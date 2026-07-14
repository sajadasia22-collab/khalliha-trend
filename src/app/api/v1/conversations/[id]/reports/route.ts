import { NextResponse } from "next/server";
import { errorResponse, newRequestId } from "../../../../../../lib/api/response";
import { getCurrentUser } from "../../../../../../lib/auth/session";
import { messagingErrorResponse } from "../../../../../../modules/messaging/http";
import { createConversationReportSchema } from "../../../../../../modules/messaging/schemas";
import { MessagingService } from "../../../../../../modules/messaging/service";

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
  const parsed = createConversationReportSchema.safeParse(await request.json());
  if (!parsed.success)
    return errorResponse("VALIDATION_ERROR", "بيانات البلاغ غير صالحة.", 400, {
      requestId,
      details: parsed.error.flatten().fieldErrors,
    });
  try {
    const { id } = await params;
    return NextResponse.json(
      { data: await MessagingService.report(user.id, id, parsed.data) },
      { status: 201 },
    );
  } catch (error) {
    return messagingErrorResponse(error, requestId);
  }
}
