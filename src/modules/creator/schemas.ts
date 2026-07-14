import { z } from "zod";
import { CampaignCategory } from "../../generated/prisma/enums";

const usernamePattern = /^[\p{L}\p{N}_]+$/u;

export const RESERVED_CREATOR_USERNAMES = new Set([
  "admin",
  "api",
  "brand",
  "campaigns",
  "creator",
  "creators",
  "login",
  "register",
  "settings",
]);

const usernameSchema = z
  .string()
  .trim()
  .min(3, "اسم المستخدم يجب أن يتكوّن من 3 أحرف على الأقل")
  .max(30, "اسم المستخدم يجب ألا يتجاوز 30 حرفاً")
  .regex(usernamePattern, "استخدم الحروف أو الأرقام أو الشرطة السفلية فقط")
  .transform((value) => value.toLocaleLowerCase("ar-IQ"))
  .refine((value) => !RESERVED_CREATOR_USERNAMES.has(value), {
    message: "اسم المستخدم هذا محجوز، اختر اسماً آخر",
  });

const optionalUsernameSchema = z
  .union([usernameSchema, z.literal("").transform(() => undefined)])
  .optional();

export const updateCreatorProfileSchema = z.object({
  username: optionalUsernameSchema,
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
  contentCategories: z
    .array(z.enum(CampaignCategory))
    .max(5, "اختر خمسة اختصاصات كحد أقصى")
    .optional(),
  languages: z
    .array(z.string().trim().min(2, "اسم اللغة قصير جداً").max(30, "اسم اللغة طويل جداً"))
    .max(5, "أضف خمس لغات كحد أقصى")
    .transform((values) => [...new Set(values)])
    .optional(),
  isProfilePublic: z.boolean().optional(),
});

export type UpdateCreatorProfileInput = z.infer<typeof updateCreatorProfileSchema>;
