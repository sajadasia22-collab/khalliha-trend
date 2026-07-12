import { prisma } from "../../lib/prisma";
import type { PrismaClient } from "../../generated/prisma/client";
import { Currency, LedgerDirection } from "../../generated/prisma/enums";

type LedgerTxClient = Pick<
  PrismaClient,
  "financialAccount" | "ledgerEntry" | "ledgerTransaction" | "wallet" | "$queryRaw"
>;

export type LedgerEntryInput = {
  accountId: string;
  direction: LedgerDirection;
  amount: bigint;
};

export type LedgerTransactionInput = {
  idempotencyKey: string;
  type: string;
  currency: Currency;
  description?: string;
  entries: LedgerEntryInput[];
};

export class LedgerEngine {
  static systemCashAccountName(currency: Currency) {
    return `حساب أصول المنصة الكلي (${currency})`;
  }

  static pendingPayoutAccountName(currency: Currency) {
    return `حساب السحوبات المعلقة (${currency})`;
  }

  static platformRevenueAccountName(currency: Currency) {
    return `حساب إيرادات المنصة (${currency})`;
  }

  static campaignBudgetAccountName(campaignId: string, currency: Currency) {
    return `ميزانية حملة محجوزة - ${campaignId} (${currency})`;
  }

  static async getOrCreateFinancialAccount(
    tx: LedgerTxClient,
    name: string,
    currency: Currency,
  ) {
    const existing = await tx.financialAccount.findFirst({ where: { name, currency } });
    if (existing) {
      return existing;
    }

    return tx.financialAccount.create({
      data: { name, currency },
    });
  }

  /**
   * Generates a new wallet and its underlying FinancialAccount for a user if they do not already exist.
   */
  static async createWalletIfNotExist(
    userId: string,
    currency: Currency,
    tx?: LedgerTxClient,
  ) {
    const client = tx ?? prisma;
    const existingWallet = await client.wallet.findUnique({
      where: {
        userId_currency: { userId, currency },
      },
      include: { financialAccount: true },
    });

    if (existingWallet) {
      return existingWallet;
    }

    const createWallet = async (transaction: LedgerTxClient) => {
      // Re-verify inside transaction to avoid race conditions
      const doubleCheck = await transaction.wallet.findUnique({
        where: {
          userId_currency: { userId, currency },
        },
        include: { financialAccount: true },
      });
      if (doubleCheck) return doubleCheck;

      // 1. Create the logical financial account
      const financialAccount = await transaction.financialAccount.create({
        data: {
          name: `محفظة المستخدم - ${userId} (${currency})`,
          currency,
        },
      });

      // 2. Create the wallet mapping
      const wallet = await transaction.wallet.create({
        data: {
          userId,
          financialAccountId: financialAccount.id,
          currency,
        },
        include: { financialAccount: true },
      });

      return wallet;
    };

    if (tx) {
      return createWallet(tx);
    }

    return prisma.$transaction(createWallet);
  }

  /**
   * Records a balanced ledger transaction with multiple credit/debit entries.
   * Enforces the fundamental accounting equation: sum(credits) == sum(debits).
   * Ensures idempotency to prevent duplicated financial transactions.
   */
  static async recordTransaction(
    tx: LedgerTxClient,
    { idempotencyKey, type, currency, description, entries }: LedgerTransactionInput,
  ) {
    // 1. Check idempotency key to avoid double post
    const existingTx = await tx.ledgerTransaction.findUnique({
      where: { idempotencyKey },
      include: { entries: true },
    });

    if (existingTx) {
      return existingTx;
    }

    // 2. Validate entries count
    if (entries.length < 2) {
      throw new Error("يجب أن تحتوي المعاملة المالية على قيدين (مدين ودائن) على الأقل");
    }

    // 3. Verify math balance: sum(debits) == sum(credits)
    let sumDebits = 0n;
    let sumCredits = 0n;

    for (const entry of entries) {
      if (entry.amount <= 0n) {
        throw new Error("قيمة القيد المالي يجب أن تكون أكبر من الصفر");
      }
      if (entry.direction === LedgerDirection.DEBIT) {
        sumDebits += entry.amount;
      } else if (entry.direction === LedgerDirection.CREDIT) {
        sumCredits += entry.amount;
      }
    }

    if (sumDebits !== sumCredits) {
      throw new Error(
        `مبالغ الدائن والمدين غير متوازنة لهذه المعاملة. مدين: ${sumDebits.toString()}، دائن: ${sumCredits.toString()}`,
      );
    }

    // 4. Record Ledger Transaction and Entries
    const ledgerTx = await tx.ledgerTransaction.create({
      data: {
        idempotencyKey,
        type,
        currency,
        status: "POSTED",
        description,
      },
    });

    for (const entry of entries) {
      await tx.ledgerEntry.create({
        data: {
          transactionId: ledgerTx.id,
          accountId: entry.accountId,
          direction: entry.direction,
          amount: entry.amount,
        },
      });
    }

    return ledgerTx;
  }

  /**
   * Acquires a Postgres row lock on the FinancialAccount, serializing any other
   * transaction that also locks this same account. Must be called inside the
   * same transaction as a balance check + entry creation that follows it —
   * without this, two concurrent transactions can both read the same balance
   * before either commits (a classic TOCTOU race), letting both spend past it.
   */
  static async lockFinancialAccount(
    tx: LedgerTxClient,
    financialAccountId: string,
  ): Promise<void> {
    await tx.$queryRaw`SELECT id FROM "FinancialAccount" WHERE id = ${financialAccountId} FOR UPDATE`;
  }

  /**
   * Retrieves the net balance of a logical financial account by summing up all credit and debit entries.
   * Net Balance = Credits - Debits.
   */
  static async getAccountBalance(financialAccountId: string): Promise<bigint> {
    return this.getAccountBalanceWithClient(prisma, financialAccountId);
  }

  static async getAccountBalanceWithClient(
    tx: Pick<PrismaClient, "ledgerEntry">,
    financialAccountId: string,
  ): Promise<bigint> {
    const entries = await tx.ledgerEntry.findMany({
      where: { accountId: financialAccountId },
    });

    let sumCredits = 0n;
    let sumDebits = 0n;

    for (const entry of entries) {
      if (entry.direction === LedgerDirection.CREDIT) {
        sumCredits += entry.amount;
      } else {
        sumDebits += entry.amount;
      }
    }

    return sumCredits - sumDebits;
  }
}
