import { NextResponse } from "next/server";
import { errorResponse, newRequestId } from "../../../../../../../lib/api/response";
import { requireApiUser } from "../../../../../../../lib/auth/api-user";
import { serializeCampaignFull } from "../../../../../../../lib/campaigns";
import { CampaignService } from "../../../../../../../modules/campaigns/service";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const requestId = newRequestId();
  const { id } = await params;

  const auth = await requireApiUser(requestId);
  if (!auth.ok) return auth.response;

  try {
    const campaign = await CampaignService.submitForReview(auth.user.id, id);
    const full = await CampaignService.getForBrand(auth.user.id, campaign.id);
    return NextResponse.json({ data: serializeCampaignFull(full) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "فشل إرسال الحملة للمراجعة.";
    return errorResponse("CAMPAIGN_SUBMIT_FAILED", message, 400, { requestId });
  }
}
