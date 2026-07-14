import { errorResponse, newRequestId } from "../../../../../lib/api/response";
import { requireApiUser } from "../../../../../lib/auth/api-user";
import { SocialAccountService } from "../../../../../modules/social-accounts/service";
import { NextResponse } from "next/server";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const requestId = newRequestId();
  const { id } = await params;

  const auth = await requireApiUser(requestId);
  if (!auth.ok) return auth.response;

  try {
    await SocialAccountService.deleteForUser(auth.user.id, id);
    return NextResponse.json({ status: "success" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "فشل حذف الحساب الاجتماعي.";
    return errorResponse("SOCIAL_ACCOUNT_NOT_FOUND", message, 404, { requestId });
  }
}
