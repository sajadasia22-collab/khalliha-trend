import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getAuthSecret, verifyJWT } from "../../../../../lib/auth/jwt";
import { errorResponse, newRequestId } from "../../../../../lib/api/response";
import { AccountService } from "../../../../../modules/account/service";
import { changePasswordSchema } from "../../../../../modules/account/schemas";

const COOKIE_NAME = "khalliha_trend_session";

async function requireUserId(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) {
    return null;
  }
  const payload = (await verifyJWT(token, getAuthSecret())) as { userId?: string } | null;
  return payload?.userId ?? null;
}

export async function POST(request: Request) {
  const requestId = newRequestId();
  const userId = await requireUserId();
  if (!userId) {
    return errorResponse("UNAUTHENTICATED", "الرجاء تسجيل الدخول أولاً.", 401, {
      requestId,
    });
  }

  const body = await request.json();
  const parsed = changePasswordSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse("VALIDATION_ERROR", "المدخلات غير صالحة", 400, {
      requestId,
      details: parsed.error.flatten().fieldErrors,
    });
  }

  try {
    await AccountService.changePassword(
      userId,
      parsed.data.currentPassword,
      parsed.data.newPassword,
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "فشل تغيير كلمة المرور.";
    return errorResponse("CHANGE_PASSWORD_FAILED", message, 400, { requestId });
  }

  return NextResponse.json({ data: { success: true } });
}
