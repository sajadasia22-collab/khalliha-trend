import { NextResponse } from "next/server";
import { getCurrentUser } from "../../../../../../lib/auth/session";
import { errorResponse, newRequestId } from "../../../../../../lib/api/response";
import { RateLimiter } from "../../../../../../lib/rate-limit";
import {
  PROFILE_IMAGE_MAX_BYTES,
  deleteProfileImage,
  detectProfileImageMime,
  getProfileImagePath,
  uploadProfileImage,
} from "../../../../../../lib/profile-image-storage";
import { CreatorProfileService } from "../../../../../../modules/creator/service";

const ALLOWED_KINDS = new Set(["avatar", "cover"]);

export async function POST(request: Request) {
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
  if (!RateLimiter.isAllowed(`profile-image:${user.id}`, 12, 60 * 60 * 1000)) {
    return errorResponse("TOO_MANY_REQUESTS", "محاولات رفع كثيرة، حاول لاحقاً.", 429, {
      requestId,
    });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return errorResponse("INVALID_UPLOAD", "تعذّر قراءة ملف الصورة.", 400, {
      requestId,
    });
  }

  const kindValue = formData.get("kind");
  const fileValue = formData.get("file");
  if (
    typeof kindValue !== "string" ||
    !ALLOWED_KINDS.has(kindValue) ||
    !(fileValue instanceof File)
  ) {
    return errorResponse("INVALID_UPLOAD", "نوع الصورة أو الملف غير صالح.", 400, {
      requestId,
    });
  }
  if (fileValue.size === 0 || fileValue.size > PROFILE_IMAGE_MAX_BYTES) {
    return errorResponse(
      "IMAGE_TOO_LARGE",
      "حجم الصورة يجب ألا يتجاوز 5 ميغابايت.",
      400,
      {
        requestId,
      },
    );
  }

  const bytes = new Uint8Array(await fileValue.arrayBuffer());
  const mime = detectProfileImageMime(bytes);
  if (!mime) {
    return errorResponse("UNSUPPORTED_IMAGE", "استخدم صورة JPG أو PNG أو WebP.", 400, {
      requestId,
    });
  }

  const kind = kindValue as "avatar" | "cover";
  const currentProfile = await CreatorProfileService.getByUserId(user.id);
  if (!currentProfile) {
    return errorResponse("PROFILE_NOT_FOUND", "الملف الشخصي غير موجود.", 404, {
      requestId,
    });
  }

  try {
    const uploaded = await uploadProfileImage({ userId: user.id, kind, bytes, mime });

    try {
      await CreatorProfileService.updateImageByUserId(user.id, kind, uploaded.publicUrl);
    } catch (error) {
      await deleteProfileImage(uploaded.path);
      throw error;
    }

    const previousUrl =
      kind === "avatar" ? currentProfile.avatarUrl : currentProfile.coverUrl;
    const previousPath = getProfileImagePath(previousUrl);
    if (previousPath) {
      await deleteProfileImage(previousPath);
    }

    return NextResponse.json(
      { data: { url: uploaded.publicUrl, kind } },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof Error && error.message === "PROFILE_STORAGE_NOT_CONFIGURED") {
      return errorResponse(
        "PROFILE_STORAGE_NOT_CONFIGURED",
        "تخزين الصور غير مفعّل على السيرفر حالياً.",
        503,
        { requestId },
      );
    }

    return errorResponse("PROFILE_IMAGE_UPLOAD_FAILED", "فشل رفع الصورة.", 500, {
      requestId,
    });
  }
}
