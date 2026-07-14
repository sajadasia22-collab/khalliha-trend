import { NextResponse } from "next/server";
import { getCurrentUser } from "../../../../../lib/auth/session";
import { errorResponse, newRequestId } from "../../../../../lib/api/response";
import { CreatorPortfolioService } from "../../../../../modules/creator/portfolio-service";
import { createPortfolioItemSchema } from "../../../../../modules/creator/portfolio-schemas";

async function requireCreator(requestId: string) {
  const user = await getCurrentUser();
  if (!user) {
    return {
      response: errorResponse("UNAUTHENTICATED", "الرجاء تسجيل الدخول أولاً.", 401, {
        requestId,
      }),
    } as const;
  }
  if (user.role !== "CREATOR") {
    return {
      response: errorResponse("FORBIDDEN", "هذا الإجراء متاح فقط لصناع المحتوى.", 403, {
        requestId,
      }),
    } as const;
  }
  return { user } as const;
}

export async function GET() {
  const requestId = newRequestId();
  const auth = await requireCreator(requestId);
  if ("response" in auth) return auth.response;
  const items = await CreatorPortfolioService.listForUser(auth.user.id);
  return NextResponse.json({ data: items });
}

export async function POST(request: Request) {
  const requestId = newRequestId();
  const auth = await requireCreator(requestId);
  if ("response" in auth) return auth.response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse("VALIDATION_ERROR", "المدخلات غير صالحة.", 400, {
      requestId,
    });
  }

  const parsed = createPortfolioItemSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse("VALIDATION_ERROR", "المدخلات غير صالحة.", 400, {
      requestId,
      details: parsed.error.flatten().fieldErrors,
    });
  }

  try {
    const item = await CreatorPortfolioService.createForUser(auth.user.id, parsed.data);
    return NextResponse.json({ data: item }, { status: 201 });
  } catch (error) {
    const code = error instanceof Error ? error.message : "PORTFOLIO_CREATE_FAILED";
    if (code === "PORTFOLIO_LIMIT_REACHED") {
      return errorResponse(code, "وصلت إلى الحد الأقصى: 12 عملاً.", 409, { requestId });
    }
    if (code === "PORTFOLIO_URL_EXISTS") {
      return errorResponse(code, "هذا الرابط موجود بالفعل في معرضك.", 409, { requestId });
    }
    return errorResponse("PORTFOLIO_CREATE_FAILED", "فشل إضافة العمل.", 400, {
      requestId,
    });
  }
}
