import { redirect } from "next/navigation";
import { getCurrentUser } from "../../../../lib/auth/session";
import Link from "next/link";
import { prisma } from "../../../../lib/prisma";
import { EarningSummary } from "../../../../components/creator/EarningSummary";
import { CreatorPayouts } from "../../../../components/creator/CreatorPayouts";
import { CreatorAnalytics } from "../../../../components/creator/CreatorAnalytics";
import { DashboardHeader } from "../../../../components/layout/DashboardHeader";
import { ConnectionErrorCard } from "../../../../components/ui/ConnectionErrorCard";
import { ShieldCheckIcon, MegaphoneIcon } from "../../../../components/ui/icons";
import { ScrollReveal } from "../../../../components/ui/ScrollReveal";

export default async function CreatorDashboard() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const overview = await (async () => {
    const profile = await prisma.creatorProfile.findUnique({
      where: { userId: user.id },
    });

    let joinedCampaignsCount = 0;
    if (profile) {
      joinedCampaignsCount = await prisma.campaignMembership.count({
        where: { creatorProfileId: profile.id },
      });
    }

    return { trustScore: profile?.trustScore ?? 50, joinedCampaignsCount };
  })().catch(() => null);

  return (
    <main className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)] dir-rtl md:ps-64 pb-20 md:pb-0">
      <DashboardHeader
        dashboardRole="creator"
        userLabel={`صانع محتوى: ${user?.fullName}`}
      />

      {/* Main Content */}
      <section className="mx-auto max-w-7xl px-5 py-12 lg:px-8 space-y-10">
        <div>
          <h1 className="fade-in-up mb-2 text-3xl font-extrabold">
            أهلاً بك، {user?.fullName} 👋
          </h1>
          <p
            className="fade-in-up font-medium text-[var(--color-text-secondary)]"
            style={{ animationDelay: "60ms" }}
          >
            لوحة تحكم صانع المحتوى. تابع أرباحك، إحصاءات فيديوهاتك، وانضم إلى حملات مميزة.
          </p>
        </div>

        {overview === null && (
          <ConnectionErrorCard message="تعذّر تحميل بيانات لوحة التحكم حالياً." />
        )}

        {overview !== null && (
          <div className="tilt-3d fade-in-up overflow-hidden rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-sm)]">
            <div className="tilt-3d-surface grid divide-y divide-[var(--color-border)] sm:grid-cols-2 sm:divide-x sm:divide-y-0">
              <div className="flex items-center gap-4 p-6">
                <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-surface-muted)] text-[var(--color-brand-active)]">
                  <ShieldCheckIcon />
                </span>
                <div>
                  <h2 className="text-sm font-bold text-[var(--color-text-secondary)]">
                    مستوى الثقة (Trust Score)
                  </h2>
                  <div className="text-3xl font-black text-[var(--color-brand-active)]">
                    {overview.trustScore}
                  </div>
                  <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                    يبدأ من 50 ويتحسن بالالتزام بشروط الحملات.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-6">
                <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-surface-muted)] text-[var(--forest-500)]">
                  <MegaphoneIcon />
                </span>
                <div>
                  <h2 className="text-sm font-bold text-[var(--color-text-secondary)]">
                    الحملات النشطة
                  </h2>
                  <div className="text-3xl font-black text-[var(--forest-700)]">
                    {overview.joinedCampaignsCount}
                  </div>
                  <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                    تصفح قسم الاستكشاف للبحث عن حملات جديدة.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Earning Summary Component */}
        <ScrollReveal>
          <EarningSummary />
        </ScrollReveal>

        {/* Analytics */}
        <ScrollReveal>
          <CreatorAnalytics />
        </ScrollReveal>

        {/* Campaign discover banner */}
        <ScrollReveal className="tilt-3d">
          <div className="tilt-3d-surface flex flex-col items-center justify-between gap-6 rounded-[var(--radius-xl)] border border-[var(--forest-500)] bg-[var(--color-surface-dark)] p-8 text-[var(--color-text-on-dark)] md:flex-row">
            <div>
              <h3 className="mb-2 text-xl font-bold text-[var(--color-brand)]">
                هل تبحث عن فرص تمويل جديدة؟
              </h3>
              <p className="max-w-xl text-sm font-medium leading-relaxed text-[var(--forest-100)]">
                تصفح قائمة الحملات المفتوحة التي تطلقها العلامات التجارية الموثقة في
                العراق، سوّي محتواك وانشره للحصول على أرباح ممتازة.
              </p>
            </div>
            <Link
              href="/campaigns"
              className="lime-signal inline-flex flex-shrink-0 items-center justify-center whitespace-nowrap rounded-[var(--radius-md)] bg-[var(--color-brand)] px-6 py-3 text-center text-sm font-bold text-[var(--color-text-on-brand)] transition-all hover:bg-[var(--color-brand-hover)]"
            >
              استكشف الحملات المتاحة
            </Link>
          </div>
        </ScrollReveal>

        {/* Payouts Section */}
        <ScrollReveal>
          <CreatorPayouts />
        </ScrollReveal>
      </section>
    </main>
  );
}
