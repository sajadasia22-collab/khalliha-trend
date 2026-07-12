import { NextResponse } from "next/server";
import { errorResponse, newRequestId } from "../../../../../../../lib/api/response";
import { getCurrentUser } from "../../../../../../../lib/auth/session";
import { resolveDisputeSchema } from "../../../../../../../modules/disputes/schemas";
import { DisputeService } from "../../../../../../../modules/disputes/service";

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
  if (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN") {
    return errorResponse("FORBIDDEN", "هذا الإجراء متاح فقط لمسؤولي النظام.", 403, {
      requestId,
    });
  }

  const parsed = resolveDisputeSchema.safeParse(await request.json());
  if (!parsed.success) {
    return errorResponse("VALIDATION_ERROR", "المدخلات غير صالحة.", 400, {
      requestId,
      details: parsed.error.flatten().fieldErrors,
    });
  }

  try {
    const { id } = await params;
    const dispute = await DisputeService.resolve(
      user.id,
      id,
      parsed.data.decision,
      parsed.data.resolutionNote,
    );
    return NextResponse.json({ data: dispute });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "فشل حل النزاع.";
    return errorResponse("BAD_REQUEST", message, 400, { requestId });
  }
}
