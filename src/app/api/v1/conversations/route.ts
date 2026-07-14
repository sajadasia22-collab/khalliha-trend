import { NextResponse } from "next/server";
import { errorResponse, newRequestId } from "../../../../lib/api/response";
import { getCurrentUser } from "../../../../lib/auth/session";
import { messagingErrorResponse } from "../../../../modules/messaging/http";
import {
  conversationListQuerySchema,
  createConversationSchema,
} from "../../../../modules/messaging/schemas";
import { MessagingService } from "../../../../modules/messaging/service";

export async function GET(request: Request) {
  const requestId = newRequestId();
  const user = await getCurrentUser();
  if (!user)
    return errorResponse("UNAUTHENTICATED", "الرجاء تسجيل الدخول أولاً.", 401, {
      requestId,
    });
  const parsed = conversationListQuerySchema.safeParse(
    Object.fromEntries(new URL(request.url).searchParams),
  );
  if (!parsed.success)
    return errorResponse("VALIDATION_ERROR", "معايير البحث غير صالحة.", 400, {
      requestId,
    });
  try {
    return NextResponse.json({
      data: await MessagingService.list(user.id, parsed.data.search),
    });
  } catch (error) {
    return messagingErrorResponse(error, requestId);
  }
}

export async function POST(request: Request) {
  const requestId = newRequestId();
  const user = await getCurrentUser();
  if (!user)
    return errorResponse("UNAUTHENTICATED", "الرجاء تسجيل الدخول أولاً.", 401, {
      requestId,
    });
  const parsed = createConversationSchema.safeParse(await request.json());
  if (!parsed.success)
    return errorResponse("VALIDATION_ERROR", "المدخلات غير صالحة.", 400, {
      requestId,
      details: parsed.error.flatten().fieldErrors,
    });
  try {
    return NextResponse.json(
      {
        data: await MessagingService.create(
          user.id,
          parsed.data.campaignId,
          parsed.data.creatorProfileId,
          parsed.data.body,
        ),
      },
      { status: 201 },
    );
  } catch (error) {
    return messagingErrorResponse(error, requestId);
  }
}
