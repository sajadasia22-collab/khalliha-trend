import { NextResponse } from "next/server";
import { BrandProfileService } from "../../../../../modules/brand/service";

export async function GET() {
  const verifications = await BrandProfileService.listPendingVerifications();
  return NextResponse.json({ data: verifications });
}
