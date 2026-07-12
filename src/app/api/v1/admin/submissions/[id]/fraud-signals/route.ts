import { NextResponse } from "next/server";
import { z } from "zod";
import { FraudSignalKind } from "../../../../../../../generated/prisma/enums";
import { errorResponse, newRequestId } from "../../../../../../../lib/api/response";
import { getCurrentUser } from "../../../../../../../lib/auth/session";
import { FraudService } from "../../../../../../../modules/fraud/service";

const schema = z.object({
  kind: z.nativeEnum(FraudSignalKind, { message: "نوع إشارة الاحتيال غير صالح" }),
  scoreImpact: z.number().int().min(0).max(100),
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

  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) {
    return errorResponse("VALIDATION_ERROR", "المدخلات غير صالحة.", 400, {
      requestId,
      details: parsed.error.flatten().fieldErrors,
    });
  }

  try {
    const { id } = await params;
    const assessment = await FraudService.addManualSignal(
      user.id,
      id,
      parsed.data.kind,
      parsed.data.scoreImpact,
      parsed.data.note,
    );
    return NextResponse.json({ data: assessment });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "فشل تسجيل إشارة الاحتيال.";
    return errorResponse("BAD_REQUEST", message, 400, { requestId });
  }
}
