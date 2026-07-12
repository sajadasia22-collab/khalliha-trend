import { redirect } from "next/navigation";
import { getCurrentUser } from "../../../../lib/auth/session";
import { DashboardHeader } from "../../../../components/layout/DashboardHeader";
import { WalletView } from "../../../../components/wallet/WalletView";
import { BrandDeposits } from "../../../../components/brand/BrandDeposits";

export default async function BrandWalletPage() {
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

      <section className="mx-auto max-w-5xl px-5 py-12 lg:px-8">
        <h1 className="fade-in-up mb-2 text-3xl font-extrabold">المحفظة</h1>
        <p className="fade-in-up mb-8 font-medium text-[var(--color-text-secondary)]">
          رصيد حسابك التجاري بالدينار والدولار، وسجل كامل لكل عملية مالية.
        </p>
        <WalletView />

        <div className="mt-10">
          <h2 className="fade-in-up mb-2 text-xl font-extrabold">تمويل المحفظة</h2>
          <p className="fade-in-up mb-6 font-medium text-[var(--color-text-secondary)]">
            أرسل طلب تمويل يدوي وسيتم مراجعته وإضافته لرصيدك خلال وقت قصير.
          </p>
          <BrandDeposits />
        </div>
      </section>
    </main>
  );
}
