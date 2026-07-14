import { NextResponse } from "next/server";
import { errorResponse, newRequestId } from "../../../../../lib/api/response";
import { getCurrentUser } from "../../../../../lib/auth/session";
import { privacySettingsSchema } from "../../../../../modules/community/schemas";
import { CommunityService } from "../../../../../modules/community/service";

export async function GET() {
  const requestId = newRequestId();
  const user = await getCurrentUser();
  if (!user)
    return errorResponse("UNAUTHENTICATED", "الرجاء تسجيل الدخول أولاً.", 401, {
      requestId,
    });
  return NextResponse.json({ data: await CommunityService.getPrivacy(user.id) });
}

export async function PATCH(request: Request) {
  const requestId = newRequestId();
  const user = await getCurrentUser();
  if (!user)
    return errorResponse("UNAUTHENTICATED", "الرجاء تسجيل الدخول أولاً.", 401, {
      requestId,
    });
  const parsed = privacySettingsSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return errorResponse("VALIDATION_ERROR", "إعداد الخصوصية غير صالح.", 400, {
      requestId,
      details: parsed.error.flatten().fieldErrors,
    });
  }
  return NextResponse.json({
    data: await CommunityService.updatePrivacy(user.id, parsed.data),
  });
}
