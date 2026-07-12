import { prisma } from "../../lib/prisma";
import { CampaignStatus, NotificationType } from "../../generated/prisma/enums";
import type { CreateCampaignInput } from "./schemas";
import { FinancialService } from "../financial/service";
import { NotificationService } from "../notifications/service";

async function getBrandIdForUser(userId: string): Promise<string> {
  const membership = await prisma.brandMember.findFirst({ where: { userId } });
  if (!membership) {
    throw new Error("لا يوجد حساب علامة تجارية مرتبط بهذا المستخدم");
  }
  return membership.brandId;
}

const campaignInclude = { rates: true, assets: true } as const;

export class CampaignService {
  static async listForBrand(userId: string) {
    const brandId = await getBrandIdForUser(userId);
    return prisma.campaign.findMany({
      where: { brandId },
      include: campaignInclude,
      orderBy: { createdAt: "desc" },
    });
  }

  static async getForBrand(userId: string, campaignId: string) {
    const brandId = await getBrandIdForUser(userId);
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      include: campaignInclude,
    });
    if (!campaign || campaign.brandId !== brandId) {
      throw new Error("الحملة غير موجودة");
    }
    return campaign;
  }

  static async createDraft(userId: string, input: CreateCampaignInput) {
    const brandId = await getBrandIdForUser(userId);

    return prisma.$transaction(async (tx) => {
      const campaign = await tx.campaign.create({
        data: {
          brandId,
          title: input.title,
          summary: input.summary,
          terms: input.terms,
          category: input.category,
          thumbnailUrl: input.thumbnailUrl,
          currency: input.currency,
          totalBudget: input.totalBudget,
          minTrustScore: input.minTrustScore,
          startsAt: input.startsAt,
          endsAt: input.endsAt,
          status: CampaignStatus.DRAFT,
        },
      });

      await tx.campaignPlatformRate.createMany({
        data: input.rates.map((rate) => ({
          campaignId: campaign.id,
          platform: rate.platform,
          cpmMinorUnits: rate.cpmMinorUnits,
          minimumQualifiedViews: rate.minimumQualifiedViews,
          maximumReward: rate.maximumReward,
        })),
      });

      if (input.assets.length > 0) {
        await tx.campaignAsset.createMany({
          data: input.assets.map((asset) => ({
            campaignId: campaign.id,
            url: asset.url,
            label: asset.label,
          })),
        });
      }

      return tx.campaign.findUniqueOrThrow({
        where: { id: campaign.id },
        include: campaignInclude,
      });
    });
  }

  static async updateDraft(
    userId: string,
    campaignId: string,
    input: CreateCampaignInput,
  ) {
    const brandId = await getBrandIdForUser(userId);
    const existing = await prisma.campaign.findUnique({ where: { id: campaignId } });
    if (!existing || existing.brandId !== brandId) {
      throw new Error("الحملة غير موجودة");
    }
    if (
      existing.status !== CampaignStatus.DRAFT &&
      existing.status !== CampaignStatus.NEEDS_CHANGES
    ) {
      throw new Error("لا يمكن تعديل حملة بعد إرسالها للمراجعة أو تفعيلها");
    }

    return prisma.$transaction(async (tx) => {
      await tx.campaign.update({
        where: { id: campaignId },
        data: {
          title: input.title,
          summary: input.summary,
          terms: input.terms,
          category: input.category,
          thumbnailUrl: input.thumbnailUrl,
          currency: input.currency,
          totalBudget: input.totalBudget,
          minTrustScore: input.minTrustScore,
          startsAt: input.startsAt,
          endsAt: input.endsAt,
        },
      });

      await tx.campaignPlatformRate.deleteMany({ where: { campaignId } });
      await tx.campaignPlatformRate.createMany({
        data: input.rates.map((rate) => ({
          campaignId,
          platform: rate.platform,
          cpmMinorUnits: rate.cpmMinorUnits,
          minimumQualifiedViews: rate.minimumQualifiedViews,
          maximumReward: rate.maximumReward,
        })),
      });

      await tx.campaignAsset.deleteMany({ where: { campaignId } });
      if (input.assets.length > 0) {
        await tx.campaignAsset.createMany({
          data: input.assets.map((asset) => ({
            campaignId,
            url: asset.url,
            label: asset.label,
          })),
        });
      }

      return tx.campaign.findUniqueOrThrow({
        where: { id: campaignId },
        include: campaignInclude,
      });
    });
  }

  static async submitForReview(userId: string, campaignId: string) {
    const brandId = await getBrandIdForUser(userId);
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      include: { rates: true },
    });
    if (!campaign || campaign.brandId !== brandId) {
      throw new Error("الحملة غير موجودة");
    }
    if (
      campaign.status !== CampaignStatus.DRAFT &&
      campaign.status !== CampaignStatus.NEEDS_CHANGES
    ) {
      throw new Error("لا يمكن إرسال هذه الحملة للمراجعة في حالتها الحالية");
    }
    if (campaign.rates.length === 0) {
      throw new Error("أضف سعر منصة واحداً على الأقل قبل الإرسال للمراجعة");
    }

    return prisma.campaign.update({
      where: { id: campaignId },
      data: {
        status: CampaignStatus.PENDING_REVIEW,
        reviewNote: null,
        reviewedByUserId: null,
        reviewedAt: null,
      },
    });
  }

  static async listPendingReview() {
    return prisma.campaign.findMany({
      where: { status: CampaignStatus.PENDING_REVIEW },
      include: { ...campaignInclude, brand: true },
      orderBy: { createdAt: "asc" },
    });
  }

  static async review(
    campaignId: string,
    reviewerUserId: string,
    decision: "APPROVE" | "REQUEST_CHANGES" | "REJECT",
    note?: string,
  ) {
    const campaign = await prisma.campaign.findUnique({ where: { id: campaignId } });
    if (!campaign) {
      throw new Error("الحملة غير موجودة");
    }
    if (campaign.status !== CampaignStatus.PENDING_REVIEW) {
      throw new Error("هذه الحملة ليست قيد المراجعة");
    }

    const now = new Date();
    const nextStatus =
      decision === "APPROVE"
        ? campaign.startsAt && campaign.startsAt > now
          ? CampaignStatus.SCHEDULED
          : CampaignStatus.ACTIVE
        : decision === "REQUEST_CHANGES"
          ? CampaignStatus.NEEDS_CHANGES
          : CampaignStatus.REJECTED;

    if (decision === "APPROVE") {
      await FinancialService.reserveCampaignBudget(campaignId);
    }

    const updated = await prisma.campaign.update({
      where: { id: campaignId },
      data: {
        status: nextStatus,
        reviewNote: note ?? null,
        reviewedByUserId: reviewerUserId,
        reviewedAt: now,
      },
    });

    const brandMembers = await prisma.brandMember.findMany({
      where: { brandId: campaign.brandId },
    });
    const notificationCopy =
      decision === "APPROVE"
        ? { type: NotificationType.CAMPAIGN_APPROVED, title: "تم اعتماد حملتك" }
        : decision === "REQUEST_CHANGES"
          ? {
              type: NotificationType.CAMPAIGN_NEEDS_CHANGES,
              title: "حملتك تحتاج تعديلات",
            }
          : { type: NotificationType.CAMPAIGN_REJECTED, title: "تم رفض حملتك" };
    await Promise.all(
      brandMembers.map((member) =>
        NotificationService.notify(
          member.userId,
          notificationCopy.type,
          notificationCopy.title,
          `الحملة "${campaign.title}": ${note ?? "راجع تفاصيل الحملة لمزيد من المعلومات."}`,
          `/brand/campaigns/${campaign.id}`,
        ),
      ),
    );

    return updated;
  }

  static async getAnalyticsForBrand(userId: string) {
    const brandId = await getBrandIdForUser(userId);

    const campaigns = await prisma.campaign.findMany({
      where: { brandId },
      select: {
        id: true,
        title: true,
        status: true,
        currency: true,
        totalBudget: true,
        reservedBudget: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const [snapshots, accruals] = await Promise.all([
      prisma.metricsSnapshot.findMany({
        where: { submission: { campaignMembership: { campaign: { brandId } } } },
        select: {
          qualifiedViews: true,
          capturedAt: true,
          submission: {
            select: { campaignMembership: { select: { campaignId: true } } },
          },
        },
      }),
      prisma.earningAccrual.findMany({
        where: { submission: { campaignMembership: { campaign: { brandId } } } },
        select: {
          amount: true,
          currency: true,
          createdAt: true,
          submission: {
            select: { campaignMembership: { select: { campaignId: true } } },
          },
        },
      }),
    ]);

    const perCampaignViews = new Map<string, bigint>();
    for (const snapshot of snapshots) {
      const campaignId = snapshot.submission.campaignMembership.campaignId;
      perCampaignViews.set(
        campaignId,
        (perCampaignViews.get(campaignId) ?? 0n) + snapshot.qualifiedViews,
      );
    }

    const perCampaignSpend = new Map<string, bigint>();
    for (const accrual of accruals) {
      const campaignId = accrual.submission.campaignMembership.campaignId;
      perCampaignSpend.set(
        campaignId,
        (perCampaignSpend.get(campaignId) ?? 0n) + accrual.amount,
      );
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dailyViews = new Map<string, bigint>();
    const dailySpend = new Map<string, bigint>();
    for (let i = 29; i >= 0; i -= 1) {
      const day = new Date(today);
      day.setDate(day.getDate() - i);
      const key = day.toISOString().slice(0, 10);
      dailyViews.set(key, 0n);
      dailySpend.set(key, 0n);
    }
    for (const snapshot of snapshots) {
      const key = snapshot.capturedAt.toISOString().slice(0, 10);
      if (dailyViews.has(key)) {
        dailyViews.set(key, (dailyViews.get(key) ?? 0n) + snapshot.qualifiedViews);
      }
    }
    for (const accrual of accruals) {
      if (accrual.currency !== "IQD") continue;
      const key = accrual.createdAt.toISOString().slice(0, 10);
      if (dailySpend.has(key)) {
        dailySpend.set(key, (dailySpend.get(key) ?? 0n) + accrual.amount);
      }
    }

    return {
      campaigns: campaigns.map((campaign) => ({
        id: campaign.id,
        title: campaign.title,
        status: campaign.status,
        currency: campaign.currency,
        totalBudget: campaign.totalBudget.toString(),
        reservedBudget: campaign.reservedBudget.toString(),
        qualifiedViews: (perCampaignViews.get(campaign.id) ?? 0n).toString(),
        spend: (perCampaignSpend.get(campaign.id) ?? 0n).toString(),
      })),
      daily: Array.from(dailyViews.keys()).map((date) => ({
        date,
        qualifiedViews: (dailyViews.get(date) ?? 0n).toString(),
        spend: (dailySpend.get(date) ?? 0n).toString(),
      })),
    };
  }
}
