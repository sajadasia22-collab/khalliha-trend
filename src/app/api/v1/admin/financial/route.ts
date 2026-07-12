import { NextResponse } from "next/server";
import { z } from "zod";
import { errorResponse, newRequestId } from "../../../../../lib/api/response";
import { getCurrentUser } from "../../../../../lib/auth/session";
import { FinancialService } from "../../../../../modules/financial/service";
import { prisma } from "../../../../../lib/prisma";

const reviewSchema = z.object({
  type: z.enum(["DEPOSIT", "PAYOUT", "RELEASE_EARNINGS"], {
    message: "نوع الطلب غير صالح",
  }),
  id: z.string().min(1, "معرّف الطلب مطلوب").optional(),
  decision: z
    .enum(["APPROVE", "REJECT"], {
      message: "القرار يجب أن يكون اعتماد أو رفض",
    })
    .optional(),
  referenceNumber: z.string().max(100).optional(),
  note: z.string().max(500).optional(),
});

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export async function GET() {
  const requestId = newRequestId();
  const user = await getCurrentUser();

  if (!user) {
    return errorResponse("UNAUTHENTICATED", "الرجاء تسجيل الدخول أولاً.", 401, {
      requestId,
    });
  }

  if (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN") {
    return errorResponse("FORBIDDEN", "هذا الإجراء متاح فقط لمسؤولي النظام.", 403, {
      requestId,
    });
  }

  try {
    const [pendingDeposits, pendingPayouts] = await Promise.all([
      prisma.deposit.findMany({
        where: { status: "PENDING" },
        include: { user: { select: { fullName: true, email: true } } },
        orderBy: { createdAt: "asc" },
      }),
      prisma.payoutRequest.findMany({
        where: { status: "PENDING" },
        include: { user: { select: { fullName: true, email: true } } },
        orderBy: { createdAt: "asc" },
      }),
    ]);

    return NextResponse.json({
      data: {
        deposits: pendingDeposits.map((item) => ({
          id: item.id,
          amount: item.amount.toString(),
          currency: item.currency,
          status: item.status,
          referenceNumber: item.referenceNumber,
          note: item.note,
          createdAt: item.createdAt.toISOString(),
          user: item.user,
        })),
        payouts: pendingPayouts.map((item) => ({
          id: item.id,
          amount: item.amount.toString(),
          currency: item.currency,
          status: item.status,
          payoutMethod: item.payoutMethod,
          recipientDetails: item.recipientDetails,
          note: item.note,
          createdAt: item.createdAt.toISOString(),
          user: item.user,
        })),
      },
    });
  } catch {
    return errorResponse("INTERNAL_ERROR", "فشل جلب المعاملات المالية المعلقة.", 500, {
      requestId,
    });
  }
}

export async function POST(request: Request) {
  const requestId = newRequestId();
  const user = await getCurrentUser();

  if (!user) {
    return errorResponse("UNAUTHENTICATED", "الرجاء تسجيل الدخول أولاً.", 401, {
      requestId,
    });
  }

  if (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN") {
    return errorResponse("FORBIDDEN", "هذا الإجراء متاح فقط لمسؤولي النظام.", 403, {
      requestId,
    });
  }

  try {
    const body = await request.json();
    const parsed = reviewSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse("VALIDATION_ERROR", "المدخلات غير صالحة.", 400, {
        requestId,
        details: parsed.error.flatten().fieldErrors,
      });
    }

    const { type, id, decision, referenceNumber, note } = parsed.data;

    if (type === "DEPOSIT") {
      if (!id || !decision) {
        return errorResponse("VALIDATION_ERROR", "معرّف الطلب والقرار مطلوبان.", 400, {
          requestId,
        });
      }
      if (decision === "APPROVE") {
        await FinancialService.approveDeposit(user.id, id);
      } else {
        await FinancialService.rejectDeposit(user.id, id, note);
      }
    } else if (type === "PAYOUT") {
      if (!id || !decision) {
        return errorResponse("VALIDATION_ERROR", "معرّف الطلب والقرار مطلوبان.", 400, {
          requestId,
        });
      }
      if (decision === "APPROVE") {
        await FinancialService.approvePayout(user.id, id, referenceNumber);
      } else {
        await FinancialService.rejectPayout(user.id, id, note);
      }
    } else {
      const result = await FinancialService.releaseAvailableEarnings();
      return NextResponse.json({
        data: {
          success: true,
          releasedCount: result.releasedCount,
          releasedIds: result.releasedIds,
          message: "تم تحرير الأرباح المستحقة إلى محافظ صناع المحتوى.",
        },
      });
    }

    return NextResponse.json({
      data: {
        success: true,
        message: "تم معالجة العملية واعتمادها بنجاح.",
      },
    });
  } catch (error: unknown) {
    return errorResponse(
      "BAD_REQUEST",
      errorMessage(error, "فشل معالجة الطلب المالي."),
      400,
      { requestId },
    );
  }
}
