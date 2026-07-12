import { describe, expect, it, vi, beforeEach } from "vitest";
import { BrandVerificationStatus } from "../../generated/prisma/enums";

vi.mock("../../lib/prisma", () => {
  const mockPrisma = {
    brandMember: {
      findFirst: vi.fn(),
    },
    brandVerification: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    brandProfile: {
      update: vi.fn(),
    },
    $transaction: vi.fn((cb) => cb(mockPrisma)),
  };
  return { prisma: mockPrisma };
});

import { prisma } from "../../lib/prisma";
import { BrandProfileService } from "./service";

function mock<T>(value: T): any {
  return value;
}

describe("BrandProfileService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("requestVerification", () => {
    it("refuses a second request while one is already pending", async () => {
      vi.mocked(prisma.brandMember.findFirst).mockResolvedValue(
        mock({ brandId: "brand-1" }),
      );
      vi.mocked(prisma.brandVerification.findFirst).mockResolvedValue(
        mock({ id: "verification-1", status: BrandVerificationStatus.PENDING }),
      );

      await expect(BrandProfileService.requestVerification("user-1")).rejects.toThrow(
        "قيد المراجعة",
      );
      expect(prisma.brandVerification.create).not.toHaveBeenCalled();
    });
  });

  describe("reviewVerification", () => {
    it("marks the brand as verified when approved", async () => {
      vi.mocked(prisma.brandVerification.findUnique).mockResolvedValue(
        mock({
          id: "verification-1",
          brandId: "brand-1",
          status: BrandVerificationStatus.PENDING,
        }),
      );
      vi.mocked(prisma.brandVerification.update).mockResolvedValue(mock({}));

      await BrandProfileService.reviewVerification(
        "verification-1",
        "admin-1",
        "APPROVED",
      );

      expect(prisma.brandProfile.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: "brand-1" } }),
      );
    });

    it("refuses to re-review an already-decided verification", async () => {
      vi.mocked(prisma.brandVerification.findUnique).mockResolvedValue(
        mock({
          id: "verification-1",
          brandId: "brand-1",
          status: BrandVerificationStatus.APPROVED,
        }),
      );

      await expect(
        BrandProfileService.reviewVerification("verification-1", "admin-1", "APPROVED"),
      ).rejects.toThrow("تمت مراجعة");
    });
  });
});
