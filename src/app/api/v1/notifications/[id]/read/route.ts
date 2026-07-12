import { NextResponse } from "next/server";
import { errorResponse, newRequestId } from "../../../../../../lib/api/response";
import { getCurrentUser } from "../../../../../../lib/auth/session";
import { NotificationService } from "../../../../../../modules/notifications/service";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const requestId = newRequestId();
  const user = await getCurrentUser();
  if (!user) {
    return errorResponse("UNAUTHENTICATED", "الرجاء تسجيل الدخول أولاً.", 401, {
      requestId,
    });
  }

  try {
    const { id } = await params;
    const notification = await NotificationService.markAsRead(user.id, id);
    return NextResponse.json({ data: notification });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "فشل تحديث الإشعار.";
    return errorResponse("BAD_REQUEST", message, 400, { requestId });
  }
}
