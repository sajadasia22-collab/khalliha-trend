import { redirect } from "next/navigation";
import { getCurrentUser } from "../../../../lib/auth/session";
import { DashboardHeader } from "../../../../components/layout/DashboardHeader";
import { AccountSettings } from "../../../../components/account/AccountSettings";

export default async function BrandSettingsPage() {
  const user = await getCurrentUser();
  const brandMember = user?.brandMembers?.[0];
  if (!user || !brandMember) {
    redirect("/login");
  }

  return (
    <main className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)] dir-rtl md:ps-64 pb-20 md:pb-0">
      <DashboardHeader
        dashboardRole="brand"
        userLabel={`العلامة التجارية: ${brandMember.brand.name}`}
      />

      <section className="mx-auto max-w-3xl px-5 py-12 lg:px-8">
        <h1 className="fade-in-up mb-2 text-3xl font-extrabold">الإعدادات</h1>
        <p className="fade-in-up mb-8 font-medium text-[var(--color-text-secondary)]">
          إدارة كلمة المرور وتفضيلات الإشعارات لحسابك.
        </p>
        <AccountSettings />
      </section>
    </main>
  );
}
