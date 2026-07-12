import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getAuthSecret, verifyJWT } from "../../../../../lib/auth/jwt";
import { errorResponse, newRequestId } from "../../../../../lib/api/response";
import { BrandProfileService } from "../../../../../modules/brand/service";
import { updateBrandProfileSchema } from "../../../../../modules/brand/schemas";

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

  const brand = await BrandProfileService.getForUser(userId);
  if (!brand) {
    return errorResponse("PROFILE_NOT_FOUND", "لا يوجد حساب علامة تجارية.", 404, {
      requestId,
    });
  }

  return NextResponse.json({ data: brand });
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
  const parsed = updateBrandProfileSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse("VALIDATION_ERROR", "المدخلات غير صالحة", 400, {
      requestId,
      details: parsed.error.flatten().fieldErrors,
    });
  }

  try {
    const brand = await BrandProfileService.updateForUser(userId, parsed.data);
    return NextResponse.json({ data: brand });
  } catch (error) {
    const message = error instanceof Error ? error.message : "فشل تحديث الملف الشخصي.";
    return errorResponse("PROFILE_UPDATE_FAILED", message, 400, { requestId });
  }
}
