import { NextResponse } from "next/server";
import { errorResponse, newRequestId } from "../../../../../../lib/api/response";
import { requireApiUser } from "../../../../../../lib/auth/api-user";
import { serializeCampaignFull } from "../../../../../../lib/campaigns";
import { CampaignService } from "../../../../../../modules/campaigns/service";
import { createCampaignSchema } from "../../../../../../modules/campaigns/schemas";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const requestId = newRequestId();
  const { id } = await params;
  const auth = await requireApiUser(requestId);
  if (!auth.ok) return auth.response;

  try {
    const campaign = await CampaignService.getForBrand(auth.user.id, id);
    return NextResponse.json({ data: serializeCampaignFull(campaign) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "الحملة غير موجودة.";
    return errorResponse("CAMPAIGN_NOT_FOUND", message, 404, { requestId });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const requestId = newRequestId();
  const { id } = await params;
  const auth = await requireApiUser(requestId);
  if (!auth.ok) return auth.response;

  const body = await request.json().catch(() => null);
  const parsed = createCampaignSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse("VALIDATION_ERROR", "المدخلات غير صالحة", 400, {
      requestId,
      details: parsed.error.flatten().fieldErrors,
    });
  }

  try {
    const campaign = await CampaignService.updateDraft(auth.user.id, id, parsed.data);
    return NextResponse.json({ data: serializeCampaignFull(campaign) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "فشل تحديث الحملة.";
    return errorResponse("CAMPAIGN_UPDATE_FAILED", message, 400, { requestId });
  }
}
