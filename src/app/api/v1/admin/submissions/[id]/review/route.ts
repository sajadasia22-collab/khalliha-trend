import { NextResponse } from "next/server";
import { z } from "zod";
import { errorResponse, newRequestId } from "../../../../../../../lib/api/response";
import { requireAdminApiUser } from "../../../../../../../lib/auth/admin-api";
import { SubmissionService } from "../../../../../../../modules/submissions/service";

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

  const auth = await requireAdminApiUser(requestId);
  if (!auth.ok) return auth.response;

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
      auth.user.id,
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
