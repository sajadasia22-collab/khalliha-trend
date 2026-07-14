import { NextResponse } from "next/server";
import { newRequestId } from "../../../../../../lib/api/response";
import { requireAdminApiUser } from "../../../../../../lib/auth/admin-api";
import { serializeCampaignFull } from "../../../../../../lib/campaigns";
import { CampaignService } from "../../../../../../modules/campaigns/service";

export async function GET() {
  const requestId = newRequestId();
  const auth = await requireAdminApiUser(requestId);
  if (!auth.ok) return auth.response;

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
