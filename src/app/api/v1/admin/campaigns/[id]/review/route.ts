import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getAuthSecret, verifyJWT } from "../../../../../../../lib/auth/jwt";
import { errorResponse, newRequestId } from "../../../../../../../lib/api/response";
import { CampaignService } from "../../../../../../../modules/campaigns/service";
import { reviewCampaignSchema } from "../../../../../../../modules/campaigns/schemas";

const COOKIE_NAME = "khalliha_trend_session";

export async function POST(
  request: Request,
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

  const body = await request.json();
  const parsed = reviewCampaignSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse("VALIDATION_ERROR", "المدخلات غير صالحة", 400, {
      requestId,
      details: parsed.error.flatten().fieldErrors,
    });
  }

  try {
    const campaign = await CampaignService.review(
      id,
      payload.userId,
      parsed.data.decision,
      parsed.data.note,
    );
    return NextResponse.json({
      data: { id: campaign.id, status: campaign.status, reviewNote: campaign.reviewNote },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "فشلت عملية المراجعة.";
    return errorResponse("CAMPAIGN_REVIEW_FAILED", message, 400, { requestId });
  }
}
