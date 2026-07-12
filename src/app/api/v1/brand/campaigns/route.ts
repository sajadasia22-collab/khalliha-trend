import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getAuthSecret, verifyJWT } from "../../../../../lib/auth/jwt";
import { errorResponse, newRequestId } from "../../../../../lib/api/response";
import { serializeCampaignFull } from "../../../../../lib/campaigns";
import { CampaignService } from "../../../../../modules/campaigns/service";
import { createCampaignSchema } from "../../../../../modules/campaigns/schemas";

const COOKIE_NAME = "khalliha_trend_session";

async function requireUserId(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) {
    return null;
  }
  const payload = (await verifyJWT(token, getAuthSecret())) as { userId?: string } | null;
  return payload?.userId ?? null;
}

export async function GET() {
  const requestId = newRequestId();
  const userId = await requireUserId();
  if (!userId) {
    return errorResponse("UNAUTHENTICATED", "الرجاء تسجيل الدخول أولاً.", 401, {
      requestId,
    });
  }

  const campaigns = await CampaignService.listForBrand(userId);
  return NextResponse.json({ data: campaigns.map(serializeCampaignFull) });
}

export async function POST(request: Request) {
  const requestId = newRequestId();
  const userId = await requireUserId();
  if (!userId) {
    return errorResponse("UNAUTHENTICATED", "الرجاء تسجيل الدخول أولاً.", 401, {
      requestId,
    });
  }

  const body = await request.json();
  const parsed = createCampaignSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse("VALIDATION_ERROR", "المدخلات غير صالحة", 400, {
      requestId,
      details: parsed.error.flatten().fieldErrors,
    });
  }

  try {
    const campaign = await CampaignService.createDraft(userId, parsed.data);
    return NextResponse.json({ data: serializeCampaignFull(campaign) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "فشل إنشاء الحملة.";
    return errorResponse("CAMPAIGN_CREATE_FAILED", message, 400, { requestId });
  }
}
