import { z } from "zod";

export const updateCreatorProfileSchema = z.object({
  bio: z
    .string()
    .trim()
    .max(500, "النبذة يجب ألا تتجاوز 500 حرف")
    .optional()
    .or(z.literal("").transform(() => undefined)),
  country: z
    .string()
    .trim()
    .length(2, "رمز الدولة يجب أن يكون حرفين (مثل IQ)")
    .optional(),
  governorate: z
    .string()
    .trim()
    .max(100, "اسم المحافظة طويل جداً")
    .optional()
    .or(z.literal("").transform(() => undefined)),
});

export type UpdateCreatorProfileInput = z.infer<typeof updateCreatorProfileSchema>;
