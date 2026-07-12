import { NextResponse } from "next/server";
import { serializeCampaignFull } from "../../../../../../lib/campaigns";
import { CampaignService } from "../../../../../../modules/campaigns/service";

export async function GET() {
  const campaigns = await CampaignService.listPendingReview();
  return NextResponse.json({
    data: campaigns.map((campaign) => ({
      ...serializeCampaignFull(campaign),
      brand: {
        id: campaign.brand.id,
        name: campaign.brand.name,
        slug: campaign.brand.slug,
      },
    })),
  });
}
