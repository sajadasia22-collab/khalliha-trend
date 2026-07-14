import { NextResponse } from "next/server";
import { newRequestId } from "../../../../../lib/api/response";
import { requireAdminApiUser } from "../../../../../lib/auth/admin-api";
import { SocialAccountService } from "../../../../../modules/social-accounts/service";

export async function GET() {
  const requestId = newRequestId();
  const auth = await requireAdminApiUser(requestId);
  if (!auth.ok) return auth.response;

  const accounts = await SocialAccountService.listPending();
  return NextResponse.json({ data: accounts });
}
