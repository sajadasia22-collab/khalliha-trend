import { prisma } from "../../../lib/prisma";
import {
  CampaignCategory,
  CampaignStatus,
  Platform,
} from "../../../generated/prisma/enums";
import { categoryLabels, platformLabels } from "../../../lib/campaigns";
import { CampaignCard } from "../../../components/campaigns/CampaignCard";
import { CampaignFilters } from "../../../components/campaigns/CampaignFilters";

export const metadata = {
  title: "استكشف الحملات — خلّيها ترند",
};

type SearchParams = Promise<{ platform?: string; category?: string; search?: string }>;

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

  return (
    <main className="mx-auto max-w-7xl px-5 py-12 lg:px-8">
      <div className="mb-8">
        <span
          className="fade-in-up mb-3 inline-flex items-center gap-1.5 rounded-[var(--radius-pill)] bg-[var(--color-surface-muted)] px-3 py-1 text-xs font-bold text-[var(--color-brand-active)]"
          style={{ animationDelay: "0ms" }}
        >
          <span
            className="h-1.5 w-1.5 rounded-full bg-[var(--color-brand)]"
            aria-hidden="true"
          />
          {campaigns.length > 0 ? `${campaigns.length} حملة نشطة الآن` : "الحملات النشطة"}
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
          حملات نشطة ومموّلة من علامات تجارية عراقية. انضم بعد تحقق الأهلية وشروط كل حملة.
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
        <div className="mb-10">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-extrabold text-[var(--color-text)]">
            <span
              className="h-1.5 w-1.5 rounded-full bg-[var(--color-brand)]"
              aria-hidden="true"
            />
            الحملات المميزة
          </h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
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
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
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
    </main>
  );
}
