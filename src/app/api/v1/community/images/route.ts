import { NextResponse } from "next/server";
import { errorResponse, newRequestId } from "../../../../../lib/api/response";
import { getCurrentUser } from "../../../../../lib/auth/session";
import {
  PROFILE_IMAGE_MAX_BYTES,
  detectProfileImageMime,
  uploadProfileImage,
} from "../../../../../lib/profile-image-storage";
import { RateLimiter } from "../../../../../lib/rate-limit";

export async function POST(request: Request) {
  const requestId = newRequestId();
  const user = await getCurrentUser();
  if (!user)
    return errorResponse("UNAUTHENTICATED", "الرجاء تسجيل الدخول أولاً.", 401, {
      requestId,
    });
  if (user.role !== "CREATOR") {
    return errorResponse("FORBIDDEN", "رفع صور المجتمع متاح لصناع المحتوى.", 403, {
      requestId,
    });
  }
  if (!RateLimiter.isAllowed(`community-image:${user.id}`, 20, 60 * 60 * 1000)) {
    return errorResponse("TOO_MANY_REQUESTS", "محاولات رفع كثيرة، حاول لاحقاً.", 429, {
      requestId,
    });
  }
  const formData = await request.formData().catch(() => null);
  const file = formData?.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return errorResponse("INVALID_UPLOAD", "اختر صورة صالحة.", 400, { requestId });
  }
  if (file.size > PROFILE_IMAGE_MAX_BYTES) {
    return errorResponse("IMAGE_TOO_LARGE", "حجم الصورة يجب ألا يتجاوز 5MB.", 400, {
      requestId,
    });
  }
  const bytes = new Uint8Array(await file.arrayBuffer());
  const mime = detectProfileImageMime(bytes);
  if (!mime) {
    return errorResponse("UNSUPPORTED_IMAGE", "استخدم JPG أو PNG أو WebP.", 400, {
      requestId,
    });
  }
  try {
    const uploaded = await uploadProfileImage({
      userId: user.id,
      kind: `community-${crypto.randomUUID()}`,
      bytes,
      mime,
    });
    return NextResponse.json({ data: { url: uploaded.publicUrl } }, { status: 201 });
  } catch (error) {
    const code =
      error instanceof Error && error.message === "PROFILE_STORAGE_NOT_CONFIGURED"
        ? "PROFILE_STORAGE_NOT_CONFIGURED"
        : "COMMUNITY_IMAGE_UPLOAD_FAILED";
    return errorResponse(
      code,
      "تعذّر رفع صورة المنشور.",
      code.includes("CONFIGURED") ? 503 : 500,
      {
        requestId,
      },
    );
  }
}
