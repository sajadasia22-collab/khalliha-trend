import { NextResponse } from "next/server";
import { errorResponse, newRequestId } from "../../../../../../../lib/api/response";
import { getCurrentUser } from "../../../../../../../lib/auth/session";
import { communityErrorResponse } from "../../../../../../../modules/community/http";
import { communityReportReviewSchema } from "../../../../../../../modules/community/schemas";
import { CommunityService } from "../../../../../../../modules/community/service";
import { AuditLogService } from "../../../../../../../modules/audit-log/service";

type Context = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Context) {
  const requestId = newRequestId();
  const user = await getCurrentUser();
  if (!user)
    return errorResponse("UNAUTHENTICATED", "الرجاء تسجيل الدخول أولاً.", 401, {
      requestId,
    });
  if (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN") {
    return errorResponse("FORBIDDEN", "غير مصرح لك بمراجعة البلاغات.", 403, {
      requestId,
    });
  }
  const parsed = communityReportReviewSchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!parsed.success) {
    return errorResponse("VALIDATION_ERROR", "قرار المراجعة غير صالح.", 400, {
      requestId,
      details: parsed.error.flatten().fieldErrors,
    });
  }
  try {
    const { id } = await params;
    const data = await CommunityService.reviewReport(user.id, id, parsed.data);
    await AuditLogService.log({
      actorId: user.id,
      actorEmail: user.email ?? undefined,
      action: "COMMUNITY_REPORT_REVIEW",
      targetType: "CommunityReport",
      targetId: id,
      after: { status: parsed.data.status, reviewNote: parsed.data.reviewNote },
      ipAddress: request.headers.get("x-forwarded-for") ?? undefined,
      userAgent: request.headers.get("user-agent") ?? undefined,
    }).catch(() => null);
    return NextResponse.json({ data });
  } catch (error) {
    return communityErrorResponse(error, requestId);
  }
}
