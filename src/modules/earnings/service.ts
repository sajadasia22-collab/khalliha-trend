import { prisma } from "../../lib/prisma";
import { CampaignStatus, EarningStatus } from "../../generated/prisma/enums";
import { calculateEarningForDelta } from "./earnings-engine";
import { FraudService } from "../fraud/service";

export class EarningsService {
  /**
   * Records a metrics snapshot for a submission and calculates earnings in a transaction.
   * Updates the campaign budget reservation and status if budget depletion milestones are met.
   */
  static async recordMetricsAndCalculateEarnings(
    adminUserId: string,
    submissionId: string,
    observedViews: bigint,
    qualifiedViews: bigint,
    note?: string,
  ) {
    const snapshot = await prisma.$transaction(async (tx) => {
      // 1. Fetch submission with membership and rates
      const submission = await tx.submission.findUnique({
        where: { id: submissionId },
        include: {
          campaignMembership: {
            include: {
              campaign: {
                include: { rates: true },
              },
            },
          },
        },
      });

      if (!submission) {
        throw new Error("المنشور المرسل غير موجود");
      }

      const campaign = submission.campaignMembership.campaign;

      // 2. Fetch platform cpm rates and caps
      const rate = campaign.rates.find((r) => r.platform === submission.platform);
      if (!rate) {
        throw new Error("لا يوجد سعر معرّف لهذه المنصة في الحملة");
      }

      // 3. Find the previous snapshot to get lastQualifiedViews
      const lastSnapshot = await tx.metricsSnapshot.findFirst({
        where: { submissionId },
        orderBy: { createdAt: "desc" },
      });
      const lastQualifiedViews = lastSnapshot?.qualifiedViews ?? 0n;

      if (qualifiedViews < lastQualifiedViews) {
        throw new Error(
          `عدد المشاهدات المؤهلة الجديد (${qualifiedViews}) لا يمكن أن يكون أقل من السابق (${lastQualifiedViews})`,
        );
      }

      // 4. Calculate already accrued earnings for this submission
      const accruals = await tx.earningAccrual.findMany({
        where: { submissionId },
      });
      const alreadyAccruedEarning = accruals.reduce((sum, item) => sum + item.amount, 0n);

      // 5. Calculate remaining campaign budget
      const remainingBudget = campaign.totalBudget - campaign.reservedBudget;

      // 6. Calculate payable earnings for this delta
      const payableReward = calculateEarningForDelta({
        cpmMinorUnits: rate.cpmMinorUnits,
        maximumReward: rate.maximumReward,
        remainingBudget: remainingBudget > 0n ? remainingBudget : 0n,
        currentQualifiedViews: qualifiedViews,
        lastQualifiedViews,
        alreadyAccruedEarning,
      });

      // 7. Create Metrics Snapshot
      const snapshot = await tx.metricsSnapshot.create({
        data: {
          submissionId,
          observedViews,
          qualifiedViews,
          disqualifiedViews:
            observedViews > qualifiedViews ? observedViews - qualifiedViews : 0n,
          disqualificationReason: note || null,
          capturedByUserId: adminUserId,
          source: "MANUAL_ADMIN",
        },
      });

      // 8. Accrue earnings if any payable rewards calculated
      if (payableReward > 0n) {
        // Set hold duration: e.g., 7 days configurable hold
        const holdDays = 7;
        const heldUntil = new Date(Date.now() + holdDays * 24 * 60 * 60 * 1000);

        await tx.earningAccrual.create({
          data: {
            submissionId,
            metricsSnapshotId: snapshot.id,
            amount: payableReward,
            currency: campaign.currency,
            status: EarningStatus.PENDING_VERIFICATION,
            heldUntil,
          },
        });

        // 9. Update Campaign Reserved Budget & Status
        const newReserved = campaign.reservedBudget + payableReward;
        let newStatus = campaign.status;

        if (newReserved >= campaign.totalBudget) {
          newStatus = CampaignStatus.BUDGET_EXHAUSTED;
        } else if ((newReserved * 100n) / campaign.totalBudget >= 90n) {
          newStatus = CampaignStatus.BUDGET_LOW;
        }

        await tx.campaign.update({
          where: { id: campaign.id },
          data: {
            reservedBudget: newReserved,
            status: newStatus,
          },
        });
      }

      return snapshot;
    });

    await FraudService.evaluateSubmissionFromMetrics(submissionId);

    return snapshot;
  }

  /**
   * Aggregates and returns summary earnings for a creator.
   */
  static async getCreatorEarningsSummary(userId: string) {
    const profile = await prisma.creatorProfile.findUnique({
      where: { userId },
    });
    if (!profile) {
      throw new Error("لا يوجد ملف صانع محتوى مرتبط بهذا المستخدم");
    }

    // Find memberships and accruals
    const memberships = await prisma.campaignMembership.findMany({
      where: { creatorProfileId: profile.id },
      select: { id: true },
    });

    const membershipIds = memberships.map((m) => m.id);

    const submissions = await prisma.submission.findMany({
      where: { campaignMembershipId: { in: membershipIds } },
      select: { id: true },
    });

    const submissionIds = submissions.map((s) => s.id);

    const accruals = await prisma.earningAccrual.findMany({
      where: { submissionId: { in: submissionIds } },
      include: {
        submission: {
          include: {
            campaignMembership: {
              include: { campaign: true },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Helper function to group sum
    const getSummaryByCurrency = (currency: "IQD" | "USD") => {
      const filtered = accruals.filter(
        (a) => a.submission.campaignMembership.campaign.currency === currency,
      );

      const total = filtered.reduce((sum, item) => sum + item.amount, 0n);

      const held = filtered
        .filter(
          (a) =>
            a.status === EarningStatus.HELD ||
            a.status === EarningStatus.PENDING_VERIFICATION,
        )
        .reduce((sum, item) => sum + item.amount, 0n);

      const available = filtered
        .filter((a) => a.status === EarningStatus.AVAILABLE)
        .reduce((sum, item) => sum + item.amount, 0n);

      const paid = filtered
        .filter((a) => a.status === EarningStatus.PAID)
        .reduce((sum, item) => sum + item.amount, 0n);

      return {
        total: total.toString(),
        held: held.toString(),
        available: available.toString(),
        paid: paid.toString(),
      };
    };

    return {
      IQD: getSummaryByCurrency("IQD"),
      USD: getSummaryByCurrency("USD"),
      history: accruals.map((acc) => ({
        id: acc.id,
        amount: acc.amount.toString(),
        currency: acc.submission.campaignMembership.campaign.currency,
        status: acc.status,
        heldUntil: acc.heldUntil?.toISOString() || null,
        createdAt: acc.createdAt.toISOString(),
        campaignTitle: acc.submission.campaignMembership.campaign.title,
        postUrl: acc.submission.postUrl,
      })),
    };
  }
}
