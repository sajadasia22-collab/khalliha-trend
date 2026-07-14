import { NextResponse } from "next/server";
import { errorResponse, newRequestId } from "../../../../../lib/api/response";
import { requireApiUser } from "../../../../../lib/auth/api-user";
import { BrandProfileService } from "../../../../../modules/brand/service";
import { updateBrandProfileSchema } from "../../../../../modules/brand/schemas";

export async function GET() {
  const requestId = newRequestId();
  const auth = await requireApiUser(requestId);
  if (!auth.ok) return auth.response;

  const brand = await BrandProfileService.getForUser(auth.user.id);
  if (!brand) {
    return errorResponse("PROFILE_NOT_FOUND", "لا يوجد حساب علامة تجارية.", 404, {
      requestId,
    });
  }

  return NextResponse.json({ data: brand });
}

export async function PATCH(request: Request) {
  const requestId = newRequestId();
  const auth = await requireApiUser(requestId);
  if (!auth.ok) return auth.response;

  const body = await request.json().catch(() => null);
  const parsed = updateBrandProfileSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse("VALIDATION_ERROR", "المدخلات غير صالحة", 400, {
      requestId,
      details: parsed.error.flatten().fieldErrors,
    });
  }

  try {
    const brand = await BrandProfileService.updateForUser(auth.user.id, parsed.data);
    return NextResponse.json({ data: brand });
  } catch (error) {
    const message = error instanceof Error ? error.message : "فشل تحديث الملف الشخصي.";
    return errorResponse("PROFILE_UPDATE_FAILED", message, 400, { requestId });
  }
}
