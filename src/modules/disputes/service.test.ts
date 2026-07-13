import { beforeEach, describe, expect, it, vi } from "vitest";
import { DisputeReason, UserRole } from "../../generated/prisma/enums";

vi.mock("../../lib/prisma", () => {
  const mockPrisma = {
    user: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
    },
    submission: {
      findUnique: vi.fn(),
    },
    dispute: {
      create: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
    disputeMessage: {
      create: vi.fn(),
    },
    earningAccrual: {
      updateMany: vi.fn(),
    },
    campaign: {
      update: vi.fn(),
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
    campaign: {
      id: "campaign-1",
      title: "حملة",
      reservedBudget: 10_000n,
      brand: { members: [{ userId: "brand-user" }] },
    },
  },
  earnings: [],
};

describe("DisputeService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(prisma.dispute.findFirst).mockResolvedValue(null);
    vi.mocked(prisma.dispute.updateMany).mockResolvedValue({ count: 1 });
    vi.mocked(prisma.user.findMany).mockResolvedValue([] as any);
    vi.mocked(prisma.earningAccrual.updateMany).mockResolvedValue({ count: 0 });
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
    expect(prisma.earningAccrual.updateMany).toHaveBeenCalledWith({
      where: {
        submissionId: "sub-1",
        status: "PENDING_VERIFICATION",
      },
      data: { status: "HELD" },
    });
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
    await DisputeService.resolve("admin-1", "dispute-1", "CREATOR", "تم قبول الاعتراض");

    expect(prisma.creatorProfile.update).toHaveBeenCalledWith({
      where: { id: "cp-1" },
      data: { trustScore: 55 },
    });
  });

  it("blocks a duplicate active dispute for the same submission", async () => {
    vi.mocked(prisma.submission.findUnique).mockResolvedValue(submission as any);
    vi.mocked(prisma.dispute.findFirst).mockResolvedValue({ id: "existing" } as any);
    await expect(
      DisputeService.create("creator-user", {
        submissionId: "sub-1",
        reason: DisputeReason.EARNINGS,
        title: "اعتراض مكرر",
        description: "هذه تفاصيل الاعتراض المكرر",
      }),
    ).rejects.toThrow("نزاع نشط مسبقاً");
  });

  it("blocks resolving the same dispute twice", async () => {
    vi.mocked(prisma.dispute.findUnique).mockResolvedValue({
      id: "dispute-1",
      title: "نزاع",
      submission,
    } as any);
    vi.mocked(prisma.dispute.updateMany).mockResolvedValue({ count: 0 });
    await expect(
      DisputeService.resolve("admin-1", "dispute-1", "CREATOR", "قرار نهائي"),
    ).rejects.toThrow("مسبقاً");
    expect(prisma.creatorProfile.update).not.toHaveBeenCalled();
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
