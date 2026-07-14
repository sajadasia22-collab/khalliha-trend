import { NextResponse } from "next/server";
import { errorResponse, newRequestId } from "../../../../../../lib/api/response";
import { getCurrentUser } from "../../../../../../lib/auth/session";
import { messagingErrorResponse } from "../../../../../../modules/messaging/http";
import {
  createMessageSchema,
  messageListQuerySchema,
} from "../../../../../../modules/messaging/schemas";
import { MessagingService } from "../../../../../../modules/messaging/service";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const requestId = newRequestId();
  const user = await getCurrentUser();
  if (!user)
    return errorResponse("UNAUTHENTICATED", "الرجاء تسجيل الدخول أولاً.", 401, {
      requestId,
    });
  const parsed = messageListQuerySchema.safeParse(
    Object.fromEntries(new URL(request.url).searchParams),
  );
  if (!parsed.success)
    return errorResponse("VALIDATION_ERROR", "معايير البحث غير صالحة.", 400, {
      requestId,
    });
  try {
    const { id } = await params;
    return NextResponse.json({
      data: await MessagingService.messages(user.id, id, parsed.data.search),
    });
  } catch (error) {
    return messagingErrorResponse(error, requestId);
  }
}

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
  const parsed = createMessageSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success)
    return errorResponse("VALIDATION_ERROR", "المدخلات غير صالحة.", 400, {
      requestId,
      details: parsed.error.flatten().fieldErrors,
    });
  try {
    const { id } = await params;
    return NextResponse.json(
      { data: await MessagingService.send(user.id, id, parsed.data.body) },
      { status: 201 },
    );
  } catch (error) {
    return messagingErrorResponse(error, requestId);
  }
}
