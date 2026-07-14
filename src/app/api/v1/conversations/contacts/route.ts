import { NextResponse } from "next/server";
import { errorResponse, newRequestId } from "../../../../../lib/api/response";
import { getCurrentUser } from "../../../../../lib/auth/session";
import { messagingErrorResponse } from "../../../../../modules/messaging/http";
import { MessagingService } from "../../../../../modules/messaging/service";

export async function GET() {
  const requestId = newRequestId();
  const user = await getCurrentUser();
  if (!user)
    return errorResponse("UNAUTHENTICATED", "الرجاء تسجيل الدخول أولاً.", 401, {
      requestId,
    });
  try {
    return NextResponse.json({ data: await MessagingService.listContacts(user.id) });
  } catch (error) {
    return messagingErrorResponse(error, requestId);
  }
}
