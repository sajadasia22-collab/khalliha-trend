import { NextResponse } from "next/server";
import { errorResponse, newRequestId } from "../../../../../lib/api/response";
import { getCurrentUser } from "../../../../../lib/auth/session";
import { NotificationService } from "../../../../../modules/notifications/service";

export async function POST() {
  const requestId = newRequestId();
  const user = await getCurrentUser();
  if (!user) {
    return errorResponse("UNAUTHENTICATED", "الرجاء تسجيل الدخول أولاً.", 401, {
      requestId,
    });
  }

  await NotificationService.markAllAsRead(user.id);
  return NextResponse.json({ data: { success: true } });
}
