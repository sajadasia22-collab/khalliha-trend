import { z } from "zod";
import { CampaignCategory, Platform } from "../../generated/prisma/enums";

const optionalText = (maximum: number) =>
  z
    .string()
    .trim()
    .max(maximum)
    .optional()
    .or(z.literal("").transform(() => undefined));

export const creatorDirectoryQuerySchema = z.object({
  search: optionalText(80),
  category: z.enum(CampaignCategory).optional(),
  platform: z.enum(Platform).optional(),
  governorate: optionalText(100),
  language: optionalText(30),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(24).default(12),
});

export type CreatorDirectoryQuery = z.infer<typeof creatorDirectoryQuerySchema>;
