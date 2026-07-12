import { NextResponse } from "next/server";
import { Currency, LedgerDirection } from "../../../../generated/prisma/enums";
import { errorResponse, newRequestId } from "../../../../lib/api/response";
import { getCurrentUser } from "../../../../lib/auth/session";
import { prisma } from "../../../../lib/prisma";
import { LedgerEngine } from "../../../../modules/financial/ledger";

function signedAmount(direction: LedgerDirection, amount: bigint) {
  return direction === LedgerDirection.CREDIT ? amount : -amount;
}

export async function GET() {
  const requestId = newRequestId();
  const user = await getCurrentUser();

  if (!user) {
    return errorResponse("UNAUTHENTICATED", "الرجاء تسجيل الدخول أولاً.", 401, {
      requestId,
    });
  }

  try {
    const wallets = await Promise.all(
      [Currency.IQD, Currency.USD].map((currency) =>
        LedgerEngine.createWalletIfNotExist(user.id, currency),
      ),
    );

    const data = await Promise.all(
      wallets.map(async (wallet) => {
        const balance = await LedgerEngine.getAccountBalance(wallet.financialAccountId);
        const entries = await prisma.ledgerEntry.findMany({
          where: { accountId: wallet.financialAccountId },
          include: { transaction: true },
          orderBy: { createdAt: "desc" },
          take: 50,
        });

        return {
          currency: wallet.currency,
          balance: balance.toString(),
          transactions: entries.map((entry) => ({
            id: entry.id,
            transactionId: entry.transactionId,
            type: entry.transaction.type,
            description: entry.transaction.description,
            direction: entry.direction,
            amount: entry.amount.toString(),
            signedAmount: signedAmount(entry.direction, entry.amount).toString(),
            createdAt: entry.createdAt.toISOString(),
          })),
        };
      }),
    );

    return NextResponse.json({ data });
  } catch {
    return errorResponse("INTERNAL_ERROR", "فشل جلب بيانات المحفظة.", 500, {
      requestId,
    });
  }
}
