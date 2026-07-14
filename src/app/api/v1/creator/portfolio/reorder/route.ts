import { NextResponse } from "next/server";
import { getCurrentUser } from "../../../../../../lib/auth/session";
import { errorResponse, newRequestId } from "../../../../../../lib/api/response";
import { CreatorPortfolioService } from "../../../../../../modules/creator/portfolio-service";
import { reorderPortfolioSchema } from "../../../../../../modules/creator/portfolio-schemas";

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

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    body = null;
  }
  const parsed = reorderPortfolioSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse("VALIDATION_ERROR", "ترتيب الأعمال غير صالح.", 400, {
      requestId,
    });
  }

  try {
    await CreatorPortfolioService.reorderForUser(user.id, parsed.data.itemIds);
    return NextResponse.json({ data: { itemIds: parsed.data.itemIds } });
  } catch {
    return errorResponse("PORTFOLIO_ITEM_NOT_FOUND", "أحد الأعمال غير موجود.", 404, {
      requestId,
    });
  }
}
