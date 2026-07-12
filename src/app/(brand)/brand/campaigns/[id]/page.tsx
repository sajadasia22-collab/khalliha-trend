import { redirect, notFound } from "next/navigation";
import { getCurrentUser } from "../../../../../lib/auth/session";
import { CampaignService } from "../../../../../modules/campaigns/service";
import {
  campaignStatusLabels,
  formatBudget,
  platformLabels,
} from "../../../../../lib/campaigns";
import { DashboardHeader } from "../../../../../components/layout/DashboardHeader";
import { CampaignForm } from "../../../../../components/brand/CampaignForm";
import { SubmitForReviewButton } from "../../../../../components/brand/SubmitForReviewButton";

export default async function BrandCampaignDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const { id } = await params;
  const campaign = await CampaignService.getForBrand(user.id, id).catch(() => null);
  if (!campaign) {
    notFound();
  }

  const isEditable = campaign.status === "DRAFT" || campaign.status === "NEEDS_CHANGES";

  return (
    <main className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)] dir-rtl md:ps-64 pb-20 md:pb-0">
      <DashboardHeader dashboardRole="brand" userLabel={user.fullName} />

      <section className="mx-auto max-w-4xl px-5 py-12 lg:px-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-3xl font-extrabold">{campaign.title}</h1>
          <span className="rounded-[var(--radius-pill)] bg-[var(--color-surface-muted)] px-3 py-1.5 text-xs font-bold text-[var(--color-text-secondary)]">
            {campaignStatusLabels[campaign.status]}
          </span>
        </div>

        {campaign.reviewNote && (
          <div className="mb-6 rounded-[var(--radius-md)] border border-[var(--trend-300)] bg-[var(--trend-50)] p-4 text-sm font-semibold text-[var(--forest-800)]">
            <span className="mb-1 block text-xs font-black text-[var(--trend-800)]">
              ملاحظة الإدارة
            </span>
            {campaign.reviewNote}
          </div>
        )}

        {isEditable ? (
          <>
            <div className="card mb-6 border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
              <CampaignForm
                mode="edit"
                campaignId={campaign.id}
                initialValues={{
                  title: campaign.title,
                  summary: campaign.summary,
                  terms: campaign.terms,
                  category: campaign.category,
                  thumbnailUrl: campaign.thumbnailUrl ?? "",
                  currency: campaign.currency,
                  totalBudget: campaign.totalBudget.toString(),
                  minTrustScore: campaign.minTrustScore,
                  startsAt: campaign.startsAt
                    ? campaign.startsAt.toISOString().slice(0, 10)
                    : "",
                  endsAt: campaign.endsAt
                    ? campaign.endsAt.toISOString().slice(0, 10)
                    : "",
                  rates: campaign.rates.map((rate) => ({
                    platform: rate.platform,
                    cpmMinorUnits: rate.cpmMinorUnits.toString(),
                    minimumQualifiedViews: rate.minimumQualifiedViews.toString(),
                    maximumReward: rate.maximumReward.toString(),
                  })),
                  assets: campaign.assets.map((asset) => ({
                    url: asset.url,
                    label: asset.label,
                  })),
                }}
              />
            </div>
            <SubmitForReviewButton campaignId={campaign.id} />
          </>
        ) : (
          <div className="space-y-6">
            <div className="card border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
              <p className="leading-relaxed text-[var(--color-text)]">
                {campaign.summary}
              </p>
              <p className="mt-4 text-sm font-extrabold text-[var(--forest-700)]">
                {formatBudget(campaign.totalBudget, campaign.currency)}
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {campaign.rates.map((rate) => (
                <div
                  key={rate.platform}
                  className="card border border-[var(--color-border)] bg-[var(--color-surface)] p-4"
                >
                  <h3 className="font-extrabold text-[var(--color-text)]">
                    {platformLabels[rate.platform]}
                  </h3>
                  <p className="mt-1 text-xs text-[var(--color-text-secondary)]">
                    CPM: {rate.cpmMinorUnits.toString()} {campaign.currency}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
