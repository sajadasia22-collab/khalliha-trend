import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getAuthSecret, verifyJWT } from "../../../../lib/auth/jwt";
import { errorResponse, newRequestId } from "../../../../lib/api/response";
import { SocialAccountService } from "../../../../modules/social-accounts/service";
import { createSocialAccountSchema } from "../../../../modules/social-accounts/schemas";

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

  const accounts = await SocialAccountService.listForUser(userId);
  return NextResponse.json({ data: accounts });
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
  const parsed = createSocialAccountSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse("VALIDATION_ERROR", "المدخلات غير صالحة", 400, {
      requestId,
      details: parsed.error.flatten().fieldErrors,
    });
  }

  try {
    const account = await SocialAccountService.createForUser(userId, parsed.data);
    return NextResponse.json({ data: account });
  } catch (error) {
    const message = error instanceof Error ? error.message : "فشل ربط الحساب الاجتماعي.";
    return errorResponse("SOCIAL_ACCOUNT_LINK_FAILED", message, 409, { requestId });
  }
}
