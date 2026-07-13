import Link from "next/link";
import { redirect } from "next/navigation";
import { DashboardHeader } from "../../../../components/layout/DashboardHeader";
import {
  ActivityIcon,
  AnalyticsIcon,
  BanknoteIcon,
  BriefcaseIcon,
  EyeIcon,
  MegaphoneIcon,
  RevenueIcon,
  ShieldAlertIcon,
  TrendingUpIcon,
  UsersIcon,
  WalletIcon,
} from "../../../../components/ui/icons";
import { UserRole } from "../../../../generated/prisma/enums";
import { getCurrentUser } from "../../../../lib/auth/session";
import {
  AdminAnalyticsService,
  type AnalyticsPeriod,
} from "../../../../modules/admin-analytics/service";

export const dynamic = "force-dynamic";

const periods: Array<{ value: AnalyticsPeriod; label: string }> = [
  { value: 30, label: "30 يوم" },
  { value: 90, label: "3 أشهر" },
  { value: 365, label: "سنة" },
];

const statusLabels: Record<string, string> = {
  CREATOR: "صانع محتوى",
  BRAND: "تاجر / علامة",
  ADMIN: "مشرف",
  SUPER_ADMIN: "مدير النظام",
  ACTIVE: "نشط",
  PENDING_VERIFICATION: "بانتظار التحقق",
  SUSPENDED: "موقوف",
  BANNED: "محظور",
  DRAFT: "مسودة",
  PENDING_REVIEW: "قيد المراجعة",
  ACTIVE_CAMPAIGN: "نشطة",
  COMPLETED: "مكتملة",
};

const auditLabels: Record<string, string> = {
  ADMIN_USER_STATUS_CHANGED: "تغيير حالة مستخدم",
  DEPOSIT_APPROVED: "اعتماد إيداع",
  PAYOUT_APPROVED: "اعتماد سحب",
  CAMPAIGN_REVIEWED: "مراجعة حملة",
  SUBMISSION_REVIEWED: "مراجعة مشاركة",
};

function formatCount(value: number | string) {
  return BigInt(value).toLocaleString("ar-IQ", { numberingSystem: "latn" });
}

function formatMoney(value: string, currency: string) {
  return `${formatCount(value)} ${currency === "IQD" ? "د.ع" : "$"}`;
}

function GrowthBadge({ value }: { value: number }) {
  const positive = value >= 0;
  return (
    <span
      className={`rounded-full px-2.5 py-1 text-xs font-black ${positive ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"}`}
    >
      {positive ? "+" : ""}
      {value}%
    </span>
  );
}

function MiniChart({
  data,
}: {
  data: Array<{ label: string; users: number; campaigns: number }>;
}) {
  const max = Math.max(1, ...data.flatMap((item) => [item.users, item.campaigns]));
  return (
    <div
      className="mt-8"
      role="img"
      aria-label="رسم يوضح نمو المستخدمين والحملات خلال الفترة"
    >
      <div className="flex h-52 items-end gap-2 sm:gap-4">
        {data.map((item) => (
          <div
            key={item.label}
            className="group flex h-full min-w-0 flex-1 items-end justify-center gap-1"
          >
            <span
              title={`${item.users} مستخدم`}
              className="w-2.5 rounded-t-full bg-[var(--color-brand)] transition-all duration-500 sm:w-4"
              style={{ height: `${Math.max(3, (item.users / max) * 100)}%` }}
            />
            <span
              title={`${item.campaigns} حملة`}
              className="w-2.5 rounded-t-full bg-[var(--color-text)]/75 transition-all duration-500 sm:w-4"
              style={{ height: `${Math.max(3, (item.campaigns / max) * 100)}%` }}
            />
          </div>
        ))}
      </div>
      <div className="mt-3 flex justify-between gap-1 text-[10px] font-bold text-[var(--color-text-muted)]">
        {data.map((item, index) => (
          <span key={item.label} className={index % 2 ? "hidden sm:block" : "block"}>
            {item.label}
          </span>
        ))}
      </div>
    </div>
  );
}

