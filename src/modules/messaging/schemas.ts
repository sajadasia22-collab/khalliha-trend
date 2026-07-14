import { z } from "zod";
import { CommunityReportReason } from "../../generated/prisma/enums";

export const conversationListQuerySchema = z.object({
  search: z.string().trim().max(100).optional().default(""),
});

export const messageListQuerySchema = z.object({
  search: z.string().trim().max(100).optional().default(""),
});

export const createConversationSchema = z.object({
  campaignId: z.string().min(1),
  creatorProfileId: z.string().min(1).optional(),
  body: z.string().trim().min(1, "اكتب رسالة أولاً").max(2000),
});

export const createMessageSchema = z.object({
  body: z.string().trim().min(1, "اكتب رسالة أولاً").max(2000),
});

export const createConversationReportSchema = z.object({
  messageId: z.string().min(1).optional(),
  reason: z.nativeEnum(CommunityReportReason),
  details: z.string().trim().max(1000).optional(),
});

export const reviewConversationReportSchema = z.object({
  decision: z.enum(["DISMISS", "ACTION"]),
  reviewNote: z.string().trim().min(3).max(1000),
});
