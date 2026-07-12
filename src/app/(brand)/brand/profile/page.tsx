import { redirect } from "next/navigation";
import { getCurrentUser } from "../../../../lib/auth/session";
import { BrandProfileService } from "../../../../modules/brand/service";
import { DashboardHeader } from "../../../../components/layout/DashboardHeader";
import { BrandProfileForm } from "../../../../components/brand/BrandProfileForm";

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
    <main className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)] dir-rtl md:ps-64 pb-20 md:pb-0">
      <DashboardHeader
        dashboardRole="brand"
        userLabel={`العلامة التجارية: ${brand.name}`}
      />

      <section className="mx-auto max-w-4xl px-5 py-12 lg:px-8">
        <h1 className="mb-8 text-3xl font-extrabold">ملف العلامة التجارية</h1>

        <div className="card border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
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
