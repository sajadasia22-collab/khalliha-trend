import { z } from "zod";
import { Platform } from "../../generated/prisma/enums";
import { normalizePostUrl } from "../../lib/post-url";

const optionalDescription = z
  .string()
  .trim()
  .max(500, "وصف العمل يجب ألا يتجاوز 500 حرف")
  .optional()
  .or(z.literal("").transform(() => undefined));

export const createPortfolioItemSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(3, "عنوان العمل يجب أن يتكوّن من 3 أحرف على الأقل")
      .max(100, "عنوان العمل يجب ألا يتجاوز 100 حرف"),
    description: optionalDescription,
    platform: z.enum(Platform),
    projectUrl: z.string().trim().url("رابط العمل غير صالح"),
  })
  .superRefine((value, context) => {
    const normalized = normalizePostUrl(value.projectUrl);
    if (!normalized) {
      context.addIssue({
        code: "custom",
        path: ["projectUrl"],
        message: "استخدم رابط منشور مباشر من منصة مدعومة",
      });
      return;
    }
    if (normalized.platform !== value.platform) {
      context.addIssue({
        code: "custom",
        path: ["projectUrl"],
        message: "الرابط لا يطابق المنصة المختارة",
      });
    }
  });

export const updatePortfolioItemSchema = z
  .object({
    title: z.string().trim().min(3).max(100).optional(),
    description: z
      .string()
      .trim()
      .max(500, "وصف العمل يجب ألا يتجاوز 500 حرف")
      .transform((value) => value || null)
      .optional(),
    sortOrder: z.number().int().min(0).max(10_000).optional(),
  })
  .refine((value) => Object.values(value).some((item) => item !== undefined), {
    message: "لا توجد تغييرات للحفظ",
  });

export const reorderPortfolioSchema = z.object({
  itemIds: z
    .array(z.string().min(1))
    .min(1, "أضف عملاً واحداً على الأقل")
    .max(12, "لا يمكن ترتيب أكثر من 12 عملاً")
    .refine((ids) => new Set(ids).size === ids.length, "لا يجوز تكرار العمل"),
});

export type CreatePortfolioItemInput = z.infer<typeof createPortfolioItemSchema>;
export type UpdatePortfolioItemInput = z.infer<typeof updatePortfolioItemSchema>;
