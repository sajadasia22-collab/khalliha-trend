import { NextResponse } from "next/server";
import { z } from "zod";
import { errorResponse, newRequestId } from "../../../../../lib/api/response";
import { getCurrentUser } from "../../../../../lib/auth/session";
import { FinancialService } from "../../../../../modules/financial/service";
import { prisma } from "../../../../../lib/prisma";
import { Currency } from "../../../../../generated/prisma/enums";

const createDepositSchema = z.object({
  amount: z.number().int().positive("قيمة الإيداع يجب أن تكون أكبر من الصفر"),
  currency: z.nativeEnum(Currency, {
    message: "العملة غير مدعومة",
  }),
  referenceNumber: z.string().max(100).optional(),
  note: z.string().max(500).optional(),
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

  if (user.role !== "BRAND") {
    return errorResponse("FORBIDDEN", "هذا الإجراء متاح فقط للتجار والشركات.", 403, {
      requestId,
    });
  }

  try {
    const body = await request.json();
    const parsed = createDepositSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse("VALIDATION_ERROR", "المدخلات غير صالحة.", 400, {
        requestId,
        details: parsed.error.flatten().fieldErrors,
      });
    }

    const { amount, currency, referenceNumber, note } = parsed.data;

    const deposit = await FinancialService.requestDeposit(
      user.id,
      BigInt(amount),
      currency,
      referenceNumber,
      note,
    );

    return NextResponse.json({
      data: {
        id: deposit.id,
        amount: deposit.amount.toString(),
        currency: deposit.currency,
        status: deposit.status,
        referenceNumber: deposit.referenceNumber,
        note: deposit.note,
        createdAt: deposit.createdAt.toISOString(),
      },
    });
  } catch (error: unknown) {
    return errorResponse(
      "BAD_REQUEST",
      errorMessage(error, "فشل إنشاء طلب الإيداع."),
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

  if (user.role !== "BRAND") {
    return errorResponse("FORBIDDEN", "هذا الإجراء متاح فقط للتجار والشركات.", 403, {
      requestId,
    });
  }

  try {
    const deposits = await prisma.deposit.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      data: deposits.map((item) => ({
        id: item.id,
        amount: item.amount.toString(),
        currency: item.currency,
        status: item.status,
        referenceNumber: item.referenceNumber,
        note: item.note,
        createdAt: item.createdAt.toISOString(),
      })),
    });
  } catch {
    return errorResponse("INTERNAL_ERROR", "فشل جلب سجل الإيداعات.", 500, { requestId });
  }
}
