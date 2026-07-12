import { z } from "zod";
import { CampaignCategory, Currency, Platform } from "../../generated/prisma/enums";

const currencyValues = Object.values(Currency) as [Currency, ...Currency[]];
const platformValues = Object.values(Platform) as [Platform, ...Platform[]];
const categoryValues = Object.values(CampaignCategory) as [
  CampaignCategory,
  ...CampaignCategory[],
];

const bigIntString = z
  .string()
  .trim()
  .regex(/^[0-9]+$/, "يجب أن تكون قيمة رقمية صحيحة")
  .transform((value) => BigInt(value));

const platformRateSchema = z.object({
  platform: z.enum(platformValues),
  cpmMinorUnits: bigIntString,
  minimumQualifiedViews: bigIntString.optional().default(() => 0n),
  maximumReward: bigIntString,
});

const campaignAssetSchema = z.object({
  url: z.string().trim().url("رابط الأصل غير صالح"),
  label: z.string().trim().min(1, "عنوان الأصل مطلوب").max(120),
});

export const createCampaignSchema = z.object({
  title: z.string().trim().min(5, "العنوان قصير جداً").max(150),
  summary: z.string().trim().min(20, "الملخص يجب أن يكون 20 حرفاً على الأقل").max(2000),
  terms: z.string().trim().min(20, "الشروط يجب أن تكون 20 حرفاً على الأقل").max(5000),
  category: z.enum(categoryValues).default(CampaignCategory.OTHER),
  thumbnailUrl: z
    .string()
    .trim()
    .url("رابط الصورة غير صالح")
    .optional()
    .or(z.literal("").transform(() => undefined)),
  currency: z.enum(currencyValues).default(Currency.IQD),
  totalBudget: bigIntString,
  minTrustScore: z.coerce.number().int().min(0).max(100).default(0),
  startsAt: z.coerce.date().optional(),
  endsAt: z.coerce.date().optional(),
  rates: z.array(platformRateSchema).min(1, "أضف سعر منصة واحدة على الأقل"),
  assets: z.array(campaignAssetSchema).max(10).optional().default([]),
});

export type CreateCampaignInput = z.infer<typeof createCampaignSchema>;

export const reviewCampaignSchema = z.object({
  decision: z.enum(["APPROVE", "REQUEST_CHANGES", "REJECT"]),
  note: z
    .string()
    .trim()
    .max(1000)
    .optional()
    .or(z.literal("").transform(() => undefined)),
});

export type ReviewCampaignInput = z.infer<typeof reviewCampaignSchema>;
