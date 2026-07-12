import { describe, expect, it, vi, beforeEach } from "vitest";
import { Platform, SocialAccountStatus } from "../../generated/prisma/enums";

vi.mock("../../lib/prisma", () => {
  const mockPrisma = {
    creatorProfile: {
      findUnique: vi.fn(),
    },
    socialAccount: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
    },
  };
  return { prisma: mockPrisma };
});

import { prisma } from "../../lib/prisma";
import { SocialAccountService } from "./service";

function mock<T>(value: T): any {
  return value;
}

describe("SocialAccountService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createForUser", () => {
    it("rejects a handle already linked by another creator", async () => {
      vi.mocked(prisma.creatorProfile.findUnique).mockResolvedValue(
        mock({ id: "profile-1" }),
      );
      vi.mocked(prisma.socialAccount.findUnique).mockResolvedValue(
        mock({ id: "existing-account" }),
      );

      await expect(
        SocialAccountService.createForUser("user-1", {
          platform: Platform.TIKTOK,
          handle: "someone",
          profileUrl: "https://tiktok.com/@someone",
        }),
      ).rejects.toThrow("مرتبط بالفعل");
    });

    it("normalizes the handle before storing it", async () => {
      vi.mocked(prisma.creatorProfile.findUnique).mockResolvedValue(
        mock({ id: "profile-1" }),
      );
      vi.mocked(prisma.socialAccount.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.socialAccount.create).mockResolvedValue(mock({ id: "account-1" }));

      await SocialAccountService.createForUser("user-1", {
        platform: Platform.TIKTOK,
        handle: "@SomeOne",
        profileUrl: "https://tiktok.com/@someone",
      });

      expect(prisma.socialAccount.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ handle: "someone" }),
        }),
      );
    });
  });

  describe("deleteForUser", () => {
    it("refuses to delete a social account owned by another creator", async () => {
      vi.mocked(prisma.creatorProfile.findUnique).mockResolvedValue(
        mock({ id: "profile-1" }),
      );
      vi.mocked(prisma.socialAccount.findUnique).mockResolvedValue(
        mock({
          id: "account-1",
          creatorProfileId: "profile-OTHER",
          status: SocialAccountStatus.PENDING,
        }),
      );

      await expect(
        SocialAccountService.deleteForUser("user-1", "account-1"),
      ).rejects.toThrow("غير موجود");
      expect(prisma.socialAccount.delete).not.toHaveBeenCalled();
    });

    it("deletes an account owned by the requesting creator", async () => {
      vi.mocked(prisma.creatorProfile.findUnique).mockResolvedValue(
        mock({ id: "profile-1" }),
      );
      vi.mocked(prisma.socialAccount.findUnique).mockResolvedValue(
        mock({ id: "account-1", creatorProfileId: "profile-1" }),
      );

      await SocialAccountService.deleteForUser("user-1", "account-1");

      expect(prisma.socialAccount.delete).toHaveBeenCalledWith({
        where: { id: "account-1" },
      });
    });
  });
});
