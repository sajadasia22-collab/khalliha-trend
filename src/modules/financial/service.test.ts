import { describe, expect, it, vi, beforeEach } from "vitest";
import {
  Currency,
  DepositStatus,
  PayoutStatus,
  LedgerDirection,
} from "../../generated/prisma/enums";

vi.mock("../../lib/prisma", () => {
  const mockPrisma = {
    deposit: {
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    payoutRequest: {
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    campaign: {
      findUnique: vi.fn(),
    },
    earningAccrual: {
      findMany: vi.fn(),
      update: vi.fn(),
    },
    wallet: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    financialAccount: {
      findFirst: vi.fn(),
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
    $queryRaw: vi.fn(),
    $transaction: vi.fn((cb) => cb(mockPrisma)),
  };
  return { prisma: mockPrisma };
});

vi.mock("../notifications/service", () => ({
  NotificationService: {
    notify: vi.fn(),
  },
}));

import { prisma } from "../../lib/prisma";
import { FinancialService } from "./service";

describe("FinancialService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("requestDeposit", () => {
    it("should successfully create a pending deposit record", async () => {
      vi.mocked(prisma.deposit.create).mockResolvedValue({ id: "dep-1" } as any);

      const result = await FinancialService.requestDeposit(
        "brand-user",
        150000n,
        Currency.IQD,
        "ref-123",
        "حوالة زين كاش",
      );

      expect(result).toBeDefined();
      expect(prisma.deposit.create).toHaveBeenCalledWith({
        data: {
          userId: "brand-user",
          amount: 150000n,
          currency: Currency.IQD,
          status: DepositStatus.PENDING,
          referenceNumber: "ref-123",
          note: "حوالة زين كاش",
        },
      });
    });

    it("should fail if deposit amount is non-positive", async () => {
      await expect(
        FinancialService.requestDeposit("brand-user", 0n, Currency.IQD),
      ).rejects.toThrow("قيمة الإيداع يجب أن تكون أكبر من الصفر");
    });
  });

  describe("approveDeposit", () => {
    it("should fail if deposit is not found", async () => {
      vi.mocked(prisma.deposit.findUnique).mockResolvedValue(null);

      await expect(FinancialService.approveDeposit("admin-1", "dep-2")).rejects.toThrow(
        "طلب الإيداع غير موجود",
      );
    });

    it("should successfully record ledger transaction and approve deposit", async () => {
      const mockDeposit = {
        id: "dep-3",
        userId: "brand-user",
        amount: 200000n,
        currency: Currency.IQD,
        status: DepositStatus.PENDING,
      };
      vi.mocked(prisma.deposit.findUnique).mockResolvedValue(mockDeposit as any);

      // Mock Wallet
      vi.mocked(prisma.wallet.findUnique).mockResolvedValue({
        id: "wallet-1",
        financialAccountId: "acc-brand",
      } as any);

      // Mock System Account
      vi.mocked(prisma.financialAccount.findFirst).mockResolvedValue({
        id: "acc-system",
      } as any);

      // Mock transaction recording
      vi.mocked(prisma.ledgerTransaction.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.ledgerTransaction.create).mockResolvedValue({
        id: "ledger-tx-1",
      } as any);
      vi.mocked(prisma.deposit.update).mockResolvedValue({
        id: "dep-3",
        userId: "brand-user",
        amount: 200000n,
        status: DepositStatus.APPROVED,
      } as any);

      const result = await FinancialService.approveDeposit("admin-1", "dep-3");
      expect(result.status).toBe(DepositStatus.APPROVED);

      // Verify that debit/credit are recorded
      expect(prisma.ledgerEntry.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: {
            transactionId: "ledger-tx-1",
            accountId: "acc-system",
            direction: LedgerDirection.DEBIT,
            amount: 200000n,
          },
        }),
      );
      expect(prisma.ledgerEntry.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: {
            transactionId: "ledger-tx-1",
            accountId: "acc-brand",
            direction: LedgerDirection.CREDIT,
            amount: 200000n,
          },
        }),
      );
    });
  });

  describe("requestPayout", () => {
    it("should fail if creator has insufficient balance", async () => {
      // Mock wallet lookups
      vi.mocked(prisma.wallet.findUnique).mockResolvedValue({
        id: "wallet-creator",
        financialAccountId: "acc-creator",
      } as any);

      // Mock empty entries (0 balance)
      vi.mocked(prisma.ledgerEntry.findMany).mockResolvedValue([]);

      await expect(
        FinancialService.requestPayout(
          "creator-1",
          50000n,
          Currency.IQD,
          "ZainCash",
          "07700000000",
        ),
      ).rejects.toThrow("الرصيد المتاح في المحفظة غير كافٍ لإتمام عملية السحب");
    });

    it("should successfully create pending payout request if balance is enough", async () => {
      // Mock wallet lookups
      vi.mocked(prisma.wallet.findUnique).mockResolvedValue({
        id: "wallet-creator",
        financialAccountId: "acc-creator",
      } as any);

      // Mock $1000 balance
      vi.mocked(prisma.ledgerEntry.findMany).mockResolvedValue([
        { direction: LedgerDirection.CREDIT, amount: 150000n },
      ] as any);

      vi.mocked(prisma.financialAccount.findFirst).mockResolvedValue({
        id: "acc-pending-payouts",
      } as any);
      vi.mocked(prisma.ledgerTransaction.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.ledgerTransaction.create).mockResolvedValue({
        id: "ledger-reservation-1",
      } as any);
      vi.mocked(prisma.payoutRequest.create).mockResolvedValue({
        id: "payout-1",
        userId: "creator-1",
        amount: 50000n,
        currency: Currency.IQD,
        status: PayoutStatus.PENDING,
        payoutMethod: "ZainCash",
        recipientDetails: "07700000000",
      } as any);
      vi.mocked(prisma.payoutRequest.update).mockResolvedValue({
        id: "payout-1",
        ledgerTransactionId: "ledger-reservation-1",
      } as any);

      const result = await FinancialService.requestPayout(
        "creator-1",
        50000n,
        Currency.IQD,
        "ZainCash",
        "07700000000",
      );

      expect(result).toBeDefined();
      expect(prisma.payoutRequest.create).toHaveBeenCalledWith({
        data: {
          userId: "creator-1",
          amount: 50000n,
          currency: Currency.IQD,
          status: PayoutStatus.PENDING,
          payoutMethod: "ZainCash",
          recipientDetails: "07700000000",
        },
      });
      expect(prisma.ledgerEntry.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            transactionId: "ledger-reservation-1",
            accountId: "acc-creator",
            direction: LedgerDirection.DEBIT,
            amount: 50000n,
          }),
        }),
      );
      expect(prisma.ledgerEntry.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            transactionId: "ledger-reservation-1",
            accountId: "acc-pending-payouts",
            direction: LedgerDirection.CREDIT,
            amount: 50000n,
          }),
        }),
      );
    });
  });

  describe("reverseLedgerTransaction", () => {
    it("should successfully reverse ledger transaction with opposite debit/credit entries", async () => {
      const mockOriginalTx = {
        id: "tx-orig",
        currency: Currency.IQD,
        entries: [
          { accountId: "acc-1", direction: LedgerDirection.DEBIT, amount: 1000n },
          { accountId: "acc-2", direction: LedgerDirection.CREDIT, amount: 1000n },
        ],
      };

      vi.mocked(prisma.ledgerTransaction.findUnique)
        .mockResolvedValueOnce(mockOriginalTx as any) // Find original tx
        .mockResolvedValueOnce(null); // Idempotency check inside recordTransaction

      vi.mocked(prisma.ledgerTransaction.create).mockResolvedValue({
        id: "tx-rev-success",
      } as any);

      const result = await FinancialService.reverseLedgerTransaction(
        "admin-1",
        "tx-orig",
        "خلاف مالي",
      );
      expect(result.id).toBe("tx-rev-success");

      // Verify entries reversed directions
      expect(prisma.ledgerEntry.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: {
            transactionId: "tx-rev-success",
            accountId: "acc-1",
            direction: LedgerDirection.CREDIT, // Originally DEBIT
            amount: 1000n,
          },
        }),
      );
      expect(prisma.ledgerEntry.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: {
            transactionId: "tx-rev-success",
            accountId: "acc-2",
            direction: LedgerDirection.DEBIT, // Originally CREDIT
            amount: 1000n,
          },
        }),
      );
    });
  });

  describe("reserveCampaignBudget", () => {
    it("should reserve campaign budget from brand wallet into campaign account", async () => {
      vi.mocked(prisma.campaign.findUnique).mockResolvedValue({
        id: "campaign-1",
        title: "حملة ممولة",
        totalBudget: 300000n,
        currency: Currency.IQD,
        brand: {
          members: [{ userId: "brand-user", role: "OWNER" }],
        },
      } as any);
      vi.mocked(prisma.wallet.findUnique).mockResolvedValue({
        id: "wallet-brand",
        financialAccountId: "acc-brand",
      } as any);
      vi.mocked(prisma.ledgerEntry.findMany).mockResolvedValue([
        { direction: LedgerDirection.CREDIT, amount: 500000n },
      ] as any);
      vi.mocked(prisma.financialAccount.findFirst).mockResolvedValue({
        id: "acc-campaign-budget",
      } as any);
      vi.mocked(prisma.ledgerTransaction.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.ledgerTransaction.create).mockResolvedValue({
        id: "tx-campaign-reserve",
      } as any);

      const result = await FinancialService.reserveCampaignBudget("campaign-1");

      expect(result.id).toBe("tx-campaign-reserve");
      expect(prisma.ledgerEntry.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            accountId: "acc-brand",
            direction: LedgerDirection.DEBIT,
            amount: 300000n,
          }),
        }),
      );
      expect(prisma.ledgerEntry.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            accountId: "acc-campaign-budget",
            direction: LedgerDirection.CREDIT,
            amount: 300000n,
          }),
        }),
      );
    });

    it("should refuse reservation when brand wallet balance is insufficient", async () => {
      vi.mocked(prisma.campaign.findUnique).mockResolvedValue({
        id: "campaign-1",
        title: "حملة ممولة",
        totalBudget: 300000n,
        currency: Currency.IQD,
        brand: {
          members: [{ userId: "brand-user", role: "OWNER" }],
        },
      } as any);
      vi.mocked(prisma.wallet.findUnique).mockResolvedValue({
        id: "wallet-brand",
        financialAccountId: "acc-brand",
      } as any);
      vi.mocked(prisma.ledgerEntry.findMany).mockResolvedValue([
        { direction: LedgerDirection.CREDIT, amount: 100000n },
      ] as any);

      await expect(FinancialService.reserveCampaignBudget("campaign-1")).rejects.toThrow(
        "رصيد التاجر غير كافٍ",
      );
    });
  });

  describe("releaseAvailableEarnings", () => {
    it("should release eligible held earnings into creator wallet", async () => {
      vi.mocked(prisma.earningAccrual.findMany).mockResolvedValue([
        {
          id: "earning-1",
          submissionId: "sub-1",
          amount: 75000n,
          currency: Currency.IQD,
          submission: {
            campaignMembership: {
              creatorProfile: { userId: "creator-user" },
              campaign: { id: "campaign-1", currency: Currency.IQD },
            },
          },
        },
      ] as any);
      vi.mocked(prisma.wallet.findUnique).mockResolvedValue({
        id: "wallet-creator",
        financialAccountId: "acc-creator",
      } as any);
      vi.mocked(prisma.financialAccount.findFirst).mockResolvedValue({
        id: "acc-campaign-budget",
      } as any);
      vi.mocked(prisma.ledgerEntry.findMany).mockResolvedValue([
        { direction: LedgerDirection.CREDIT, amount: 100000n },
      ] as any);
      vi.mocked(prisma.ledgerTransaction.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.ledgerTransaction.create).mockResolvedValue({
        id: "tx-earning-release",
      } as any);
      vi.mocked(prisma.earningAccrual.update).mockResolvedValue({
        id: "earning-1",
        status: "AVAILABLE",
      } as any);

      const result = await FinancialService.releaseAvailableEarnings(new Date());

      expect(result).toEqual({ releasedCount: 1, releasedIds: ["earning-1"] });
      expect(prisma.earningAccrual.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            submission: {
              disputes: {
                none: {
                  status: {
                    in: [
                      "OPEN",
                      "AWAITING_CREATOR",
                      "AWAITING_BRAND",
                      "UNDER_ADMIN_REVIEW",
                    ],
                  },
                },
              },
              OR: [{ fraudAssessment: null }, { fraudAssessment: { status: "CLEARED" } }],
            },
          }),
        }),
      );
      expect(prisma.ledgerEntry.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            accountId: "acc-campaign-budget",
            direction: LedgerDirection.DEBIT,
            amount: 75000n,
          }),
        }),
      );
      expect(prisma.ledgerEntry.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            accountId: "acc-creator",
            direction: LedgerDirection.CREDIT,
            amount: 75000n,
          }),
        }),
      );
      expect(prisma.earningAccrual.update).toHaveBeenCalledWith({
        where: { id: "earning-1" },
        data: { status: "AVAILABLE" },
      });
    });
  });
});
