import { NextResponse } from "next/server";
import { errorResponse, newRequestId } from "../../../../../lib/api/response";
import { requireApiUser } from "../../../../../lib/auth/api-user";
import { serializeCampaignFull } from "../../../../../lib/campaigns";
import { CampaignService } from "../../../../../modules/campaigns/service";
import { createCampaignSchema } from "../../../../../modules/campaigns/schemas";

export async function GET() {
  const requestId = newRequestId();
  const auth = await requireApiUser(requestId);
  if (!auth.ok) return auth.response;

  const campaigns = await CampaignService.listForBrand(auth.user.id);
  return NextResponse.json({ data: campaigns.map(serializeCampaignFull) });
}

export async function POST(request: Request) {
  const requestId = newRequestId();
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
    const campaign = await CampaignService.createDraft(auth.user.id, parsed.data);
    return NextResponse.json({ data: serializeCampaignFull(campaign) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "فشل إنشاء الحملة.";
    return errorResponse("CAMPAIGN_CREATE_FAILED", message, 400, { requestId });
  }
}
