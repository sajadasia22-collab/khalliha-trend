import { redirect } from "next/navigation";
import { getCurrentUser } from "../../../../lib/auth/session";
import { CreatorProfileService } from "../../../../modules/creator/service";
import { DashboardHeader } from "../../../../components/layout/DashboardHeader";
import { ProfileForm } from "../../../../components/creator/ProfileForm";
import { SocialAccountsManager } from "../../../../components/creator/SocialAccountsManager";
import { PortfolioManager } from "../../../../components/creator/PortfolioManager";
import { ScrollReveal } from "../../../../components/ui/ScrollReveal";
import { BriefcaseIcon, LinkIcon } from "../../../../components/ui/icons";

export default async function CreatorProfilePage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const profile = await CreatorProfileService.getByUserId(user.id);
  return (
    <main className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)] dir-rtl md:ps-64 pb-20 md:pb-0">
      <DashboardHeader
        dashboardRole="creator"
        userLabel={`صانع محتوى: ${user.fullName}`}
      />

      <section className="mx-auto max-w-5xl px-5 py-12 lg:px-8">
        <div className="fade-in-up mb-8">
          <span className="mb-3 inline-flex rounded-[var(--radius-pill)] bg-[rgba(214,246,29,.18)] px-3 py-1 text-xs font-black text-[var(--color-brand-active)]">
            هويتك داخل خلّيها ترند
          </span>
          <h1 className="text-3xl font-extrabold">ملفك المهني</h1>
          <p className="mt-2 max-w-2xl text-sm font-medium leading-6 text-[var(--color-text-secondary)]">
            قدّم نفسك للعلامات التجارية بصورة واضحة، وحدد اختصاصاتك والحسابات التي تثبت
            جودة أعمالك.
          </p>
        </div>

        <ScrollReveal>
          <div className="mb-10">
            <ProfileForm
              fullName={user.fullName}
              initialUsername={profile?.username ?? ""}
              initialBio={profile?.bio ?? ""}
              initialAvatarUrl={profile?.avatarUrl ?? ""}
              initialCoverUrl={profile?.coverUrl ?? ""}
              initialCountry={profile?.country ?? "IQ"}
              initialGovernorate={profile?.governorate ?? ""}
              initialContentCategories={profile?.contentCategories ?? []}
              initialLanguages={profile?.languages ?? []}
              initialIsProfilePublic={profile?.isProfilePublic ?? true}
            />
          </div>
        </ScrollReveal>

        <ScrollReveal delayMs={60}>
          <div className="mb-10 overflow-hidden rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-sm)]">
            <div className="mb-5 flex items-center gap-3">
              <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-brand)] text-[var(--color-text-on-brand)]">
                <BriefcaseIcon aria-hidden="true" />
              </span>
              <div>
                <h2 className="text-lg font-extrabold">معرض الأعمال</h2>
                <p className="text-xs text-[var(--color-text-muted)]">
                  واجهتك الأولى أمام العلامات التجارية.
                </p>
              </div>
            </div>
            <PortfolioManager
              initialItems={
                profile?.portfolioItems.map((item) => ({
                  id: item.id,
                  title: item.title,
                  description: item.description,
                  platform: item.platform,
                  projectUrl: item.projectUrl,
                  thumbnailUrl: item.thumbnailUrl,
                  sortOrder: item.sortOrder,
                })) ?? []
              }
            />
          </div>
        </ScrollReveal>

        <ScrollReveal delayMs={80} className="tilt-3d">
          <div className="tilt-3d-surface card overflow-hidden border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
            <div className="mb-4 flex items-center gap-3">
              <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-surface-muted)] text-[var(--forest-500)]">
                <LinkIcon />
              </span>
              <h2 className="text-lg font-extrabold">الحسابات الاجتماعية</h2>
            </div>
            <SocialAccountsManager
              initialAccounts={
                profile?.socialAccounts.map((account) => ({
                  id: account.id,
                  platform: account.platform,
                  handle: account.handle,
                  profileUrl: account.profileUrl,
                  status: account.status,
                  rejectionReason: account.rejectionReason,
                })) ?? []
              }
            />
          </div>
        </ScrollReveal>
      </section>
    </main>
  );
}
