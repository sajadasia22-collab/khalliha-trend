import { NextResponse } from "next/server";
import { errorResponse, newRequestId } from "../../../../../lib/api/response";
import { getCurrentUser } from "../../../../../lib/auth/session";
import { CampaignService } from "../../../../../modules/campaigns/service";

export async function GET() {
  const requestId = newRequestId();
  const user = await getCurrentUser();
  if (!user) {
    return errorResponse("UNAUTHENTICATED", "الرجاء تسجيل الدخول أولاً.", 401, {
      requestId,
    });
  }

  try {
    const analytics = await CampaignService.getAnalyticsForBrand(user.id);
    return NextResponse.json({ data: analytics });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "فشل جلب التحليلات.";
    return errorResponse("BAD_REQUEST", message, 400, { requestId });
  }
}
