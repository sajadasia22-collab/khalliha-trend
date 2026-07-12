import { NextResponse } from "next/server";
import { z } from "zod";
import { errorResponse, newRequestId } from "../../../../../lib/api/response";
import { getCurrentUser } from "../../../../../lib/auth/session";
import { FinancialService } from "../../../../../modules/financial/service";
import { prisma } from "../../../../../lib/prisma";
import { Currency } from "../../../../../generated/prisma/enums";

const createPayoutSchema = z.object({
  amount: z.number().int().positive("قيمة السحب يجب أن تكون أكبر من الصفر"),
  currency: z.nativeEnum(Currency, {
    message: "العملة غير مدعومة",
  }),
  payoutMethod: z.string().min(1, "وسيلة السحب مطلوبة"),
  recipientDetails: z.string().min(1, "تفاصيل المستلم مطلوبة"),
});

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

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

  try {
    const body = await request.json();
    const parsed = createPayoutSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse("VALIDATION_ERROR", "المدخلات غير صالحة.", 400, {
        requestId,
        details: parsed.error.flatten().fieldErrors,
      });
    }

    const { amount, currency, payoutMethod, recipientDetails } = parsed.data;

    const payout = await FinancialService.requestPayout(
      user.id,
      BigInt(amount),
      currency,
      payoutMethod,
      recipientDetails,
    );

    return NextResponse.json({
      data: {
        id: payout.id,
        amount: payout.amount.toString(),
        currency: payout.currency,
        status: payout.status,
        payoutMethod: payout.payoutMethod,
        recipientDetails: payout.recipientDetails,
        createdAt: payout.createdAt.toISOString(),
      },
    });
  } catch (error: unknown) {
    return errorResponse(
      "BAD_REQUEST",
      errorMessage(error, "فشل إنشاء طلب السحب."),
      400,
      { requestId },
    );
  }
}

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

  try {
    const payouts = await prisma.payoutRequest.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      data: payouts.map((item) => ({
        id: item.id,
        amount: item.amount.toString(),
        currency: item.currency,
        status: item.status,
        payoutMethod: item.payoutMethod,
        recipientDetails: item.recipientDetails,
        referenceNumber: item.referenceNumber,
        createdAt: item.createdAt.toISOString(),
      })),
    });
  } catch {
    return errorResponse("INTERNAL_ERROR", "فشل جلب سجل السحوبات.", 500, { requestId });
  }
}
