import { NextResponse } from "next/server";
import { errorResponse, newRequestId } from "../../../../../lib/api/response";
import { requireApiUser } from "../../../../../lib/auth/api-user";
import { BrandProfileService } from "../../../../../modules/brand/service";

export async function POST() {
  const requestId = newRequestId();
  const auth = await requireApiUser(requestId);
  if (!auth.ok) return auth.response;

  try {
    const verification = await BrandProfileService.requestVerification(auth.user.id);
    return NextResponse.json({ data: verification });
  } catch (error) {
    const message = error instanceof Error ? error.message : "فشل إرسال طلب التوثيق.";
    return errorResponse("VERIFICATION_REQUEST_FAILED", message, 400, { requestId });
  }
}
