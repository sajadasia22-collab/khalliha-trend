import Link from "next/link";
import {
  budgetProgress,
  categoryLabels,
  formatBudget,
  lowestCpm,
  platformLabels,
} from "../../lib/campaigns";
import { Platform } from "../../generated/prisma/enums";
import { ArrowUpRightIcon, CheckIcon } from "../ui/icons";

export type CampaignCardData = {
  id: string;
  title: string;
  category: keyof typeof categoryLabels;
  thumbnailUrl: string | null;
  currency: string;
  totalBudget: bigint;
  reservedBudget: bigint;
  brand: { name: string; verified: boolean };
  rates: { platform: Platform; cpmMinorUnits: bigint }[];
};

const gradientByCategory: Record<keyof typeof categoryLabels, string> = {
  PRODUCT: "linear-gradient(135deg, var(--trend-300), var(--forest-600))",
  BEAUTY: "linear-gradient(135deg, var(--trend-200), var(--forest-500))",
  FOOD: "linear-gradient(135deg, var(--trend-400), var(--forest-700))",
  FASHION: "linear-gradient(135deg, var(--trend-300), var(--forest-800))",
  TECH: "linear-gradient(135deg, var(--mist-600), var(--forest-700))",
  ENTERTAINMENT: "linear-gradient(135deg, var(--trend-400), var(--forest-600))",
  GAMING: "linear-gradient(135deg, var(--forest-500), var(--forest-900))",
  OTHER: "linear-gradient(135deg, var(--mist-500), var(--forest-700))",
};

export function CampaignCard({
  campaign,
  featured = false,
}: {
  campaign: CampaignCardData;
  featured?: boolean;
}) {
  const cpm = lowestCpm(campaign.rates);
  const progress = budgetProgress(campaign.reservedBudget, campaign.totalBudget);
  const platforms = campaign.rates.map((rate) => platformLabels[rate.platform]);

  return (
    <div className="tilt-3d">
      <Link
        href={`/campaigns/${campaign.id}`}
        className={`campaign-card-link surface-3d tilt-3d-surface group block overflow-hidden rounded-[var(--radius-lg)] ${featured ? "sm:col-span-1" : ""}`}
      >
        <div
          className="relative flex aspect-[16/9] items-end overflow-hidden p-4"
          style={
            campaign.thumbnailUrl
              ? undefined
              : { background: gradientByCategory[campaign.category] }
          }
        >
          {campaign.thumbnailUrl && (
            // thumbnailUrl is an unrestricted external URL (no host allowlist), so next/image's
            // remotePatterns would need to accept any host — that turns the optimizer into an
            // open image proxy. Plain <img> avoids that risk.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={campaign.thumbnailUrl}
              alt={campaign.title}
              loading="lazy"
              decoding="async"
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 ease-[cubic-bezier(.2,.8,.2,1)] group-hover:scale-110"
            />
          )}
          <span className="absolute end-3 top-3 rounded-[var(--radius-pill)] bg-[rgba(6,38,25,0.55)] px-3 py-1 text-xs font-bold text-[var(--mist-50)] backdrop-blur-sm">
            {categoryLabels[campaign.category]}
          </span>
          {featured && (
            <span className="absolute start-3 top-3 rounded-[var(--radius-pill)] bg-[var(--color-brand)] px-3 py-1 text-xs font-black text-[var(--color-text-on-brand)]">
              مميزة
            </span>
          )}
        </div>

        <div className="p-5">
          <div className="mb-2 flex items-center gap-1.5">
            <span className="text-xs font-bold text-[var(--color-text-secondary)]">
              {campaign.brand.name}
            </span>
            {campaign.brand.verified && (
              <span className="icon-3d h-5 w-5 rounded-full" aria-label="علامة موثّقة">
                <CheckIcon size={12} strokeWidth={3} />
              </span>
            )}
          </div>

          <h3 className="mb-2 line-clamp-2 font-extrabold text-[var(--color-text)]">
            {campaign.title}
          </h3>

          <p className="mb-4 text-xs font-bold text-[var(--color-text-muted)]">
            {platforms.join(" + ")}
          </p>

          {cpm !== null && (
            <p className="mb-3 text-sm font-extrabold text-[var(--forest-700)]">
              {formatBudget(cpm, campaign.currency)} / 1000 مشاهدة
            </p>
          )}

          <div className="mb-1.5 h-2 w-full overflow-hidden rounded-[var(--radius-pill)] bg-[var(--color-surface-muted)]">
            <div
              className="h-full rounded-[var(--radius-pill)] bg-[var(--color-brand)] transition-[width] duration-700 ease-[cubic-bezier(.2,.8,.2,1)]"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="mb-4 text-xs font-semibold text-[var(--color-text-secondary)]">
            {formatBudget(campaign.reservedBudget, campaign.currency)} من{" "}
            {formatBudget(campaign.totalBudget, campaign.currency)}
          </p>

          <span className="btn-primary flex w-full items-center justify-center py-2.5 text-sm">
            <ArrowUpRightIcon size={16} />
            انضم للحملة
          </span>
        </div>
      </Link>
    </div>
  );
}
