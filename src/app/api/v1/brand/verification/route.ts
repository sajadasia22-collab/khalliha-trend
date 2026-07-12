import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getAuthSecret, verifyJWT } from "../../../../../lib/auth/jwt";
import { errorResponse, newRequestId } from "../../../../../lib/api/response";
import { BrandProfileService } from "../../../../../modules/brand/service";

const COOKIE_NAME = "khalliha_trend_session";

export async function POST() {
  const requestId = newRequestId();
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
    const verification = await BrandProfileService.requestVerification(payload.userId);
    return NextResponse.json({ data: verification });
  } catch (error) {
    const message = error instanceof Error ? error.message : "فشل إرسال طلب التوثيق.";
    return errorResponse("VERIFICATION_REQUEST_FAILED", message, 400, { requestId });
  }
}
