import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { getAuthSecret, verifyJWT } from "../../../../../../../lib/auth/jwt";
import { errorResponse, newRequestId } from "../../../../../../../lib/api/response";
import { SubmissionService } from "../../../../../../../modules/submissions/service";

const COOKIE_NAME = "khalliha_trend_session";

const reviewSubmissionSchema = z.object({
  decision: z.enum(["APPROVE", "REJECT", "REQUEST_REVISION"]),
  note: z.string().optional(),
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
    const parsed = reviewSubmissionSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse("VALIDATION_ERROR", "المدخلات غير صالحة.", 400, {
        requestId,
        details: parsed.error.flatten().fieldErrors,
      });
    }

    const submission = await SubmissionService.reviewSubmission(
      payload.userId,
      submissionId,
      parsed.data.decision,
      parsed.data.note,
    );

    return NextResponse.json({ data: submission });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "فشلت عملية المراجعة.";
    return errorResponse("BAD_REQUEST", message, 400, {
      requestId,
    });
  }
}
