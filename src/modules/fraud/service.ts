import { prisma } from "../../lib/prisma";
import type { PrismaClient } from "../../generated/prisma/client";
import {
  EarningStatus,
  FraudRiskLevel,
  FraudReviewStatus,
  FraudSignalKind,
  NotificationType,
  TrustScoreEventReason,
} from "../../generated/prisma/enums";
import { AuditLogService } from "../audit-log/service";
import { NotificationService } from "../notifications/service";

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

    const result = await prisma.$transaction(async (tx) => {
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

      return FraudService.recalculateAssessmentWithClient(tx, submissionId, true);
    });

    await AuditLogService.log({
      actorId: adminUserId,
      action: "FRAUD_SIGNAL_ADD_MANUAL",
      targetType: "Submission",
      targetId: submissionId,
      after: { kind, scoreImpact, note },
    });

    return result;
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
            scoreImpact: disqualifiedRatio >= 80 ? 55 : 45,
            note: `نسبة المشاهدات المستبعدة ${disqualifiedRatio}%`,
          });
        }
      }

      if (previous) {
        if (
          previous.qualifiedViews > 0n &&
          latest.qualifiedViews > previous.qualifiedViews * 3n
        ) {
          signals.push({
            kind: FraudSignalKind.VIEW_SPIKE,
            scoreImpact: 35,
            note: "قفزة كبيرة في المشاهدات المؤهلة بين snapshot وآخر",
          });
        }
      }

      let createdSignal = false;
      for (const signal of signals) {
        const exists = await tx.fraudSignal.findFirst({
          where: {
            submissionId,
            kind: signal.kind,
          },
        });
        if (!exists) {
          createdSignal = true;
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

      return FraudService.recalculateAssessmentWithClient(
        tx,
        submissionId,
        createdSignal,
      );
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
    const result = await prisma.$transaction(async (tx) => {
      const assessment = await tx.fraudAssessment.findUnique({
        where: { id: assessmentId },
        include: {
          submission: {
            include: {
              earnings: true,
              socialAccount: { include: { creatorProfile: true } },
              campaignMembership: { include: { campaign: true } },
            },
          },
        },
      });
      if (!assessment) {
        throw new Error("تقييم الاحتيال غير موجود");
      }

      const claimed = await tx.fraudAssessment.updateMany({
        where: {
          id: assessmentId,
          status: { in: [FraudReviewStatus.OPEN, FraudReviewStatus.UNDER_REVIEW] },
        },
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
      if (claimed.count !== 1) {
        throw new Error("تمت مراجعة حالة الاحتيال هذه مسبقاً");
      }

      if (decision === "CONFIRM") {
        const reversibleAccruals = assessment.submission.earnings.filter(
          (earning) =>
            earning.status === EarningStatus.PENDING_VERIFICATION ||
            earning.status === EarningStatus.HELD,
        );
        if (reversibleAccruals.length > 0) {
          const reversedAmount = reversibleAccruals.reduce(
            (sum, item) => sum + item.amount,
            0n,
          );
          await tx.earningAccrual.updateMany({
            where: { id: { in: reversibleAccruals.map((item) => item.id) } },
            data: { status: EarningStatus.REVERSED },
          });
          const campaign = assessment.submission.campaignMembership.campaign;
          await tx.campaign.update({
            where: { id: campaign.id },
            data: {
              reservedBudget:
                campaign.reservedBudget > reversedAmount
                  ? campaign.reservedBudget - reversedAmount
                  : 0n,
            },
          });
        }
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

      return {
        ...assessment,
        status:
          decision === "CONFIRM"
            ? FraudReviewStatus.CONFIRMED
            : FraudReviewStatus.CLEARED,
        creatorUserId: creatorProfile.userId,
      };
    });

    await NotificationService.notify(
      result.creatorUserId,
      NotificationType.FRAUD_FLAGGED,
      decision === "CONFIRM" ? "نتيجة مراجعة المحتوى" : "تمت إزالة الاشتباه",
      decision === "CONFIRM"
        ? "أكدت الإدارة وجود مخالفة على إحدى مشاركاتك. راجع مركز النزاعات إذا رغبت بالاعتراض."
        : "راجعت الإدارة المشاركة وأزالت عنها إشارة الاشتباه.",
      "/creator/disputes",
    );

    await AuditLogService.log({
      actorId: adminUserId,
      action:
        decision === "CONFIRM" ? "FRAUD_ASSESSMENT_CONFIRM" : "FRAUD_ASSESSMENT_CLEAR",
      targetType: "FraudAssessment",
      targetId: assessmentId,
      before: { status: FraudReviewStatus.OPEN },
      after: { status: result.status, reviewNote: note ?? null },
    });

    return result;
  }

  private static async recalculateAssessmentWithClient(
    tx: FraudTxClient,
    submissionId: string,
    reopen = false,
  ) {
    const [signals, existing] = await Promise.all([
      tx.fraudSignal.findMany({ where: { submissionId } }),
      tx.fraudAssessment.findUnique({ where: { submissionId } }),
    ]);
    const fraudScore = clampScore(
      signals.reduce((sum, signal) => sum + signal.scoreImpact, 0),
    );

    return tx.fraudAssessment.upsert({
      where: { submissionId },
      create: {
        submissionId,
        fraudScore,
        riskLevel: riskLevel(fraudScore),
        status: fraudScore > 0 ? FraudReviewStatus.OPEN : FraudReviewStatus.CLEARED,
      },
      update: {
        fraudScore,
        riskLevel: riskLevel(fraudScore),
        status:
          existing?.status === FraudReviewStatus.CONFIRMED
            ? FraudReviewStatus.CONFIRMED
            : reopen || !existing
              ? fraudScore > 0
                ? FraudReviewStatus.OPEN
                : FraudReviewStatus.CLEARED
              : existing.status,
      },
    });
  }
}
