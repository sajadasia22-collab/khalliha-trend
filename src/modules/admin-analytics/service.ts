import { prisma } from "../../lib/prisma";
import {
  CampaignStatus,
  Currency,
  DepositStatus,
  DisputeStatus,
  EarningStatus,
  FraudReviewStatus,
  LedgerDirection,
  PayoutStatus,
  SocialAccountStatus,
  SubmissionStatus,
  UserRole,
  UserStatus,
} from "../../generated/prisma/enums";

export type AnalyticsPeriod = 30 | 90 | 365;

type MoneyRow = {
  currency: Currency;
  status: string;
  _count: { _all: number };
  _sum: { amount: bigint | null };
};

const currencies = [Currency.IQD, Currency.USD] as const;

function emptyMoney() {
  return Object.fromEntries(
    currencies.map((currency) => [
      currency,
      {
        approvedDeposits: 0n,
        pendingDeposits: 0n,
        approvedPayouts: 0n,
        pendingPayouts: 0n,
        availableEarnings: 0n,
        paidEarnings: 0n,
        heldEarnings: 0n,
        campaignBudgets: 0n,
        reservedBudgets: 0n,
        platformRevenue: 0n,
        approvedDepositCount: 0,
        pendingDepositCount: 0,
        approvedPayoutCount: 0,
        pendingPayoutCount: 0,
      },
    ]),
  ) as Record<
    Currency,
    {
      approvedDeposits: bigint;
      pendingDeposits: bigint;
      approvedPayouts: bigint;
      pendingPayouts: bigint;
      availableEarnings: bigint;
      paidEarnings: bigint;
      heldEarnings: bigint;
      campaignBudgets: bigint;
      reservedBudgets: bigint;
      platformRevenue: bigint;
      approvedDepositCount: number;
      pendingDepositCount: number;
      approvedPayoutCount: number;
      pendingPayoutCount: number;
    }
  >;
}

export function calculateGrowth(current: number, previous: number) {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}

export function calculateLedgerBalance(
  entries: Array<{ amount: bigint; direction: LedgerDirection }>,
) {
  return entries.reduce(
    (balance, entry) =>
      balance +
      (entry.direction === LedgerDirection.CREDIT ? entry.amount : -entry.amount),
    0n,
  );
}

function statusCount<T extends string>(
  rows: Array<{ status: T; _count: { _all: number } }>,
  status: T,
) {
  return rows.find((row) => row.status === status)?._count._all ?? 0;
}

function moneyValue(rows: MoneyRow[], currency: Currency, status: string) {
  return (
    rows.find((row) => row.currency === currency && row.status === status)?._sum.amount ??
    0n
  );
}

function moneyCount(rows: MoneyRow[], currency: Currency, status: string) {
  return (
    rows.find((row) => row.currency === currency && row.status === status)?._count._all ??
    0
  );
}

function serializeMoney<T extends Record<string, bigint | number>>(value: T) {
  return Object.fromEntries(
    Object.entries(value).map(([key, item]) => [
      key,
      typeof item === "bigint" ? item.toString() : item,
    ]),
  );
}

