import { NextResponse } from "next/server";
import { errorResponse, newRequestId } from "../../../../../../../lib/api/response";
import { getCurrentUser } from "../../../../../../../lib/auth/session";
import { communityErrorResponse } from "../../../../../../../modules/community/http";
import { CommunityService } from "../../../../../../../modules/community/service";

type Context = { params: Promise<{ id: string }> };

export async function POST(_request: Request, { params }: Context) {
  const requestId = newRequestId();
  const user = await getCurrentUser();
  if (!user)
    return errorResponse("UNAUTHENTICATED", "الرجاء تسجيل الدخول أولاً.", 401, {
      requestId,
    });
  try {
    const data = await CommunityService.toggleLike(user.id, (await params).id);
    return NextResponse.json({ data });
  } catch (error) {
    return communityErrorResponse(error, requestId);
  }
}
