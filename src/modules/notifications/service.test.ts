import { describe, expect, it, vi, beforeEach } from "vitest";
import { NotificationService } from "./service";
import { NotificationType } from "../../generated/prisma/enums";

vi.mock("../../lib/prisma", () => {
  const mockPrisma = {
    notification: {
      create: vi.fn(),
    },
    notificationPreference: {
      findUnique: vi.fn(),
    },
  };
  return { prisma: mockPrisma };
});

import { prisma } from "../../lib/prisma";

describe("NotificationService.notify", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates the notification when no preference row exists (default enabled)", async () => {
    vi.mocked(prisma.notificationPreference.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.notification.create).mockResolvedValue({ id: "notif-1" } as any);

    const result = await NotificationService.notify(
      "user-1",
      NotificationType.PAYOUT_REVIEWED,
      "عنوان",
      "نص الإشعار",
    );

    expect(prisma.notification.create).toHaveBeenCalledTimes(1);
    expect(result).not.toBeNull();
  });

  it("creates the notification when the user explicitly enabled that category", async () => {
    vi.mocked(prisma.notificationPreference.findUnique).mockResolvedValue({
      enabled: true,
    } as any);

    await NotificationService.notify(
      "user-1",
      NotificationType.DISPUTE_UPDATED,
      "عنوان",
      "نص الإشعار",
    );

    expect(prisma.notification.create).toHaveBeenCalledTimes(1);
  });

  it("skips creation when the user disabled that category", async () => {
    vi.mocked(prisma.notificationPreference.findUnique).mockResolvedValue({
      enabled: false,
    } as any);

    const result = await NotificationService.notify(
      "user-1",
      NotificationType.DISPUTE_UPDATED,
      "عنوان",
      "نص الإشعار",
    );

    expect(prisma.notification.create).not.toHaveBeenCalled();
    expect(result).toBeNull();
  });
});
