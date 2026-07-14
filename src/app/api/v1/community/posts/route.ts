import { NextResponse } from "next/server";
import { errorResponse, newRequestId } from "../../../../../lib/api/response";
import { getCurrentUser } from "../../../../../lib/auth/session";
import { RateLimiter } from "../../../../../lib/rate-limit";
import { communityErrorResponse } from "../../../../../modules/community/http";
import {
  communityFeedQuerySchema,
  communityPostSchema,
} from "../../../../../modules/community/schemas";
import { CommunityService } from "../../../../../modules/community/service";

export async function GET(request: Request) {
  const requestId = newRequestId();
  const user = await getCurrentUser();
  const parsed = communityFeedQuerySchema.safeParse(
    Object.fromEntries(new URL(request.url).searchParams),
  );
  if (!parsed.success) {
    return errorResponse("VALIDATION_ERROR", "معايير الخلاصة غير صالحة.", 400, {
      requestId,
      details: parsed.error.flatten().fieldErrors,
    });
  }
  if (parsed.data.feed !== "all" && !user) {
    return errorResponse("UNAUTHENTICATED", "سجّل الدخول لعرض هذه الخلاصة.", 401, {
      requestId,
    });
  }
  const result = await CommunityService.listPosts(user?.id ?? null, parsed.data);
  return NextResponse.json({ data: result.items, pagination: result.pagination });
}

export async function POST(request: Request) {
  const requestId = newRequestId();
  const user = await getCurrentUser();
  if (!user) {
    return errorResponse("UNAUTHENTICATED", "الرجاء تسجيل الدخول أولاً.", 401, {
      requestId,
    });
  }
  if (!RateLimiter.isAllowed(`community-post:${user.id}`, 12, 60 * 60 * 1000)) {
    return errorResponse("TOO_MANY_REQUESTS", "وصلت حد النشر المؤقت.", 429, {
      requestId,
    });
  }
  const parsed = communityPostSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return errorResponse("VALIDATION_ERROR", "بيانات المنشور غير صالحة.", 400, {
      requestId,
      details: parsed.error.flatten().fieldErrors,
    });
  }
  try {
    const data = await CommunityService.createPost(user.id, user.role, parsed.data);
    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    return communityErrorResponse(error, requestId);
  }
}
