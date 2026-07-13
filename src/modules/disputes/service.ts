import { prisma } from "../../lib/prisma";
import {
  DisputeStatus,
  EarningStatus,
  NotificationType,
  TrustScoreEventReason,
  UserRole,
} from "../../generated/prisma/enums";
import type { CreateDisputeInput } from "./schemas";
import { NotificationService } from "../notifications/service";
import { AuditLogService } from "../audit-log/service";

export const ACTIVE_DISPUTE_STATUSES = [
  DisputeStatus.OPEN,
  DisputeStatus.AWAITING_CREATOR,
  DisputeStatus.AWAITING_BRAND,
  DisputeStatus.UNDER_ADMIN_REVIEW,
] as const;

const CLOSED_DISPUTE_STATUSES = [
  DisputeStatus.RESOLVED_CREATOR,
  DisputeStatus.RESOLVED_BRAND,
  DisputeStatus.PARTIAL_RESOLUTION,
  DisputeStatus.CLOSED,
] as const;

function clampScore(score: number) {
  return Math.max(0, Math.min(100, score));
}

function participantLink(role: UserRole) {
  if (role === UserRole.CREATOR) return "/creator/disputes";
  if (role === UserRole.BRAND) return "/brand/disputes";
  return "/admin/disputes";
}

export class DisputeService {
  static async create(userId: string, input: CreateDisputeInput) {
    const result = await prisma.$transaction(
      async (tx) => {
        const submission = await tx.submission.findUnique({
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
        if (!submission) throw new Error("الإرسال غير موجود");

        const isCreator = submission.socialAccount.creatorProfile.userId === userId;
        const isBrandMember = submission.campaignMembership.campaign.brand.members.some(
          (member) => member.userId === userId,
        );
        if (!isCreator && !isBrandMember) {
          throw new Error("لا تملك صلاحية فتح نزاع على هذا الإرسال");
        }

        const existing = await tx.dispute.findFirst({
          where: {
            submissionId: input.submissionId,
            status: { in: [...ACTIVE_DISPUTE_STATUSES] },
          },
        });
        if (existing) throw new Error("يوجد نزاع نشط مسبقاً على هذه المشاركة");

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

        await Promise.all([
          tx.disputeMessage.create({
            data: {
              disputeId: dispute.id,
              senderUserId: userId,
              body: input.description,
            },
          }),
          tx.earningAccrual.updateMany({
            where: {
              submissionId: input.submissionId,
              status: EarningStatus.PENDING_VERIFICATION,
            },
            data: { status: EarningStatus.HELD },
          }),
        ]);

        return { dispute, submission };
      },
      { isolationLevel: "Serializable" },
    );

    const participantIds = new Set([
      result.submission.socialAccount.creatorProfile.userId,
      ...result.submission.campaignMembership.campaign.brand.members.map(
        (member) => member.userId,
      ),
    ]);
    const recipients = await prisma.user.findMany({
      where: {
        OR: [
          { id: { in: [...participantIds].filter((id) => id !== userId) } },
          { role: { in: [UserRole.ADMIN, UserRole.SUPER_ADMIN] } },
        ],
      },
      select: { id: true, role: true },
    });
    await Promise.all(
      recipients
        .filter((recipient) => recipient.id !== userId)
        .map((recipient) =>
          NotificationService.notify(
            recipient.id,
            NotificationType.DISPUTE_UPDATED,
            "تم فتح نزاع جديد",
            `نزاع «${input.title}» بانتظار المتابعة.`,
            participantLink(recipient.role),
          ),
        ),
    );

    await AuditLogService.log({
      actorId: userId,
      action: "DISPUTE_CREATE",
      targetType: "Dispute",
      targetId: result.dispute.id,
      after: { reason: input.reason, title: input.title, earningsHeld: true },
    });
    return result.dispute;
  }

  static async listForUser(userId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error("المستخدم غير موجود");
    if (user.role === UserRole.ADMIN || user.role === UserRole.SUPER_ADMIN) {
      return this.listForAdmin();
    }

    const ownershipWhere =
      user.role === UserRole.CREATOR
        ? { submission: { socialAccount: { creatorProfile: { userId } } } }
        : {
            submission: {
              campaignMembership: {
                campaign: { brand: { members: { some: { userId } } } },
              },
            },
          };

    return prisma.dispute.findMany({
      where: ownershipWhere,
      include: {
        openedBy: { select: { id: true, fullName: true, role: true } },
        submission: {
          select: {
            id: true,
            postUrl: true,
            socialAccount: {
              select: {
                creatorProfile: {
                  select: { user: { select: { fullName: true } } },
                },
              },
            },
            campaignMembership: {
              select: {
                campaign: {
                  select: { title: true, brand: { select: { name: true } } },
                },
              },
            },
          },
        },
        messages: {
          orderBy: { createdAt: "asc" },
          include: { sender: { select: { id: true, fullName: true, role: true } } },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  static async listEligibleSubmissions(userId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || (user.role !== UserRole.CREATOR && user.role !== UserRole.BRAND)) {
      return [];
    }
    const ownershipWhere =
      user.role === UserRole.CREATOR
        ? { socialAccount: { creatorProfile: { userId } } }
        : {
            campaignMembership: {
              campaign: { brand: { members: { some: { userId } } } },
            },
          };

    return prisma.submission.findMany({
      where: ownershipWhere,
      orderBy: { createdAt: "desc" },
      take: 100,
      select: {
        id: true,
        postUrl: true,
        platform: true,
        status: true,
        createdAt: true,
        campaignMembership: { select: { campaign: { select: { title: true } } } },
        disputes: {
          where: { status: { in: [...ACTIVE_DISPUTE_STATUSES] } },
          select: { id: true },
          take: 1,
        },
      },
    });
  }

  static async listForAdmin() {
    return prisma.dispute.findMany({
      include: {
        openedBy: { select: { id: true, fullName: true, email: true, role: true } },
        submission: {
          select: {
            id: true,
            postUrl: true,
            socialAccount: {
              select: {
                creatorProfile: {
                  select: { user: { select: { fullName: true } } },
                },
              },
            },
            campaignMembership: {
              select: {
                campaign: {
                  select: { title: true, brand: { select: { name: true } } },
                },
              },
            },
          },
        },
        messages: {
          orderBy: { createdAt: "asc" },
          include: { sender: { select: { id: true, fullName: true, role: true } } },
        },
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
    if (!dispute) throw new Error("النزاع غير موجود");
    if ((CLOSED_DISPUTE_STATUSES as readonly DisputeStatus[]).includes(dispute.status)) {
      throw new Error("لا يمكن الرد على نزاع مغلق");
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    const isAdmin = user?.role === UserRole.ADMIN || user?.role === UserRole.SUPER_ADMIN;
    const isCreator = dispute.submission.socialAccount.creatorProfile.userId === userId;
    const isBrandMember =
      dispute.submission.campaignMembership.campaign.brand.members.some(
        (member) => member.userId === userId,
      );
    if (!user || (!isAdmin && !isCreator && !isBrandMember)) {
      throw new Error("لا تملك صلاحية الرد على هذا النزاع");
    }

    const message = await prisma.disputeMessage.create({
      data: { disputeId, senderUserId: userId, body },
      include: { sender: { select: { id: true, fullName: true, role: true } } },
    });

    const participantIds = new Set([
      dispute.submission.socialAccount.creatorProfile.userId,
      ...dispute.submission.campaignMembership.campaign.brand.members.map(
        (member) => member.userId,
      ),
    ]);
    const recipients = await prisma.user.findMany({
      where: {
        OR: [
          { id: { in: [...participantIds].filter((id) => id !== userId) } },
          ...(isAdmin ? [] : [{ role: { in: [UserRole.ADMIN, UserRole.SUPER_ADMIN] } }]),
        ],
      },
      select: { id: true, role: true },
    });
    await Promise.all(
      recipients.map((recipient) =>
        NotificationService.notify(
          recipient.id,
          NotificationType.DISPUTE_UPDATED,
          "رد جديد على نزاع",
          `تمت إضافة رسالة إلى نزاع «${dispute.title}».`,
          participantLink(recipient.role),
        ),
      ),
    );
    return message;
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
              earnings: true,
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
      if (!dispute) throw new Error("النزاع غير موجود");

      const status =
        decision === "CREATOR"
          ? DisputeStatus.RESOLVED_CREATOR
          : decision === "BRAND"
            ? DisputeStatus.RESOLVED_BRAND
            : decision === "PARTIAL"
              ? DisputeStatus.PARTIAL_RESOLUTION
              : DisputeStatus.CLOSED;
      const claimed = await tx.dispute.updateMany({
        where: { id: disputeId, status: { in: [...ACTIVE_DISPUTE_STATUSES] } },
        data: {
          status,
          resolutionNote,
          resolvedByUserId: adminUserId,
          resolvedAt: new Date(),
        },
      });
      if (claimed.count !== 1) throw new Error("تم اتخاذ قرار نهائي لهذا النزاع مسبقاً");

      const heldAccruals = dispute.submission.earnings.filter(
        (earning) => earning.status === EarningStatus.HELD,
      );
      if (decision === "BRAND" && heldAccruals.length > 0) {
        const reversedAmount = heldAccruals.reduce((sum, item) => sum + item.amount, 0n);
        await tx.earningAccrual.updateMany({
          where: { id: { in: heldAccruals.map((item) => item.id) } },
          data: { status: EarningStatus.REVERSED },
        });
        const campaign = dispute.submission.campaignMembership.campaign;
        await tx.campaign.update({
          where: { id: campaign.id },
          data: {
            reservedBudget:
              campaign.reservedBudget > reversedAmount
                ? campaign.reservedBudget - reversedAmount
                : 0n,
          },
        });
      } else {
        await tx.earningAccrual.updateMany({
          where: { id: { in: heldAccruals.map((item) => item.id) } },
          data: { status: EarningStatus.PENDING_VERIFICATION },
        });
      }

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
      return { ...dispute, status, resolutionNote };
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
        `النزاع «${result.title}»: ${resolutionNote}`,
        "/creator/disputes",
      ),
      ...brandMemberUserIds.map((userId) =>
        NotificationService.notify(
          userId,
          NotificationType.DISPUTE_UPDATED,
          "تم حل النزاع",
          `النزاع «${result.title}»: ${resolutionNote}`,
          "/brand/disputes",
        ),
      ),
    ]);

    await AuditLogService.log({
      actorId: adminUserId,
      action: "DISPUTE_RESOLVE",
      targetType: "Dispute",
      targetId: disputeId,
      before: { status: DisputeStatus.OPEN },
      after: {
        status: result.status,
        resolutionNote,
        earningsReleased: decision !== "BRAND",
      },
    });
    return result;
  }
}
