import { prisma } from "../../lib/prisma";
import type { PrismaClient } from "../../generated/prisma/client";
import {
  FraudRiskLevel,
  FraudReviewStatus,
  FraudSignalKind,
  TrustScoreEventReason,
} from "../../generated/prisma/enums";

type FraudTxClient = Pick<PrismaClient, "fraudAssessment" | "fraudSignal">;

function clampScore(score: number) {
  return Math.max(0, Math.min(100, score));
}

function riskLevel(score: number): FraudRiskLevel {
  if (score >= 70) return FraudRiskLevel.HIGH;
  if (score >= 35) return FraudRiskLevel.MEDIUM;
  return FraudRiskLevel.LOW;
}

export class FraudService {
  static async addManualSignal(
    adminUserId: string,
    submissionId: string,
    kind: FraudSignalKind,
    scoreImpact: number,
    note?: string,
  ) {
    if (scoreImpact < 0 || scoreImpact > 100) {
      throw new Error("تأثير إشارة الاحتيال يجب أن يكون بين 0 و100");
    }

    return prisma.$transaction(async (tx) => {
      const submission = await tx.submission.findUnique({ where: { id: submissionId } });
      if (!submission) {
        throw new Error("الإرسال غير موجود");
      }

      await tx.fraudSignal.create({
        data: {
          submissionId,
          kind,
          scoreImpact,
          note: note ?? null,
          createdByUserId: adminUserId,
        },
      });

      return FraudService.recalculateAssessmentWithClient(tx, submissionId);
    });
  }

  static async evaluateSubmissionFromMetrics(submissionId: string) {
    return prisma.$transaction(async (tx) => {
      const submission = await tx.submission.findUnique({
        where: { id: submissionId },
        include: { metricsSnapshots: { orderBy: { createdAt: "desc" }, take: 2 } },
      });
      if (!submission) {
        throw new Error("الإرسال غير موجود");
      }

      const [latest, previous] = submission.metricsSnapshots;
      if (!latest) {
        return FraudService.recalculateAssessmentWithClient(tx, submissionId);
      }

      const signals: Array<{ kind: FraudSignalKind; scoreImpact: number; note: string }> =
        [];
      if (latest.observedViews > 0n) {
        const disqualifiedRatio = Number(
          (latest.disqualifiedViews * 100n) / latest.observedViews,
        );
        if (disqualifiedRatio >= 50) {
          signals.push({
            kind: FraudSignalKind.HIGH_DISQUALIFIED_RATIO,
            scoreImpact: 35,
            note: `نسبة المشاهدات المستبعدة ${disqualifiedRatio}%`,
          });
        }
      }

      if (previous) {
        const delta = latest.qualifiedViews - previous.qualifiedViews;
        if (previous.qualifiedViews > 0n && delta > previous.qualifiedViews * 3n) {
          signals.push({
            kind: FraudSignalKind.VIEW_SPIKE,
            scoreImpact: 25,
            note: "قفزة كبيرة في المشاهدات المؤهلة بين snapshot وآخر",
          });
        }
      }

      for (const signal of signals) {
        const exists = await tx.fraudSignal.findFirst({
          where: {
            submissionId,
            kind: signal.kind,
            note: signal.note,
          },
        });
        if (!exists) {
          await tx.fraudSignal.create({
            data: {
              submissionId,
              kind: signal.kind,
              scoreImpact: signal.scoreImpact,
              note: signal.note,
            },
          });
        }
      }

      return FraudService.recalculateAssessmentWithClient(tx, submissionId);
    });
  }

  static async listQueue() {
    return prisma.fraudAssessment.findMany({
      where: { status: { in: [FraudReviewStatus.OPEN, FraudReviewStatus.UNDER_REVIEW] } },
      include: {
        submission: {
          include: {
            socialAccount: { include: { creatorProfile: { include: { user: true } } } },
            campaignMembership: { include: { campaign: { include: { brand: true } } } },
            fraudSignals: { orderBy: { createdAt: "desc" } },
          },
        },
      },
      orderBy: [{ riskLevel: "desc" }, { updatedAt: "desc" }],
    });
  }

  static async resolveAssessment(
    adminUserId: string,
    assessmentId: string,
    decision: "CLEAR" | "CONFIRM",
    note?: string,
  ) {
    return prisma.$transaction(async (tx) => {
      const assessment = await tx.fraudAssessment.findUnique({
        where: { id: assessmentId },
        include: {
          submission: {
            include: {
              socialAccount: { include: { creatorProfile: true } },
            },
          },
        },
      });
      if (!assessment) {
        throw new Error("تقييم الاحتيال غير موجود");
      }

      const creatorProfile = assessment.submission.socialAccount.creatorProfile;
      const delta = decision === "CONFIRM" ? -10 : 3;
      const newTrustScore = clampScore(creatorProfile.trustScore + delta);

      await tx.creatorProfile.update({
        where: { id: creatorProfile.id },
        data: { trustScore: newTrustScore },
      });

      await tx.trustScoreEvent.create({
        data: {
          creatorProfileId: creatorProfile.id,
          userId: creatorProfile.userId,
          delta,
          reason:
            decision === "CONFIRM"
              ? TrustScoreEventReason.FRAUD_CONFIRMED
              : TrustScoreEventReason.FRAUD_CLEARED,
          note: note ?? null,
        },
      });

      return tx.fraudAssessment.update({
        where: { id: assessmentId },
        data: {
          status:
            decision === "CONFIRM"
              ? FraudReviewStatus.CONFIRMED
              : FraudReviewStatus.CLEARED,
          reviewNote: note ?? null,
          reviewedByUserId: adminUserId,
          reviewedAt: new Date(),
        },
      });
    });
  }

  private static async recalculateAssessmentWithClient(
    tx: FraudTxClient,
    submissionId: string,
  ) {
    const signals = await tx.fraudSignal.findMany({ where: { submissionId } });
    const fraudScore = clampScore(
      signals.reduce((sum, signal) => sum + signal.scoreImpact, 0),
    );

    return tx.fraudAssessment.upsert({
      where: { submissionId },
      create: {
        submissionId,
        fraudScore,
        riskLevel: riskLevel(fraudScore),
        status: FraudReviewStatus.OPEN,
      },
      update: {
        fraudScore,
        riskLevel: riskLevel(fraudScore),
        status: fraudScore > 0 ? FraudReviewStatus.OPEN : FraudReviewStatus.CLEARED,
      },
    });
  }
}
