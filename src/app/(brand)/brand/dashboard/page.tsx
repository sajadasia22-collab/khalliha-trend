import { redirect } from "next/navigation";
import { getCurrentUser } from "../../../../lib/auth/session";
import Link from "next/link";
import { prisma } from "../../../../lib/prisma";
import { LedgerEngine } from "../../../../modules/financial/ledger";
import { BrandAnalytics } from "../../../../components/brand/BrandAnalytics";
import { DashboardHeader } from "../../../../components/layout/DashboardHeader";
import { ConnectionErrorCard } from "../../../../components/ui/ConnectionErrorCard";
import {
  WalletIcon,
  BanknoteIcon,
  MegaphoneIcon,
  BriefcaseIcon,
  PlusIcon,
} from "../../../../components/ui/icons";

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
    <main className="dashboard-page min-h-screen text-[var(--color-text)] dir-rtl md:ps-64 pb-20 md:pb-0">
      <DashboardHeader
        dashboardRole="brand"
        userLabel={`العلامة التجارية: ${brand.name}`}
      />

      {/* Main Content */}
      <section className="mx-auto max-w-7xl px-5 py-12 lg:px-8 space-y-10">
        <div className="dashboard-hero fade-in-up">
          <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-[var(--radius-md)] icon-3d">
            <BriefcaseIcon />
          </div>
          <h1 className="text-3xl font-extrabold mb-2">لوحة تحكم التاجر</h1>
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
          <div className="grid gap-6 sm:grid-cols-3">
            {/* Card 1: Balance */}
            <Link
              href="/brand/wallet"
              className="card-interactive surface-3d fade-in-up group rounded-[var(--radius-xl)] p-6 hover:border-[var(--color-brand)] hover:shadow-[var(--shadow-brand)]"
            >
              <div className="flex items-center gap-4">
                <span className="icon-3d h-12 w-12 rounded-[var(--radius-lg)]">
                  <WalletIcon />
                </span>
                <div>
                  <h2 className="text-xs font-extrabold uppercase tracking-wider text-[var(--color-text-secondary)]">
                    رصيد الحساب التجاري
                  </h2>
                  <div className="mt-1 text-2xl font-black text-[var(--forest-700)] dark:text-[var(--color-text)]">
                    {overview.balance.toLocaleString("ar-IQ", {
                      numberingSystem: "latn",
                    })}{" "}
                    <span className="text-sm font-bold text-[var(--color-text-secondary)]">
                      د.ع
                    </span>
                  </div>
                  <span className="mt-1.5 inline-block text-[11px] font-bold text-[var(--color-brand-active)]">
                    + موّل رصيدك
                  </span>
                </div>
              </div>
            </Link>

            {/* Card 2: Reserved */}
            <div
              className="card-interactive surface-3d fade-in-up group rounded-[var(--radius-xl)] p-6 hover:border-[var(--color-brand)] hover:shadow-[var(--shadow-brand)]"
              style={{ animationDelay: "100ms" }}
            >
              <div className="flex items-center gap-4">
                <span className="icon-3d h-12 w-12 rounded-[var(--radius-lg)]">
                  <BanknoteIcon />
                </span>
                <div>
                  <h2 className="text-xs font-extrabold uppercase tracking-wider text-[var(--color-text-secondary)]">
                    الميزانية المحجوزة للحملات
                  </h2>
                  <div className="mt-1 text-2xl font-black text-[var(--forest-700)] dark:text-[var(--color-text)]">
                    {overview.totalReserved.toLocaleString("ar-IQ", {
                      numberingSystem: "latn",
                    })}{" "}
                    <span className="text-sm font-bold text-[var(--color-text-secondary)]">
                      د.ع
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 3: Campaigns Count */}
            <div
              className="card-interactive surface-3d fade-in-up group rounded-[var(--radius-xl)] p-6 hover:border-[var(--color-brand)] hover:shadow-[var(--shadow-brand)]"
              style={{ animationDelay: "200ms" }}
            >
              <div className="flex items-center gap-4">
                <span className="icon-3d h-12 w-12 rounded-[var(--radius-lg)]">
                  <MegaphoneIcon />
                </span>
                <div>
                  <h2 className="text-xs font-extrabold uppercase tracking-wider text-[var(--color-text-secondary)]">
                    حملاتك التسويقية
                  </h2>
                  <div className="mt-1 text-2xl font-black text-[var(--forest-700)] dark:text-[var(--color-text)]">
                    {overview.campaignCount}{" "}
                    <span className="text-sm font-bold text-[var(--color-text-secondary)]">
                      حملة
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Analytics */}
        <BrandAnalytics />

        {/* Campaign creation banner */}
        <div className="surface-dark-3d p-8 text-[var(--color-text-on-dark)] rounded-[var(--radius-xl)] flex flex-col md:flex-row items-center justify-between gap-6">
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
              className="btn-primary inline-flex justify-center items-center gap-2 text-center px-6 py-3 text-sm font-bold rounded-[var(--radius-md)] bg-[var(--color-brand)] text-[var(--color-text-on-brand)] hover:bg-[var(--color-brand-hover)] transition-all whitespace-nowrap"
            >
              <PlusIcon size={17} />
              أنشئ حملة جديدة
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