function ProgressRow({
  label,
  value,
  total,
  color = "bg-[var(--color-brand)]",
}: {
  label: string;
  value: number;
  total: number;
  color?: string;
}) {
  const width = total ? Math.min(100, (value / total) * 100) : 0;
  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-sm font-bold">
        <span>{label}</span>
        <span className="tabular-nums">{formatCount(value)}</span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-[var(--color-surface-muted)]">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${width}%` }} />
      </div>
    </div>
  );
}

export default async function AdminAnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== UserRole.ADMIN && user.role !== UserRole.SUPER_ADMIN) redirect("/");

  const params = await searchParams;
  const parsed = Number(params.period);
  const period: AnalyticsPeriod = parsed === 90 || parsed === 365 ? parsed : 30;
  const data = await AdminAnalyticsService.getDashboard(period);
  const peak = Math.max(
    1,
    ...data.timeline.flatMap((item) => [item.users, item.campaigns]),
  );

  const kpis = [
    {
      label: "إجمالي المستخدمين",
      value: formatCount(data.overview.totalUsers),
      detail: `${formatCount(data.overview.newUsers)} جديد`,
      growth: data.overview.userGrowth,
      icon: UsersIcon,
    },
    {
      label: "إجمالي الحملات",
      value: formatCount(data.overview.totalCampaigns),
      detail: `${formatCount(data.overview.activeCampaigns)} نشطة`,
      growth: data.overview.campaignGrowth,
      icon: MegaphoneIcon,
    },
    {
      label: "المشاهدات المؤهلة",
      value: formatCount(data.performance.qualifiedViews),
      detail: `${data.performance.qualificationRate.toFixed(1)}% نسبة التأهل`,
      icon: EyeIcon,
    },
    {
      label: "مشاركات المحتوى",
      value: formatCount(data.performance.submissions),
      detail: `${formatCount(data.performance.approvedSubmissions)} معتمدة`,
      icon: ActivityIcon,
    },
  ];

  return (
    <main
      className="min-h-screen bg-[var(--color-bg)] pb-24 text-[var(--color-text)] md:ps-64 md:pb-0"
      dir="rtl"
    >
      <DashboardHeader
        dashboardRole="admin"
        userLabel={`${user.role === UserRole.SUPER_ADMIN ? "مدير النظام" : "مشرف"}: ${user.fullName}`}
      />
      <section className="mx-auto max-w-[1500px] px-5 py-10 lg:px-8">
        <div className="mb-8 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div>
            <div className="mb-3 flex items-center gap-2 text-sm font-black text-[var(--color-text-secondary)]">
              <AnalyticsIcon size={18} /> مركز قيادة المنصة
            </div>
            <h1 className="text-3xl font-black sm:text-4xl">التقارير والتحليلات</h1>
            <p className="mt-2 max-w-2xl font-medium text-[var(--color-text-secondary)]">
              صورة كاملة ومباشرة للنمو، حركة الأموال، أداء المحتوى، والمخاطر التشغيلية.
            </p>
          </div>
          <div className="flex rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-1.5 shadow-sm">
            {periods.map((item) => (
              <Link
                key={item.value}
                href={`/admin/analytics?period=${item.value}`}
                className={`rounded-xl px-4 py-2 text-sm font-black transition ${period === item.value ? "bg-[var(--color-text)] text-white" : "text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-muted)]"}`}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {kpis.map((item) => {
            const Icon = item.icon;
            return (
              <article
                key={item.label}
                className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm"
              >
                <div className="flex items-start justify-between">
                  <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[var(--color-brand)] text-[var(--color-text-on-brand)]">
                    <Icon />
                  </span>
                  {item.growth !== undefined && <GrowthBadge value={item.growth} />}
                </div>
                <p className="mt-5 text-sm font-bold text-[var(--color-text-secondary)]">
                  {item.label}
                </p>
                <p className="mt-1 text-3xl font-black tabular-nums">{item.value}</p>
                <p className="mt-2 text-xs font-bold text-[var(--color-text-muted)]">
                  {item.detail} خلال الفترة
                </p>
              </article>
            );
          })}
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-[1.55fr_1fr]">
          <article className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-black">حركة النمو</h2>
                <p className="mt-1 text-sm font-medium text-[var(--color-text-secondary)]">
                  تسجيل مستخدمين وإنشاء حملات جديدة
                </p>
              </div>
              <div className="flex gap-4 text-xs font-bold">
                <span className="flex items-center gap-2">
                  <i className="h-2.5 w-2.5 rounded-full bg-[var(--color-brand)]" />{" "}
                  مستخدمون
                </span>
                <span className="flex items-center gap-2">
                  <i className="h-2.5 w-2.5 rounded-full bg-[var(--color-text)]/75" />{" "}
                  حملات
                </span>
              </div>
            </div>
            <MiniChart data={data.timeline} />
            <div className="sr-only">أعلى قيمة في الرسم {peak}</div>
          </article>
          <article className="rounded-3xl bg-[#082c20] p-6 text-white shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black">صحة المنصة</h2>
                <p className="mt-1 text-sm text-white/65">مؤشرات تشغيلية مباشرة</p>
              </div>
              <TrendingUpIcon className="text-[var(--color-brand)]" size={30} />
            </div>
            <div className="mt-8 space-y-6">
              <div>
                <p className="text-xs font-bold text-white/60">نسبة المستخدمين النشطين</p>
                <p className="mt-1 text-3xl font-black">
                  {data.overview.totalUsers
                    ? (
                        (data.overview.activeUsers / data.overview.totalUsers) *
                        100
                      ).toFixed(1)
                    : "0.0"}
                  %
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-white/8 p-4">
                  <p className="text-xs text-white/60">صنّاع محتوى</p>
                  <p className="mt-1 text-2xl font-black">
                    {formatCount(data.overview.creators)}
                  </p>
                </div>
                <div className="rounded-2xl bg-white/8 p-4">
                  <p className="text-xs text-white/60">تجار وعلامات</p>
                  <p className="mt-1 text-2xl font-black">
                    {formatCount(data.overview.brands)}
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between border-t border-white/10 pt-4 text-sm">
                <span className="text-white/65">حسابات مقيّدة</span>
                <strong>{formatCount(data.overview.restrictedUsers)}</strong>
              </div>
            </div>
          </article>
        </div>

        <div className="mt-6">
          <div className="mb-4 flex items-end justify-between">
            <div>
              <h2 className="text-2xl font-black">المركز المالي</h2>
              <p className="mt-1 text-sm font-medium text-[var(--color-text-secondary)]">
                كل عملة محسوبة بصورة مستقلة
              </p>
            </div>
            <span className="hidden rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-blue-800 sm:block">
              عمولة المنصة: {data.commissionPercent}%
            </span>
          </div>
          <div className="grid gap-5 xl:grid-cols-2">
            {(["IQD", "USD"] as const).map((currency) => {
              const item = data.money[currency];
              const financialItems: Array<[string, string | number, typeof WalletIcon]> =
                [
                  ["تمويل معتمد", item.approvedDeposits, WalletIcon],
                  ["سحب مدفوع", item.approvedPayouts, BanknoteIcon],
                  ["أرباح متاحة للصناع", item.availableEarnings, BriefcaseIcon],
                  ["إيداع معلّق", item.pendingDeposits, WalletIcon],
                  ["سحب معلّق", item.pendingPayouts, BanknoteIcon],
                  ["ميزانيات محجوزة", item.reservedBudgets, MegaphoneIcon],
                ];
              return (
                <article
                  key={currency}
                  className="overflow-hidden rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm"
                >
                  <div className="flex items-center justify-between border-b border-[var(--color-border)] p-5">
                    <div className="flex items-center gap-3">
                      <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[var(--color-brand)]">
                        <RevenueIcon />
                      </span>
                      <div>
                        <h3 className="font-black">
                          {currency === "IQD" ? "الدينار العراقي" : "الدولار الأمريكي"}
                        </h3>
                        <p className="text-xs font-bold text-[var(--color-text-muted)]">
                          {currency}
                        </p>
                      </div>
                    </div>
                    <div className="text-end">
                      <p className="text-xs font-bold text-[var(--color-text-muted)]">
                        إيراد المنصة الفعلي
                      </p>
                      <p className="text-xl font-black">
                        {formatMoney(String(item.platformRevenue), currency)}
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-px bg-[var(--color-border)] sm:grid-cols-3">
                    {financialItems.map(([label, value, Icon]) => (
                      <div key={String(label)} className="bg-[var(--color-surface)] p-4">
                        <Icon size={17} className="mb-3 text-[var(--color-text-muted)]" />
                        <p className="text-[11px] font-bold text-[var(--color-text-secondary)]">
                          {String(label)}
                        </p>
                        <p className="mt-1 text-base font-black tabular-nums">
                          {formatMoney(String(value), currency)}
                        </p>
                      </div>
                    ))}
                  </div>
                </article>
              );
            })}
          </div>
          <p className="mt-3 text-xs font-medium text-[var(--color-text-muted)]">
            ملاحظة: التمويل المعتمد هو أموال مودعة للحملات وليس ربحاً. إيراد المنصة يعرض
            فقط العمولة المسجلة في دفتر الحسابات.
          </p>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          <article className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm lg:col-span-2">
            <h2 className="text-xl font-black">أداء المحتوى والمشاهدات</h2>
            <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
              جودة المشاهدات ومسار اعتماد المشاركات
            </p>
            <div className="mt-7 grid gap-7 sm:grid-cols-2">
              <div className="space-y-5">
                <ProgressRow
                  label="مشاهدات مؤهلة"
                  value={Number(data.performance.qualifiedViews)}
                  total={Number(data.performance.observedViews)}
                />
                <ProgressRow
                  label="مشاهدات مستبعدة"
                  value={Number(data.performance.disqualifiedViews)}
                  total={Number(data.performance.observedViews)}
                  color="bg-red-400"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-[var(--color-surface-muted)] p-4">
                  <p className="text-xs font-bold text-[var(--color-text-secondary)]">
                    لقطات القياس
                  </p>
                  <p className="mt-2 text-2xl font-black">
                    {formatCount(data.performance.snapshots)}
                  </p>
                </div>
                <div className="rounded-2xl bg-[var(--color-surface-muted)] p-4">
                  <p className="text-xs font-bold text-[var(--color-text-secondary)]">
                    حسابات موثقة
                  </p>
                  <p className="mt-2 text-2xl font-black">
                    {formatCount(data.performance.verifiedSocialAccounts)}
                  </p>
                </div>
                <div className="rounded-2xl bg-[var(--color-surface-muted)] p-4">
                  <p className="text-xs font-bold text-[var(--color-text-secondary)]">
                    مشاركات معلّقة
                  </p>
                  <p className="mt-2 text-2xl font-black">
                    {formatCount(data.performance.pendingSubmissions)}
                  </p>
                </div>
                <div className="rounded-2xl bg-[var(--color-surface-muted)] p-4">
                  <p className="text-xs font-bold text-[var(--color-text-secondary)]">
                    اشتراكات الحملات
                  </p>
                  <p className="mt-2 text-2xl font-black">
                    {formatCount(data.overview.memberships)}
                  </p>
                </div>
              </div>
            </div>
          </article>
          <article className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-black">المخاطر</h2>
              <ShieldAlertIcon className="text-red-500" />
            </div>
            <div className="mt-6 space-y-3">
              {[
                ["نزاعات مفتوحة", data.risk.openDisputes, "/admin/disputes"],
                ["حالات احتيال مفتوحة", data.risk.openFraud, "/admin/fraud"],
                ["خطورة عالية", data.risk.highRiskFraud, "/admin/fraud"],
              ].map(([label, value, href]) => (
                <Link
                  key={String(label)}
                  href={String(href)}
                  className="flex items-center justify-between rounded-2xl bg-[var(--color-surface-muted)] p-4 transition hover:-translate-y-0.5"
                >
                  <span className="text-sm font-bold">{String(label)}</span>
                  <span
                    className={`grid min-w-9 place-items-center rounded-full px-2 py-1 text-sm font-black ${Number(value) ? "bg-red-100 text-red-800" : "bg-emerald-100 text-emerald-800"}`}
                  >
                    {String(value)}
                  </span>
                </Link>
              ))}
            </div>
          </article>
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-2">
          <article className="overflow-hidden rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm">
            <div className="flex items-center justify-between border-b border-[var(--color-border)] p-5">
              <div>
                <h2 className="text-lg font-black">أحدث المستخدمين</h2>
                <p className="text-xs text-[var(--color-text-muted)]">
                  آخر الحسابات المسجلة
                </p>
              </div>
              <Link href="/admin/users" className="text-sm font-black underline">
                عرض الكل
              </Link>
            </div>
            <div className="divide-y divide-[var(--color-border)]">
              {data.recentUsers.map((item) => (
                <Link
                  key={item.id}
                  href={`/admin/users/${item.id}`}
                  className="flex items-center justify-between gap-4 p-4 hover:bg-[var(--color-surface-muted)]"
                >
                  <div className="min-w-0">
                    <p className="truncate font-black">{item.fullName}</p>
                    <p className="mt-1 text-xs font-bold text-[var(--color-text-muted)]">
                      {statusLabels[item.role] ?? item.role} ·{" "}
                      {statusLabels[item.status] ?? item.status}
                    </p>
                  </div>
                  <time className="shrink-0 text-xs text-[var(--color-text-muted)]">
                    {item.createdAt.toLocaleDateString("ar-IQ", {
                      numberingSystem: "latn",
                    })}
                  </time>
                </Link>
              ))}
            </div>
          </article>
          <article className="overflow-hidden rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm">
            <div className="border-b border-[var(--color-border)] p-5">
              <h2 className="text-lg font-black">سجل نشاط الإدارة</h2>
              <p className="text-xs text-[var(--color-text-muted)]">
                آخر الإجراءات الحساسة المسجلة
              </p>
            </div>
            <div className="divide-y divide-[var(--color-border)]">
              {data.recentAuditLogs.length ? (
                data.recentAuditLogs.slice(0, 5).map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-4 p-4"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-black">
                        {auditLabels[item.action] ?? item.action}
                      </p>
                      <p className="mt-1 truncate text-xs text-[var(--color-text-muted)]">
                        {item.actorEmail ?? "النظام"} · {item.targetType}
                      </p>
                    </div>
                    <time className="shrink-0 text-xs text-[var(--color-text-muted)]">
                      {item.createdAt.toLocaleDateString("ar-IQ", {
                        numberingSystem: "latn",
                      })}
                    </time>
                  </div>
                ))
              ) : (
                <p className="p-8 text-center text-sm font-bold text-[var(--color-text-muted)]">
                  لا يوجد نشاط مسجل بعد
                </p>
              )}
            </div>
          </article>
        </div>

        <p className="mt-6 text-center text-xs font-medium text-[var(--color-text-muted)]">
          آخر تحديث:{" "}
          {new Date(data.generatedAt).toLocaleString("ar-IQ", {
            numberingSystem: "latn",
          })}
        </p>
      </section>
    </main>
  );
}
