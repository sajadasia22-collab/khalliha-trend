import { prisma } from "../../lib/prisma";
import {
  Currency,
  DepositStatus,
  EarningStatus,
  LedgerDirection,
  NotificationType,
  PayoutStatus,
} from "../../generated/prisma/enums";
import { LedgerEngine } from "./ledger";
import { NotificationService } from "../notifications/service";
import { AuditLogService } from "../audit-log/service";

export class FinancialService {
  private static getPlatformCommissionBps() {
    const raw = process.env.PLATFORM_COMMISSION_BPS ?? "0";
    const parsed = Number.parseInt(raw, 10);
    if (!Number.isFinite(parsed) || parsed < 0 || parsed > 10_000) {
      throw new Error("نسبة عمولة المنصة غير صالحة");
    }
    return BigInt(parsed);
  }

  /**
   * Submits a pending deposit request from a brand user.
   */
  static async requestDeposit(
    userId: string,
    amount: bigint,
    currency: Currency,
    referenceNumber?: string,
    note?: string,
  ) {
    if (amount <= 0n) {
      throw new Error("قيمة الإيداع يجب أن تكون أكبر من الصفر");
    }

    return await prisma.deposit.create({
      data: {
        userId,
        amount,
        currency,
        status: DepositStatus.PENDING,
        referenceNumber: referenceNumber || null,
        note: note || null,
      },
    });
  }

  /**
   * Approves a pending deposit request, generating the double-entry transaction.
   */
  static async approveDeposit(adminUserId: string, depositId: string) {
    const result = await prisma.$transaction(async (tx) => {
      // 1. Fetch deposit
      const deposit = await tx.deposit.findUnique({
        where: { id: depositId },
      });

      if (!deposit) {
        throw new Error("طلب الإيداع غير موجود");
      }

      if (deposit.status !== DepositStatus.PENDING) {
        throw new Error("طلب الإيداع تم معالجته مسبقاً");
      }

      // 2. Fetch or create user wallet
      const wallet = await LedgerEngine.createWalletIfNotExist(
        deposit.userId,
        deposit.currency,
        tx,
      );

      // 3. Fetch or create system physical cash account
      const systemAssetAcc = await LedgerEngine.getOrCreateFinancialAccount(
        tx,
        LedgerEngine.systemCashAccountName(deposit.currency),
        deposit.currency,
      );

      // 4. Record Double-entry Ledger transaction:
      // Debit: Platform Cash Asset (+Asset)
      // Credit: Brand Wallet Account (+Wallet Balance / Liability)
      const ledgerTx = await LedgerEngine.recordTransaction(tx, {
        idempotencyKey: `deposit-${deposit.id}`,
        type: "DEPOSIT",
        currency: deposit.currency,
        description: `إيداع رصيد للتاجر - حوالة رقم ${deposit.referenceNumber ?? "—"}`,
        entries: [
          {
            accountId: systemAssetAcc.id,
            direction: LedgerDirection.DEBIT,
            amount: deposit.amount,
          },
          {
            accountId: wallet.financialAccountId,
            direction: LedgerDirection.CREDIT,
            amount: deposit.amount,
          },
        ],
      });

      // 5. Update Deposit status
      return await tx.deposit.update({
        where: { id: depositId },
        data: {
          status: DepositStatus.APPROVED,
          reviewedByUserId: adminUserId,
          reviewedAt: new Date(),
          ledgerTransactionId: ledgerTx.id,
        },
      });
    });

    await NotificationService.notify(
      result.userId,
      NotificationType.DEPOSIT_REVIEWED,
      "تم اعتماد طلب الإيداع",
      `تم اعتماد إيداعك بمبلغ ${result.amount.toLocaleString("ar-IQ", { numberingSystem: "latn" })} وإضافته إلى رصيدك.`,
      "/brand/dashboard",
    );

    await AuditLogService.log({
      actorId: adminUserId,
      action: "DEPOSIT_APPROVE",
      targetType: "Deposit",
      targetId: depositId,
      before: { status: DepositStatus.PENDING },
      after: {
        status: DepositStatus.APPROVED,
        reviewedByUserId: adminUserId,
        ledgerTransactionId: result.ledgerTransactionId,
      },
    });

    return result;
  }

