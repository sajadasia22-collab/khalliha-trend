import { NextResponse } from "next/server";
import { errorResponse, newRequestId } from "../../../../../../../lib/api/response";
import { getCurrentUser } from "../../../../../../../lib/auth/session";
import { RateLimiter } from "../../../../../../../lib/rate-limit";
import { communityErrorResponse } from "../../../../../../../modules/community/http";
import { communityCommentSchema } from "../../../../../../../modules/community/schemas";
import { CommunityService } from "../../../../../../../modules/community/service";

type Context = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Context) {
  const requestId = newRequestId();
  try {
    const user = await getCurrentUser();
    const data = await CommunityService.listComments((await params).id, user?.id ?? null);
    return NextResponse.json({ data });
  } catch (error) {
    return communityErrorResponse(error, requestId);
  }
}

export async function POST(request: Request, { params }: Context) {
  const requestId = newRequestId();
  const user = await getCurrentUser();
  if (!user)
    return errorResponse("UNAUTHENTICATED", "الرجاء تسجيل الدخول أولاً.", 401, {
      requestId,
    });
  if (!RateLimiter.isAllowed(`community-comment:${user.id}`, 30, 60 * 60 * 1000)) {
    return errorResponse("TOO_MANY_REQUESTS", "تعليقات كثيرة، حاول لاحقاً.", 429, {
      requestId,
    });
  }
  const parsed = communityCommentSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return errorResponse("VALIDATION_ERROR", "نص التعليق غير صالح.", 400, {
      requestId,
      details: parsed.error.flatten().fieldErrors,
    });
  }
  try {
    const data = await CommunityService.createComment(
      user.id,
      (await params).id,
      parsed.data,
    );
    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    return communityErrorResponse(error, requestId);
  }
}
