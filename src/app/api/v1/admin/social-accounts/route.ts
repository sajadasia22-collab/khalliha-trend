import { NextResponse } from "next/server";
import { SocialAccountService } from "../../../../../modules/social-accounts/service";

export async function GET() {
  const accounts = await SocialAccountService.listPending();
  return NextResponse.json({ data: accounts });
}