  /**
   * Rejects a pending deposit request.
   */
  static async rejectDeposit(adminUserId: string, depositId: string, note?: string) {
    const deposit = await prisma.deposit.findUnique({
      where: { id: depositId },
    });

    if (!deposit) {
      throw new Error("طلب الإيداع غير موجود");
    }

    if (deposit.status !== DepositStatus.PENDING) {
      throw new Error("طلب الإيداع تم معالجته مسبقاً");
    }

    const updated = await prisma.deposit.update({
      where: { id: depositId },
      data: {
        status: DepositStatus.REJECTED,
        reviewedByUserId: adminUserId,
        reviewedAt: new Date(),
        note: note || deposit.note,
      },
    });

    await NotificationService.notify(
      updated.userId,
      NotificationType.DEPOSIT_REVIEWED,
      "تم رفض طلب الإيداع",
      note ?? "راجع لوحة التحكم لمزيد من التفاصيل.",
      "/brand/dashboard",
    );

    await AuditLogService.log({
      actorId: adminUserId,
      action: "DEPOSIT_REJECT",
      targetType: "Deposit",
      targetId: depositId,
      before: { status: deposit.status, note: deposit.note },
      after: { status: DepositStatus.REJECTED, reviewedByUserId: adminUserId, note },
    });

    return updated;
  }

  /**
   * Submits a pending payout request from a creator.
   * Checks that the creator's current balance is enough.
   */
  static async requestPayout(
    userId: string,
    amount: bigint,
    currency: Currency,
    payoutMethod: string,
    recipientDetails: string,
  ) {
    if (amount <= 0n) {
      throw new Error("قيمة السحب يجب أن تكون أكبر من الصفر");
    }

    return prisma.$transaction(async (tx) => {
      const wallet = await LedgerEngine.createWalletIfNotExist(userId, currency, tx);
      await LedgerEngine.lockFinancialAccount(tx, wallet.financialAccountId);
      const balance = await LedgerEngine.getAccountBalanceWithClient(
        tx,
        wallet.financialAccountId,
      );

      if (balance < amount) {
        throw new Error("الرصيد المتاح في المحفظة غير كافٍ لإتمام عملية السحب");
      }

      const payout = await tx.payoutRequest.create({
        data: {
          userId,
          amount,
          currency,
          status: PayoutStatus.PENDING,
          payoutMethod,
          recipientDetails,
        },
      });

      const pendingPayoutAccount = await LedgerEngine.getOrCreateFinancialAccount(
        tx,
        LedgerEngine.pendingPayoutAccountName(currency),
        currency,
      );

      const reservationTx = await LedgerEngine.recordTransaction(tx, {
        idempotencyKey: `payout-reservation-${payout.id}`,
        type: "PAYOUT_RESERVATION",
        currency,
        description: `حجز مبلغ طلب السحب ${payout.id}`,
        entries: [
          {
            accountId: wallet.financialAccountId,
            direction: LedgerDirection.DEBIT,
            amount,
          },
          {
            accountId: pendingPayoutAccount.id,
            direction: LedgerDirection.CREDIT,
            amount,
          },
        ],
      });

      return tx.payoutRequest.update({
        where: { id: payout.id },
        data: { ledgerTransactionId: reservationTx.id },
      });
    });
  }

