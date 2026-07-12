import { prisma } from "../../lib/prisma";
import { CampaignStatus, SocialAccountStatus } from "../../generated/prisma/enums";

async function getCreatorProfileForUser(userId: string) {
  const profile = await prisma.creatorProfile.findUnique({ where: { userId } });
  if (!profile) {
    throw new Error("لا يوجد ملف صانع محتوى مرتبط بهذا المستخدم");
  }
  return profile;
}

export class MembershipService {
  static async joinCampaign(userId: string, campaignId: string) {
    const creatorProfile = await getCreatorProfileForUser(userId);

    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      include: { rates: true },
    });
    if (!campaign) {
      throw new Error("الحملة غير موجودة");
    }
    if (campaign.status !== CampaignStatus.ACTIVE) {
      throw new Error("هذه الحملة غير مفتوحة للانضمام حالياً");
    }
    if (creatorProfile.trustScore < campaign.minTrustScore) {
      throw new Error("مستوى الثقة الخاص بك أقل من الحد الأدنى المطلوب لهذه الحملة");
    }

    const requiredPlatforms = campaign.rates.map((rate) => rate.platform);
    const verifiedAccount = await prisma.socialAccount.findFirst({
      where: {
        creatorProfileId: creatorProfile.id,
        status: SocialAccountStatus.VERIFIED,
        platform: { in: requiredPlatforms },
      },
    });
    if (!verifiedAccount) {
      throw new Error("يجب ربط وتوثيق حساب اجتماعي على إحدى منصات الحملة قبل الانضمام");
    }

    const existing = await prisma.campaignMembership.findUnique({
      where: {
        campaignId_creatorProfileId: {
          campaignId,
          creatorProfileId: creatorProfile.id,
        },
      },
    });
    if (existing) {
      throw new Error("أنت منضم لهذه الحملة بالفعل");
    }

    return prisma.campaignMembership.create({
      data: {
        campaignId,
        creatorProfileId: creatorProfile.id,
        termsSnapshot: {
          title: campaign.title,
          summary: campaign.summary,
          terms: campaign.terms,
          currency: campaign.currency,
          minTrustScore: campaign.minTrustScore,
          snapshotAt: new Date().toISOString(),
          rates: campaign.rates.map((rate) => ({
            platform: rate.platform,
            cpmMinorUnits: rate.cpmMinorUnits.toString(),
            minimumQualifiedViews: rate.minimumQualifiedViews.toString(),
            maximumReward: rate.maximumReward.toString(),
          })),
        },
      },
    });
  }

  static async listJoinedForUser(userId: string) {
    const creatorProfile = await getCreatorProfileForUser(userId);
    return prisma.campaignMembership.findMany({
      where: { creatorProfileId: creatorProfile.id },
      include: { campaign: { include: { brand: true, rates: true } } },
      orderBy: { createdAt: "desc" },
    });
  }

  static async getMembership(userId: string, campaignId: string) {
    const creatorProfile = await getCreatorProfileForUser(userId);
    return prisma.campaignMembership.findUnique({
      where: {
        campaignId_creatorProfileId: {
          campaignId,
          creatorProfileId: creatorProfile.id,
        },
      },
      include: { submissions: true },
    });
  }
}
