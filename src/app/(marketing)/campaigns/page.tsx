import { prisma } from "../../../lib/prisma";
import {
  CampaignCategory,
  CampaignStatus,
  Platform,
} from "../../../generated/prisma/enums";
import { categoryLabels, platformLabels } from "../../../lib/campaigns";
import { CampaignCard } from "../../../components/campaigns/CampaignCard";
import { CampaignFilters } from "../../../components/campaigns/CampaignFilters";
import { getCurrentUser } from "../../../lib/auth/session";
import { DashboardHeader } from "../../../components/layout/DashboardHeader";
import type { Prisma } from "../../../generated/prisma/client";

export const metadata = {
  title: "استكشف الحملات — خلّيها ترند",
};

type SearchParams = Promise<{ platform?: string; category?: string; search?: string }>;

type TopCreator = Prisma.CreatorProfileGetPayload<{
  include: {
    user: { select: { fullName: true } };
    socialAccounts: { select: { platform: true; handle: true } };
  };
}>;

type TopBrand = Prisma.BrandProfileGetPayload<{
  include: {
    campaigns: true;
  };
}>;

async function loadCampaigns(filters: {
  platform?: string;
  category?: string;
  search?: string;
}) {
  const isValidPlatform = filters.platform && filters.platform in platformLabels;
  const isValidCategory = filters.category && filters.category in categoryLabels;

  return prisma.campaign.findMany({
    where: {
      status: CampaignStatus.ACTIVE,
      ...(isValidPlatform
        ? { rates: { some: { platform: filters.platform as Platform } } }
        : {}),
      ...(isValidCategory ? { category: filters.category as CampaignCategory } : {}),
      ...(filters.search
        ? { title: { contains: filters.search, mode: "insensitive" as const } }
        : {}),
    },
    include: { brand: true, rates: true },
    orderBy: { totalBudget: "desc" },
    take: 60,
  });
}

function getDashboardRole(role: string): "creator" | "brand" | "admin" | null {
  if (role === "CREATOR") return "creator";
  if (role === "BRAND") return "brand";
  if (role === "ADMIN" || role === "SUPER_ADMIN") return "admin";
  return null;
}