export class AdminAnalyticsService {
  static async getDashboard(period: AnalyticsPeriod) {
    const now = new Date();
    const since = new Date(now);
    since.setDate(since.getDate() - period);
    const previousSince = new Date(since);
    previousSince.setDate(previousSince.getDate() - period);

    const [
      userStatuses,
      userRoles,
      totalUsers,
      newUsers,
      previousUsers,
      campaignStatuses,
      totalCampaigns,
      newCampaigns,
      previousCampaigns,
      depositRows,
      payoutRows,
      earningRows,
      campaignMoney,
      revenueEntries,
      metrics,
      submissionStatuses,
      socialStatuses,
      membershipCount,
      fraudStatuses,
      highRiskFraud,
      disputeStatuses,
      recentUsers,
      recentCampaigns,
      recentAuditLogs,
      timelineUsers,
      timelineCampaigns,
      timelineDeposits,
      timelinePayouts,
    ] = await Promise.all([
      prisma.user.groupBy({ by: ["status"], _count: { _all: true } }),
      prisma.user.groupBy({ by: ["role"], _count: { _all: true } }),
      prisma.user.count(),
      prisma.user.count({ where: { createdAt: { gte: since } } }),
      prisma.user.count({ where: { createdAt: { gte: previousSince, lt: since } } }),
      prisma.campaign.groupBy({ by: ["status"], _count: { _all: true } }),
      prisma.campaign.count(),
      prisma.campaign.count({ where: { createdAt: { gte: since } } }),
      prisma.campaign.count({ where: { createdAt: { gte: previousSince, lt: since } } }),
      prisma.deposit.groupBy({
        by: ["currency", "status"],
        _count: { _all: true },
        _sum: { amount: true },
      }),
      prisma.payoutRequest.groupBy({
        by: ["currency", "status"],
        _count: { _all: true },
        _sum: { amount: true },
      }),
      prisma.earningAccrual.groupBy({
        by: ["currency", "status"],
        _count: { _all: true },
        _sum: { amount: true },
      }),
      prisma.campaign.groupBy({
        by: ["currency"],
        _sum: { totalBudget: true, reservedBudget: true },
      }),
      prisma.ledgerEntry.findMany({
        where: { account: { name: { startsWith: "حساب إيرادات المنصة (" } } },
        select: {
          amount: true,
          direction: true,
          account: { select: { currency: true } },
        },
      }),
      prisma.metricsSnapshot.aggregate({
        _sum: { observedViews: true, qualifiedViews: true, disqualifiedViews: true },
        _count: { _all: true },
      }),
      prisma.submission.groupBy({ by: ["status"], _count: { _all: true } }),
      prisma.socialAccount.groupBy({ by: ["status"], _count: { _all: true } }),
      prisma.campaignMembership.count(),
      prisma.fraudAssessment.groupBy({ by: ["status"], _count: { _all: true } }),
      prisma.fraudAssessment.count({
        where: {
          riskLevel: "HIGH",
          status: { in: [FraudReviewStatus.OPEN, FraudReviewStatus.UNDER_REVIEW] },
        },
      }),
      prisma.dispute.groupBy({ by: ["status"], _count: { _all: true } }),
      prisma.user.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
        select: { id: true, fullName: true, role: true, status: true, createdAt: true },
      }),
      prisma.campaign.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          title: true,
          status: true,
          currency: true,
          totalBudget: true,
          createdAt: true,
          brand: { select: { name: true } },
        },
      }),
      prisma.auditLog.findMany({
        orderBy: { createdAt: "desc" },
        take: 8,
        select: {
          id: true,
          action: true,
          targetType: true,
          actorEmail: true,
          createdAt: true,
        },
      }),
      prisma.user.findMany({
        where: { createdAt: { gte: since } },
        select: { createdAt: true },
      }),
      prisma.campaign.findMany({
        where: { createdAt: { gte: since } },
        select: { createdAt: true },
      }),
      prisma.deposit.findMany({
        where: { createdAt: { gte: since } },
        select: { createdAt: true, amount: true, currency: true, status: true },
      }),
      prisma.payoutRequest.findMany({
        where: { createdAt: { gte: since } },
        select: { createdAt: true, amount: true, currency: true, status: true },
      }),
    ]);

    const money = emptyMoney();
    for (const currency of currencies) {
      const campaign = campaignMoney.find((row) => row.currency === currency)?._sum;
      money[currency] = {
        approvedDeposits: moneyValue(
          depositRows as MoneyRow[],
          currency,
          DepositStatus.APPROVED,
        ),
        pendingDeposits: moneyValue(
          depositRows as MoneyRow[],
          currency,
          DepositStatus.PENDING,
        ),
        approvedPayouts: moneyValue(
          payoutRows as MoneyRow[],
          currency,
          PayoutStatus.APPROVED,
        ),
        pendingPayouts: moneyValue(
          payoutRows as MoneyRow[],
          currency,
          PayoutStatus.PENDING,
        ),
        availableEarnings: moneyValue(
          earningRows as MoneyRow[],
          currency,
          EarningStatus.AVAILABLE,
        ),
        paidEarnings: moneyValue(earningRows as MoneyRow[], currency, EarningStatus.PAID),
        heldEarnings: moneyValue(earningRows as MoneyRow[], currency, EarningStatus.HELD),
        campaignBudgets: campaign?.totalBudget ?? 0n,
        reservedBudgets: campaign?.reservedBudget ?? 0n,
        platformRevenue: 0n,
        approvedDepositCount: moneyCount(
          depositRows as MoneyRow[],
          currency,
          DepositStatus.APPROVED,
        ),
        pendingDepositCount: moneyCount(
          depositRows as MoneyRow[],
          currency,
          DepositStatus.PENDING,
        ),
        approvedPayoutCount: moneyCount(
          payoutRows as MoneyRow[],
          currency,
          PayoutStatus.APPROVED,
        ),
        pendingPayoutCount: moneyCount(
          payoutRows as MoneyRow[],
          currency,
          PayoutStatus.PENDING,
        ),
      };
    }
    for (const currency of currencies) {
      money[currency].platformRevenue = calculateLedgerBalance(
        revenueEntries.filter((entry) => entry.account.currency === currency),
      );
    }

    const bucketCount = period === 30 ? 10 : 12;
    const bucketMs = (period * 24 * 60 * 60 * 1000) / bucketCount;
    const buckets = Array.from({ length: bucketCount }, (_, index) => {
      const start = new Date(since.getTime() + index * bucketMs);
      const end = new Date(since.getTime() + (index + 1) * bucketMs);
      const inBucket = (date: Date) => date >= start && date < end;
      return {
        label: start.toLocaleDateString("ar-IQ", {
          month: "short",
          day: "numeric",
          numberingSystem: "latn",
        }),
        users: timelineUsers.filter((item) => inBucket(item.createdAt)).length,
        campaigns: timelineCampaigns.filter((item) => inBucket(item.createdAt)).length,
        deposits: timelineDeposits.filter(
          (item) => inBucket(item.createdAt) && item.status === DepositStatus.APPROVED,
        ).length,
        payouts: timelinePayouts.filter(
          (item) => inBucket(item.createdAt) && item.status === PayoutStatus.APPROVED,
        ).length,
      };
    });

    const observed = metrics._sum.observedViews ?? 0n;
    const qualified = metrics._sum.qualifiedViews ?? 0n;
    const closedDisputeStatuses = new Set<DisputeStatus>([
      DisputeStatus.RESOLVED_CREATOR,
      DisputeStatus.RESOLVED_BRAND,
      DisputeStatus.PARTIAL_RESOLUTION,
      DisputeStatus.CLOSED,
    ]);
    const openDisputes = disputeStatuses
      .filter((row) => !closedDisputeStatuses.has(row.status))
      .reduce((sum, row) => sum + row._count._all, 0);
    const openFraud =
      statusCount(fraudStatuses, FraudReviewStatus.OPEN) +
      statusCount(fraudStatuses, FraudReviewStatus.UNDER_REVIEW);

    return {
      generatedAt: now.toISOString(),
      period,
      overview: {
        totalUsers,
        newUsers,
        userGrowth: calculateGrowth(newUsers, previousUsers),
        creators:
          userRoles.find((row) => row.role === UserRole.CREATOR)?._count._all ?? 0,
        brands: userRoles.find((row) => row.role === UserRole.BRAND)?._count._all ?? 0,
        activeUsers: statusCount(userStatuses, UserStatus.ACTIVE),
        restrictedUsers:
          statusCount(userStatuses, UserStatus.SUSPENDED) +
          statusCount(userStatuses, UserStatus.BANNED),
        totalCampaigns,
        newCampaigns,
        campaignGrowth: calculateGrowth(newCampaigns, previousCampaigns),
        activeCampaigns: statusCount(campaignStatuses, CampaignStatus.ACTIVE),
        completedCampaigns: statusCount(campaignStatuses, CampaignStatus.COMPLETED),
        pendingCampaigns: statusCount(campaignStatuses, CampaignStatus.PENDING_REVIEW),
        memberships: membershipCount,
      },
      money: Object.fromEntries(
        currencies.map((currency) => [currency, serializeMoney(money[currency])]),
      ),
      performance: {
        observedViews: observed.toString(),
        qualifiedViews: qualified.toString(),
        disqualifiedViews: (metrics._sum.disqualifiedViews ?? 0n).toString(),
        qualificationRate:
          observed > 0n ? Number((qualified * 10_000n) / observed) / 100 : 0,
        snapshots: metrics._count._all,
        submissions: submissionStatuses.reduce((sum, row) => sum + row._count._all, 0),
        approvedSubmissions: statusCount(submissionStatuses, SubmissionStatus.APPROVED),
        pendingSubmissions:
          statusCount(submissionStatuses, SubmissionStatus.SUBMITTED) +
          statusCount(submissionStatuses, SubmissionStatus.UNDER_REVIEW),
        verifiedSocialAccounts: statusCount(socialStatuses, SocialAccountStatus.VERIFIED),
        pendingSocialAccounts: statusCount(socialStatuses, SocialAccountStatus.PENDING),
      },
      risk: { openDisputes, openFraud, highRiskFraud },
      timeline: buckets,
      recentUsers,
      recentCampaigns: recentCampaigns.map((campaign) => ({
        ...campaign,
        totalBudget: campaign.totalBudget.toString(),
      })),
      recentAuditLogs,
      commissionPercent: Number(process.env.PLATFORM_COMMISSION_BPS ?? "0") / 100,
    };
  }
}
