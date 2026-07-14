import { z } from "zod";
import {
  CommunityReportReason,
  CommunityReportStatus,
  MessagePermission,
} from "../../generated/prisma/enums";

const optionalBody = z.string().trim().max(2000).optional().nullable();
const optionalUrl = z.string().trim().url().max(2048).optional().nullable();

export const communityPostSchema = z
  .object({
    body: optionalBody,
    imageUrl: optionalUrl,
    imageUrls: z.array(z.string().trim().url().max(2048)).max(4).optional(),
    linkUrl: optionalUrl,
  })
  .superRefine((value, context) => {
    if (!value.body && !value.imageUrl && !value.imageUrls?.length && !value.linkUrl) {
      context.addIssue({
        code: "custom",
        path: ["body"],
        message: "أضف نصاً أو صورة أو رابطاً.",
      });
    }
    if (value.linkUrl) {
      const protocol = new URL(value.linkUrl).protocol;
      if (protocol !== "http:" && protocol !== "https:") {
        context.addIssue({
          code: "custom",
          path: ["linkUrl"],
          message: "الرابط الخارجي غير صالح.",
        });
      }
    }
  });

export const communityPostUpdateSchema = communityPostSchema;

export const communityCommentSchema = z.object({
  body: z.string().trim().min(1).max(1000),
  parentId: z.string().cuid().optional().nullable(),
});

export const communityFeedQuerySchema = z.object({
  feed: z.enum(["all", "following", "saved"]).default("all"),
  search: z.string().trim().max(100).optional(),
  page: z.coerce.number().int().min(1).max(1000).default(1),
  pageSize: z.coerce.number().int().min(1).max(30).default(12),
});

export const communityReportSchema = z
  .object({
    postId: z.string().cuid().optional(),
    commentId: z.string().cuid().optional(),
    reason: z.nativeEnum(CommunityReportReason),
    details: z.string().trim().max(1000).optional(),
  })
  .refine((value) => Boolean(value.postId) !== Boolean(value.commentId), {
    message: "حدد منشوراً أو تعليقاً واحداً.",
  });

export const communityReportReviewSchema = z.object({
  status: z.enum([
    CommunityReportStatus.REVIEWED,
    CommunityReportStatus.DISMISSED,
    CommunityReportStatus.ACTIONED,
  ]),
  reviewNote: z.string().trim().min(3).max(1000),
});

export const privacySettingsSchema = z.object({
  messagePermission: z.nativeEnum(MessagePermission),
});
