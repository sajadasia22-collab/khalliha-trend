import { prisma } from "../../../../../lib/prisma";
import { errorResponse, newRequestId } from "../../../../../lib/api/response";
import { NextResponse } from "next/server";
import { CampaignStatus } from "../../../../../generated/prisma/enums";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const requestId = newRequestId();
  const { id } = await params;

  try {
    const campaign = await prisma.campaign.findFirst({
      where: { id, status: CampaignStatus.ACTIVE },
      include: { brand: true, rates: true },
    });

    if (!campaign) {
      return errorResponse("CAMPAIGN_NOT_FOUND", "لم يتم العثور على الحملة.", 404, {
        requestId,
      });
    }

    return NextResponse.json({
      data: {
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
        brand: campaign.brand,
        rates: campaign.rates.map((rate) => ({
          platform: rate.platform,
          cpmMinorUnits: rate.cpmMinorUnits.toString(),
          minimumQualifiedViews: rate.minimumQualifiedViews.toString(),
          maximumReward: rate.maximumReward.toString(),
        })),
      },
    });
  } catch {
    return errorResponse(
      "SERVICE_UNAVAILABLE",
      "تعذّر الاتصال بقاعدة البيانات حالياً.",
      503,
      { requestId },
    );
  }
}
