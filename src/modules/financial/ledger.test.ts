import { describe, expect, it, vi, beforeEach } from "vitest";
import { Currency, LedgerDirection } from "../../generated/prisma/enums";

vi.mock("../../lib/prisma", () => {
  const mockPrisma = {
    wallet: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    financialAccount: {
      create: vi.fn(),
    },
    ledgerTransaction: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    ledgerEntry: {
      create: vi.fn(),
      findMany: vi.fn(),
    },
    $transaction: vi.fn((cb) => cb(mockPrisma)),
  };
  return { prisma: mockPrisma };
});

import { prisma } from "../../lib/prisma";
import { LedgerEngine } from "./ledger";

describe("LedgerEngine", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createWalletIfNotExist", () => {
    it("should return existing wallet if it exists", async () => {
      const mockWallet = { id: "wallet-1", userId: "user-1", currency: Currency.IQD };
      vi.mocked(prisma.wallet.findUnique).mockResolvedValue(mockWallet as any);

      const result = await LedgerEngine.createWalletIfNotExist("user-1", Currency.IQD);
      expect(result).toEqual(mockWallet);
      expect(prisma.wallet.create).not.toHaveBeenCalled();
    });

    it("should create new wallet and financial account if none exist", async () => {
      vi.mocked(prisma.wallet.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.financialAccount.create).mockResolvedValue({ id: "acc-1" } as any);
      vi.mocked(prisma.wallet.create).mockResolvedValue({
        id: "wallet-2",
        userId: "user-1",
        financialAccountId: "acc-1",
      } as any);

      const result = await LedgerEngine.createWalletIfNotExist("user-1", Currency.IQD);
      expect(result.id).toBe("wallet-2");
      expect(prisma.financialAccount.create).toHaveBeenCalled();
      expect(prisma.wallet.create).toHaveBeenCalled();
    });
  });

  describe("recordTransaction", () => {
    const mockTx = prisma;

    it("should skip and return existing transaction if idempotencyKey is matched", async () => {
      const mockTxRecord = { id: "tx-1", idempotencyKey: "key-1" };
      vi.mocked(prisma.ledgerTransaction.findUnique).mockResolvedValue(
        mockTxRecord as any,
      );

      const result = await LedgerEngine.recordTransaction(mockTx, {
        idempotencyKey: "key-1",
        type: "DEPOSIT",
        currency: Currency.IQD,
        entries: [],
      });

      expect(result).toEqual(mockTxRecord);
      expect(prisma.ledgerTransaction.create).not.toHaveBeenCalled();
    });

    it("should throw error if entries are less than 2", async () => {
      vi.mocked(prisma.ledgerTransaction.findUnique).mockResolvedValue(null);

      await expect(
        LedgerEngine.recordTransaction(mockTx, {
          idempotencyKey: "key-2",
          type: "DEPOSIT",
          currency: Currency.IQD,
          entries: [
            { accountId: "acc-1", direction: LedgerDirection.CREDIT, amount: 1000n },
          ],
        }),
      ).rejects.toThrow("يجب أن تحتوي المعاملة المالية على قيدين");
    });

    it("should throw error if entries are unbalanced", async () => {
      vi.mocked(prisma.ledgerTransaction.findUnique).mockResolvedValue(null);

      await expect(
        LedgerEngine.recordTransaction(mockTx, {
          idempotencyKey: "key-3",
          type: "DEPOSIT",
          currency: Currency.IQD,
          entries: [
            { accountId: "acc-1", direction: LedgerDirection.DEBIT, amount: 1000n },
            { accountId: "acc-2", direction: LedgerDirection.CREDIT, amount: 800n },
          ],
        }),
      ).rejects.toThrow("مبالغ الدائن والمدين غير متوازنة");
    });

    it("should record balanced transaction successfully", async () => {
      vi.mocked(prisma.ledgerTransaction.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.ledgerTransaction.create).mockResolvedValue({
        id: "tx-rec-1",
      } as any);

      const result = await LedgerEngine.recordTransaction(mockTx, {
        idempotencyKey: "key-4",
        type: "DEPOSIT",
        currency: Currency.IQD,
        entries: [
          { accountId: "acc-1", direction: LedgerDirection.DEBIT, amount: 1000n },
          { accountId: "acc-2", direction: LedgerDirection.CREDIT, amount: 1000n },
        ],
      });

      expect(result.id).toBe("tx-rec-1");
      expect(prisma.ledgerTransaction.create).toHaveBeenCalled();
      expect(prisma.ledgerEntry.create).toHaveBeenCalledTimes(2);
    });
  });

  describe("getAccountBalance", () => {
    it("should sum credit entries minus debit entries", async () => {
      vi.mocked(prisma.ledgerEntry.findMany).mockResolvedValue([
        { direction: LedgerDirection.CREDIT, amount: 5000n },
        { direction: LedgerDirection.DEBIT, amount: 2000n },
        { direction: LedgerDirection.CREDIT, amount: 1500n },
      ] as any);

      const balance = await LedgerEngine.getAccountBalance("acc-1");
      // (5000 + 1500) - 2000 = 4500
      expect(balance).toBe(4500n);
    });
  });
});
