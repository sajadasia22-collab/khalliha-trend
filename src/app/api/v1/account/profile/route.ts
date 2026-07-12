import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getAuthSecret, verifyJWT } from "../../../../../lib/auth/jwt";
import { errorResponse, newRequestId } from "../../../../../lib/api/response";
import { AccountService } from "../../../../../modules/account/service";
import { updateProfileSchema } from "../../../../../modules/account/schemas";
import { AuthService } from "../../../../../modules/auth/service";
import { AuditLogService } from "../../../../../modules/audit-log/service";

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

  const user = await AuthService.findById(userId);
  if (!user) {
    return errorResponse("USER_NOT_FOUND", "المستخدم غير موجود.", 404, { requestId });
  }

  const body = await request.json();
  const parsed = updateProfileSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse("VALIDATION_ERROR", "المدخلات غير صالحة", 400, {
      requestId,
      details: parsed.error.flatten().fieldErrors,
    });
  }

  const beforeData = { fullName: user.fullName, email: user.email };

  try {
    const updated = await AccountService.updateProfile(
      userId,
      parsed.data.fullName,
      parsed.data.email,
    );

    // Register Audit Log
    const ipAddress = request.headers.get("x-forwarded-for") || "127.0.0.1";
    const userAgent = request.headers.get("user-agent") || "";

    await AuditLogService.log({
      action: "USER_PROFILE_UPDATE",
      actorId: userId,
      targetType: "USER",
      targetId: userId,
      ipAddress,
      userAgent,
      before: beforeData,
      after: { fullName: updated.fullName, email: updated.email },
    }).catch(() => null); // Silently pass log error to avoid blocking the main flow

    return NextResponse.json({
      data: {
        success: true,
        user: {
          fullName: updated.fullName,
          email: updated.email,
        },
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "فشل تحديث بيانات الملف الشخصي.";
    return errorResponse("PROFILE_UPDATE_FAILED", message, 400, { requestId });
  }
}
