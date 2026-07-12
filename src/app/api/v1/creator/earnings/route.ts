import { NextResponse } from "next/server";
import { errorResponse, newRequestId } from "../../../../../lib/api/response";
import { getCurrentUser } from "../../../../../lib/auth/session";
import { EarningsService } from "../../../../../modules/earnings/service";

export async function GET() {
  const requestId = newRequestId();

  try {
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

    const summary = await EarningsService.getCreatorEarningsSummary(user.id);
    return NextResponse.json({
      data: summary,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "فشل جلب إحصائيات الأرباح.";
    return errorResponse("INTERNAL_ERROR", message, 500, {
      requestId,
    });
  }
}
