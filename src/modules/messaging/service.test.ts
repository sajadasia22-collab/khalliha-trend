import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../lib/prisma", () => ({
  prisma: {
    user: { findUnique: vi.fn() },
    conversation: {
      findUnique: vi.fn(),
      create: vi.fn(),
      findUniqueOrThrow: vi.fn(),
      update: vi.fn(),
      findMany: vi.fn(),
    },
    campaignMembership: { findFirst: vi.fn(), findMany: vi.fn() },
    conversationMessage: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      updateMany: vi.fn(),
      groupBy: vi.fn(),
      update: vi.fn(),
    },
    conversationReport: {
      findFirst: vi.fn(),
      create: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
    },
    userBlock: { findFirst: vi.fn() },
    userFollow: { findUnique: vi.fn() },
    $transaction: vi.fn(),
  },
}));

vi.mock("../notifications/service", () => ({ NotificationService: { notify: vi.fn() } }));
vi.mock("../audit-log/service", () => ({ AuditLogService: { log: vi.fn() } }));

import { prisma } from "../../lib/prisma";
import { MessagingService } from "./service";

function mock<T>(value: T): any {
  return value;
}

const conversation = {
  id: "conversation-1",
  creatorProfile: {
    id: "profile-1",
    userId: "creator-1",
    username: "creator",
    avatarUrl: null,
    user: { fullName: "الصانع" },
  },
  campaign: {
    id: "campaign-1",
    title: "حملة",
    brand: { id: "brand-1", name: "العلامة", members: [{ userId: "brand-user-1" }] },
  },
};

describe("MessagingService authorization", () => {
  beforeEach(() => vi.clearAllMocks());

  it("hides a conversation from non-participants to prevent IDOR", async () => {
    vi.mocked(prisma.conversation.findUnique).mockResolvedValue(mock(conversation));
    await expect(
      MessagingService.requireParticipant("outsider", "conversation-1"),
    ).rejects.toThrow("CONVERSATION_NOT_FOUND");
  });

  it("allows both the joined creator and a campaign brand member", async () => {
    vi.mocked(prisma.conversation.findUnique).mockResolvedValue(mock(conversation));
    await expect(
      MessagingService.requireParticipant("creator-1", "conversation-1"),
    ).resolves.toMatchObject({ isCreator: true });
    await expect(
      MessagingService.requireParticipant("brand-user-1", "conversation-1"),
    ).resolves.toMatchObject({ isCreator: false });
  });

  it("does not start a conversation without a real campaign membership", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(
      mock({ id: "brand-user-1", role: "BRAND", status: "ACTIVE", creatorProfile: null }),
    );
    vi.mocked(prisma.campaignMembership.findFirst).mockResolvedValue(null);
    await expect(
      MessagingService.create("brand-user-1", "campaign-1", "profile-1", "مرحباً"),
    ).rejects.toThrow("CAMPAIGN_CONTACT_NOT_FOUND");
    expect(prisma.conversation.create).not.toHaveBeenCalled();
  });

  it("refuses sending when either participant blocked the other", async () => {
    vi.mocked(prisma.conversation.findUnique).mockResolvedValue(mock(conversation));
    vi.mocked(prisma.userBlock.findFirst).mockResolvedValue(mock({ id: "block-1" }));
    await expect(
      MessagingService.send("creator-1", "conversation-1", "رسالة"),
    ).rejects.toThrow("CONVERSATION_BLOCKED");
    expect(prisma.conversationMessage.create).not.toHaveBeenCalled();
  });

  it("does not allow reporting your own message", async () => {
    vi.mocked(prisma.conversation.findUnique).mockResolvedValue(mock(conversation));
    vi.mocked(prisma.conversationMessage.findFirst).mockResolvedValue(
      mock({ id: "message-1", senderUserId: "creator-1" }),
    );
    await expect(
      MessagingService.report("creator-1", "conversation-1", {
        messageId: "message-1",
        reason: "SPAM",
      }),
    ).rejects.toThrow("CANNOT_REPORT_OWN_MESSAGE");
  });
});
