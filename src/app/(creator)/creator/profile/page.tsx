import { redirect } from "next/navigation";
import { getCurrentUser } from "../../../../lib/auth/session";
import { CreatorProfileService } from "../../../../modules/creator/service";
import { DashboardHeader } from "../../../../components/layout/DashboardHeader";
import { ProfileForm } from "../../../../components/creator/ProfileForm";
import { SocialAccountsManager } from "../../../../components/creator/SocialAccountsManager";
import { ScrollReveal } from "../../../../components/ui/ScrollReveal";
import { UserIcon, LinkIcon } from "../../../../components/ui/icons";

export default async function CreatorProfilePage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const profile = await CreatorProfileService.getByUserId(user.id);
  const verifiedAccountsCount =
    profile?.socialAccounts.filter((account) => account.status === "VERIFIED").length ??
    0;

  return (
    <main className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)] dir-rtl md:ps-64 pb-20 md:pb-0">
      <DashboardHeader
        dashboardRole="creator"
        userLabel={`صانع محتوى: ${user.fullName}`}
      />

      <section className="mx-auto max-w-4xl px-5 py-12 lg:px-8">
        <div className="fade-in-up mb-8 flex items-center gap-4">
          <span className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full bg-[var(--color-brand)] text-lg font-black text-[var(--color-text-on-brand)]">
            {user.fullName?.slice(0, 1) ?? "؟"}
          </span>
          <div>
            <h1 className="text-3xl font-extrabold">ملفي الشخصي</h1>
            <p className="mt-1 text-sm font-medium text-[var(--color-text-secondary)]">
              {verifiedAccountsCount > 0
                ? `${verifiedAccountsCount} حساب موثّق مربوط بملفك`
                : "أكمل بياناتك واربط حساباتك ليزيد ظهورك في الحملات"}
            </p>
          </div>
        </div>

        <ScrollReveal className="tilt-3d">
          <div className="tilt-3d-surface mb-10 card overflow-hidden border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
            <div className="mb-4 flex items-center gap-3">
              <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-surface-muted)] text-[var(--color-brand-active)]">
                <UserIcon />
              </span>
              <h2 className="text-lg font-extrabold">المعلومات الأساسية</h2>
            </div>
            <ProfileForm
              initialBio={profile?.bio ?? ""}
              initialCountry={profile?.country ?? "IQ"}
              initialGovernorate={profile?.governorate ?? ""}
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
