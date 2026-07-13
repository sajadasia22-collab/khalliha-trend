import { prisma } from "../../lib/prisma";
import { hashPassword, verifyPassword } from "../../lib/auth/password";
import { NotificationType } from "../../generated/prisma/enums";
import type { UpdateNotificationPreferencesInput } from "./schemas";

// Only categories a user can meaningfully opt out of are exposed here.
// GENERIC remains internal; every category below has a real user-facing call site.
const USER_FACING_NOTIFICATION_TYPES: NotificationType[] = [
  NotificationType.CAMPAIGN_APPROVED,
  NotificationType.CAMPAIGN_NEEDS_CHANGES,
  NotificationType.CAMPAIGN_REJECTED,
  NotificationType.SUBMISSION_REVIEWED,
  NotificationType.DEPOSIT_REVIEWED,
  NotificationType.PAYOUT_REVIEWED,
  NotificationType.DISPUTE_UPDATED,
  NotificationType.FRAUD_FLAGGED,
];

export class AccountService {
  static async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.passwordHash) {
      throw new Error("المستخدم غير موجود");
    }
    if (!verifyPassword(currentPassword, user.passwordHash)) {
      throw new Error("كلمة المرور الحالية غير صحيحة");
    }

    const passwordHash = hashPassword(newPassword);
    await prisma.user.update({ where: { id: userId }, data: { passwordHash } });
  }

  static async getNotificationPreferences(userId: string) {
    const rows = await prisma.notificationPreference.findMany({ where: { userId } });
    const enabledByType = new Map(rows.map((row) => [row.type, row.enabled]));
    return USER_FACING_NOTIFICATION_TYPES.map((type) => ({
      type,
      enabled: enabledByType.get(type) ?? true,
    }));
  }

  static async updateNotificationPreferences(
    userId: string,
    input: UpdateNotificationPreferencesInput,
  ) {
    await prisma.$transaction(
      input.preferences.map((pref) =>
        prisma.notificationPreference.upsert({
          where: { userId_type: { userId, type: pref.type } },
          update: { enabled: pref.enabled },
          create: { userId, type: pref.type, enabled: pref.enabled },
        }),
      ),
    );
    return AccountService.getNotificationPreferences(userId);
  }

  static async updateProfile(
    userId: string,
    fullName: string,
    email: string | null | undefined,
  ) {
    if (email) {
      const existing = await prisma.user.findFirst({
        where: {
          email,
          id: { not: userId },
        },
      });
      if (existing) {
        throw new Error("البريد الإلكتروني مستخدم بالفعل من قبل حساب آخر");
      }
    }

    return await prisma.user.update({
      where: { id: userId },
      data: {
        fullName,
        email: email || null,
      },
    });
  }
}
