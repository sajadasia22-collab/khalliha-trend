import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "../../../lib/prisma";
import { CampaignStatus, Platform } from "../../../generated/prisma/enums";
import {
  categoryLabels,
  platformLabels,
  platformIcons,
  formatBudget,
  budgetProgress,
  detectAssetSource,
  assetSourceLabels,
  assetSourceIcons,
} from "../../../lib/campaigns";
import { ButtonLink } from "../../../components/ui/button";
import {
  CheckIcon,
  ArrowStartIcon,
  ArrowUpRightIcon,
  WalletIcon,
  UsersIcon,
  VideoIcon,
  EyeIcon,
  BanknoteIcon,
} from "../../../components/ui/icons";
import { getCurrentUser } from "../../../lib/auth/session";
import { MembershipService } from "../../../modules/memberships/service";
import { SocialAccountService } from "../../../modules/social-accounts/service";
import { CampaignJoinAndSubmit } from "../../../components/campaigns/CampaignJoinAndSubmit";
import { DashboardHeader } from "../../../components/layout/DashboardHeader";
import { Navbar } from "../../../components/layout/Navbar";
import { Footer } from "../../../components/layout/Footer";

type DashboardRole = "creator" | "brand" | "admin" | null;

function getDashboardRole(role: string): DashboardRole {
  if (role === "CREATOR") return "creator";
  if (role === "BRAND") return "brand";
  if (role === "ADMIN" || role === "SUPER_ADMIN") return "admin";
  return null;
}

/** Wraps the page body in the right chrome: dashboard sidebar for logged-in
 * users, public Navbar/Footer for everyone else. Kept in one place so the
 * error branch and the happy path can't drift into showing both at once —
 * campaigns/ lives outside (marketing) precisely so this is the only header
 * either state ever renders. */
function PageChrome({
  dashboardRole,
  userLabel,
  children,
}: {
  dashboardRole: DashboardRole;
  userLabel: string;
  children: React.ReactNode;
}) {
  if (dashboardRole) {
    return (
      <main className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)] dir-rtl md:ps-64 pb-20 md:pb-0">
        <DashboardHeader dashboardRole={dashboardRole} userLabel={userLabel} />
        <div className="mx-auto max-w-6xl px-5 py-10 lg:px-8">{children}</div>
      </main>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-[var(--color-bg)] text-[var(--color-text)]">
      <Navbar />
      <main className="flex-1 dir-rtl">
        <div className="mx-auto max-w-6xl px-5 py-10 lg:px-8">{children}</div>
      </main>
      <Footer />
    </div>
  );
}

function BackLink() {
  return (
    <Link
      href="/campaigns"
      className="group mb-6 inline-flex items-center gap-1.5 text-sm font-bold text-[var(--color-text-secondary)] transition-colors duration-150 hover:text-[var(--forest-700)]"
    >
      <ArrowStartIcon
        size={16}
        strokeWidth={2}
        className="transition-transform duration-200 ease-[cubic-bezier(.2,.8,.2,1)] group-hover:translate-x-0.5 rtl:rotate-180"
      />
      العودة لقائمة الحملات
    </Link>
  );
}

