import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getAuthSecret, verifyJWT } from "../../../../../lib/auth/jwt";
import { errorResponse, newRequestId } from "../../../../../lib/api/response";
import { AccountService } from "../../../../../modules/account/service";
import { updateNotificationPreferencesSchema } from "../../../../../modules/account/schemas";

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

export async function GET() {
  const requestId = newRequestId();
  const userId = await requireUserId();
  if (!userId) {
    return errorResponse("UNAUTHENTICATED", "الرجاء تسجيل الدخول أولاً.", 401, {
      requestId,
    });
  }

  const preferences = await AccountService.getNotificationPreferences(userId);
  return NextResponse.json({ data: preferences });
}

export async function PATCH(request: Request) {
  const requestId = newRequestId();
  const userId = await requireUserId();
  if (!userId) {
    return errorResponse("UNAUTHENTICATED", "الرجاء تسجيل الدخول أولاً.", 401, {
      requestId,
    });
  }

  const body = await request.json();
  const parsed = updateNotificationPreferencesSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse("VALIDATION_ERROR", "المدخلات غير صالحة", 400, {
      requestId,
      details: parsed.error.flatten().fieldErrors,
    });
  }

  const preferences = await AccountService.updateNotificationPreferences(
    userId,
    parsed.data,
  );
  return NextResponse.json({ data: preferences });
}