  /**
   * Approves a pending payout request, generating the double-entry transaction.
   */
  static async approvePayout(
    adminUserId: string,
    payoutRequestId: string,
    referenceNumber?: string,
  ) {
    const result = await prisma.$transaction(async (tx) => {
      // 1. Fetch payout request
      const payout = await tx.payoutRequest.findUnique({
        where: { id: payoutRequestId },
      });

      if (!payout) {
        throw new Error("طلب السحب غير موجود");
      }

      if (payout.status !== PayoutStatus.PENDING) {
        throw new Error("طلب السحب تم معالجته مسبقاً");
      }

      const pendingPayoutAccount = await LedgerEngine.getOrCreateFinancialAccount(
        tx,
        LedgerEngine.pendingPayoutAccountName(payout.currency),
        payout.currency,
      );

      // 4. Fetch or create system physical cash account
      const systemAssetAcc = await LedgerEngine.getOrCreateFinancialAccount(
        tx,
        LedgerEngine.systemCashAccountName(payout.currency),
        payout.currency,
      );

      // 5. Record Double-entry Ledger transaction:
      // Debit: Pending Payout Account (-reserved liability)
      // Credit: Platform Cash Asset (-Asset)
      const ledgerTx = await LedgerEngine.recordTransaction(tx, {
        idempotencyKey: `payout-settlement-${payout.id}`,
        type: "PAYOUT_SETTLEMENT",
        currency: payout.currency,
        description: `سحب رصيد صانع المحتوى - وسيلة: ${payout.payoutMethod}`,
        entries: [
          {
            accountId: pendingPayoutAccount.id,
            direction: LedgerDirection.DEBIT,
            amount: payout.amount,
          },
          {
            accountId: systemAssetAcc.id,
            direction: LedgerDirection.CREDIT,
            amount: payout.amount,
          },
        ],
      });

      // 6. Update PayoutRequest status
      return await tx.payoutRequest.update({
        where: { id: payoutRequestId },
        data: {
          status: PayoutStatus.APPROVED,
          reviewedByUserId: adminUserId,
          reviewedAt: new Date(),
          referenceNumber: referenceNumber || null,
          ledgerTransactionId: ledgerTx.id,
        },
      });
    });

    await NotificationService.notify(
      result.userId,
      NotificationType.PAYOUT_REVIEWED,
      "تم اعتماد طلب السحب",
      `تم اعتماد طلب سحبك بمبلغ ${result.amount.toLocaleString("ar-IQ", { numberingSystem: "latn" })} وتنفيذه.`,
      "/creator/dashboard",
    );

    await AuditLogService.log({
      actorId: adminUserId,
      action: "PAYOUT_APPROVE",
      targetType: "PayoutRequest",
      targetId: payoutRequestId,
      before: { status: PayoutStatus.PENDING },
      after: {
        status: PayoutStatus.APPROVED,
        reviewedByUserId: adminUserId,
        referenceNumber,
        ledgerTransactionId: result.ledgerTransactionId,
      },
    });

    return result;
  }

  /**
   * Rejects a pending payout request.
   */
  static async rejectPayout(adminUserId: string, payoutRequestId: string, note?: string) {
    const result = await prisma.$transaction(async (tx) => {
      const payout = await tx.payoutRequest.findUnique({
        where: { id: payoutRequestId },
      });

      if (!payout) {
        throw new Error("طلب السحب غير موجود");
      }

      if (payout.status !== PayoutStatus.PENDING) {
        throw new Error("طلب السحب تم معالجته مسبقاً");
      }

      const wallet = await LedgerEngine.createWalletIfNotExist(
        payout.userId,
        payout.currency,
        tx,
      );
      const pendingPayoutAccount = await LedgerEngine.getOrCreateFinancialAccount(
        tx,
        LedgerEngine.pendingPayoutAccountName(payout.currency),
        payout.currency,
      );

      await LedgerEngine.recordTransaction(tx, {
        idempotencyKey: `payout-reservation-release-${payout.id}`,
        type: "PAYOUT_RESERVATION_RELEASE",
        currency: payout.currency,
        description: `إرجاع مبلغ طلب السحب المرفوض ${payout.id}`,
        entries: [
          {
            accountId: pendingPayoutAccount.id,
            direction: LedgerDirection.DEBIT,
            amount: payout.amount,
          },
          {
            accountId: wallet.financialAccountId,
            direction: LedgerDirection.CREDIT,
            amount: payout.amount,
          },
        ],
      });

      return tx.payoutRequest.update({
        where: { id: payoutRequestId },
        data: {
          status: PayoutStatus.REJECTED,
          reviewedByUserId: adminUserId,
          reviewedAt: new Date(),
          note: note || payout.note,
        },
      });
    });

    await NotificationService.notify(
      result.userId,
      NotificationType.PAYOUT_REVIEWED,
      "تم رفض طلب السحب",
      note ?? "أُعيد المبلغ إلى محفظتك. راجع لوحة التحكم لمزيد من التفاصيل.",
      "/creator/dashboard",
    );

    await AuditLogService.log({
      actorId: adminUserId,
      action: "PAYOUT_REJECT",
      targetType: "PayoutRequest",
      targetId: payoutRequestId,
      before: { status: PayoutStatus.PENDING },
      after: { status: PayoutStatus.REJECTED, reviewedByUserId: adminUserId, note },
    });

    return result;
  }

