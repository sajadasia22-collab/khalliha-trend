import { NextResponse } from "next/server";
import { errorResponse, newRequestId } from "../../../../../lib/api/response";
import { requireApiUser } from "../../../../../lib/auth/api-user";
import { AccountService } from "../../../../../modules/account/service";
import { updateProfileSchema } from "../../../../../modules/account/schemas";
import { AuditLogService } from "../../../../../modules/audit-log/service";

export async function POST(request: Request) {
  const requestId = newRequestId();
  const auth = await requireApiUser(requestId);
  if (!auth.ok) return auth.response;
  const { user } = auth;

  const body = await request.json().catch(() => null);
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
      user.id,
      parsed.data.fullName,
      parsed.data.email,
    );

    // Register Audit Log
    const ipAddress = request.headers.get("x-forwarded-for") || "127.0.0.1";
    const userAgent = request.headers.get("user-agent") || "";

    await AuditLogService.log({
      action: "USER_PROFILE_UPDATE",
      actorId: user.id,
      targetType: "USER",
      targetId: user.id,
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
