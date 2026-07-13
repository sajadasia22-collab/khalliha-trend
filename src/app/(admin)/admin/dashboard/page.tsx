import { redirect } from "next/navigation";
import { getCurrentUser } from "../../../../lib/auth/session";
import Link from "next/link";
import { prisma } from "../../../../lib/prisma";
import { CampaignStatus } from "../../../../generated/prisma/enums";
import {
  DepositStatus,
  PayoutStatus,
  DisputeStatus,
  FraudReviewStatus,
  UserRole,
} from "../../../../generated/prisma/enums";
import { DashboardHeader } from "../../../../components/layout/DashboardHeader";
import { ConnectionErrorCard } from "../../../../components/ui/ConnectionErrorCard";
import {
  ClipboardCheckIcon,
  WalletIcon,
  BanknoteIcon,
  AlertTriangleIcon,
  ShieldAlertIcon,
  MegaphoneIcon,
  UsersIcon,
  BriefcaseIcon,
  EyeIcon,
} from "../../../../components/ui/icons";

const ACTIVE_DISPUTE_STATUSES = [
  DisputeStatus.OPEN,
  DisputeStatus.AWAITING_CREATOR,
  DisputeStatus.AWAITING_BRAND,
  DisputeStatus.UNDER_ADMIN_REVIEW,
];

const OPEN_FRAUD_STATUSES = [FraudReviewStatus.OPEN, FraudReviewStatus.UNDER_REVIEW];

