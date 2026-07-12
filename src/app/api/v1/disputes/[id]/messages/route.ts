import { NextResponse } from "next/server";
import { errorResponse, newRequestId } from "../../../../../../lib/api/response";
import { getCurrentUser } from "../../../../../../lib/auth/session";
import { createDisputeMessageSchema } from "../../../../../../modules/disputes/schemas";
import { DisputeService } from "../../../../../../modules/disputes/service";

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

  const parsed = createDisputeMessageSchema.safeParse(await request.json());
  if (!parsed.success) {
    return errorResponse("VALIDATION_ERROR", "المدخلات غير صالحة.", 400, {
      requestId,
      details: parsed.error.flatten().fieldErrors,
    });
  }

  try {
    const { id } = await params;
    const message = await DisputeService.addMessage(user.id, id, parsed.data.body);
    return NextResponse.json({ data: message });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "فشل إرسال الرسالة.";
    return errorResponse("BAD_REQUEST", message, 400, { requestId });
  }
}
