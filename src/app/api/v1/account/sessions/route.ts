import { NextResponse } from "next/server";
import { errorResponse, newRequestId } from "../../../../../lib/api/response";
import { getCurrentUser } from "../../../../../lib/auth/session";
import { AccountService } from "../../../../../modules/account/service";

export async function GET(request: Request) {
  const requestId = newRequestId();
  const user = await getCurrentUser();
  if (!user)
    return errorResponse("UNAUTHENTICATED", "الرجاء تسجيل الدخول أولاً.", 401, {
      requestId,
    });

  return NextResponse.json({
    data: {
      current: {
        ipAddress: request.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? null,
        userAgent: request.headers.get("user-agent"),
      },
      recent: await AccountService.getRecentSessions(user.id),
    },
  });
}
