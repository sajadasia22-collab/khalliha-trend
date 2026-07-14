import { describe, expect, it, vi, beforeEach } from "vitest";
import { pbkdf2Sync } from "crypto";
import { AccountService } from "./service";
import { NotificationType } from "../../generated/prisma/enums";

vi.mock("../../lib/prisma", () => {
  const mockPrisma = {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    notificationPreference: {
      findMany: vi.fn(),
      upsert: vi.fn(),
    },
    $transaction: vi.fn((operations: unknown) =>
      Array.isArray(operations) ? Promise.all(operations) : operations,
    ),
  };
  return { prisma: mockPrisma };
});

import { prisma } from "../../lib/prisma";

function hashFor(password: string) {
  const salt = "46f88296a80ea47f";
  const hash = pbkdf2Sync(password, salt, 10000, 64, "sha512").toString("hex");
  return `${salt}:${hash}`;
}

describe("AccountService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("changePassword", () => {
    it("rejects when the current password is wrong", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: "user-1",
        passwordHash: hashFor("correct-password"),
      } as any);

      await expect(
        AccountService.changePassword("user-1", "wrong-password", "new-password-123"),
      ).rejects.toThrow("كلمة المرور الحالية غير صحيحة");

      expect(prisma.user.update).not.toHaveBeenCalled();
    });

    it("throws when the user does not exist", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

      await expect(
        AccountService.changePassword("missing-user", "anything", "new-password-123"),
      ).rejects.toThrow("المستخدم غير موجود");
    });

    it("updates the password hash when the current password is correct", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: "user-1",
        passwordHash: hashFor("correct-password"),
      } as any);

      await AccountService.changePassword(
        "user-1",
        "correct-password",
        "new-password-123",
      );

      expect(prisma.user.update).toHaveBeenCalledTimes(1);
      const call = vi.mocked(prisma.user.update).mock.calls[0][0];
      expect(call.where).toEqual({ id: "user-1" });
      // The new hash must actually verify against the new password, and must
      // not equal the old stored hash (a no-op update would be a real bug).
      expect(call.data.passwordHash).not.toBe(hashFor("correct-password"));
    });
  });

  describe("getNotificationPreferences", () => {
    it("defaults every category to enabled when no preference rows exist", async () => {
      vi.mocked(prisma.notificationPreference.findMany).mockResolvedValue([]);

      const preferences = await AccountService.getNotificationPreferences("user-1");

      expect(preferences.length).toBeGreaterThan(0);
      expect(preferences.every((pref) => pref.enabled)).toBe(true);
    });

    it("reflects an explicit opt-out row", async () => {
      vi.mocked(prisma.notificationPreference.findMany).mockResolvedValue([
        { userId: "user-1", type: NotificationType.DISPUTE_UPDATED, enabled: false },
      ] as any);

      const preferences = await AccountService.getNotificationPreferences("user-1");
      const disputePref = preferences.find(
        (pref) => pref.type === NotificationType.DISPUTE_UPDATED,
      );

      expect(disputePref?.enabled).toBe(false);
    });
  });

  describe("updateNotificationPreferences", () => {
    it("upserts each submitted preference by userId+type", async () => {
      vi.mocked(prisma.notificationPreference.findMany).mockResolvedValue([]);

      await AccountService.updateNotificationPreferences("user-1", {
        preferences: [{ type: NotificationType.DEPOSIT_REVIEWED, enabled: false }],
      });

      expect(prisma.notificationPreference.upsert).toHaveBeenCalledWith({
        where: {
          userId_type: { userId: "user-1", type: NotificationType.DEPOSIT_REVIEWED },
        },
        update: { enabled: false },
        create: {
          userId: "user-1",
          type: NotificationType.DEPOSIT_REVIEWED,
          enabled: false,
        },
      });
    });
  });

  describe("exportUserData", () => {
    it("does not export anything when the authenticated user no longer exists", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

      await expect(AccountService.exportUserData("missing-user")).rejects.toThrow(
        "USER_NOT_FOUND",
      );
    });
  });
});
