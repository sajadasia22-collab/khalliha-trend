import { NextResponse } from "next/server";
import { errorResponse, newRequestId } from "../../../../../../../lib/api/response";
import { SocialAccountService } from "../../../../../../../modules/social-accounts/service";
import { reviewSocialAccountSchema } from "../../../../../../../modules/social-accounts/schemas";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const requestId = newRequestId();
  const { id } = await params;

  const body = await request.json();
  const parsed = reviewSocialAccountSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse("VALIDATION_ERROR", "المدخلات غير صالحة", 400, {
      requestId,
      details: parsed.error.flatten().fieldErrors,
    });
  }

  try {
    const account = await SocialAccountService.review(
      id,
      parsed.data.decision,
      parsed.data.rejectionReason,
    );
    return NextResponse.json({ data: account });
  } catch (error) {
    const message = error instanceof Error ? error.message : "فشلت عملية المراجعة.";
    return errorResponse("SOCIAL_ACCOUNT_REVIEW_FAILED", message, 400, { requestId });
  }
}
