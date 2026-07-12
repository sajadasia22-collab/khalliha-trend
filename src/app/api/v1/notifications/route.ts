import { NextResponse } from "next/server";
import { errorResponse, newRequestId } from "../../../../lib/api/response";
import { getCurrentUser } from "../../../../lib/auth/session";
import { NotificationService } from "../../../../modules/notifications/service";

export async function GET() {
  const requestId = newRequestId();
  const user = await getCurrentUser();
  if (!user) {
    return errorResponse("UNAUTHENTICATED", "الرجاء تسجيل الدخول أولاً.", 401, {
      requestId,
    });
  }

  const [notifications, unreadCount] = await Promise.all([
    NotificationService.listForUser(user.id),
    NotificationService.unreadCount(user.id),
  ]);

  return NextResponse.json({ data: notifications, unreadCount });
}
