import type { Prisma } from "../../generated/prisma/client";
import {
  CommunityReportStatus,
  MessagePermission,
  NotificationType,
  UserRole,
  UserStatus,
} from "../../generated/prisma/enums";
import { prisma } from "../../lib/prisma";
import { AuditLogService } from "../audit-log/service";
import { NotificationService } from "../notifications/service";

const conversationInclude = {
  campaign: {
    select: {
      id: true,
      title: true,
      brand: { select: { id: true, name: true, members: { select: { userId: true } } } },
    },
  },
  creatorProfile: {
    select: {
      id: true,
      username: true,
      avatarUrl: true,
      userId: true,
      user: { select: { fullName: true } },
    },
  },
} satisfies Prisma.ConversationInclude;

async function requireMessagingUser(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      role: true,
      status: true,
      creatorProfile: { select: { id: true } },
    },
  });
  if (
    !user ||
    user.status !== UserStatus.ACTIVE ||
    (user.role !== UserRole.CREATOR && user.role !== UserRole.BRAND)
  ) {
    throw new Error("MESSAGING_ROLE_NOT_ALLOWED");
  }
  return user;
}

export class MessagingService {
  static async requireParticipant(userId: string, conversationId: string) {
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: conversationInclude,
    });
    if (!conversation) throw new Error("CONVERSATION_NOT_FOUND");
    const isCreator = conversation.creatorProfile.userId === userId;
    const isBrand = conversation.campaign.brand.members.some(
      (member) => member.userId === userId,
    );
    if (!isCreator && !isBrand) throw new Error("CONVERSATION_NOT_FOUND");
    return { conversation, isCreator };
  }

  static async listContacts(userId: string) {
    const user = await requireMessagingUser(userId);
    if (user.role === UserRole.CREATOR) {
      return prisma.campaignMembership.findMany({
        where: { creatorProfile: { userId } },
        select: {
          campaign: {
            select: { id: true, title: true, brand: { select: { name: true } } },
          },
          creatorProfileId: true,
        },
        orderBy: { createdAt: "desc" },
      });
    }
    return prisma.campaignMembership.findMany({
      where: { campaign: { brand: { members: { some: { userId } } } } },
      select: {
        campaign: {
          select: { id: true, title: true, brand: { select: { name: true } } },
        },
        creatorProfileId: true,
        creatorProfile: {
          select: {
            username: true,
            avatarUrl: true,
            user: { select: { fullName: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  static async list(userId: string, search = "") {
    const user = await requireMessagingUser(userId);
    const ownership: Prisma.ConversationWhereInput =
      user.role === UserRole.CREATOR
        ? { creatorProfile: { userId } }
        : { campaign: { brand: { members: { some: { userId } } } } };
    const where: Prisma.ConversationWhereInput = {
      AND: [
        ownership,
        search
          ? {
              OR: [
                { campaign: { title: { contains: search, mode: "insensitive" } } },
                {
                  campaign: {
                    brand: { name: { contains: search, mode: "insensitive" } },
                  },
                },
                {
                  creatorProfile: {
                    user: { fullName: { contains: search, mode: "insensitive" } },
                  },
                },
                {
                  messages: {
                    some: {
                      body: { contains: search, mode: "insensitive" },
                      removedAt: null,
                    },
                  },
                },
              ],
            }
          : {},
      ],
    };
    const items = await prisma.conversation.findMany({
      where,
      include: {
        ...conversationInclude,
        messages: { orderBy: { createdAt: "desc" }, take: 1 },
      },
      orderBy: { lastMessageAt: "desc" },
      take: 100,
    });
    const unread = await prisma.conversationMessage.groupBy({
      by: ["conversationId"],
      where: { conversation: ownership, senderUserId: { not: userId }, readAt: null },
      _count: { _all: true },
    });
    const unreadMap = new Map(unread.map((row) => [row.conversationId, row._count._all]));
    return items.map((item) => ({ ...item, unreadCount: unreadMap.get(item.id) ?? 0 }));
  }

  static async create(
    userId: string,
    campaignId: string,
    creatorProfileId: string | undefined,
    body: string,
  ) {
    const user = await requireMessagingUser(userId);
    const membership = await prisma.campaignMembership.findFirst({
      where: {
        campaignId,
        ...(user.role === UserRole.CREATOR
          ? { creatorProfile: { userId } }
          : { creatorProfileId, campaign: { brand: { members: { some: { userId } } } } }),
      },
      include: {
        creatorProfile: { include: { user: { include: { privacySettings: true } } } },
        campaign: {
          include: {
            brand: {
              include: {
                members: { include: { user: { include: { privacySettings: true } } } },
              },
            },
          },
        },
      },
    });
    if (!membership) throw new Error("CAMPAIGN_CONTACT_NOT_FOUND");
    const creatorId = membership.creatorProfileId;
    const existing = await prisma.conversation.findUnique({
      where: { campaignId_creatorProfileId: { campaignId, creatorProfileId: creatorId } },
    });
    if (!existing) {
      const recipient =
        user.role === UserRole.CREATOR
          ? membership.campaign.brand.members[0]?.user
          : membership.creatorProfile.user;
      if (!recipient) throw new Error("CAMPAIGN_CONTACT_NOT_FOUND");
      const blocked = await prisma.userBlock.findFirst({
        where: {
          OR: [
            { blockerUserId: userId, blockedUserId: recipient.id },
            { blockerUserId: recipient.id, blockedUserId: userId },
          ],
        },
      });
      if (blocked) throw new Error("CONVERSATION_BLOCKED");
      const permission =
        recipient.privacySettings?.messagePermission ??
        MessagePermission.CAMPAIGN_CONTACTS;
      if (permission === MessagePermission.NOBODY)
        throw new Error("MESSAGE_PERMISSION_DENIED");
      if (permission === MessagePermission.FOLLOWING) {
        const follows = await prisma.userFollow.findUnique({
          where: {
            followerUserId_followedUserId: {
              followerUserId: recipient.id,
              followedUserId: userId,
            },
          },
        });
        if (!follows) throw new Error("MESSAGE_PERMISSION_DENIED");
      }
    }
    const conversation =
      existing ??
      (await prisma.conversation.create({
        data: { campaignId, creatorProfileId: creatorId, createdByUserId: userId },
      }));
    await this.send(userId, conversation.id, body);
    return prisma.conversation.findUniqueOrThrow({
      where: { id: conversation.id },
      include: conversationInclude,
    });
  }

  static async messages(userId: string, conversationId: string, search = "") {
    await this.requireParticipant(userId, conversationId);
    const messages = await prisma.conversationMessage.findMany({
      where: {
        conversationId,
        ...(search
          ? { body: { contains: search, mode: "insensitive" }, removedAt: null }
          : {}),
      },
      include: { sender: { select: { id: true, fullName: true, role: true } } },
      orderBy: { createdAt: "asc" },
      take: 200,
    });
    return messages.map((message) =>
      message.removedAt
        ? { ...message, body: "تمت إزالة هذه الرسالة بواسطة الإدارة." }
        : message,
    );
  }

  static async send(userId: string, conversationId: string, body: string) {
    const { conversation, isCreator } = await this.requireParticipant(
      userId,
      conversationId,
    );
    const otherIds = isCreator
      ? conversation.campaign.brand.members.map((member) => member.userId)
      : [conversation.creatorProfile.userId];
    const blocked = await prisma.userBlock.findFirst({
      where: {
        OR: otherIds.flatMap((otherId) => [
          { blockerUserId: userId, blockedUserId: otherId },
          { blockerUserId: otherId, blockedUserId: userId },
        ]),
      },
    });
    if (blocked) throw new Error("CONVERSATION_BLOCKED");
    const message = await prisma.$transaction(async (tx) => {
      const created = await tx.conversationMessage.create({
        data: { conversationId, senderUserId: userId, body },
        include: { sender: { select: { id: true, fullName: true, role: true } } },
      });
      await tx.conversation.update({
        where: { id: conversationId },
        data: { lastMessageAt: created.createdAt },
      });
      return created;
    });
    await Promise.all(
      otherIds.map((recipientId) =>
        NotificationService.notify(
          recipientId,
          NotificationType.MESSAGE_RECEIVED,
          `رسالة جديدة — ${conversation.campaign.title}`,
          body.length > 100 ? `${body.slice(0, 100)}…` : body,
          isCreator ? "/brand/messages" : "/creator/messages",
        ),
      ),
    );
    return message;
  }

  static async markRead(userId: string, conversationId: string) {
    await this.requireParticipant(userId, conversationId);
    return prisma.conversationMessage.updateMany({
      where: { conversationId, senderUserId: { not: userId }, readAt: null },
      data: { readAt: new Date() },
    });
  }

  static async report(
    userId: string,
    conversationId: string,
    input: {
      messageId?: string;
      reason: Prisma.ConversationReportCreateInput["reason"];
      details?: string;
    },
  ) {
    await this.requireParticipant(userId, conversationId);
    let message = null;
    if (input.messageId) {
      message = await prisma.conversationMessage.findFirst({
        where: { id: input.messageId, conversationId },
      });
      if (!message) throw new Error("MESSAGE_NOT_FOUND");
      if (message.senderUserId === userId) throw new Error("CANNOT_REPORT_OWN_MESSAGE");
      const existing = await prisma.conversationReport.findFirst({
        where: {
          reporterId: userId,
          messageId: input.messageId,
          status: CommunityReportStatus.OPEN,
        },
      });
      if (existing) throw new Error("REPORT_ALREADY_OPEN");
    }
    const report = await prisma.conversationReport.create({
      data: {
        conversationId,
        messageId: input.messageId,
        reporterId: userId,
        reason: input.reason,
        details: input.details,
      },
    });
    await AuditLogService.log({
      actorId: userId,
      action: "CONVERSATION_REPORT_CREATE",
      targetType: "ConversationReport",
      targetId: report.id,
      after: { conversationId, messageId: input.messageId, reason: input.reason },
    });
    return report;
  }

  static async listReports() {
    return prisma.conversationReport.findMany({
      where: { status: CommunityReportStatus.OPEN },
      include: {
        reporter: { select: { id: true, fullName: true, role: true } },
        message: {
          select: {
            id: true,
            body: true,
            sender: { select: { id: true, fullName: true, role: true } },
          },
        },
        conversation: { include: conversationInclude },
      },
      orderBy: { createdAt: "asc" },
    });
  }

  static async reviewReport(
    adminId: string,
    reportId: string,
    decision: "DISMISS" | "ACTION",
    reviewNote: string,
  ) {
    const admin = await prisma.user.findUnique({
      where: { id: adminId },
      select: { role: true },
    });
    if (!admin || (admin.role !== UserRole.ADMIN && admin.role !== UserRole.SUPER_ADMIN))
      throw new Error("MESSAGING_ROLE_NOT_ALLOWED");
    const report = await prisma.conversationReport.findFirst({
      where: { id: reportId, status: CommunityReportStatus.OPEN },
    });
    if (!report) throw new Error("CONVERSATION_REPORT_NOT_OPEN");
    const updated = await prisma.$transaction(async (tx) => {
      if (decision === "ACTION" && report.messageId) {
        await tx.conversationMessage.update({
          where: { id: report.messageId },
          data: { removedAt: new Date() },
        });
      }
      return tx.conversationReport.update({
        where: { id: reportId },
        data: {
          status:
            decision === "ACTION"
              ? CommunityReportStatus.ACTIONED
              : CommunityReportStatus.DISMISSED,
          reviewNote,
          reviewedById: adminId,
          reviewedAt: new Date(),
        },
      });
    });
    await AuditLogService.log({
      actorId: adminId,
      action: `CONVERSATION_REPORT_${decision}`,
      targetType: "ConversationReport",
      targetId: reportId,
      before: { status: report.status },
      after: {
        status: updated.status,
        reviewNote,
        messageRemoved: decision === "ACTION" && Boolean(report.messageId),
      },
    });
    return updated;
  }
}
