import { redirect } from "next/navigation";
import { getCurrentUser } from "../../../../lib/auth/session";
import { BrandProfileService } from "../../../../modules/brand/service";
import { DashboardHeader } from "../../../../components/layout/DashboardHeader";
import { BrandProfileForm } from "../../../../components/brand/BrandProfileForm";
import { BriefcaseIcon, CheckIcon, SettingsIcon } from "../../../../components/ui/icons";

export default async function BrandProfilePage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const brand = await BrandProfileService.getForUser(user.id);
  if (!brand) {
    redirect("/brand/dashboard");
  }

  const latestVerification = brand.verifications[0] ?? null;

  return (
    <main
      className="dashboard-page min-h-screen bg-[var(--color-bg)] pb-24 text-[var(--color-text)] md:ps-64 md:pb-0"
      dir="rtl"
    >
      <DashboardHeader
        dashboardRole="brand"
        userLabel={`العلامة التجارية: ${brand.name}`}
      />

      <section className="mx-auto max-w-5xl px-5 py-8 lg:px-8 lg:py-10">
        <div className="mb-7 overflow-hidden rounded-[var(--radius-xl)] bg-[var(--color-surface-dark)] p-6 text-[var(--color-text-on-dark)] shadow-[var(--shadow-md)] sm:p-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <span className="flex h-14 w-14 items-center justify-center rounded-[var(--radius-lg)] bg-[var(--color-brand)] text-[var(--color-text-on-brand)]">
                <BriefcaseIcon size={26} />
              </span>
              <div>
                <p className="text-xs font-black text-[var(--color-brand)]">
                  هوية العلامة
                </p>
                <h1 className="mt-1 text-2xl font-black sm:text-3xl">{brand.name}</h1>
                <span className="mt-2 inline-flex items-center gap-1.5 text-xs font-bold text-[var(--forest-100)]">
                  {brand.verifiedAt ? (
                    <>
                      <CheckIcon size={14} /> علامة موثقة
                    </>
                  ) : (
                    "التوثيق غير مكتمل"
                  )}
                </span>
              </div>
            </div>
            <a
              href="/brand/settings"
              className="inline-flex items-center justify-center gap-2 rounded-[var(--radius-pill)] border border-[var(--forest-500)] px-4 py-2.5 text-sm font-bold hover:border-[var(--color-brand)]"
            >
              <SettingsIcon size={17} /> إعدادات الحساب
            </a>
          </div>
        </div>

        <div className="card rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-sm)] sm:p-7">
          <BrandProfileForm
            initialName={brand.name}
            initialDescription={brand.description ?? ""}
            isVerified={Boolean(brand.verifiedAt)}
            initialVerificationStatus={latestVerification?.status ?? null}
          />
        </div>
      </section>
    </main>
  );
}
