import { beforeEach, describe, expect, it, vi } from "vitest";
import { DisputeReason, DisputeStatus, UserRole } from "../../generated/prisma/enums";

vi.mock("../../lib/prisma", () => {
  const mockPrisma = {
    user: {
      findUnique: vi.fn(),
    },
    submission: {
      findUnique: vi.fn(),
    },
    dispute: {
      create: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    disputeMessage: {
      create: vi.fn(),
    },
    creatorProfile: {
      update: vi.fn(),
    },
    trustScoreEvent: {
      create: vi.fn(),
    },
    $transaction: vi.fn((cb) => cb(mockPrisma)),
  };
  return { prisma: mockPrisma };
});

vi.mock("../notifications/service", () => ({
  NotificationService: {
    notify: vi.fn(),
  },
}));

import { prisma } from "../../lib/prisma";
import { DisputeService } from "./service";

const submission = {
  id: "sub-1",
  socialAccount: {
    creatorProfile: { id: "cp-1", userId: "creator-user", trustScore: 50 },
  },
  campaignMembership: {
    campaign: { brand: { members: [{ userId: "brand-user" }] } },
  },
};

describe("DisputeService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("allows creator to open dispute on own submission", async () => {
    vi.mocked(prisma.submission.findUnique).mockResolvedValue(submission as any);
    vi.mocked(prisma.dispute.create).mockResolvedValue({ id: "dispute-1" } as any);

    const result = await DisputeService.create("creator-user", {
      submissionId: "sub-1",
      reason: DisputeReason.QUALIFIED_VIEWS,
      title: "اعتراض على المشاهدات",
      description: "المشاهدات المؤهلة أقل من المتوقع",
    });

    expect(result.id).toBe("dispute-1");
    expect(prisma.disputeMessage.create).toHaveBeenCalled();
  });

  it("blocks unrelated user from opening dispute", async () => {
    vi.mocked(prisma.submission.findUnique).mockResolvedValue(submission as any);

    await expect(
      DisputeService.create("other-user", {
        submissionId: "sub-1",
        reason: DisputeReason.OTHER,
        title: "نزاع",
        description: "تفاصيل نزاع غير مصرح",
      }),
    ).rejects.toThrow("لا تملك صلاحية");
  });

  it("resolves dispute in favor of creator and raises trust score", async () => {
    vi.mocked(prisma.dispute.findUnique).mockResolvedValue({
      id: "dispute-1",
      submission,
    } as any);
    vi.mocked(prisma.dispute.update).mockResolvedValue({
      id: "dispute-1",
      status: DisputeStatus.RESOLVED_CREATOR,
      title: "اعتراض على المشاهدات",
      submission,
    } as any);

    await DisputeService.resolve("admin-1", "dispute-1", "CREATOR", "تم قبول الاعتراض");

    expect(prisma.creatorProfile.update).toHaveBeenCalledWith({
      where: { id: "cp-1" },
      data: { trustScore: 55 },
    });
  });

  it("admin can list all disputes", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: "admin-1",
      role: UserRole.ADMIN,
    } as any);
    vi.mocked(prisma.dispute.findMany).mockResolvedValue([] as any);

    await DisputeService.listForUser("admin-1");

    expect(prisma.dispute.findMany).toHaveBeenCalled();
  });
});
