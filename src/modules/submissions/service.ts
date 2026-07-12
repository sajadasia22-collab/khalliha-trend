import { prisma } from "../../lib/prisma";
import {
  CampaignStatus,
  NotificationType,
  SocialAccountStatus,
  SubmissionStatus,
} from "../../generated/prisma/enums";
import { normalizePostUrl } from "../../lib/post-url";
import { NotificationService } from "../notifications/service";
import { AuditLogService } from "../audit-log/service";

export class SubmissionService {
  static async createSubmission(
    userId: string,
    campaignId: string,
    data: { socialAccountId: string; postUrl: string },
  ) {
    const profile = await prisma.creatorProfile.findUnique({ where: { userId } });
    if (!profile) {
      throw new Error("لا يوجد ملف صانع محتوى مرتبط بهذا المستخدم");
    }

    const membership = await prisma.campaignMembership.findUnique({
      where: {
        campaignId_creatorProfileId: {
          campaignId,
          creatorProfileId: profile.id,
        },
      },
      include: {
        campaign: {
          include: { rates: true },
        },
      },
    });

    if (!membership) {
      throw new Error("يجب الانضمام للحملة أولاً لتتمكن من إرسال المنشورات");
    }

    if (membership.campaign.status !== CampaignStatus.ACTIVE) {
      throw new Error("لا يمكن إرسال منشورات لحملة غير نشطة حالياً");
    }

    const socialAccount = await prisma.socialAccount.findUnique({
      where: { id: data.socialAccountId },
    });

    if (!socialAccount || socialAccount.creatorProfileId !== profile.id) {
      throw new Error("الحساب الاجتماعي غير موجود أو غير مرتبط بملفك الشخصي");
    }

    if (socialAccount.status !== SocialAccountStatus.VERIFIED) {
      throw new Error("يجب أن يكون الحساب الاجتماعي موثقاً لتتمكن من استخدامه للإرسال");
    }

    const normalized = normalizePostUrl(data.postUrl);
    if (!normalized) {
      throw new Error("رابط المنشور غير صالح أو المنصة غير مدعومة");
    }

    if (normalized.platform !== socialAccount.platform) {
      throw new Error("منصة الرابط المرسل لا تطابق منصة الحساب الاجتماعي المحدد");
    }

    const hasRate = membership.campaign.rates.some(
      (rate) => rate.platform === normalized.platform,
    );
    if (!hasRate) {
      throw new Error("هذه المنصة غير مدعومة في هذه الحملة");
    }

    const existing = await prisma.submission.findUnique({
      where: {
        platform_platformPostId: {
          platform: normalized.platform,
          platformPostId: normalized.platformPostId,
        },
      },
    });
    if (existing) {
      throw new Error("تم إرسال هذا المنشور مسبقاً على المنصة");
    }

    return prisma.submission.create({
      data: {
        campaignMembershipId: membership.id,
        socialAccountId: data.socialAccountId,
        platform: normalized.platform,
        postUrl: normalized.normalizedUrl,
        platformPostId: normalized.platformPostId,
        status: SubmissionStatus.SUBMITTED,
      },
    });
  }

  static async listSubmissionsForCreator(userId: string, campaignId: string) {
    const profile = await prisma.creatorProfile.findUnique({ where: { userId } });
    if (!profile) {
      throw new Error("لا يوجد ملف صانع محتوى مرتبط بهذا المستخدم");
    }

    const membership = await prisma.campaignMembership.findUnique({
      where: {
        campaignId_creatorProfileId: {
          campaignId,
          creatorProfileId: profile.id,
        },
      },
    });
    if (!membership) {
      return [];
    }

    return prisma.submission.findMany({
      where: { campaignMembershipId: membership.id },
      include: { socialAccount: true },
      orderBy: { createdAt: "desc" },
    });
  }

  static async listAllForCreator(userId: string) {
    const profile = await prisma.creatorProfile.findUnique({ where: { userId } });
    if (!profile) {
      throw new Error("لا يوجد ملف صانع محتوى مرتبط بهذا المستخدم");
    }

    return prisma.submission.findMany({
      where: { campaignMembership: { creatorProfileId: profile.id } },
      select: {
        id: true,
        status: true,
        createdAt: true,
        campaignMembership: { select: { campaign: { select: { title: true } } } },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  static async listPendingSubmissionsForAdmin() {
    return prisma.submission.findMany({
      where: {
        status: {
          in: [
            SubmissionStatus.SUBMITTED,
            SubmissionStatus.UNDER_REVIEW,
            SubmissionStatus.APPROVED,
          ],
        },
      },
      include: {
        socialAccount: {
          include: {
            creatorProfile: {
              include: {
                user: { select: { fullName: true, email: true } },
              },
            },
          },
        },
        campaignMembership: {
          include: {
            campaign: {
              include: { brand: true },
            },
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });
  }

  static async reviewSubmission(
    adminUserId: string,
    submissionId: string,
    decision: "APPROVE" | "REJECT" | "REQUEST_REVISION",
    note?: string,
  ) {
    const submission = await prisma.submission.findUnique({
      where: { id: submissionId },
      include: {
        socialAccount: { include: { creatorProfile: true } },
        campaignMembership: { include: { campaign: true } },
      },
    });
    if (!submission) {
      throw new Error("المنشور المرسل غير موجود");
    }

    let nextStatus: SubmissionStatus;
    if (decision === "APPROVE") {
      nextStatus = SubmissionStatus.APPROVED;
    } else if (decision === "REJECT") {
      nextStatus = SubmissionStatus.REJECTED;
    } else if (decision === "REQUEST_REVISION") {
      nextStatus = SubmissionStatus.REVISION_REQUESTED;
    } else {
      throw new Error("قرار مراجعة غير صالح");
    }

    const updated = await prisma.submission.update({
      where: { id: submissionId },
      data: {
        status: nextStatus,
        rejectionReason: decision === "REJECT" ? note : null,
        reviewNote: decision !== "APPROVE" ? note : null,
        reviewedByUserId: adminUserId,
        reviewedAt: new Date(),
      },
    });

    await AuditLogService.log({
      actorId: adminUserId,
      action:
        decision === "APPROVE"
          ? "SUBMISSION_APPROVE"
          : decision === "REQUEST_REVISION"
            ? "SUBMISSION_REQUEST_REVISION"
            : "SUBMISSION_REJECT",
      targetType: "Submission",
      targetId: submissionId,
      before: {
        status: submission.status,
        rejectionReason: submission.rejectionReason,
        reviewNote: submission.reviewNote,
      },
      after: {
        status: nextStatus,
        rejectionReason: decision === "REJECT" ? note : null,
        reviewNote: decision !== "APPROVE" ? note : null,
      },
    });

    const notificationCopy =
      decision === "APPROVE"
        ? { type: NotificationType.SUBMISSION_REVIEWED, title: "تم قبول إرسالك" }
        : decision === "REQUEST_REVISION"
          ? { type: NotificationType.SUBMISSION_REVIEWED, title: "إرسالك يحتاج تعديل" }
          : { type: NotificationType.SUBMISSION_REVIEWED, title: "تم رفض إرسالك" };
    await NotificationService.notify(
      submission.socialAccount.creatorProfile.userId,
      notificationCopy.type,
      notificationCopy.title,
      `الحملة "${submission.campaignMembership.campaign.title}": ${note ?? "راجع تفاصيل الإرسال لمزيد من المعلومات."}`,
      `/creator/dashboard`,
    );

    return updated;
  }
}
