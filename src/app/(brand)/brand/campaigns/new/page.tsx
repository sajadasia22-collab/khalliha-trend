import { redirect } from "next/navigation";
import { getCurrentUser } from "../../../../../lib/auth/session";
import { BrandProfileService } from "../../../../../modules/brand/service";
import { DashboardHeader } from "../../../../../components/layout/DashboardHeader";
import { CampaignForm } from "../../../../../components/brand/CampaignForm";

export default async function NewCampaignPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const brand = await BrandProfileService.getForUser(user.id);
  if (!brand) {
    redirect("/brand/dashboard");
  }

  return (
    <main className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)] dir-rtl md:ps-64 pb-20 md:pb-0">
      <DashboardHeader dashboardRole="brand" userLabel={user.fullName} />

      <section className="mx-auto max-w-3xl px-5 py-12 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold mb-2">إنشاء حملة جديدة</h1>
          <p className="text-sm font-medium text-[var(--color-text-secondary)]">
            تُحفظ الحملة كمسودة (Draft) أولاً، ويمكنك تعديلها وتفحصها بدقة قبل إرسالها
            لمراجعة الإدارة والتوثيق.
          </p>
        </div>

        <div className="card border border-[var(--color-border)] bg-[var(--color-surface)] p-6 rounded-[var(--radius-xl)] shadow-sm">
          <CampaignForm mode="create" />
        </div>
      </section>
    </main>
  );
}
