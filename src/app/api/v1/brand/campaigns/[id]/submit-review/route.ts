import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getAuthSecret, verifyJWT } from "../../../../../../../lib/auth/jwt";
import { errorResponse, newRequestId } from "../../../../../../../lib/api/response";
import { serializeCampaignFull } from "../../../../../../../lib/campaigns";
import { CampaignService } from "../../../../../../../modules/campaigns/service";

const COOKIE_NAME = "khalliha_trend_session";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const requestId = newRequestId();
  const { id } = await params;

  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) {
    return errorResponse("UNAUTHENTICATED", "الرجاء تسجيل الدخول أولاً.", 401, {
      requestId,
    });
  }
  const payload = (await verifyJWT(token, getAuthSecret())) as { userId?: string } | null;
  if (!payload?.userId) {
    return errorResponse(
      "UNAUTHENTICATED",
      "جلسة عمل غير صالحة أو منتهية الصلاحية.",
      401,
      {
        requestId,
      },
    );
  }

  try {
    const campaign = await CampaignService.submitForReview(payload.userId, id);
    const full = await CampaignService.getForBrand(payload.userId, campaign.id);
    return NextResponse.json({ data: serializeCampaignFull(full) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "فشل إرسال الحملة للمراجعة.";
    return errorResponse("CAMPAIGN_SUBMIT_FAILED", message, 400, { requestId });
  }
}
