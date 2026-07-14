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
    <main
      className="dashboard-page min-h-screen bg-[var(--color-bg)] pb-24 text-[var(--color-text)] md:ps-64 md:pb-0"
      dir="rtl"
    >
      <DashboardHeader
        dashboardRole="brand"
        userLabel={`العلامة التجارية: ${brandMember.brand.name}`}
      />

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-5 lg:px-8 lg:py-10">
        <h1 className="fade-in-up mb-2 text-3xl font-extrabold">الإعدادات</h1>
        <p className="fade-in-up mb-8 font-medium text-[var(--color-text-secondary)]">
          كل أدوات التحكم بحسابك وخصوصيتك وتجربة استخدام المنصة في مكان واحد.
        </p>
        <AccountSettings dashboardRole="brand" />
      </section>
    </main>
  );
}
