import { redirect } from "next/navigation";
import { getCurrentUser } from "../../../../lib/auth/session";
import Link from "next/link";
import { prisma } from "../../../../lib/prisma";
import { LedgerEngine } from "../../../../modules/financial/ledger";
import { BrandDeposits } from "../../../../components/brand/BrandDeposits";
import { BrandAnalytics } from "../../../../components/brand/BrandAnalytics";
import { DashboardHeader } from "../../../../components/layout/DashboardHeader";
import { ConnectionErrorCard } from "../../../../components/ui/ConnectionErrorCard";
import { WalletIcon, BanknoteIcon, MegaphoneIcon } from "../../../../components/ui/icons";

export default async function BrandDashboard() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }
  const brandMember = user.brandMembers?.[0];
  if (!brandMember) {
    redirect("/login");
  }
  const brand = brandMember.brand;

  const overview = await (async () => {
    // 1. Get brand wallet balance (IQD)
    const wallet = await LedgerEngine.createWalletIfNotExist(user.id, "IQD");
    const balance = await LedgerEngine.getAccountBalance(wallet.financialAccountId);

    // 2. Get campaigns reserved budget
    const campaigns = await prisma.campaign.findMany({
      where: { brandId: brand.id },
      select: { reservedBudget: true },
    });
    const totalReserved = campaigns.reduce((sum, item) => sum + item.reservedBudget, 0n);
    const campaignCount = campaigns.length;

    return { balance, totalReserved, campaignCount };
  })().catch(() => null);

  return (
    <main className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)] dir-rtl md:ps-64 pb-20 md:pb-0">
      <DashboardHeader
        dashboardRole="brand"
        userLabel={`العلامة التجارية: ${brand.name}`}
      />

      {/* Main Content */}
      <section className="mx-auto max-w-7xl px-5 py-12 lg:px-8 space-y-10">
        <div>
          <h1 className="text-3xl font-extrabold mb-2">
            أهلاً بك في لوحة تحكم التاجر 👋
          </h1>
          <p className="text-[var(--color-text-secondary)] font-medium">
            علامتك التجارية:{" "}
            <strong className="text-[var(--forest-700)]">{brand.name}</strong>. أطلق
            حملاتك، موّل ميزانيتك، وراجع مشاركات المحتوى.
          </p>
        </div>

        {overview === null && (
          <ConnectionErrorCard message="تعذّر تحميل بيانات المحفظة والحملات حالياً." />
        )}

        {overview !== null && (
          <div className="tilt-3d fade-in-up overflow-hidden rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-sm)]">
            <div className="tilt-3d-surface grid divide-y divide-[var(--color-border)] sm:grid-cols-3 sm:divide-x sm:divide-y-0">
              <div className="flex items-center gap-4 p-6">
                <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-surface-muted)] text-[var(--forest-500)]">
                  <WalletIcon />
                </span>
                <div>
                  <h2 className="text-sm font-bold text-[var(--color-text-secondary)]">
                    رصيد الحساب التجاري (IQD)
                  </h2>
                  <div className="text-3xl font-black text-[var(--forest-700)]">
                    {overview.balance.toLocaleString("ar-IQ")} د.ع
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 p-6">
                <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-surface-muted)] text-[var(--forest-500)]">
                  <BanknoteIcon />
                </span>
                <div>
                  <h2 className="text-sm font-bold text-[var(--color-text-secondary)]">
                    الميزانية المحجوزة للحملات
                  </h2>
                  <div className="text-3xl font-black text-[var(--forest-700)]">
                    {overview.totalReserved.toLocaleString("ar-IQ")} د.ع
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 p-6">
                <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-surface-muted)] text-[var(--forest-500)]">
                  <MegaphoneIcon />
                </span>
                <div>
                  <h2 className="text-sm font-bold text-[var(--color-text-secondary)]">
                    عدد حملاتك
                  </h2>
                  <div className="text-3xl font-black text-[var(--forest-700)]">
                    {overview.campaignCount}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Analytics */}
        <BrandAnalytics />

        {/* Deposits Manager Component */}
        <BrandDeposits />

        {/* Campaign creation banner */}
        <div className="p-8 card border border-[var(--forest-500)] bg-[var(--color-surface-dark)] text-[var(--color-text-on-dark)] rounded-[var(--radius-xl)] flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="text-xl font-bold text-[var(--color-brand)] mb-2">
              هل تريد إطلاق حملة تسويقية جديدة؟
            </h3>
            <p className="text-[var(--forest-100)] text-sm font-medium leading-relaxed max-w-xl">
              أنشئ حملة تسويقية مخصصة، حدد ميزانيتك، ضع شروطك الخاصة (أسعار المشاهدة
              والمنصات المستهدفة)، واربط علامتك التجارية بصناع المحتوى الأكفأ.
            </p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/brand/campaigns/new"
              className="btn-primary inline-flex justify-center items-center text-center px-6 py-3 text-sm font-bold rounded-[var(--radius-md)] bg-[var(--color-brand)] text-[var(--color-text-on-brand)] hover:bg-[var(--color-brand-hover)] transition-all whitespace-nowrap"
            >
              أنشئ حملة جديدة
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