  static async reserveCampaignBudget(campaignId: string) {
    return prisma.$transaction(async (tx) => {
      const campaign = await tx.campaign.findUnique({
        where: { id: campaignId },
        include: { brand: { include: { members: true } } },
      });

      if (!campaign) {
        throw new Error("الحملة غير موجودة");
      }

      if (campaign.totalBudget <= 0n) {
        throw new Error("ميزانية الحملة يجب أن تكون أكبر من الصفر");
      }

      const brandOwner =
        campaign.brand.members.find((member) => member.role === "OWNER") ??
        campaign.brand.members[0];
      if (!brandOwner) {
        throw new Error("لا يوجد مالك علامة تجارية لحجز ميزانية الحملة");
      }

      const wallet = await LedgerEngine.createWalletIfNotExist(
        brandOwner.userId,
        campaign.currency,
        tx,
      );
      await LedgerEngine.lockFinancialAccount(tx, wallet.financialAccountId);
      const walletBalance = await LedgerEngine.getAccountBalanceWithClient(
        tx,
        wallet.financialAccountId,
      );

      if (walletBalance < campaign.totalBudget) {
        throw new Error("رصيد التاجر غير كافٍ لحجز ميزانية الحملة قبل التفعيل");
      }

      const campaignBudgetAccount = await LedgerEngine.getOrCreateFinancialAccount(
        tx,
        LedgerEngine.campaignBudgetAccountName(campaign.id, campaign.currency),
        campaign.currency,
      );

      return LedgerEngine.recordTransaction(tx, {
        idempotencyKey: `campaign-budget-reservation-${campaign.id}`,
        type: "CAMPAIGN_BUDGET_RESERVATION",
        currency: campaign.currency,
        description: `حجز ميزانية حملة ${campaign.title}`,
        entries: [
          {
            accountId: wallet.financialAccountId,
            direction: LedgerDirection.DEBIT,
            amount: campaign.totalBudget,
          },
          {
            accountId: campaignBudgetAccount.id,
            direction: LedgerDirection.CREDIT,
            amount: campaign.totalBudget,
          },
        ],
      });
    });
  }

