import { NextResponse } from "next/server";
import { getCurrentUser } from "../../../../../lib/auth/session";
import { errorResponse, newRequestId } from "../../../../../lib/api/response";
import { CreatorProfileService } from "../../../../../modules/creator/service";
import { updateCreatorProfileSchema } from "../../../../../modules/creator/schemas";

export async function GET() {
  const requestId = newRequestId();
  const user = await getCurrentUser();
  if (!user) {
    return errorResponse("UNAUTHENTICATED", "الرجاء تسجيل الدخول أولاً.", 401, {
      requestId,
    });
  }
  if (user.role !== "CREATOR") {
    return errorResponse("FORBIDDEN", "هذا الإجراء متاح فقط لصناع المحتوى.", 403, {
      requestId,
    });
  }

  const profile = await CreatorProfileService.getByUserId(user.id);
  if (!profile) {
    return errorResponse("PROFILE_NOT_FOUND", "الملف الشخصي غير موجود.", 404, {
      requestId,
    });
  }

  return NextResponse.json({ data: profile });
}

export async function PATCH(request: Request) {
  const requestId = newRequestId();
  const user = await getCurrentUser();
  if (!user) {
    return errorResponse("UNAUTHENTICATED", "الرجاء تسجيل الدخول أولاً.", 401, {
      requestId,
    });
  }
  if (user.role !== "CREATOR") {
    return errorResponse("FORBIDDEN", "هذا الإجراء متاح فقط لصناع المحتوى.", 403, {
      requestId,
    });
  }

  const body = await request.json().catch(() => null);
  const parsed = updateCreatorProfileSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse("VALIDATION_ERROR", "المدخلات غير صالحة", 400, {
      requestId,
      details: parsed.error.flatten().fieldErrors,
    });
  }

  try {
    const profile = await CreatorProfileService.updateByUserId(user.id, parsed.data);
    return NextResponse.json({ data: profile });
  } catch (error) {
    if (error instanceof Error && error.message === "USERNAME_TAKEN") {
      return errorResponse("USERNAME_TAKEN", "اسم المستخدم مستخدم بالفعل.", 409, {
        requestId,
      });
    }

    return errorResponse("PROFILE_UPDATE_FAILED", "فشل حفظ الملف الشخصي.", 500, {
      requestId,
    });
  }
}
