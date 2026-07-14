import { NextResponse } from "next/server";
import { errorResponse, newRequestId } from "../../../../../../lib/api/response";
import { getCurrentUser } from "../../../../../../lib/auth/session";
import { RateLimiter } from "../../../../../../lib/rate-limit";
import { FollowService } from "../../../../../../modules/follows/service";

type Context = { params: Promise<{ username: string }> };

function followError(error: unknown, requestId: string) {
  if (error instanceof Error && error.message === "FOLLOW_TARGET_NOT_FOUND") {
    return errorResponse("FOLLOW_TARGET_NOT_FOUND", "صانع المحتوى غير موجود.", 404, {
      requestId,
    });
  }
  if (error instanceof Error && error.message === "CANNOT_FOLLOW_SELF") {
    return errorResponse("CANNOT_FOLLOW_SELF", "لا يمكنك متابعة حسابك.", 400, {
      requestId,
    });
  }
  return errorResponse("FOLLOW_UPDATE_FAILED", "تعذّر تحديث المتابعة.", 500, {
    requestId,
  });
}

async function updateFollow(action: "follow" | "unfollow", context: Context) {
  const requestId = newRequestId();
  const user = await getCurrentUser();
  if (!user) {
    return errorResponse("UNAUTHENTICATED", "الرجاء تسجيل الدخول أولاً.", 401, {
      requestId,
    });
  }
  if (!RateLimiter.isAllowed(`follow:${user.id}`, 60, 60_000)) {
    return errorResponse(
      "TOO_MANY_REQUESTS",
      "طلبات متابعة كثيرة، حاول بعد دقيقة.",
      429,
      {
        requestId,
      },
    );
  }

  const { username } = await context.params;
  try {
    const data =
      action === "follow"
        ? await FollowService.followByUsername(user.id, username)
        : await FollowService.unfollowByUsername(user.id, username);
    return NextResponse.json({ data });
  } catch (error) {
    return followError(error, requestId);
  }
}

export async function POST(_request: Request, context: Context) {
  return updateFollow("follow", context);
}

export async function DELETE(_request: Request, context: Context) {
  return updateFollow("unfollow", context);
}
