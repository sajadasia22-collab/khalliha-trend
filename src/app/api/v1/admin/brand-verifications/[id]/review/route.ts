import { NextResponse } from "next/server";
import { errorResponse, newRequestId } from "../../../../../../../lib/api/response";
import { requireAdminApiUser } from "../../../../../../../lib/auth/admin-api";
import { BrandProfileService } from "../../../../../../../modules/brand/service";
import { brandVerificationReviewSchema } from "../../../../../../../modules/brand/schemas";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const requestId = newRequestId();
  const { id } = await params;

  const auth = await requireAdminApiUser(requestId);
  if (!auth.ok) return auth.response;

  const body = await request.json().catch(() => null);
  const parsed = brandVerificationReviewSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse("VALIDATION_ERROR", "المدخلات غير صالحة", 400, {
      requestId,
      details: parsed.error.flatten().fieldErrors,
    });
  }

  try {
    const verification = await BrandProfileService.reviewVerification(
      id,
      auth.user.id,
      parsed.data.decision,
      parsed.data.note,
    );
    return NextResponse.json({ data: verification });
  } catch (error) {
    const message = error instanceof Error ? error.message : "فشلت عملية المراجعة.";
    return errorResponse("VERIFICATION_REVIEW_FAILED", message, 400, { requestId });
  }
}
