import { NextResponse } from "next/server";
import { newRequestId } from "../../../../../lib/api/response";
import { requireAdminApiUser } from "../../../../../lib/auth/admin-api";
import { BrandProfileService } from "../../../../../modules/brand/service";

export async function GET() {
  const requestId = newRequestId();
  const auth = await requireAdminApiUser(requestId);
  if (!auth.ok) return auth.response;

  const verifications = await BrandProfileService.listPendingVerifications();
  return NextResponse.json({ data: verifications });
}
