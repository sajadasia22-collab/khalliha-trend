import { NextResponse } from "next/server";
import { getCurrentUser } from "../../../../../../../lib/auth/session";
import { errorResponse, newRequestId } from "../../../../../../../lib/api/response";
import { RateLimiter } from "../../../../../../../lib/rate-limit";
import {
  PROFILE_IMAGE_MAX_BYTES,
  deleteProfileImage,
  detectProfileImageMime,
  getProfileImagePath,
  uploadProfileImage,
} from "../../../../../../../lib/profile-image-storage";
import { CreatorPortfolioService } from "../../../../../../../modules/creator/portfolio-service";

type Context = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Context) {
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
  if (!RateLimiter.isAllowed(`portfolio-image:${user.id}`, 24, 60 * 60 * 1000)) {
    return errorResponse("TOO_MANY_REQUESTS", "محاولات رفع كثيرة، حاول لاحقاً.", 429, {
      requestId,
    });
  }

  const { id } = await params;
  const item = await CreatorPortfolioService.findOwnedItem(user.id, id);
  if (!item) {
    return errorResponse("PORTFOLIO_ITEM_NOT_FOUND", "العمل غير موجود.", 404, {
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
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return errorResponse("INVALID_UPLOAD", "ملف الصورة مطلوب.", 400, { requestId });
  }
  if (file.size > PROFILE_IMAGE_MAX_BYTES) {
    return errorResponse(
      "IMAGE_TOO_LARGE",
      "حجم الصورة يجب ألا يتجاوز 5 ميغابايت.",
      400,
      {
        requestId,
      },
    );
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const mime = detectProfileImageMime(bytes);
  if (!mime) {
    return errorResponse("UNSUPPORTED_IMAGE", "استخدم صورة JPG أو PNG أو WebP.", 400, {
      requestId,
    });
  }

  try {
    const uploaded = await uploadProfileImage({
      userId: user.id,
      kind: `portfolio-${item.id}`,
      bytes,
      mime,
    });
    try {
      await CreatorPortfolioService.updateThumbnailForUser(
        user.id,
        item.id,
        uploaded.publicUrl,
      );
    } catch (error) {
      await deleteProfileImage(uploaded.path);
      throw error;
    }

    const previousPath = getProfileImagePath(item.thumbnailUrl);
    if (previousPath) await deleteProfileImage(previousPath).catch(() => undefined);
    return NextResponse.json({ data: { url: uploaded.publicUrl } }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "PROFILE_STORAGE_NOT_CONFIGURED") {
      return errorResponse(
        "PROFILE_STORAGE_NOT_CONFIGURED",
        "تخزين الصور غير مفعّل على السيرفر حالياً.",
        503,
        { requestId },
      );
    }
    return errorResponse("PORTFOLIO_IMAGE_UPLOAD_FAILED", "فشل رفع صورة العمل.", 500, {
      requestId,
    });
  }
}
