import { prisma } from "../../lib/prisma";
import { NotificationType } from "../../generated/prisma/enums";
import type { PrismaClient } from "../../generated/prisma/client";

type NotificationTxClient = Pick<PrismaClient, "notification">;

type NotificationTxClientWithPreferences = NotificationTxClient &
  Pick<PrismaClient, "notificationPreference">;

export class NotificationService {
  static async notify(
    userId: string,
    type: NotificationType,
    title: string,
    body: string,
    link?: string,
    tx: NotificationTxClientWithPreferences = prisma,
  ) {
    // Absence of a preference row means "enabled" — rows are only created
    // once a user explicitly opts out via account settings.
    const preference = await tx.notificationPreference.findUnique({
      where: { userId_type: { userId, type } },
    });
    if (preference?.enabled === false) {
      return null;
    }

    return tx.notification.create({
      data: { userId, type, title, body, link: link ?? null },
    });
  }

  static async listForUser(userId: string, limit = 20) {
    return prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
  }

  static async unreadCount(userId: string) {
    return prisma.notification.count({ where: { userId, readAt: null } });
  }

  static async markAsRead(userId: string, notificationId: string) {
    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
    });
    if (!notification || notification.userId !== userId) {
      throw new Error("الإشعار غير موجود");
    }
    if (notification.readAt) {
      return notification;
    }
    return prisma.notification.update({
      where: { id: notificationId },
      data: { readAt: new Date() },
    });
  }

  static async markAllAsRead(userId: string) {
    return prisma.notification.updateMany({
      where: { userId, readAt: null },
      data: { readAt: new Date() },
    });
  }
}
