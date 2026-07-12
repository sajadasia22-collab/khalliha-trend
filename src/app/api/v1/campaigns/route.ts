import { z } from "zod";
import { prisma } from "../../../../lib/prisma";
import {
  errorResponse,
  newRequestId,
  paginatedResponse,
} from "../../../../lib/api/response";
import {
  CampaignCategory,
  CampaignStatus,
  Platform,
} from "../../../../generated/prisma/enums";

const platformValues = Object.values(Platform) as [Platform, ...Platform[]];
const categoryValues = Object.values(CampaignCategory) as [
  CampaignCategory,
  ...CampaignCategory[],
];

const querySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
  platform: z.enum(platformValues).optional(),
  category: z.enum(categoryValues).optional(),
  search: z.string().trim().max(150).optional(),
  sort: z.enum(["createdAt", "startsAt"]).default("createdAt"),
  order: z.enum(["asc", "desc"]).default("desc"),
});

function serializeCampaign(campaign: {
  id: string;
  title: string;
  summary: string;
  category: CampaignCategory;
  thumbnailUrl: string | null;
  status: CampaignStatus;
  currency: string;
  totalBudget: bigint;
  reservedBudget: bigint;
  startsAt: Date | null;
  endsAt: Date | null;
  createdAt: Date;
  brand: { id: string; name: string; slug: string; verifiedAt: Date | null };
  rates: {
    platform: Platform;
    cpmMinorUnits: bigint;
    minimumQualifiedViews: bigint;
    maximumReward: bigint;
  }[];
}) {
  return {
    id: campaign.id,
    title: campaign.title,
    summary: campaign.summary,
    category: campaign.category,
    thumbnailUrl: campaign.thumbnailUrl,
    status: campaign.status,
    currency: campaign.currency,
    totalBudget: campaign.totalBudget.toString(),
    reservedBudget: campaign.reservedBudget.toString(),
    startsAt: campaign.startsAt,
    endsAt: campaign.endsAt,
    createdAt: campaign.createdAt,
    brand: {
      id: campaign.brand.id,
      name: campaign.brand.name,
      slug: campaign.brand.slug,
      verified: Boolean(campaign.brand.verifiedAt),
    },
    rates: campaign.rates.map((rate) => ({
      platform: rate.platform,
      cpmMinorUnits: rate.cpmMinorUnits.toString(),
      minimumQualifiedViews: rate.minimumQualifiedViews.toString(),
      maximumReward: rate.maximumReward.toString(),
    })),
  };
}

export async function GET(request: Request) {
  const requestId = newRequestId();
  const { searchParams } = new URL(request.url);

  const parsed = querySchema.safeParse({
    page: searchParams.get("page") ?? undefined,
    pageSize: searchParams.get("pageSize") ?? undefined,
    platform: searchParams.get("platform") ?? undefined,
    category: searchParams.get("category") ?? undefined,
    search: searchParams.get("search") ?? undefined,
    sort: searchParams.get("sort") ?? undefined,
    order: searchParams.get("order") ?? undefined,
  });

  if (!parsed.success) {
    return errorResponse("VALIDATION_ERROR", "معايير البحث غير صالحة", 400, {
      requestId,
      details: parsed.error.flatten().fieldErrors,
    });
  }

  const { page, pageSize, platform, category, search, sort, order } = parsed.data;

  const where = {
    status: CampaignStatus.ACTIVE,
    ...(platform ? { rates: { some: { platform } } } : {}),
    ...(category ? { category } : {}),
    ...(search ? { title: { contains: search, mode: "insensitive" as const } } : {}),
  };

  try {
    const [campaigns, total] = await Promise.all([
      prisma.campaign.findMany({
        where,
        include: { brand: true, rates: true },
        orderBy: { [sort]: order },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.campaign.count({ where }),
    ]);

    return paginatedResponse(campaigns.map(serializeCampaign), { page, pageSize, total });
  } catch {
    return errorResponse(
      "SERVICE_UNAVAILABLE",
      "تعذّر الاتصال بقاعدة البيانات حالياً.",
      503,
      { requestId },
    );
  }
}
