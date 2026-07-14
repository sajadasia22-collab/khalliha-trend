import { NextResponse } from "next/server";
import { z } from "zod";
import { errorResponse, newRequestId } from "../../../../../../../lib/api/response";
import { requireAdminApiUser } from "../../../../../../../lib/auth/admin-api";
import { EarningsService } from "../../../../../../../modules/earnings/service";

const metricsSchema = z
  .object({
    observedViews: z
      .number()
      .int()
      .nonnegative("المشاهدات الكلية يجب أن تكون قيمة موجبة"),
    qualifiedViews: z
      .number()
      .int()
      .nonnegative("المشاهدات المؤهلة يجب أن تكون قيمة موجبة"),
    note: z.string().max(500, "الملاحظة لا يمكن أن تتجاوز 500 حرف").optional(),
  })
  .refine((data) => data.qualifiedViews <= data.observedViews, {
    message: "المشاهدات المؤهلة لا يمكن أن تتجاوز المشاهدات الكلية المرصودة",
    path: ["qualifiedViews"],
  });

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const requestId = newRequestId();
  const { id: submissionId } = await params;

  const auth = await requireAdminApiUser(requestId);
  if (!auth.ok) return auth.response;

  try {
    const body = await request.json();
    const parsed = metricsSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse("VALIDATION_ERROR", "المدخلات غير صالحة.", 400, {
        requestId,
        details: parsed.error.flatten().fieldErrors,
      });
    }

    const { observedViews, qualifiedViews, note } = parsed.data;

    const snapshot = await EarningsService.recordMetricsAndCalculateEarnings(
      auth.user.id,
      submissionId,
      BigInt(observedViews),
      BigInt(qualifiedViews),
      note,
    );

    return NextResponse.json({
      data: {
        id: snapshot.id,
        submissionId: snapshot.submissionId,
        observedViews: snapshot.observedViews.toString(),
        qualifiedViews: snapshot.qualifiedViews.toString(),
        disqualifiedViews: snapshot.disqualifiedViews.toString(),
        disqualificationReason: snapshot.disqualificationReason,
        source: snapshot.source,
        capturedAt: snapshot.capturedAt.toISOString(),
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "فشل تسجيل الإحصائيات.";
    return errorResponse("BAD_REQUEST", message, 400, {
      requestId,
    });
  }
}
