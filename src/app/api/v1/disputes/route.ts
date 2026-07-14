import { NextResponse } from "next/server";
import { errorResponse, newRequestId } from "../../../../lib/api/response";
import { getCurrentUser } from "../../../../lib/auth/session";
import { createDisputeSchema } from "../../../../modules/disputes/schemas";
import { DisputeService } from "../../../../modules/disputes/service";

export async function GET() {
  const requestId = newRequestId();
  const user = await getCurrentUser();
  if (!user) {
    return errorResponse("UNAUTHENTICATED", "الرجاء تسجيل الدخول أولاً.", 401, {
      requestId,
    });
  }

  const disputes = await DisputeService.listForUser(user.id);
  return NextResponse.json({ data: disputes });
}

export async function POST(request: Request) {
  const requestId = newRequestId();
  const user = await getCurrentUser();
  if (!user) {
    return errorResponse("UNAUTHENTICATED", "الرجاء تسجيل الدخول أولاً.", 401, {
      requestId,
    });
  }

  const parsed = createDisputeSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return errorResponse("VALIDATION_ERROR", "المدخلات غير صالحة.", 400, {
      requestId,
      details: parsed.error.flatten().fieldErrors,
    });
  }

  try {
    const dispute = await DisputeService.create(user.id, parsed.data);
    return NextResponse.json({ data: dispute });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "فشل فتح النزاع.";
    return errorResponse("BAD_REQUEST", message, 400, { requestId });
  }
}