  static async releaseAvailableEarnings(now = new Date()) {
    return prisma.$transaction(async (tx) => {
      const eligibleAccruals = await tx.earningAccrual.findMany({
        where: {
          status: { in: [EarningStatus.PENDING_VERIFICATION, EarningStatus.HELD] },
          heldUntil: { lte: now },
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
          },
        },
        include: {
          submission: {
            include: {
              campaignMembership: {
                include: {
                  creatorProfile: true,
                  campaign: true,
                },
              },
            },
          },
        },
      });

      const releasedIds: string[] = [];

      for (const accrual of eligibleAccruals) {
        const membership = accrual.submission.campaignMembership;
        const campaign = membership.campaign;
        const creatorWallet = await LedgerEngine.createWalletIfNotExist(
          membership.creatorProfile.userId,
          accrual.currency,
          tx,
        );
        const campaignBudgetAccount = await LedgerEngine.getOrCreateFinancialAccount(
          tx,
          LedgerEngine.campaignBudgetAccountName(campaign.id, campaign.currency),
          campaign.currency,
        );

        await LedgerEngine.lockFinancialAccount(tx, campaignBudgetAccount.id);
        const campaignBalance = await LedgerEngine.getAccountBalanceWithClient(
          tx,
          campaignBudgetAccount.id,
        );
        if (campaignBalance < accrual.amount) {
          throw new Error("رصيد ميزانية الحملة المحجوزة غير كافٍ لتحرير الأرباح");
        }

        const commissionAmount =
          (accrual.amount * FinancialService.getPlatformCommissionBps()) / 10_000n;
        const creatorAmount = accrual.amount - commissionAmount;
        const entries = [
          {
            accountId: campaignBudgetAccount.id,
            direction: LedgerDirection.DEBIT,
            amount: accrual.amount,
          },
          {
            accountId: creatorWallet.financialAccountId,
            direction: LedgerDirection.CREDIT,
            amount: creatorAmount,
          },
        ];

        if (commissionAmount > 0n) {
          const platformRevenueAccount = await LedgerEngine.getOrCreateFinancialAccount(
            tx,
            LedgerEngine.platformRevenueAccountName(accrual.currency),
            accrual.currency,
          );
          entries.push({
            accountId: platformRevenueAccount.id,
            direction: LedgerDirection.CREDIT,
            amount: commissionAmount,
          });
        }

        await LedgerEngine.recordTransaction(tx, {
          idempotencyKey: `earning-release-${accrual.id}`,
          type: "EARNING_RELEASE",
          currency: accrual.currency,
          description: `تحرير أرباح صانع المحتوى للمنشور ${accrual.submissionId}`,
          entries,
        });

        await tx.earningAccrual.update({
          where: { id: accrual.id },
          data: { status: EarningStatus.AVAILABLE },
        });

        releasedIds.push(accrual.id);
      }

      return { releasedCount: releasedIds.length, releasedIds };
    });
  }

  /**
   * Reverses an existing LedgerTransaction by generating opposite entries.
   * Ledger is immutable; corrections must be performed as reversal operations.
   */
  static async reverseLedgerTransaction(
    adminUserId: string,
    transactionId: string,
    reason: string,
  ) {
    return await prisma.$transaction(async (tx) => {
      const originalTx = await tx.ledgerTransaction.findUnique({
        where: { id: transactionId },
        include: { entries: true },
      });

      if (!originalTx) {
        throw new Error("المعاملة المالية المراد عكسها غير موجودة");
      }

      const reversalIdempotencyKey = `reversal-${originalTx.id}`;

      // Check if already reversed
      const doubleCheck = await tx.ledgerTransaction.findUnique({
        where: { idempotencyKey: reversalIdempotencyKey },
      });
      if (doubleCheck) {
        throw new Error("هذه المعاملة تم عكسها مسبقاً");
      }

      // Reverse direction of each entry: DEBIT -> CREDIT, CREDIT -> DEBIT
      const reversedEntries = originalTx.entries.map((entry) => ({
        accountId: entry.accountId,
        direction:
          entry.direction === LedgerDirection.DEBIT
            ? LedgerDirection.CREDIT
            : LedgerDirection.DEBIT,
        amount: entry.amount,
      }));

      // Record reversal transaction
      const reversalTx = await LedgerEngine.recordTransaction(tx, {
        idempotencyKey: reversalIdempotencyKey,
        type: "REVERSAL",
        currency: originalTx.currency,
        description: `عكس القيد المالي ${originalTx.id} - السبب: ${reason}`,
        entries: reversedEntries,
      });

      return reversalTx;
    });
  }
}