export default async function CampaignDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();
  const dashboardRole = user ? getDashboardRole(user.role) : null;
  const userLabel = user
    ? dashboardRole === "creator"
      ? `صانع محتوى: ${user.fullName}`
      : dashboardRole === "brand"
        ? `تاجر: ${user.fullName}`
        : `مشرف: ${user.fullName}`
    : "";

  let campaign;
  try {
    campaign = await prisma.campaign.findFirst({
      where: { id, status: CampaignStatus.ACTIVE },
      include: { brand: true, rates: true, assets: true },
    });
  } catch {
    return (
      <PageChrome dashboardRole={dashboardRole} userLabel={userLabel}>
        <div className="card border border-[var(--color-border)] bg-[var(--color-surface)] p-8 text-center">
          <p className="font-bold text-[var(--color-text)]">
            تعذّر الاتصال بقاعدة البيانات حالياً.
          </p>
          <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
            حاول تحديث الصفحة بعد قليل.
          </p>
        </div>
      </PageChrome>
    );
  }

  if (!campaign) {
    notFound();
  }

  let isJoined = false;
  let verifiedSocialAccounts: Array<{
    id: string;
    platform: Platform;
    handle: string;
    profileUrl: string;
  }> = [];
  let initialSubmissions: Array<{
    id: string;
    platform: Platform;
    postUrl: string;
    platformPostId: string;
    status: string;
    rejectionReason: string | null;
    reviewNote: string | null;
    createdAt: string;
    socialAccount?: {
      handle: string;
    };
  }> = [];

  if (user && user.role === "CREATOR") {
    const membership = await MembershipService.getMembership(user.id, campaign.id);
    isJoined = !!membership;

    const accounts = await SocialAccountService.listForUser(user.id);
    verifiedSocialAccounts = accounts.filter((acc) => acc.status === "VERIFIED");

    if (isJoined && membership) {
      const rawSubs = await prisma.submission.findMany({
        where: { campaignMembershipId: membership.id },
        include: { socialAccount: true },
        orderBy: { createdAt: "desc" },
      });
      initialSubmissions = rawSubs.map((sub) => ({
        ...sub,
        createdAt: sub.createdAt.toISOString(),
      }));
    }
  }

  const progress = budgetProgress(campaign.reservedBudget, campaign.totalBudget);
  const maxReward = campaign.rates.reduce(
    (max, rate) => (rate.maximumReward > max ? rate.maximumReward : max),
    0n,
  );

  const howToEarnSteps = [
    { icon: UsersIcon, text: "انضم للحملة بعد ما تتحقق أهليتك" },
    { icon: VideoIcon, text: "انشر فيديو على المنصة وأرسل رابطه" },
    { icon: WalletIcon, text: "استلم أرباحك بمحفظتك بعد اعتماد المشاهدات" },
  ];

  const actionPanel = user ? (
    user.role === "CREATOR" ? (
      <CampaignJoinAndSubmit
        campaignId={campaign.id}
        minTrustScore={campaign.minTrustScore}
        creatorTrustScore={user.creatorProfile?.trustScore ?? 50}
        rates={campaign.rates.map((rate) => ({ platform: rate.platform }))}
        isInitiallyJoined={isJoined}
        verifiedSocialAccounts={verifiedSocialAccounts.map((acc) => ({
          id: acc.id,
          platform: acc.platform,
          handle: acc.handle,
          profileUrl: acc.profileUrl,
        }))}
        initialSubmissions={initialSubmissions}
      />
    ) : (
      <div className="card border border-[var(--color-border)] bg-[var(--color-surface)] p-6 text-center text-sm font-bold text-[var(--color-text-secondary)]">
        أنت مسجل كـ {user.role === "BRAND" ? "علامة تجارية" : "مسؤول نظام"}. فقط صناع
        المحتوى يمكنهم الانضمام وتقديم منشورات للحملات.
      </div>
    )
  ) : (
    <div className="surface-dark-3d rounded-[var(--radius-xl)] p-6 text-[var(--color-text-on-dark)]">
      <h2 className="text-lg font-bold text-[var(--color-brand)]">
        مهتم بالانضمام لهذه الحملة؟
      </h2>
      <p className="mt-2 text-sm font-medium leading-relaxed text-[var(--forest-100)]">
        سجّل كصانع محتوى لإكمال ملفك الشخصي وربط حساباتك، ثم انضم للحملة بعد تحقق الأهلية.
      </p>
      <ButtonLink
        className="mt-5 flex w-full items-center justify-center"
        href="/register"
      >
        سجّل كصانع محتوى
      </ButtonLink>
    </div>
  );

  return (
    <PageChrome dashboardRole={dashboardRole} userLabel={userLabel}>
      <BackLink />

      <div className="relative mb-6">
        {campaign.thumbnailUrl ? (
          // thumbnailUrl is an unrestricted external URL (no host allowlist), so next/image's
          // remotePatterns would need to accept any host — that turns the optimizer into an
          // open image proxy. Plain <img> avoids that risk.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={campaign.thumbnailUrl}
            alt={campaign.title}
            loading="eager"
            fetchPriority="high"
            decoding="async"
            className="fade-in-up aspect-[21/9] w-full rounded-[var(--radius-lg)] object-cover shadow-[var(--shadow-lg)]"
          />
        ) : (
          <div
            className="fade-in-up aspect-[21/9] w-full rounded-[var(--radius-lg)]"
            style={{
              background: "linear-gradient(135deg, var(--trend-300), var(--forest-700))",
            }}
            aria-hidden="true"
          />
        )}
        <span
          className="fade-in-up absolute end-4 top-4 rounded-[var(--radius-pill)] bg-[rgba(6,38,25,0.55)] px-3 py-1 text-xs font-bold text-[var(--mist-50)] backdrop-blur-sm"
          style={{ animationDelay: "60ms" }}
        >
          {categoryLabels[campaign.category]}
        </span>
      </div>

      <h1
        className="fade-in-up text-2xl font-extrabold text-[var(--color-text)] md:text-3xl"
        style={{ animationDelay: "100ms" }}
      >
        {campaign.title}
      </h1>
      <p className="mt-2 flex items-center gap-1.5 text-sm font-semibold text-[var(--color-text-secondary)]">
        {campaign.brand.name}
        {campaign.brand.verifiedAt && (
          <span className="icon-3d h-5 w-5 rounded-full" aria-label="علامة موثّقة">
            <CheckIcon size={12} strokeWidth={3} />
          </span>
        )}
      </p>

      <div
        className="fade-in-up mt-6 flex flex-col items-start gap-4 rounded-[var(--radius-xl)] border border-[rgba(214,246,29,0.35)] bg-[rgba(214,246,29,0.1)] p-5 sm:flex-row sm:items-center"
        style={{ animationDelay: "140ms" }}
      >
        <span className="icon-3d h-14 w-14 shrink-0 rounded-[var(--radius-lg)]">
          <WalletIcon size={26} />
        </span>
        <div>
          <p className="text-sm font-bold text-[var(--forest-800)]">
            أقصى مبلغ تقدر تربحه من فيديو واحد بهذه الحملة
          </p>
          <p className="text-3xl font-black text-[var(--forest-900)] md:text-4xl">
            {formatBudget(maxReward, campaign.currency)}
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        {howToEarnSteps.map((step, index) => (
          <div
            key={step.text}
            className="fade-in-up flex items-center gap-3 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 sm:flex-col sm:items-start"
            style={{ animationDelay: `${180 + index * 70}ms` }}
          >
            <span className="icon-3d h-9 w-9 shrink-0 rounded-full text-sm font-black">
              {index + 1}
            </span>
            <p className="text-sm font-bold leading-relaxed text-[var(--color-text)] sm:mt-3">
              <step.icon size={16} className="me-1.5 inline-block align-[-3px]" />
              {step.text}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
        <div className="order-2 min-w-0 lg:order-1">
          <p className="leading-relaxed text-[var(--color-text)]">{campaign.summary}</p>

          {campaign.assets.length > 0 && (
            <div className="mt-8">
              <h2 className="mb-1 text-lg font-extrabold text-[var(--color-text)]">
                مواد الحملة
              </h2>
              <p className="mb-4 text-sm text-[var(--color-text-secondary)]">
                ملفات ومواد وفّرتها العلامة التجارية — طّلع عليها قبل ما تنضم عشان تعرف
                شنو بالضبط لازم تنشر.
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                {campaign.assets.map((asset) => {
                  const source = detectAssetSource(asset.url);
                  const SourceIcon = assetSourceIcons[source];
                  return (
                    <a
                      key={asset.id}
                      href={asset.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="card card-interactive group flex items-center gap-3 border border-[var(--color-border)] bg-[var(--color-surface)] p-4"
                    >
                      <span className="icon-3d h-10 w-10 shrink-0 rounded-[var(--radius-md)]">
                        <SourceIcon className="h-5 w-5" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-extrabold text-[var(--color-text)]">
                          {asset.label}
                        </span>
                        <span className="block text-xs font-semibold text-[var(--color-text-muted)]">
                          {assetSourceLabels[source]}
                        </span>
                      </span>
                      <ArrowUpRightIcon
                        size={16}
                        className="shrink-0 text-[var(--color-text-muted)] transition-colors group-hover:text-[var(--forest-700)]"
                      />
                    </a>
                  );
                })}
              </div>
            </div>
          )}

          <div className="mt-8">
            <h2 className="mb-4 text-lg font-extrabold text-[var(--color-text)]">
              شروط كل منصة بالتفصيل
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {campaign.rates.map((rate) => {
                const PlatformIcon = platformIcons[rate.platform];
                return (
                  <div
                    key={rate.platform}
                    className="card border border-[var(--color-border)] bg-[var(--color-surface)] p-6"
                  >
                    <h3 className="mb-4 flex items-center gap-2 font-extrabold text-[var(--color-text)]">
                      <PlatformIcon className="h-5 w-5 shrink-0" />
                      {platformLabels[rate.platform]}
                    </h3>

                    <div className="space-y-4">
                      <div className="flex items-start gap-3">
                        <EyeIcon
                          size={18}
                          className="mt-0.5 shrink-0 text-[var(--color-text-muted)]"
                        />
                        <p className="text-sm leading-relaxed text-[var(--color-text-secondary)]">
                          لازم يوصل فيديوك لـ{" "}
                          <span className="font-extrabold text-[var(--color-text)]">
                            {rate.minimumQualifiedViews.toLocaleString("ar-IQ", {
                              numberingSystem: "latn",
                            })}
                          </span>{" "}
                          مشاهدة مؤهلة على الأقل عشان تربح.
                        </p>
                      </div>
                      <div className="flex items-start gap-3">
                        <BanknoteIcon
                          size={18}
                          className="mt-0.5 shrink-0 text-[var(--color-text-muted)]"
                        />
                        <p className="text-sm leading-relaxed text-[var(--color-text-secondary)]">
                          تربح{" "}
                          <span className="font-extrabold text-[var(--color-text)]">
                            {formatBudget(rate.cpmMinorUnits, campaign.currency)}
                          </span>{" "}
                          عن كل 1000 مشاهدة مؤهلة.
                        </p>
                      </div>
                      <div className="flex items-start gap-3">
                        <WalletIcon
                          size={18}
                          className="mt-0.5 shrink-0 text-[var(--color-text-muted)]"
                        />
                        <p className="text-sm leading-relaxed text-[var(--color-text-secondary)]">
                          أقصى أرباح تقدر توصلها من الفيديو الواحد:{" "}
                          <span className="font-extrabold text-[var(--color-text)]">
                            {formatBudget(rate.maximumReward, campaign.currency)}
                          </span>
                          .
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <aside className="order-1 lg:order-2">
          <div className="space-y-5 lg:sticky lg:top-24">
            <div className="card border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
              <div className="flex items-baseline justify-between gap-3">
                <h2 className="text-xs font-bold text-[var(--color-text-secondary)]">
                  الميزانية الكلية
                </h2>
                <span className="text-xs font-bold text-[var(--color-brand-active)]">
                  {progress}% محجوزة
                </span>
              </div>
              <p className="mt-1 text-2xl font-black text-[var(--forest-700)]">
                {formatBudget(campaign.totalBudget, campaign.currency)}
              </p>
              <div className="mt-4 h-2 w-full overflow-hidden rounded-[var(--radius-pill)] bg-[var(--color-surface-muted)]">
                <div
                  className="h-full rounded-[var(--radius-pill)] bg-[var(--color-brand)] transition-[width] duration-700 ease-[cubic-bezier(.2,.8,.2,1)]"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="mt-2 text-xs font-semibold text-[var(--color-text-secondary)]">
                {formatBudget(campaign.reservedBudget, campaign.currency)} محجوزة من{" "}
                {formatBudget(campaign.totalBudget, campaign.currency)}
              </p>
            </div>

            {actionPanel}
          </div>
        </aside>
      </div>
    </PageChrome>
  );
}
