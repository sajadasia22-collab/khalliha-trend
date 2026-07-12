import { prisma } from "../../lib/prisma";
import {
  DisputeStatus,
  NotificationType,
  TrustScoreEventReason,
  UserRole,
} from "../../generated/prisma/enums";
import type { CreateDisputeInput } from "./schemas";
import { NotificationService } from "../notifications/service";

function clampScore(score: number) {
  return Math.max(0, Math.min(100, score));
}

export class DisputeService {
  static async create(userId: string, input: CreateDisputeInput) {
    const submission = await prisma.submission.findUnique({
      where: { id: input.submissionId },
      include: {
        socialAccount: { include: { creatorProfile: true } },
        campaignMembership: {
          include: {
            campaign: { include: { brand: { include: { members: true } } } },
          },
        },
      },
    });
    if (!submission) {
      throw new Error("الإرسال غير موجود");
    }

    const isCreator = submission.socialAccount.creatorProfile.userId === userId;
    const isBrandMember = submission.campaignMembership.campaign.brand.members.some(
      (member) => member.userId === userId,
    );
    if (!isCreator && !isBrandMember) {
      throw new Error("لا تملك صلاحية فتح نزاع على هذا الإرسال");
    }

    return prisma.$transaction(async (tx) => {
      const dispute = await tx.dispute.create({
        data: {
          submissionId: input.submissionId,
          openedByUserId: userId,
          reason: input.reason,
          title: input.title,
          description: input.description,
          status: DisputeStatus.OPEN,
        },
      });

      await tx.disputeMessage.create({
        data: {
          disputeId: dispute.id,
          senderUserId: userId,
          body: input.description,
        },
      });

      return dispute;
    });
  }

  static async listForUser(userId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new Error("المستخدم غير موجود");
    }

    if (user.role === UserRole.ADMIN || user.role === UserRole.SUPER_ADMIN) {
      return this.listForAdmin();
    }

    return prisma.dispute.findMany({
      where: { openedByUserId: userId },
      include: {
        submission: { include: { campaignMembership: { include: { campaign: true } } } },
        messages: { orderBy: { createdAt: "asc" } },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  static async listForAdmin() {
    return prisma.dispute.findMany({
      include: {
        openedBy: { select: { fullName: true, email: true, role: true } },
        submission: {
          include: {
            socialAccount: { include: { creatorProfile: { include: { user: true } } } },
            campaignMembership: { include: { campaign: { include: { brand: true } } } },
          },
        },
        messages: { orderBy: { createdAt: "asc" } },
      },
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    });
  }

  static async addMessage(userId: string, disputeId: string, body: string) {
    const dispute = await prisma.dispute.findUnique({
      where: { id: disputeId },
      include: {
        submission: {
          include: {
            socialAccount: { include: { creatorProfile: true } },
            campaignMembership: {
              include: {
                campaign: { include: { brand: { include: { members: true } } } },
              },
            },
          },
        },
      },
    });
    if (!dispute) {
      throw new Error("النزاع غير موجود");
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    const isAdmin = user?.role === UserRole.ADMIN || user?.role === UserRole.SUPER_ADMIN;
    const isCreator = dispute.submission.socialAccount.creatorProfile.userId === userId;
    const isBrandMember =
      dispute.submission.campaignMembership.campaign.brand.members.some(
        (member) => member.userId === userId,
      );
    if (!isAdmin && !isCreator && !isBrandMember) {
      throw new Error("لا تملك صلاحية الرد على هذا النزاع");
    }

    return prisma.disputeMessage.create({
      data: { disputeId, senderUserId: userId, body },
    });
  }

  static async resolve(
    adminUserId: string,
    disputeId: string,
    decision: "CREATOR" | "BRAND" | "PARTIAL" | "CLOSE",
    resolutionNote: string,
  ) {
    const result = await prisma.$transaction(async (tx) => {
      const dispute = await tx.dispute.findUnique({
        where: { id: disputeId },
        include: {
          submission: {
            include: {
              socialAccount: { include: { creatorProfile: true } },
              campaignMembership: {
                include: {
                  campaign: { include: { brand: { include: { members: true } } } },
                },
              },
            },
          },
        },
      });
      if (!dispute) {
        throw new Error("النزاع غير موجود");
      }

      const status =
        decision === "CREATOR"
          ? DisputeStatus.RESOLVED_CREATOR
          : decision === "BRAND"
            ? DisputeStatus.RESOLVED_BRAND
            : decision === "PARTIAL"
              ? DisputeStatus.PARTIAL_RESOLUTION
              : DisputeStatus.CLOSED;

      const creatorProfile = dispute.submission.socialAccount.creatorProfile;
      const delta = decision === "CREATOR" ? 5 : decision === "BRAND" ? -5 : 0;
      if (delta !== 0) {
        await tx.creatorProfile.update({
          where: { id: creatorProfile.id },
          data: { trustScore: clampScore(creatorProfile.trustScore + delta) },
        });
        await tx.trustScoreEvent.create({
          data: {
            creatorProfileId: creatorProfile.id,
            userId: creatorProfile.userId,
            delta,
            reason:
              decision === "CREATOR"
                ? TrustScoreEventReason.DISPUTE_RESOLVED_CREATOR
                : TrustScoreEventReason.DISPUTE_RESOLVED_BRAND,
            note: resolutionNote,
          },
        });
      }

      return tx.dispute.update({
        where: { id: disputeId },
        data: {
          status,
          resolutionNote,
          resolvedByUserId: adminUserId,
          resolvedAt: new Date(),
        },
        include: {
          submission: {
            include: {
              socialAccount: { include: { creatorProfile: true } },
              campaignMembership: {
                include: {
                  campaign: { include: { brand: { include: { members: true } } } },
                },
              },
            },
          },
        },
      });
    });

    const creatorUserId = result.submission.socialAccount.creatorProfile.userId;
    const brandMemberUserIds =
      result.submission.campaignMembership.campaign.brand.members.map(
        (member) => member.userId,
      );
    await Promise.all([
      NotificationService.notify(
        creatorUserId,
        NotificationType.DISPUTE_UPDATED,
        "تم حل النزاع",
        `النزاع "${result.title}": ${resolutionNote}`,
        "/creator/dashboard",
      ),
      ...brandMemberUserIds.map((userId) =>
        NotificationService.notify(
          userId,
          NotificationType.DISPUTE_UPDATED,
          "تم حل النزاع",
          `النزاع "${result.title}": ${resolutionNote}`,
          "/brand/dashboard",
        ),
      ),
    ]);

    return result;
  }
}