function LeaderboardSection({
  topCreators,
  topBrands,
}: {
  topCreators: TopCreator[];
  topBrands: TopBrand[];
}) {
  return (
    <div className="space-y-6">
      {/* Top Creators Card */}
      <div className="card border border-[rgba(214,246,29,0.2)] bg-[var(--color-surface-dark)] p-5 rounded-[var(--radius-xl)] shadow-[var(--shadow-brand)]">
        <h3 className="text-sm font-black text-[var(--color-text)] flex items-center gap-2 mb-4 border-b border-[rgba(200,214,206,0.1)] pb-3">
          <span>🏆</span>
          <span>لوحة شرف صناع المحتوى</span>
        </h3>

        {topCreators.length === 0 ? (
          <p className="text-xs text-[var(--color-text-muted)] text-center py-4">
            لا يوجد صناع محتوى مسجلين حالياً.
          </p>
        ) : (
          <ol className="space-y-3">
            {topCreators.map((creator, index) => {
              const score = creator.trustScore;
              const level =
                score >= 80 ? "🏆 ذهبي" : score >= 60 ? "⚡ محترف" : "🌱 مبتدئ";
              const levelColor =
                score >= 80
                  ? "text-[var(--color-text-on-brand)] bg-[var(--color-brand)]"
                  : score >= 60
                    ? "text-[var(--color-text-on-dark)] bg-[var(--forest-500)]"
                    : "text-[var(--color-text)] bg-[var(--color-surface)]";
              const rankIcon =
                index === 0
                  ? "🥇"
                  : index === 1
                    ? "🥈"
                    : index === 2
                      ? "🥉"
                      : `#${index + 1}`;

              return (
                <li
                  key={creator.id}
                  className="flex items-center justify-between gap-3 text-xs bg-[rgba(250,252,251,0.03)] p-2.5 rounded-[var(--radius-md)] border border-[rgba(200,214,206,0.06)] hover:border-[rgba(214,246,29,0.15)] transition-all"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--color-brand)] font-mono text-xs font-black text-[var(--color-text-on-brand)]">
                      {rankIcon}
                    </span>
                    <div className="min-w-0">
                      <h4 className="font-extrabold text-[var(--color-text)] truncate">
                        {creator.user.fullName}
                      </h4>
                      <p className="text-[9px] text-[var(--color-text-secondary)] mt-0.5 truncate">
                        {creator.socialAccounts.length > 0
                          ? creator.socialAccounts
                              .map((account) => `@${account.handle}`)
                              .join(", ")
                          : "لا توجد حسابات موثقة"}
                      </p>
                    </div>
                  </div>
                  <div className="text-left flex-shrink-0 flex flex-col items-end gap-1">
                    <span className="text-[10px] font-black text-[var(--color-brand)]">
                      {score} نقطة
                    </span>
                    <span
                      className={`text-[8px] px-1.5 py-0.5 rounded font-black ${levelColor}`}
                    >
                      {level}
                    </span>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </div>

      {/* Top Brands Card */}
      <div className="card border border-[rgba(200,214,206,0.12)] bg-[rgba(250,252,251,0.03)] p-5 rounded-[var(--radius-xl)] shadow-[var(--shadow-sm)]">
        <h3 className="text-sm font-black text-[var(--color-text)] flex items-center gap-2 mb-4 border-b border-[rgba(200,214,206,0.1)] pb-3">
          <span>🤝</span>
          <span>الشركاء الأكثر تفاعلاً</span>
        </h3>

        {topBrands.length === 0 ? (
          <p className="text-xs text-[var(--color-text-muted)] text-center py-4">
            لا توجد علامات تجارية موثقة حالياً.
          </p>
        ) : (
          <ul className="space-y-3.5">
            {topBrands.map((brand, index) => {
              const activeCount = brand.campaigns.length;
              return (
                <li
                  key={brand.id}
                  className="flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="h-5 w-5 rounded bg-[var(--forest-600)] text-[var(--color-brand)] flex items-center justify-center font-bold text-[10px]">
                      {index + 1}
                    </span>
                    <div className="min-w-0">
                      <h4 className="font-bold text-[var(--color-text)] flex items-center gap-1.5 truncate">
                        <span>{brand.name}</span>
                        <svg
                          width="10"
                          height="10"
                          viewBox="0 0 24 24"
                          fill="none"
                          className="text-[var(--color-brand)]"
                        >
                          <circle cx="12" cy="12" r="10" fill="currentColor" />
                          <path
                            d="M8 12.5l2.5 2.5L16 9"
                            stroke="var(--forest-900)"
                            strokeWidth="3"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </h4>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold bg-[rgba(214,246,29,0.1)] text-[var(--color-brand-active)] px-2 py-0.5 rounded-full flex-shrink-0">
                    {activeCount} حملات
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

export default async function CampaignsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { platform, category, search } = await searchParams;

  let campaigns: Awaited<ReturnType<typeof loadCampaigns>> = [];
  let loadError = false;

  try {
    campaigns = await loadCampaigns({ platform, category, search });
  } catch {
    loadError = true;
  }

  const toCardData = (campaign: (typeof campaigns)[number]) => ({
    id: campaign.id,
    title: campaign.title,
    category: campaign.category,
    thumbnailUrl: campaign.thumbnailUrl,
    currency: campaign.currency,
    totalBudget: campaign.totalBudget,
    reservedBudget: campaign.reservedBudget,
    brand: { name: campaign.brand.name, verified: Boolean(campaign.brand.verifiedAt) },
    rates: campaign.rates,
  });

  const featured = campaigns.slice(0, 3);
  const rest = campaigns.slice(3);

  const user = await getCurrentUser();
  const dashboardRole = user ? getDashboardRole(user.role) : null;
  const userLabel = user
    ? dashboardRole === "creator"
      ? `صانع محتوى: ${user.fullName}`
      : dashboardRole === "brand"
        ? `تاجر: ${user.fullName}`
        : `مشرف: ${user.fullName}`
    : "";

  // Fetch top creators and brands for Whop-style Leaderboard
  const topCreators = await prisma.creatorProfile
    .findMany({
      take: 5,
      orderBy: { trustScore: "desc" },
      include: {
        user: {
          select: { fullName: true },
        },
        socialAccounts: {
          where: { status: "VERIFIED" },
          select: { platform: true, handle: true },
        },
      },
    })
    .catch(() => []);

  const topBrandsRaw = await prisma.brandProfile
    .findMany({
      take: 5,
      where: { verifiedAt: { not: null } },
      include: {
        campaigns: {
          where: { status: "ACTIVE" },
        },
      },
    })
    .catch(() => []);

  const topBrands = [...topBrandsRaw].sort(
    (a, b) => b.campaigns.length - a.campaigns.length,
  );

  return (
    <main
      className={`bg-[var(--color-bg)] text-[var(--color-text)] dir-rtl ${
        dashboardRole
          ? "min-h-screen md:ps-64 pb-20 md:pb-0"
          : "mx-auto max-w-7xl px-5 py-12 lg:px-8"
      }`}
    >
      {dashboardRole && (
        <DashboardHeader dashboardRole={dashboardRole} userLabel={userLabel} />
      )}

      <div className={dashboardRole ? "mx-auto max-w-7xl px-5 py-12 lg:px-8" : ""}>
        <div className="mb-8">
          <span
            className="fade-in-up mb-3 inline-flex items-center gap-1.5 rounded-[var(--radius-pill)] bg-[var(--color-surface-muted)] px-3 py-1 text-xs font-bold text-[var(--color-brand-active)]"
            style={{ animationDelay: "0ms" }}
          >
            <span
              className="h-1.5 w-1.5 rounded-full bg-[var(--color-brand)]"
              aria-hidden="true"
            />
            {campaigns.length > 0
              ? `${campaigns.length} حملة نشطة الآن`
              : "الحملات النشطة"}
          </span>
          <h1
            className="fade-in-up mb-2 text-3xl font-extrabold"
            style={{ animationDelay: "40ms" }}
          >
            استكشف الحملات المتاحة
          </h1>
          <p
            className="fade-in-up font-medium text-[var(--color-text-secondary)]"
            style={{ animationDelay: "80ms" }}
          >
            حملات نشطة ومموّلة من علامات تجارية عراقية. انضم بعد تحقق الأهلية وشروط كل
            حملة.
          </p>
        </div>

        <div className="fade-in-up" style={{ animationDelay: "120ms" }}>
          <CampaignFilters
            categoryOptions={Object.entries(categoryLabels).map(([value, label]) => ({
              value,
              label,
            }))}
            platformOptions={Object.entries(platformLabels).map(([value, label]) => ({
              value,
              label,
            }))}
          />
        </div>

        {/* 2-Column Layout: Campaigns + Whop Leaderboard */}
        <div className="grid gap-8 lg:grid-cols-[1fr_300px] mt-8">
          {/* Column 1: Campaigns */}
          <div className="space-y-10">
            {loadError && (
              <div className="card border border-[var(--color-border)] bg-[var(--color-surface)] p-8 text-center">
                <p className="font-bold text-[var(--color-text)]">
                  تعذّر الاتصال بقاعدة البيانات حالياً.
                </p>
                <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
                  حاول تحديث الصفحة بعد قليل.
                </p>
              </div>
            )}

            {!loadError && campaigns.length === 0 && (
              <div className="card border border-[var(--color-border)] bg-[var(--color-surface)] p-8 text-center">
                <p className="font-bold text-[var(--color-text)]">
                  لا توجد حملات نشطة متاحة حالياً.
                </p>
                <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
                  عد لاحقاً أو سجّل كصانع محتوى لتصلك إشعارات الحملات الجديدة.
                </p>
              </div>
            )}

            {!loadError && featured.length > 0 && (
              <div>
                <h2 className="mb-4 flex items-center gap-2 text-lg font-extrabold text-[var(--color-text)]">
                  <span
                    className="h-1.5 w-1.5 rounded-full bg-[var(--color-brand)]"
                    aria-hidden="true"
                  />
                  الحملات المميزة
                </h2>
                <div className="grid gap-6 md:grid-cols-2">
                  {featured.map((campaign, index) => (
                    <div
                      key={campaign.id}
                      className="fade-in-up"
                      style={{ animationDelay: `${index * 70}ms` }}
                    >
                      <CampaignCard campaign={toCardData(campaign)} featured />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!loadError && rest.length > 0 && (
              <div>
                <h2 className="mb-4 text-lg font-extrabold text-[var(--color-text)]">
                  كل الحملات
                </h2>
                <div className="grid gap-6 md:grid-cols-2">
                  {rest.map((campaign, index) => (
                    <div
                      key={campaign.id}
                      className="fade-in-up"
                      style={{ animationDelay: `${Math.min(index * 60, 420)}ms` }}
                    >
                      <CampaignCard campaign={toCardData(campaign)} />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Column 2: Leaderboard (Visible in desktop) */}
          <div className="hidden lg:block">
            <div className="sticky top-24">
              <LeaderboardSection topCreators={topCreators} topBrands={topBrands} />
            </div>
          </div>
        </div>

        {/* Mobile Leaderboard (Visible at bottom on mobile) */}
        <div className="block lg:hidden mt-12">
          <LeaderboardSection topCreators={topCreators} topBrands={topBrands} />
        </div>
      </div>
    </main>
  );
}
