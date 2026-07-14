import { NextResponse } from "next/server";
import { getCurrentUser } from "../../../../../../lib/auth/session";
import { errorResponse, newRequestId } from "../../../../../../lib/api/response";
import {
  deleteProfileImage,
  getProfileImagePath,
} from "../../../../../../lib/profile-image-storage";
import { CreatorPortfolioService } from "../../../../../../modules/creator/portfolio-service";
import { updatePortfolioItemSchema } from "../../../../../../modules/creator/portfolio-schemas";

type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Context) {
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

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    body = null;
  }
  const parsed = updatePortfolioItemSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse("VALIDATION_ERROR", "المدخلات غير صالحة.", 400, {
      requestId,
      details: parsed.error.flatten().fieldErrors,
    });
  }

  const { id } = await params;
  try {
    const item = await CreatorPortfolioService.updateForUser(user.id, id, parsed.data);
    return NextResponse.json({ data: item });
  } catch (error) {
    if (error instanceof Error && error.message === "PORTFOLIO_ITEM_NOT_FOUND") {
      return errorResponse("PORTFOLIO_ITEM_NOT_FOUND", "العمل غير موجود.", 404, {
        requestId,
      });
    }
    return errorResponse("PORTFOLIO_UPDATE_FAILED", "فشل تحديث العمل.", 500, {
      requestId,
    });
  }
}

export async function DELETE(_request: Request, { params }: Context) {
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

  const { id } = await params;
  try {
    const item = await CreatorPortfolioService.deleteForUser(user.id, id);
    const imagePath = getProfileImagePath(item.thumbnailUrl);
    if (imagePath) await deleteProfileImage(imagePath).catch(() => undefined);
    return NextResponse.json({ data: { id: item.id } });
  } catch (error) {
    if (error instanceof Error && error.message === "PORTFOLIO_ITEM_NOT_FOUND") {
      return errorResponse("PORTFOLIO_ITEM_NOT_FOUND", "العمل غير موجود.", 404, {
        requestId,
      });
    }
    return errorResponse("PORTFOLIO_DELETE_FAILED", "فشل حذف العمل.", 500, {
      requestId,
    });
  }
}
