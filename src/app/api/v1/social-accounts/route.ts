import { NextResponse } from "next/server";
import { errorResponse, newRequestId } from "../../../../lib/api/response";
import { requireApiUser } from "../../../../lib/auth/api-user";
import { SocialAccountService } from "../../../../modules/social-accounts/service";
import { createSocialAccountSchema } from "../../../../modules/social-accounts/schemas";

export async function GET() {
  const requestId = newRequestId();
  const auth = await requireApiUser(requestId);
  if (!auth.ok) return auth.response;

  const accounts = await SocialAccountService.listForUser(auth.user.id);
  return NextResponse.json({ data: accounts });
}

export async function POST(request: Request) {
  const requestId = newRequestId();
  const auth = await requireApiUser(requestId);
  if (!auth.ok) return auth.response;

  const body = await request.json().catch(() => null);
  const parsed = createSocialAccountSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse("VALIDATION_ERROR", "المدخلات غير صالحة", 400, {
      requestId,
      details: parsed.error.flatten().fieldErrors,
    });
  }

  try {
    const account = await SocialAccountService.createForUser(auth.user.id, parsed.data);
    return NextResponse.json({ data: account });
  } catch (error) {
    const message = error instanceof Error ? error.message : "فشل ربط الحساب الاجتماعي.";
    return errorResponse("SOCIAL_ACCOUNT_LINK_FAILED", message, 409, { requestId });
  }
}
