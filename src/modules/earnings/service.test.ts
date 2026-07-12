import { describe, expect, it, vi, beforeEach } from "vitest";
import { CampaignStatus, EarningStatus, Platform } from "../../generated/prisma/enums";

vi.mock("../../lib/prisma", () => {
  const mockPrisma = {
    submission: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
    },
    metricsSnapshot: {
      findFirst: vi.fn(),
      create: vi.fn(),
    },
    earningAccrual: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
    campaign: {
      update: vi.fn(),
    },
    creatorProfile: {
      findUnique: vi.fn(),
    },
    campaignMembership: {
      findMany: vi.fn(),
    },
    $transaction: vi.fn((cb) => cb(mockPrisma)),
  };
  return { prisma: mockPrisma };
});

vi.mock("../fraud/service", () => ({
  FraudService: {
    evaluateSubmissionFromMetrics: vi.fn(),
  },
}));

import { prisma } from "../../lib/prisma";
import { EarningsService } from "./service";

describe("EarningsService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("recordMetricsAndCalculateEarnings", () => {
    it("should fail if submission is not found", async () => {
      vi.mocked(prisma.submission.findUnique).mockResolvedValue(null);

      await expect(
        EarningsService.recordMetricsAndCalculateEarnings(
          "admin-1",
          "submission-1",
          1000n,
          1000n,
        ),
      ).rejects.toThrow("المنشور المرسل غير موجود");
    });

    it("should fail if new qualified views are less than previous", async () => {
      vi.mocked(prisma.submission.findUnique).mockResolvedValue({
        id: "sub-1",
        platform: Platform.TIKTOK,
        campaignMembership: {
          campaign: {
            id: "campaign-1",
            totalBudget: 1000000n,
            reservedBudget: 0n,
            currency: "IQD",
            status: CampaignStatus.ACTIVE,
            rates: [
              {
                platform: Platform.TIKTOK,
                cpmMinorUnits: 15000n,
                maximumReward: 200000n,
              },
            ],
          },
        },
      } as any);

      vi.mocked(prisma.metricsSnapshot.findFirst).mockResolvedValue({
        qualifiedViews: 5000n,
      } as any);

      await expect(
        EarningsService.recordMetricsAndCalculateEarnings(
          "admin-1",
          "sub-1",
          4000n,
          4000n,
        ),
      ).rejects.toThrow(
        "عدد المشاهدات المؤهلة الجديد (4000) لا يمكن أن يكون أقل من السابق (5000)",
      );
    });

    it("should record metrics snapshot and calculate earnings successfully", async () => {
      const mockCampaign = {
        id: "campaign-1",
        totalBudget: 1000000n,
        reservedBudget: 0n,
        currency: "IQD",
        status: CampaignStatus.ACTIVE,
        rates: [
          {
            platform: Platform.TIKTOK,
            cpmMinorUnits: 15000n,
            maximumReward: 200000n,
          },
        ],
      };

      vi.mocked(prisma.submission.findUnique).mockResolvedValue({
        id: "sub-1",
        platform: Platform.TIKTOK,
        campaignMembership: {
          campaign: mockCampaign,
        },
      } as any);

      vi.mocked(prisma.metricsSnapshot.findFirst).mockResolvedValue(null);
      vi.mocked(prisma.earningAccrual.findMany).mockResolvedValue([]);

      vi.mocked(prisma.metricsSnapshot.create).mockResolvedValue({
        id: "snapshot-1",
        submissionId: "sub-1",
        observedViews: 10000n,
        qualifiedViews: 10000n,
        disqualifiedViews: 0n,
        source: "MANUAL_ADMIN",
        capturedAt: new Date(),
      } as any);

      const result = await EarningsService.recordMetricsAndCalculateEarnings(
        "admin-1",
        "sub-1",
        10000n,
        10000n,
      );

      expect(result).toBeDefined();
      expect(prisma.metricsSnapshot.create).toHaveBeenCalledWith({
        data: {
          submissionId: "sub-1",
          observedViews: 10000n,
          qualifiedViews: 10000n,
          disqualifiedViews: 0n,
          disqualificationReason: null,
          capturedByUserId: "admin-1",
          source: "MANUAL_ADMIN",
        },
      });

      // 10,000 views * 15 IQD CPM = 150,000 IQD
      expect(prisma.earningAccrual.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            submissionId: "sub-1",
            amount: 150000n,
            currency: "IQD",
            status: EarningStatus.PENDING_VERIFICATION,
          }),
        }),
      );

      // Campaign budget reservedBudget must be updated
      expect(prisma.campaign.update).toHaveBeenCalledWith({
        where: { id: "campaign-1" },
        data: {
          reservedBudget: 150000n,
          status: CampaignStatus.ACTIVE,
        },
      });
    });
  });

  describe("getCreatorEarningsSummary", () => {
    it("should return correct formatted summary for IQD and USD", async () => {
      vi.mocked(prisma.creatorProfile.findUnique).mockResolvedValue({
        id: "creator-1",
      } as any);

      vi.mocked(prisma.campaignMembership.findMany).mockResolvedValue([
        { id: "membership-1" },
      ] as any);

      vi.mocked(prisma.submission.findMany).mockResolvedValue([{ id: "sub-1" }] as any);

      vi.mocked(prisma.earningAccrual.findMany).mockResolvedValue([
        {
          id: "accrual-1",
          amount: 50000n,
          status: EarningStatus.PENDING_VERIFICATION,
          createdAt: new Date(),
          heldUntil: new Date(),
          submission: {
            postUrl: "https://tiktok.com/1",
            campaignMembership: {
              campaign: {
                title: "حملة 1",
                currency: "IQD",
              },
            },
          },
        },
        {
          id: "accrual-2",
          amount: 2000n, // $20.00
          status: EarningStatus.AVAILABLE,
          createdAt: new Date(),
          heldUntil: null,
          submission: {
            postUrl: "https://tiktok.com/2",
            campaignMembership: {
              campaign: {
                title: "حملة 2",
                currency: "USD",
              },
            },
          },
        },
      ] as any);

      const result = await EarningsService.getCreatorEarningsSummary("user-1");

      expect(result.IQD).toEqual({
        total: "50000",
        held: "50000",
        available: "0",
        paid: "0",
      });

      expect(result.USD).toEqual({
        total: "2000",
        held: "0",
        available: "2000",
        paid: "0",
      });

      expect(result.history).toHaveLength(2);
    });
  });
});
