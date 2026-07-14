import { NextResponse } from "next/server";
import { errorResponse, newRequestId } from "../../../../../../../lib/api/response";
import { getCurrentUser } from "../../../../../../../lib/auth/session";
import { messagingErrorResponse } from "../../../../../../../modules/messaging/http";
import { reviewConversationReportSchema } from "../../../../../../../modules/messaging/schemas";
import { MessagingService } from "../../../../../../../modules/messaging/service";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const requestId = newRequestId();
  const user = await getCurrentUser();
  if (!user)
    return errorResponse("UNAUTHENTICATED", "الرجاء تسجيل الدخول أولاً.", 401, {
      requestId,
    });
  const parsed = reviewConversationReportSchema.safeParse(await request.json());
  if (!parsed.success)
    return errorResponse("VALIDATION_ERROR", "بيانات القرار غير صالحة.", 400, {
      requestId,
      details: parsed.error.flatten().fieldErrors,
    });
  try {
    const { id } = await params;
    return NextResponse.json({
      data: await MessagingService.reviewReport(
        user.id,
        id,
        parsed.data.decision,
        parsed.data.reviewNote,
      ),
    });
  } catch (error) {
    return messagingErrorResponse(error, requestId);
  }
}
