import { z } from "zod";
import { Platform } from "../../generated/prisma/enums";

const platformValues = Object.values(Platform) as [Platform, ...Platform[]];

export const createSocialAccountSchema = z.object({
  platform: z.enum(platformValues),
  handle: z
    .string()
    .trim()
    .min(2, "اسم المستخدم قصير جداً")
    .max(60, "اسم المستخدم طويل جداً")
    .regex(/^@?[a-zA-Z0-9._-]+$/, "اسم المستخدم يحتوي على رموز غير مسموحة"),
  profileUrl: z.string().trim().url("رابط الحساب غير صالح"),
});

export type CreateSocialAccountInput = z.infer<typeof createSocialAccountSchema>;

export const reviewSocialAccountSchema = z.object({
  decision: z.enum(["VERIFIED", "REJECTED"]),
  rejectionReason: z
    .string()
    .trim()
    .max(500)
    .optional()
    .or(z.literal("").transform(() => undefined)),
});

export type ReviewSocialAccountInput = z.infer<typeof reviewSocialAccountSchema>;
