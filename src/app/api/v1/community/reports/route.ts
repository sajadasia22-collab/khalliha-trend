import { NextResponse } from "next/server";
import { errorResponse, newRequestId } from "../../../../../lib/api/response";
import { getCurrentUser } from "../../../../../lib/auth/session";
import { RateLimiter } from "../../../../../lib/rate-limit";
import { communityErrorResponse } from "../../../../../modules/community/http";
import { communityReportSchema } from "../../../../../modules/community/schemas";
import { CommunityService } from "../../../../../modules/community/service";

export async function POST(request: Request) {
  const requestId = newRequestId();
  const user = await getCurrentUser();
  if (!user)
    return errorResponse("UNAUTHENTICATED", "الرجاء تسجيل الدخول أولاً.", 401, {
      requestId,
    });
  if (!RateLimiter.isAllowed(`community-report:${user.id}`, 20, 60 * 60 * 1000)) {
    return errorResponse("TOO_MANY_REQUESTS", "بلاغات كثيرة، حاول لاحقاً.", 429, {
      requestId,
    });
  }
  const parsed = communityReportSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return errorResponse("VALIDATION_ERROR", "بيانات البلاغ غير صالحة.", 400, {
      requestId,
      details: parsed.error.flatten().fieldErrors,
    });
  }
  try {
    const data = await CommunityService.createReport(user.id, parsed.data);
    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    return communityErrorResponse(error, requestId);
  }
}
