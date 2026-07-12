import { describe, expect, it, vi, beforeEach } from "vitest";
import { CampaignStatus, Platform } from "../../generated/prisma/enums";

vi.mock("../../lib/prisma", () => {
  const mockPrisma = {
    brandMember: {
      findFirst: vi.fn(),
      findMany: vi.fn().mockResolvedValue([]),
    },
    campaign: {
      findUnique: vi.fn(),
      findUniqueOrThrow: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
    },
    campaignPlatformRate: {
      createMany: vi.fn(),
      deleteMany: vi.fn(),
    },
    campaignAsset: {
      createMany: vi.fn(),
      deleteMany: vi.fn(),
    },
    $transaction: vi.fn((cb) => cb(mockPrisma)),
  };
  return { prisma: mockPrisma };
});

vi.mock("../financial/service", () => ({
  FinancialService: {
    reserveCampaignBudget: vi.fn(),
  },
}));

vi.mock("../notifications/service", () => ({
  NotificationService: {
    notify: vi.fn(),
  },
}));

import { prisma } from "../../lib/prisma";
import { CampaignService } from "./service";
import { FinancialService } from "../financial/service";

function mock<T>(value: T): any {
  return value;
}

describe("CampaignService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getForBrand", () => {
    it("refuses to return a campaign owned by another brand", async () => {
      vi.mocked(prisma.brandMember.findFirst).mockResolvedValue(
        mock({ brandId: "brand-1" }),
      );
      vi.mocked(prisma.campaign.findUnique).mockResolvedValue(
        mock({ id: "campaign-1", brandId: "brand-OTHER" }),
      );

      await expect(CampaignService.getForBrand("user-1", "campaign-1")).rejects.toThrow(
        "غير موجودة",
      );
    });
  });

  describe("submitForReview", () => {
    it("refuses to submit a campaign with no platform rates", async () => {
      vi.mocked(prisma.brandMember.findFirst).mockResolvedValue(
        mock({ brandId: "brand-1" }),
      );
      vi.mocked(prisma.campaign.findUnique).mockResolvedValue(
        mock({
          id: "campaign-1",
          brandId: "brand-1",
          status: CampaignStatus.DRAFT,
          rates: [],
        }),
      );

      await expect(
        CampaignService.submitForReview("user-1", "campaign-1"),
      ).rejects.toThrow("سعر منصة");
      expect(prisma.campaign.update).not.toHaveBeenCalled();
    });

    it("refuses to re-submit a campaign that is already under review", async () => {
      vi.mocked(prisma.brandMember.findFirst).mockResolvedValue(
        mock({ brandId: "brand-1" }),
      );
      vi.mocked(prisma.campaign.findUnique).mockResolvedValue(
        mock({
          id: "campaign-1",
          brandId: "brand-1",
          status: CampaignStatus.PENDING_REVIEW,
          rates: [{ platform: Platform.TIKTOK }],
        }),
      );

      await expect(
        CampaignService.submitForReview("user-1", "campaign-1"),
      ).rejects.toThrow("حالتها الحالية");
    });
  });

  describe("review", () => {
    it("activates a campaign with no start date when approved", async () => {
      vi.mocked(prisma.campaign.findUnique).mockResolvedValue(
        mock({
          id: "campaign-1",
          status: CampaignStatus.PENDING_REVIEW,
          startsAt: null,
        }),
      );
      vi.mocked(prisma.campaign.update).mockResolvedValue(mock({}));

      await CampaignService.review("campaign-1", "admin-1", "APPROVE");

      expect(FinancialService.reserveCampaignBudget).toHaveBeenCalledWith("campaign-1");
      expect(prisma.campaign.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: CampaignStatus.ACTIVE }),
        }),
      );
    });

    it("schedules a campaign with a future start date when approved", async () => {
      const future = new Date(Date.now() + 86_400_000);
      vi.mocked(prisma.campaign.findUnique).mockResolvedValue(
        mock({
          id: "campaign-1",
          status: CampaignStatus.PENDING_REVIEW,
          startsAt: future,
        }),
      );
      vi.mocked(prisma.campaign.update).mockResolvedValue(mock({}));

      await CampaignService.review("campaign-1", "admin-1", "APPROVE");

      expect(FinancialService.reserveCampaignBudget).toHaveBeenCalledWith("campaign-1");
      expect(prisma.campaign.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: CampaignStatus.SCHEDULED }),
        }),
      );
    });

    it("refuses to review a campaign that is not pending", async () => {
      vi.mocked(prisma.campaign.findUnique).mockResolvedValue(
        mock({ id: "campaign-1", status: CampaignStatus.ACTIVE }),
      );

      await expect(
        CampaignService.review("campaign-1", "admin-1", "APPROVE"),
      ).rejects.toThrow("ليست قيد المراجعة");
    });
  });
});
