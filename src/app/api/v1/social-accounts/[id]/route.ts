import { cookies } from "next/headers";
import { getAuthSecret, verifyJWT } from "../../../../../lib/auth/jwt";
import { errorResponse, newRequestId } from "../../../../../lib/api/response";
import { SocialAccountService } from "../../../../../modules/social-accounts/service";
import { NextResponse } from "next/server";

const COOKIE_NAME = "khalliha_trend_session";

export async function DELETE(
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
    await SocialAccountService.deleteForUser(payload.userId, id);
    return NextResponse.json({ status: "success" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "فشل حذف الحساب الاجتماعي.";
    return errorResponse("SOCIAL_ACCOUNT_NOT_FOUND", message, 404, { requestId });
  }
}
