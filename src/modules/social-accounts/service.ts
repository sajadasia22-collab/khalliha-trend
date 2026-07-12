import { prisma } from "../../lib/prisma";
import { SocialAccountStatus } from "../../generated/prisma/enums";
import type { CreateSocialAccountInput } from "./schemas";

function normalizeHandle(handle: string): string {
  return handle.trim().replace(/^@/, "").toLowerCase();
}

export class SocialAccountService {
  static async listForUser(userId: string) {
    const profile = await prisma.creatorProfile.findUnique({ where: { userId } });
    if (!profile) {
      return [];
    }
    return prisma.socialAccount.findMany({
      where: { creatorProfileId: profile.id },
      orderBy: { createdAt: "desc" },
    });
  }

  static async createForUser(userId: string, input: CreateSocialAccountInput) {
    const profile = await prisma.creatorProfile.findUnique({ where: { userId } });
    if (!profile) {
      throw new Error("لا يوجد ملف صانع محتوى مرتبط بهذا المستخدم");
    }

    const handle = normalizeHandle(input.handle);

    const existing = await prisma.socialAccount.findUnique({
      where: { platform_handle: { platform: input.platform, handle } },
    });
    if (existing) {
      throw new Error("هذا الحساب مرتبط بالفعل بمستخدم آخر على المنصة");
    }

    return prisma.socialAccount.create({
      data: {
        creatorProfileId: profile.id,
        platform: input.platform,
        handle,
        profileUrl: input.profileUrl,
        status: SocialAccountStatus.PENDING,
      },
    });
  }

  static async deleteForUser(userId: string, socialAccountId: string) {
    const profile = await prisma.creatorProfile.findUnique({ where: { userId } });
    if (!profile) {
      throw new Error("لا يوجد ملف صانع محتوى مرتبط بهذا المستخدم");
    }

    const account = await prisma.socialAccount.findUnique({
      where: { id: socialAccountId },
    });
    if (!account || account.creatorProfileId !== profile.id) {
      throw new Error("الحساب الاجتماعي غير موجود");
    }

    await prisma.socialAccount.delete({ where: { id: socialAccountId } });
  }

  static async listPending() {
    return prisma.socialAccount.findMany({
      where: { status: SocialAccountStatus.PENDING },
      include: {
        creatorProfile: {
          include: { user: { select: { fullName: true, email: true } } },
        },
      },
      orderBy: { createdAt: "asc" },
    });
  }

  static async review(
    socialAccountId: string,
    decision: "VERIFIED" | "REJECTED",
    rejectionReason?: string,
  ) {
    const account = await prisma.socialAccount.findUnique({
      where: { id: socialAccountId },
    });
    if (!account) {
      throw new Error("الحساب الاجتماعي غير موجود");
    }
    if (account.status !== SocialAccountStatus.PENDING) {
      throw new Error("تمت مراجعة هذا الحساب مسبقاً");
    }

    return prisma.socialAccount.update({
      where: { id: socialAccountId },
      data: {
        status: decision,
        rejectionReason: decision === "REJECTED" ? rejectionReason : null,
        verifiedAt: decision === "VERIFIED" ? new Date() : null,
      },
    });
  }
}
