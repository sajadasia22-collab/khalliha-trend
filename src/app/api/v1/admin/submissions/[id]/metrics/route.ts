import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { getAuthSecret, verifyJWT } from "../../../../../../../lib/auth/jwt";
import { errorResponse, newRequestId } from "../../../../../../../lib/api/response";
import { EarningsService } from "../../../../../../../modules/earnings/service";

const COOKIE_NAME = "khalliha_trend_session";

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

  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) {
    return errorResponse("UNAUTHENTICATED", "الرجاء تسجيل الدخول أولاً.", 401, {
      requestId,
    });
  }
  const payload = (await verifyJWT(token, getAuthSecret())) as { userId?: string } | null;
  if (!payload?.userId) {
    return errorResponse(
      "UNAUTHENTICATED",
      "جلسة عمل غير صالحة أو منتهية الصلاحية.",
      401,
      {
        requestId,
      },
    );
  }

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
      payload.userId,
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