export default async function AdminDashboard() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const stats = await Promise.all([
    prisma.campaign.count({ where: { status: CampaignStatus.PENDING_REVIEW } }),
    prisma.deposit.count({ where: { status: DepositStatus.PENDING } }),
    prisma.payoutRequest.count({ where: { status: PayoutStatus.PENDING } }),
    prisma.dispute.count({ where: { status: { in: ACTIVE_DISPUTE_STATUSES } } }),
    prisma.fraudAssessment.count({ where: { status: { in: OPEN_FRAUD_STATUSES } } }),
    prisma.campaign.count({ where: { status: CampaignStatus.ACTIVE } }),
    prisma.user.count({ where: { role: UserRole.CREATOR } }),
    prisma.user.count({ where: { role: UserRole.BRAND } }),
    prisma.metricsSnapshot.aggregate({ _sum: { qualifiedViews: true } }),
  ] as const).catch(() => null);

  const [
    pendingCampaignsCount,
    pendingDepositsCount,
    pendingPayoutsCount,
    activeDisputesCount,
    openFraudCount,
    activeCampaignsCount,
    creatorsCount,
    brandsCount,
    qualifiedViewsSum,
  ] = stats ?? [0, 0, 0, 0, 0, 0, 0, 0, null];

  const totalQualifiedViews = qualifiedViewsSum?._sum.qualifiedViews ?? 0n;

  const actionItems = [
    {
      href: "/admin/reviews",
      label: "حملات قيد المراجعة",
      count: pendingCampaignsCount,
      icon: ClipboardCheckIcon,
    },
    {
      href: "/admin/reviews",
      label: "إيداعات معلقة",
      count: pendingDepositsCount,
      icon: WalletIcon,
    },
    {
      href: "/admin/reviews",
      label: "طلبات سحب معلقة",
      count: pendingPayoutsCount,
      icon: BanknoteIcon,
    },
    {
      href: "/admin/disputes",
      label: "نزاعات نشطة",
      count: activeDisputesCount,
      icon: AlertTriangleIcon,
    },
    {
      href: "/admin/fraud",
      label: "حالات احتيال مشتبهة",
      count: openFraudCount,
      icon: ShieldAlertIcon,
    },
  ];

  const pulseItems = [
    {
      label: "حملات نشطة حالياً",
      value: activeCampaignsCount,
      icon: MegaphoneIcon,
      href: "/admin/reviews",
    },
    {
      label: "صناع محتوى مسجّلون",
      value: creatorsCount,
      icon: UsersIcon,
      href: "/admin/users?role=CREATOR",
    },
    {
      label: "علامات تجارية مسجّلة",
      value: brandsCount,
      icon: BriefcaseIcon,
      href: "/admin/users?role=BRAND",
    },
    {
      label: "إجمالي المشاهدات المؤهلة",
      value: totalQualifiedViews.toLocaleString("ar-IQ", { numberingSystem: "latn" }),
      icon: EyeIcon,
      href: "/admin/dashboard",
    },
  ];

  const totalPendingActions = actionItems.reduce((sum, item) => sum + item.count, 0);

  return (
    <main className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)] dir-rtl md:ps-64 pb-20 md:pb-0">
      <DashboardHeader
        dashboardRole="admin"
        userLabel={`${user?.role === "SUPER_ADMIN" ? "مدير النظام" : "مشرف"}: ${user?.fullName}`}
      />

      {/* Main Content */}
      <section className="mx-auto max-w-7xl px-5 py-12 lg:px-8">
        <div className="mb-8">
          <h1 className="mb-2 text-3xl font-extrabold">لوحة تحكم الإدارة</h1>
          <p className="font-medium text-[var(--color-text-secondary)]">
            تسيير وإدارة العمليات اليومية للمنصة: مراجعة المشاركات، اعتماد العمليات
            المالية، والتحقق من النزاعات.
          </p>
        </div>

        {stats === null && (
          <div className="mb-8">
            <ConnectionErrorCard message="تعذّر تحميل إحصائيات لوحة التحكم حالياً." />
          </div>
        )}

        {stats !== null && (
          <div className="space-y-6">
            {/* Needs attention: one unified panel, tiles link straight into the relevant queue */}
            <div className="fade-in-up overflow-hidden rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-sm)]">
              <div className="flex items-center justify-between border-b border-[var(--color-border)] px-6 py-4">
                <h2 className="text-sm font-bold text-[var(--color-text)]">
                  يحتاج إجراءك الآن
                </h2>
                {totalPendingActions > 0 ? (
                  <span className="rounded-[var(--radius-pill)] bg-[var(--color-brand)] px-2.5 py-0.5 text-xs font-black text-[var(--color-text-on-brand)]">
                    {totalPendingActions}
                  </span>
                ) : (
                  <span className="text-xs font-bold text-[var(--color-text-muted)]">
                    لا شيء معلّق
                  </span>
                )}
              </div>
              <div className="grid divide-y divide-[var(--color-border)] sm:grid-cols-2 sm:divide-x sm:divide-y-0 lg:grid-cols-5">
                {actionItems.map((item) => {
                  const Icon = item.icon;
                  const needsAction = item.count > 0;
                  return (
                    <Link
                      key={item.label}
                      href={item.href}
                      className="group flex items-center gap-3 p-5 transition-colors duration-150 ease-[cubic-bezier(.2,.8,.2,1)] hover:bg-[var(--color-surface-muted)]"
                    >
                      <span
                        className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-[var(--radius-md)] transition-colors duration-150 ${
                          needsAction
                            ? "bg-[var(--color-brand)] text-[var(--color-text-on-brand)]"
                            : "bg-[var(--color-surface-muted)] text-[var(--color-text-secondary)]"
                        }`}
                      >
                        <Icon />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-xs font-bold text-[var(--color-text-secondary)]">
                          {item.label}
                        </span>
                        <span className="block text-2xl font-black text-[var(--color-text)]">
                          {item.count}
                        </span>
                      </span>
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 16 16"
                        fill="none"
                        aria-hidden="true"
                        className="flex-shrink-0 text-[var(--color-text-muted)] transition-transform duration-150 ease-[cubic-bezier(.2,.8,.2,1)] group-hover:-translate-x-0.5"
                      >
                        <path
                          d="M6 3l5 5-5 5"
                          stroke="currentColor"
                          strokeWidth="1.6"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Platform pulse: informational only, quieter tone, no lime signal */}
            <div
              className="fade-in-up overflow-hidden rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-sm)]"
              style={{ animationDelay: "80ms" }}
            >
              <div className="border-b border-[var(--color-border)] px-6 py-4">
                <h2 className="text-sm font-bold text-[var(--color-text)]">
                  لمحة عن المنصة
                </h2>
              </div>
              <div className="grid divide-y divide-[var(--color-border)] sm:grid-cols-2 sm:divide-x sm:divide-y-0 lg:grid-cols-4">
                {pulseItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      href={item.href ?? "/admin/users"}
                      key={item.label}
                      className="flex items-center gap-3 p-5 transition-colors hover:bg-[var(--color-surface-muted)]"
                    >
                      <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-surface-muted)] text-[var(--forest-500)]">
                        <Icon />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-xs font-bold text-[var(--color-text-secondary)]">
                          {item.label}
                        </span>
                        <span className="block text-2xl font-black text-[var(--color-text)]">
                          {item.value}
                        </span>
                      </span>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
