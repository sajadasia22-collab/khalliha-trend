import { describe, expect, it, vi, beforeEach } from "vitest";
import {
  CampaignStatus,
  Platform,
  SocialAccountStatus,
  SubmissionStatus,
} from "../../generated/prisma/enums";

vi.mock("../../lib/prisma", () => {
  const mockPrisma = {
    creatorProfile: {
      findUnique: vi.fn(),
    },
    campaignMembership: {
      findUnique: vi.fn(),
      create: vi.fn(),
      findMany: vi.fn(),
    },
    socialAccount: {
      findUnique: vi.fn(),
    },
    submission: {
      findUnique: vi.fn(),
      create: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
    },
  };
  return { prisma: mockPrisma };
});

vi.mock("../notifications/service", () => ({
  NotificationService: {
    notify: vi.fn(),
  },
}));

import { prisma } from "../../lib/prisma";
import { SubmissionService } from "./service";

function mock<T>(value: T): any {
  return value;
}

describe("SubmissionService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createSubmission", () => {
    it("should fail if creator profile does not exist", async () => {
      vi.mocked(prisma.creatorProfile.findUnique).mockResolvedValue(null);

      await expect(
        SubmissionService.createSubmission("user-1", "campaign-1", {
          socialAccountId: "account-1",
          postUrl: "https://www.tiktok.com/@user/video/123456",
        }),
      ).rejects.toThrow("لا يوجد ملف صانع محتوى");
    });

    it("should fail if creator has not joined the campaign", async () => {
      vi.mocked(prisma.creatorProfile.findUnique).mockResolvedValue(
        mock({ id: "creator-1" }),
      );
      vi.mocked(prisma.campaignMembership.findUnique).mockResolvedValue(null);

      await expect(
        SubmissionService.createSubmission("user-1", "campaign-1", {
          socialAccountId: "account-1",
          postUrl: "https://www.tiktok.com/@user/video/123456",
        }),
      ).rejects.toThrow("يجب الانضمام للحملة أولاً");
    });

    it("should fail if campaign is not active", async () => {
      vi.mocked(prisma.creatorProfile.findUnique).mockResolvedValue(
        mock({ id: "creator-1" }),
      );
      vi.mocked(prisma.campaignMembership.findUnique).mockResolvedValue(
        mock({
          id: "membership-1",
          campaign: { status: CampaignStatus.DRAFT, rates: [] },
        }),
      );

      await expect(
        SubmissionService.createSubmission("user-1", "campaign-1", {
          socialAccountId: "account-1",
          postUrl: "https://www.tiktok.com/@user/video/123456",
        }),
      ).rejects.toThrow("لا يمكن إرسال منشورات لحملة غير نشطة");
    });

    it("should fail if social account is not verified", async () => {
      vi.mocked(prisma.creatorProfile.findUnique).mockResolvedValue(
        mock({ id: "creator-1" }),
      );
      vi.mocked(prisma.campaignMembership.findUnique).mockResolvedValue(
        mock({
          id: "membership-1",
          campaign: {
            status: CampaignStatus.ACTIVE,
            rates: [{ platform: Platform.TIKTOK }],
          },
        }),
      );
      vi.mocked(prisma.socialAccount.findUnique).mockResolvedValue(
        mock({
          id: "account-1",
          creatorProfileId: "creator-1",
          status: SocialAccountStatus.PENDING,
        }),
      );

      await expect(
        SubmissionService.createSubmission("user-1", "campaign-1", {
          socialAccountId: "account-1",
          postUrl: "https://www.tiktok.com/@user/video/123456",
        }),
      ).rejects.toThrow("يجب أن يكون الحساب الاجتماعي موثقاً");
    });

    it("should fail if platform does not match social account platform", async () => {
      vi.mocked(prisma.creatorProfile.findUnique).mockResolvedValue(
        mock({ id: "creator-1" }),
      );
      vi.mocked(prisma.campaignMembership.findUnique).mockResolvedValue(
        mock({
          id: "membership-1",
          campaign: {
            status: CampaignStatus.ACTIVE,
            rates: [{ platform: Platform.TIKTOK }],
          },
        }),
      );
      vi.mocked(prisma.socialAccount.findUnique).mockResolvedValue(
        mock({
          id: "account-1",
          creatorProfileId: "creator-1",
          platform: Platform.INSTAGRAM, // mismatch with tiktok post url
          status: SocialAccountStatus.VERIFIED,
        }),
      );

      await expect(
        SubmissionService.createSubmission("user-1", "campaign-1", {
          socialAccountId: "account-1",
          postUrl: "https://www.tiktok.com/@user/video/123456",
        }),
      ).rejects.toThrow("منصة الرابط المرسل لا تطابق منصة الحساب");
    });

    it("should fail if the post URL has been submitted before", async () => {
      vi.mocked(prisma.creatorProfile.findUnique).mockResolvedValue(
        mock({ id: "creator-1" }),
      );
      vi.mocked(prisma.campaignMembership.findUnique).mockResolvedValue(
        mock({
          id: "membership-1",
          campaign: {
            status: CampaignStatus.ACTIVE,
            rates: [{ platform: Platform.TIKTOK }],
          },
        }),
      );
      vi.mocked(prisma.socialAccount.findUnique).mockResolvedValue(
        mock({
          id: "account-1",
          creatorProfileId: "creator-1",
          platform: Platform.TIKTOK,
          status: SocialAccountStatus.VERIFIED,
        }),
      );
      vi.mocked(prisma.submission.findUnique).mockResolvedValue(
        mock({ id: "submission-existing" }),
      );

      await expect(
        SubmissionService.createSubmission("user-1", "campaign-1", {
          socialAccountId: "account-1",
          postUrl: "https://www.tiktok.com/@user/video/123456",
        }),
      ).rejects.toThrow("تم إرسال هذا المنشور مسبقاً");
    });

    it("should successfully create submission with correct parameters", async () => {
      vi.mocked(prisma.creatorProfile.findUnique).mockResolvedValue(
        mock({ id: "creator-1" }),
      );
      vi.mocked(prisma.campaignMembership.findUnique).mockResolvedValue(
        mock({
          id: "membership-1",
          campaign: {
            status: CampaignStatus.ACTIVE,
            rates: [{ platform: Platform.TIKTOK }],
          },
        }),
      );
      vi.mocked(prisma.socialAccount.findUnique).mockResolvedValue(
        mock({
          id: "account-1",
          creatorProfileId: "creator-1",
          platform: Platform.TIKTOK,
          status: SocialAccountStatus.VERIFIED,
        }),
      );
      vi.mocked(prisma.submission.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.submission.create).mockResolvedValue(
        mock({ id: "submission-new" }),
      );

      const result = await SubmissionService.createSubmission("user-1", "campaign-1", {
        socialAccountId: "account-1",
        postUrl: "https://www.tiktok.com/@user/video/123456",
      });

      expect(result).toBeDefined();
      expect(prisma.submission.create).toHaveBeenCalledWith({
        data: {
          campaignMembershipId: "membership-1",
          socialAccountId: "account-1",
          platform: Platform.TIKTOK,
          postUrl: "https://www.tiktok.com/@user/video/123456",
          platformPostId: "123456",
          status: SubmissionStatus.SUBMITTED,
        },
      });
    });
  });

  describe("reviewSubmission", () => {
    const submissionWithRelations = {
      id: "submission-1",
      status: SubmissionStatus.SUBMITTED,
      socialAccount: { creatorProfile: { userId: "creator-user-1" } },
      campaignMembership: { campaign: { title: "حملة تجريبية" } },
    };

    it("should update status to APPROVED on decision APPROVE", async () => {
      vi.mocked(prisma.submission.findUnique).mockResolvedValue(
        mock(submissionWithRelations),
      );
      vi.mocked(prisma.submission.update).mockResolvedValue(mock({}));

      await SubmissionService.reviewSubmission("admin-1", "submission-1", "APPROVE");

      expect(prisma.submission.update).toHaveBeenCalledWith({
        where: { id: "submission-1" },
        data: expect.objectContaining({
          status: SubmissionStatus.APPROVED,
          reviewedByUserId: "admin-1",
        }),
      });
    });

    it("should update status to REJECTED on decision REJECT with rejectionReason", async () => {
      vi.mocked(prisma.submission.findUnique).mockResolvedValue(
        mock(submissionWithRelations),
      );
      vi.mocked(prisma.submission.update).mockResolvedValue(mock({}));

      await SubmissionService.reviewSubmission(
        "admin-1",
        "submission-1",
        "REJECT",
        "محتوى غير لائق",
      );

      expect(prisma.submission.update).toHaveBeenCalledWith({
        where: { id: "submission-1" },
        data: expect.objectContaining({
          status: SubmissionStatus.REJECTED,
          rejectionReason: "محتوى غير لائق",
          reviewedByUserId: "admin-1",
        }),
      });
    });
  });
});
