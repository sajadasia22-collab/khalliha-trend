import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "../../lib/prisma";
import { Currency, LedgerDirection, UserRole } from "../../generated/prisma/enums";
import { LedgerEngine } from "./ledger";
import { FinancialService } from "./service";

// Real financial concurrency tests. Unlike service.test.ts (which mocks prisma
// and can't model actual Postgres transaction/locking behavior), these run
// against a live database to prove concurrent requests can't overspend a
// balance — the exact scenario the mocked unit tests are structurally unable
// to catch. Skipped automatically when no local DATABASE_URL is configured.
describe.skipIf(!process.env.DATABASE_URL)(
  "Financial concurrency (real database)",
  () => {
    const userId = `concurrency-test-creator-${Date.now()}`;
    const startingBalance = 100_000n;
    let financialAccountId: string;

    beforeAll(async () => {
      await prisma.user.create({
        data: {
          id: userId,
          fullName: "اختبار السباق المالي",
          role: UserRole.CREATOR,
        },
      });

      const wallet = await LedgerEngine.createWalletIfNotExist(userId, Currency.IQD);
      financialAccountId = wallet.financialAccountId;

      const systemAccount = await prisma.financialAccount.create({
        data: {
          name: `حساب اختبار سباق - ${userId}`,
          currency: Currency.IQD,
        },
      });

      await prisma.$transaction((tx) =>
        LedgerEngine.recordTransaction(tx, {
          idempotencyKey: `concurrency-test-fund-${userId}`,
          type: "TEST_FUNDING",
          currency: Currency.IQD,
          description: "تمويل اختباري لاختبار السباق المالي",
          entries: [
            {
              accountId: systemAccount.id,
              direction: LedgerDirection.DEBIT,
              amount: startingBalance,
            },
            {
              accountId: financialAccountId,
              direction: LedgerDirection.CREDIT,
              amount: startingBalance,
            },
          ],
        }),
      );
    });

    afterAll(async () => {
      const accounts = await prisma.financialAccount.findMany({
        where: { name: { contains: userId } },
        select: { id: true },
      });
      const accountIds = [financialAccountId, ...accounts.map((a) => a.id)];

      await prisma.ledgerEntry.deleteMany({ where: { accountId: { in: accountIds } } });
      await prisma.ledgerTransaction.deleteMany({
        where: { idempotencyKey: { contains: userId } },
      });
      await prisma.payoutRequest.deleteMany({ where: { userId } });
      await prisma.wallet.deleteMany({ where: { userId } });
      await prisma.financialAccount.deleteMany({ where: { id: { in: accountIds } } });
      await prisma.user.delete({ where: { id: userId } });
    });

    it("never lets two concurrent payout requests jointly overspend the wallet balance", async () => {
      // Balance is 100,000. Two simultaneous requests for 60,000 each (120,000
      // total) must not both succeed — exactly one should be accepted.
      const [first, second] = await Promise.allSettled([
        FinancialService.requestPayout(
          userId,
          60_000n,
          Currency.IQD,
          "ZainCash",
          "0770000001",
        ),
        FinancialService.requestPayout(
          userId,
          60_000n,
          Currency.IQD,
          "ZainCash",
          "0770000002",
        ),
      ]);

      const outcomes = [first, second];
      const fulfilled = outcomes.filter((o) => o.status === "fulfilled");
      const rejected = outcomes.filter((o) => o.status === "rejected");

      expect(fulfilled).toHaveLength(1);
      expect(rejected).toHaveLength(1);
      expect((rejected[0] as PromiseRejectedResult).reason.message).toContain(
        "الرصيد المتاح في المحفظة غير كافٍ",
      );

      const finalBalance = await LedgerEngine.getAccountBalance(financialAccountId);
      // Exactly one 60,000 reservation must have been debited — never both, never zero.
      expect(finalBalance).toBe(startingBalance - 60_000n);
    });
  },
);
