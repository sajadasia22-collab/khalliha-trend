import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  EarningStatus,
  FraudReviewStatus,
  FraudRiskLevel,
  FraudSignalKind,
  TrustScoreEventReason,
} from "../../generated/prisma/enums";

vi.mock("../../lib/prisma", () => {
  const mockPrisma = {
    submission: {
      findUnique: vi.fn(),
    },
    fraudSignal: {
      create: vi.fn(),
      findMany: vi.fn(),
      findFirst: vi.fn(),
    },
    fraudAssessment: {
      upsert: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
    creatorProfile: {
      update: vi.fn(),
    },
    trustScoreEvent: {
      create: vi.fn(),
    },
    earningAccrual: {
      updateMany: vi.fn(),
    },
    campaign: {
      update: vi.fn(),
    },
    $transaction: vi.fn((cb) => cb(mockPrisma)),
  };
  return { prisma: mockPrisma };
});

vi.mock("../notifications/service", () => ({
  NotificationService: { notify: vi.fn() },
}));

import { prisma } from "../../lib/prisma";
import { FraudService } from "./service";

describe("FraudService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(prisma.fraudAssessment.updateMany).mockResolvedValue({ count: 1 });
  });

  it("creates manual signal and recalculates assessment", async () => {
    vi.mocked(prisma.submission.findUnique).mockResolvedValue({ id: "sub-1" } as any);
    vi.mocked(prisma.fraudSignal.findMany).mockResolvedValue([
      { scoreImpact: 40 },
      { scoreImpact: 35 },
    ] as any);
    vi.mocked(prisma.fraudAssessment.upsert).mockResolvedValue({
      id: "assessment-1",
      fraudScore: 75,
      riskLevel: FraudRiskLevel.HIGH,
    } as any);

    const result = await FraudService.addManualSignal(
      "admin-1",
      "sub-1",
      FraudSignalKind.MANUAL_ADMIN_FLAG,
      40,
      "نشاط غير طبيعي",
    );

    expect(result.fraudScore).toBe(75);
    expect(prisma.fraudSignal.create).toHaveBeenCalledWith({
      data: {
        submissionId: "sub-1",
        kind: FraudSignalKind.MANUAL_ADMIN_FLAG,
        scoreImpact: 40,
        note: "نشاط غير طبيعي",
        createdByUserId: "admin-1",
      },
    });
  });

  it("automatically flags a high disqualification ratio and a threefold view spike", async () => {
    vi.mocked(prisma.submission.findUnique).mockResolvedValue({
      id: "sub-1",
      metricsSnapshots: [
        { observedViews: 1_000n, qualifiedViews: 400n, disqualifiedViews: 600n },
        { observedViews: 200n, qualifiedViews: 100n, disqualifiedViews: 100n },
      ],
    } as any);
    vi.mocked(prisma.fraudSignal.findFirst).mockResolvedValue(null);
    vi.mocked(prisma.fraudSignal.findMany).mockResolvedValue([
      { scoreImpact: 45 },
      { scoreImpact: 35 },
    ] as any);
    vi.mocked(prisma.fraudAssessment.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.fraudAssessment.upsert).mockResolvedValue({
      fraudScore: 80,
      riskLevel: FraudRiskLevel.HIGH,
    } as any);

    const result = await FraudService.evaluateSubmissionFromMetrics("sub-1");

    expect(result.riskLevel).toBe(FraudRiskLevel.HIGH);
    expect(prisma.fraudSignal.create).toHaveBeenCalledTimes(2);
  });

  it("confirms assessment and lowers creator trust score", async () => {
    vi.mocked(prisma.fraudAssessment.findUnique).mockResolvedValue({
      id: "assessment-1",
      submission: {
        earnings: [],
        socialAccount: {
          creatorProfile: {
            id: "creator-profile-1",
            userId: "creator-user",
            trustScore: 50,
          },
        },
        campaignMembership: {
          campaign: { id: "camp-1", reservedBudget: 0n },
        },
      },
    } as any);
    await FraudService.resolveAssessment("admin-1", "assessment-1", "CONFIRM", "تأكيد");

    expect(prisma.creatorProfile.update).toHaveBeenCalledWith({
      where: { id: "creator-profile-1" },
      data: { trustScore: 40 },
    });
    expect(prisma.trustScoreEvent.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        delta: -10,
        reason: TrustScoreEventReason.FRAUD_CONFIRMED,
      }),
    });
  });

  it("reverses pending earnings and frees reserved budget when fraud is confirmed", async () => {
    vi.mocked(prisma.fraudAssessment.findUnique).mockResolvedValue({
      id: "assessment-1",
      submission: {
        earnings: [
          { id: "earn-1", amount: 30_000n, status: EarningStatus.PENDING_VERIFICATION },
          { id: "earn-2", amount: 10_000n, status: EarningStatus.HELD },
          { id: "earn-3", amount: 5_000n, status: EarningStatus.PAID },
        ],
        socialAccount: {
          creatorProfile: {
            id: "creator-profile-1",
            userId: "creator-user",
            trustScore: 50,
          },
        },
        campaignMembership: {
          campaign: { id: "camp-1", reservedBudget: 100_000n },
        },
      },
    } as any);

    await FraudService.resolveAssessment("admin-1", "assessment-1", "CONFIRM", "تأكيد");

    expect(prisma.earningAccrual.updateMany).toHaveBeenCalledWith({
      where: { id: { in: ["earn-1", "earn-2"] } },
      data: { status: EarningStatus.REVERSED },
    });
    expect(prisma.campaign.update).toHaveBeenCalledWith({
      where: { id: "camp-1" },
      data: { reservedBudget: 60_000n },
    });
  });

  it("does not touch earnings when suspicion is cleared", async () => {
    vi.mocked(prisma.fraudAssessment.findUnique).mockResolvedValue({
      id: "assessment-1",
      submission: {
        earnings: [
          { id: "earn-1", amount: 30_000n, status: EarningStatus.PENDING_VERIFICATION },
        ],
        socialAccount: {
          creatorProfile: {
            id: "creator-profile-1",
            userId: "creator-user",
            trustScore: 50,
          },
        },
        campaignMembership: {
          campaign: { id: "camp-1", reservedBudget: 100_000n },
        },
      },
    } as any);

    await FraudService.resolveAssessment("admin-1", "assessment-1", "CLEAR", "سليم");

    expect(prisma.earningAccrual.updateMany).not.toHaveBeenCalled();
    expect(prisma.campaign.update).not.toHaveBeenCalled();
  });

  it("creates a zero-score assessment as CLEARED so it skips the human queue", async () => {
    vi.mocked(prisma.submission.findUnique).mockResolvedValue({
      id: "sub-1",
      metricsSnapshots: [
        { observedViews: 1_000n, qualifiedViews: 1_000n, disqualifiedViews: 0n },
      ],
    } as any);
    vi.mocked(prisma.fraudSignal.findMany).mockResolvedValue([] as any);
    vi.mocked(prisma.fraudAssessment.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.fraudAssessment.upsert).mockResolvedValue({
      fraudScore: 0,
      riskLevel: FraudRiskLevel.LOW,
      status: FraudReviewStatus.CLEARED,
    } as any);

    await FraudService.evaluateSubmissionFromMetrics("sub-1");

    expect(prisma.fraudAssessment.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({ status: FraudReviewStatus.CLEARED }),
      }),
    );
  });

  it("does not apply trust score twice after a final review", async () => {
    vi.mocked(prisma.fraudAssessment.findUnique).mockResolvedValue({
      id: "assessment-1",
      submission: {
        earnings: [],
        socialAccount: {
          creatorProfile: {
            id: "creator-profile-1",
            userId: "creator-user",
            trustScore: 40,
          },
        },
        campaignMembership: {
          campaign: { id: "camp-1", reservedBudget: 0n },
        },
      },
    } as any);
    vi.mocked(prisma.fraudAssessment.updateMany).mockResolvedValue({ count: 0 });
    await expect(
      FraudService.resolveAssessment("admin-1", "assessment-1", "CONFIRM", "تكرار"),
    ).rejects.toThrow("مسبقاً");
    expect(prisma.creatorProfile.update).not.toHaveBeenCalled();
  });
});
