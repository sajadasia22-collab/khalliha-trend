import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "../../../../lib/auth/session";
import { CampaignService } from "../../../../modules/campaigns/service";
import { campaignStatusLabels, formatBudget } from "../../../../lib/campaigns";
import { DashboardHeader } from "../../../../components/layout/DashboardHeader";
import { ButtonLink } from "../../../../components/ui/button";

export default async function BrandCampaignsPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const campaigns = await CampaignService.listForBrand(user.id).catch(() => null);

  return (
    <main className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)] dir-rtl md:ps-64 pb-20 md:pb-0">
      <DashboardHeader dashboardRole="brand" userLabel={user.fullName} />

      <section className="mx-auto max-w-7xl px-5 py-12 lg:px-8">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-3xl font-extrabold">حملاتي</h1>
          <ButtonLink href="/brand/campaigns/new">+ حملة جديدة</ButtonLink>
        </div>

        {campaigns === null && (
          <div className="card border border-[var(--color-border)] bg-[var(--color-surface)] p-8 text-center">
            <p className="font-bold text-[var(--color-text)]">
              تعذّر الاتصال بقاعدة البيانات حالياً.
            </p>
          </div>
        )}

        {campaigns !== null && campaigns.length === 0 && (
          <div className="card fade-in-up border border-[var(--color-border)] bg-[var(--color-surface)] p-10 text-center">
            <p className="font-bold text-[var(--color-text)]">لم تُنشئ أي حملة بعد.</p>
            <p className="mt-2 text-sm font-medium text-[var(--color-text-secondary)]">
              أطلق أول حملة لعلامتك وحدد شروطها وميزانيتها وأسعار كل منصة.
            </p>
            <ButtonLink className="mt-6 inline-flex" href="/brand/campaigns/new">
              أنشئ حملتك الأولى
            </ButtonLink>
          </div>
        )}

        {campaigns !== null && campaigns.length > 0 && (
          <div className="space-y-3">
            {campaigns.map((campaign, index) => (
              <Link
                key={campaign.id}
                href={`/brand/campaigns/${campaign.id}`}
                className="card card-interactive fade-in-up flex flex-wrap items-center justify-between gap-3 border border-[var(--color-border)] bg-[var(--color-surface)] p-5"
                style={{ animationDelay: `${Math.min(index * 45, 360)}ms` }}
              >
                <div>
                  <h2 className="font-extrabold text-[var(--color-text)]">
                    {campaign.title}
                  </h2>
                  <p className="mt-1 text-xs font-semibold text-[var(--color-text-secondary)]">
                    {formatBudget(campaign.totalBudget, campaign.currency)}
                  </p>
                </div>
                <span className="rounded-[var(--radius-pill)] bg-[var(--color-surface-muted)] px-3 py-1 text-xs font-bold text-[var(--color-text-secondary)]">
                  {campaignStatusLabels[campaign.status]}
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
