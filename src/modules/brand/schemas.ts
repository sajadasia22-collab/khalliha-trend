import { z } from "zod";

export const updateBrandProfileSchema = z.object({
  name: z.string().trim().min(2, "اسم العلامة التجارية قصير جداً").max(120).optional(),
  description: z
    .string()
    .trim()
    .max(1000, "الوصف يجب ألا يتجاوز 1000 حرف")
    .optional()
    .or(z.literal("").transform(() => undefined)),
});

export type UpdateBrandProfileInput = z.infer<typeof updateBrandProfileSchema>;

export const brandVerificationReviewSchema = z.object({
  decision: z.enum(["APPROVED", "REJECTED"]),
  note: z
    .string()
    .trim()
    .max(500)
    .optional()
    .or(z.literal("").transform(() => undefined)),
});

export type BrandVerificationReviewInput = z.infer<typeof brandVerificationReviewSchema>;
