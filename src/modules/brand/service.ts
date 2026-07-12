import { prisma } from "../../lib/prisma";
import { BrandVerificationStatus } from "../../generated/prisma/enums";
import type { UpdateBrandProfileInput } from "./schemas";

export class BrandProfileService {
  static async getForUser(userId: string) {
    const membership = await prisma.brandMember.findFirst({
      where: { userId },
      include: {
        brand: {
          include: {
            verifications: { orderBy: { requestedAt: "desc" }, take: 1 },
          },
        },
      },
    });

    return membership?.brand ?? null;
  }

  static async updateForUser(userId: string, input: UpdateBrandProfileInput) {
    const membership = await prisma.brandMember.findFirst({ where: { userId } });
    if (!membership) {
      throw new Error("لا يوجد حساب علامة تجارية مرتبط بهذا المستخدم");
    }

    return prisma.brandProfile.update({
      where: { id: membership.brandId },
      data: input,
      include: {
        verifications: { orderBy: { requestedAt: "desc" }, take: 1 },
      },
    });
  }

  static async requestVerification(userId: string) {
    const membership = await prisma.brandMember.findFirst({ where: { userId } });
    if (!membership) {
      throw new Error("لا يوجد حساب علامة تجارية مرتبط بهذا المستخدم");
    }

    const pending = await prisma.brandVerification.findFirst({
      where: { brandId: membership.brandId, status: BrandVerificationStatus.PENDING },
    });
    if (pending) {
      throw new Error("يوجد طلب توثيق قيد المراجعة بالفعل");
    }

    return prisma.brandVerification.create({
      data: { brandId: membership.brandId, status: BrandVerificationStatus.PENDING },
    });
  }

  static async listPendingVerifications() {
    return prisma.brandVerification.findMany({
      where: { status: BrandVerificationStatus.PENDING },
      include: { brand: true },
      orderBy: { requestedAt: "asc" },
    });
  }

  static async reviewVerification(
    verificationId: string,
    reviewerUserId: string,
    decision: "APPROVED" | "REJECTED",
    note?: string,
  ) {
    const verification = await prisma.brandVerification.findUnique({
      where: { id: verificationId },
    });
    if (!verification) {
      throw new Error("طلب التوثيق غير موجود");
    }
    if (verification.status !== BrandVerificationStatus.PENDING) {
      throw new Error("تمت مراجعة هذا الطلب مسبقاً");
    }

    return prisma.$transaction(async (tx) => {
      const updated = await tx.brandVerification.update({
        where: { id: verificationId },
        data: {
          status: decision,
          note,
          reviewedByUserId: reviewerUserId,
          reviewedAt: new Date(),
        },
      });

      if (decision === "APPROVED") {
        await tx.brandProfile.update({
          where: { id: verification.brandId },
          data: { verifiedAt: new Date() },
        });
      }

      return updated;
    });
  }
}
