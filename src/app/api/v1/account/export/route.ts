import { errorResponse, newRequestId } from "../../../../../lib/api/response";
import { getCurrentUser } from "../../../../../lib/auth/session";
import { AuditLogService } from "../../../../../modules/audit-log/service";
import { AccountService } from "../../../../../modules/account/service";

export async function GET(request: Request) {
  const requestId = newRequestId();
  const user = await getCurrentUser();
  if (!user) {
    return errorResponse("UNAUTHENTICATED", "الرجاء تسجيل الدخول أولاً.", 401, {
      requestId,
    });
  }
  try {
    const data = await AccountService.exportUserData(user.id);
    await AuditLogService.log({
      actorId: user.id,
      action: "USER_DATA_EXPORT",
      targetType: "USER",
      targetId: user.id,
      ipAddress: request.headers.get("x-forwarded-for") ?? undefined,
      userAgent: request.headers.get("user-agent") ?? undefined,
    }).catch(() => null);
    return new Response(JSON.stringify(data, null, 2), {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="khalliha-trend-data-${new Date().toISOString().slice(0, 10)}.json"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    console.error(
      JSON.stringify({
        event: "account-data-export-failed",
        requestId,
        message: error instanceof Error ? error.message : "unknown error",
      }),
    );
    return errorResponse("DATA_EXPORT_FAILED", "تعذّر تصدير البيانات حالياً.", 500, {
      requestId,
      details:
        process.env.NODE_ENV === "development"
          ? error instanceof Error
            ? error.message
            : "unknown error"
          : undefined,
    });
  }
}
