import { NextResponse } from "next/server";
import { z } from "zod";
import { errorResponse, newRequestId } from "../../../../../../../lib/api/response";
import { getCurrentUser } from "../../../../../../../lib/auth/session";
import { FraudService } from "../../../../../../../modules/fraud/service";

const schema = z.object({
  decision: z.enum(["CLEAR", "CONFIRM"], { message: "قرار مراجعة الاحتيال غير صالح" }),
  note: z.string().trim().max(1000).optional(),
});

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

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return errorResponse("VALIDATION_ERROR", "المدخلات غير صالحة.", 400, {
      requestId,
      details: parsed.error.flatten().fieldErrors,
    });
  }

  try {
    const { id } = await params;
    const assessment = await FraudService.resolveAssessment(
      user.id,
      id,
      parsed.data.decision,
      parsed.data.note,
    );
    // النتيجة الكاملة تتضمن حقول BigInt (الأرباح والميزانيات) لا يمكن تسلسلها إلى JSON.
    return NextResponse.json({
      data: { id: assessment.id, status: assessment.status },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "فشلت مراجعة الاحتيال.";
    return errorResponse("BAD_REQUEST", message, 400, { requestId });
  }
}
