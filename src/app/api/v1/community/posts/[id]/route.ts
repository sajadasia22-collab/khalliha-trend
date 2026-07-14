import { NextResponse } from "next/server";
import { errorResponse, newRequestId } from "../../../../../../lib/api/response";
import { getCurrentUser } from "../../../../../../lib/auth/session";
import { communityErrorResponse } from "../../../../../../modules/community/http";
import { communityPostUpdateSchema } from "../../../../../../modules/community/schemas";
import { CommunityService } from "../../../../../../modules/community/service";

type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Context) {
  const requestId = newRequestId();
  const user = await getCurrentUser();
  if (!user)
    return errorResponse("UNAUTHENTICATED", "الرجاء تسجيل الدخول أولاً.", 401, {
      requestId,
    });
  const parsed = communityPostUpdateSchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!parsed.success) {
    return errorResponse("VALIDATION_ERROR", "بيانات المنشور غير صالحة.", 400, {
      requestId,
      details: parsed.error.flatten().fieldErrors,
    });
  }
  try {
    const { id } = await params;
    const data = await CommunityService.updatePost(user.id, id, parsed.data);
    return NextResponse.json({ data });
  } catch (error) {
    return communityErrorResponse(error, requestId);
  }
}

export async function DELETE(_request: Request, { params }: Context) {
  const requestId = newRequestId();
  const user = await getCurrentUser();
  if (!user)
    return errorResponse("UNAUTHENTICATED", "الرجاء تسجيل الدخول أولاً.", 401, {
      requestId,
    });
  try {
    const { id } = await params;
    const data = await CommunityService.deletePost(user.id, id);
    return NextResponse.json({ data });
  } catch (error) {
    return communityErrorResponse(error, requestId);
  }
}
