import { ButtonLink } from "../../components/ui/button";
import { ScrollReveal } from "../../components/ui/ScrollReveal";
import { CountUpNumber } from "../../components/ui/CountUpNumber";
import { LiveMockStat } from "../../components/ui/LiveMockStat";
import { FloatingDollars } from "../../components/ui/FloatingDollars";
import {
  CampaignCard,
  type CampaignCardData,
} from "../../components/campaigns/CampaignCard";
import { prisma } from "../../lib/prisma";
import { CampaignStatus, UserRole } from "../../generated/prisma/enums";
import {
  MegaphoneIcon,
  VideoIcon,
  WalletIcon,
  TrendingUpIcon,
  UsersIcon,
  BriefcaseIcon,
  EyeIcon,
} from "../../components/ui/icons";

// Pulls live counts and featured campaigns straight from Prisma on every
// request — without this, Next would statically freeze that data at build
// time (this route has no cookies/searchParams to trigger dynamic rendering
// automatically the way the dashboard pages do via the session cookie).
export const dynamic = "force-dynamic";

const campaignCards = [
  {
    title: "حملة إطلاق عطر صيفي",
    brand: "علامة موثقة",
    platform: "TikTok + Instagram",
    cpm: "CPM حسب شروط الحملة",
  },
  {
    title: "مراجعة منتج تقني",
    brand: "قيد مراجعة الإدارة",
    platform: "YouTube + Facebook",
    cpm: "ميزانية محجوزة قبل التفعيل",
  },
];

const workflowItems = [
  "التاجر ينشئ حملة ويمول ميزانيتها.",
  "صانع المحتوى ينضم وينشر خارج المنصة.",
  "الإدارة تراجع المشاهدات وتحرر الأرباح.",
];

const journeySteps = [
  {
    icon: BriefcaseIcon,
    title: "التاجر يطلق الحملة",
    body: "يحدد الشروط، يموّل الميزانية عبر رصيد حقيقي، وينتظر انضمام صناع محتوى مؤهلين.",
  },
  {
    icon: VideoIcon,
    title: "صانع المحتوى ينشر",
    body: "يصنع الفيديو وينشره على حسابه الخاص في TikTok أو Instagram أو YouTube أو Facebook.",
  },
  {
    icon: EyeIcon,
    title: "المنصة تتحقق",
    body: "تُفصل المشاهدات المؤهلة عن المستبعدة بشفافية كاملة، بعد فترة تحقق واضحة.",
  },
  {
    icon: WalletIcon,
    title: "الأرباح تصل",
    body: "تُحرَّر الأرباح إلى المحفظة تلقائيًا، ويمكن طلب السحب فور توفر الرصيد المتاح.",
  },
];

const creatorPoints = [
  "اكتشف الحملات النشطة من علامات تجارية موثقة.",
  "اصنع الفيديو بأسلوبك الخاص.",
  "انشره على حسابك الشخصي — لا استضافة، لا وسيط.",
  "اربح من كل مشاهدة مؤهلة تلقائيًا.",
];

const brandPoints = [
  "أطلق حملات مخصصة بشروط وميزانية تحددها أنت.",
  "صِل لصناع محتوى متعددين دفعة واحدة.",
  "ادفع مقابل المشاهدات المؤهلة فقط، لا مقابل الوعود.",
  "تابع الأداء والإنفاق لحظة بلحظة من لوحتك.",
];

const viewStates = [
  { label: "مرصودة", body: "كل مشاهدة تُسجَّل فور رصدها من رابط المنشور." },
  { label: "مؤهلة", body: "تمر بفترة تحقق ثم تُحتسب ضمن أرباح صانع المحتوى." },
  { label: "مستبعدة", body: "تُستبعد مع توضيح السبب دائمًا — بلا قرارات مبهمة." },
];

async function loadHomeStats() {
  const [activeCampaigns, creators, brands, qualifiedViewsSum] = await Promise.all([
    prisma.campaign.count({ where: { status: CampaignStatus.ACTIVE } }),
    prisma.user.count({ where: { role: UserRole.CREATOR } }),
    prisma.user.count({ where: { role: UserRole.BRAND } }),
    prisma.metricsSnapshot.aggregate({ _sum: { qualifiedViews: true } }),
  ]);
  return {
    activeCampaigns,
    creators,
    brands,
    qualifiedViews: qualifiedViewsSum._sum.qualifiedViews ?? 0n,
  };
}

async function loadFeaturedCampaigns(): Promise<CampaignCardData[]> {
  const campaigns = await prisma.campaign.findMany({
    where: { status: CampaignStatus.ACTIVE },
    include: { brand: true, rates: true },
    orderBy: { totalBudget: "desc" },
    take: 3,
  });
  return campaigns.map((campaign) => ({
    id: campaign.id,
    title: campaign.title,
    category: campaign.category,
    thumbnailUrl: campaign.thumbnailUrl,
    currency: campaign.currency,
    totalBudget: campaign.totalBudget,
    reservedBudget: campaign.reservedBudget,
    brand: { name: campaign.brand.name, verified: Boolean(campaign.brand.verifiedAt) },
    rates: campaign.rates,
  }));
}

export default async function Home() {
  const stats = await loadHomeStats().catch(() => null);
  const featuredCampaigns = await loadFeaturedCampaigns().catch(() => []);

  return (
    <main className="overflow-hidden bg-[var(--color-bg)]">
      {/* Hero Section */}
      <section className="relative mx-auto grid min-h-[calc(100vh-73px)] max-w-7xl items-center gap-8 px-5 py-8 lg:grid-cols-[1fr_1.1fr] lg:px-8 lg:py-16 dir-rtl text-right">
        {/* Decorative background glow */}
        <div className="absolute -left-20 top-20 h-72 w-72 rounded-full bg-[var(--color-brand)] opacity-10 blur-3xl pointer-events-none" />
        <div className="absolute -right-20 bottom-20 h-72 w-72 rounded-full bg-[var(--color-success)] opacity-5 blur-3xl pointer-events-none" />

        <div className="hero-copy fade-in-up space-y-6">
          <h1 className="text-3xl font-black leading-tight sm:text-5xl lg:text-6xl tracking-tight text-[var(--color-text)]">
            سوّي المحتوى، انشره، <br />
            <span className="text-[var(--color-brand)] bg-[var(--color-surface-dark)] px-4 py-1.5 sm:px-5 sm:py-2 rounded-[var(--radius-lg)] inline-block mt-3 shadow-[var(--shadow-brand)]">
              واربح من المشاهدات
            </span>
          </h1>
          <p className="text-sm sm:text-lg leading-relaxed text-[var(--color-text-secondary)] font-medium max-w-xl">
            منصة عراقية مبتكرة تربط العلامات التجارية بصناع المحتوى مباشرة: شروط معلنة،
            روابط فيديوهات موحدة، احتساب ذكي للمشاهدات المؤهلة، ومحفظة مالية آمنة.
          </p>

          <div className="pt-2 flex flex-col gap-3 sm:flex-row">
            <ButtonLink
              className="lime-signal justify-center text-center px-8 py-3.5 text-sm font-bold cursor-pointer w-full sm:w-auto"
              href="/register"
            >
              ابدأ كصانع محتوى
            </ButtonLink>
            <ButtonLink
              className="justify-center text-center px-8 py-3.5 text-sm font-bold cursor-pointer transition-transform hover:scale-102 w-full sm:w-auto"
              href="/register"
              variant="secondary"
            >
              أنشئ حملة تسويقية
            </ButtonLink>
          </div>

          <div className="pt-4 grid gap-3 sm:grid-cols-3">
            {workflowItems.map((item, index) => (
              <div
                className="workflow-step fade-in-up border border-[var(--color-border)] bg-[var(--color-surface)] p-4 rounded-[var(--radius-lg)] transition-all hover:border-[var(--color-border-strong)] hover:shadow-[var(--shadow-sm)] flex sm:flex-col items-center sm:items-start gap-3 sm:gap-0"
                key={item}
                style={{ animationDelay: `${150 + index * 80}ms` }}
              >
                <span className="text-xs font-black text-[var(--color-brand-active)]">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <p className="text-xs font-bold text-[var(--color-text-secondary)] sm:mt-2 leading-relaxed">
                  {item}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* 3D Dashboard Mock Shell */}
        <div className="tilt-3d fade-in-up relative" style={{ animationDelay: "120ms" }}>
          <FloatingDollars />

          <div
            className="product-shell tilt-3d-surface border border-[var(--forest-500)] rounded-[var(--radius-xl)] bg-gradient-to-br from-[rgba(18,56,40,0.95)] to-[rgba(6,38,25,1)] shadow-[var(--shadow-lg)] overflow-hidden"
            aria-label="معاينة واجهة خلّيها ترند"
          >
            {/* Window Bar (Mac style) */}
            <div className="flex items-center gap-2 px-5 py-3 border-b border-[rgba(200,214,206,0.12)] bg-[rgba(0,0,0,0.2)]">
              <span className="h-3 w-3 rounded-full bg-[rgba(214,246,29,0.3)] border border-[rgba(214,246,29,0.5)]" />
              <span className="h-3 w-3 rounded-full bg-[rgba(200,214,206,0.2)]" />
              <span className="h-3 w-3 rounded-full bg-[rgba(200,214,206,0.1)]" />
              <div className="mx-auto text-[9px] font-bold text-[var(--forest-300)] font-mono tracking-widest uppercase">
                KHALLIHA.TREND
              </div>
            </div>

            <div className="product-header flex items-center justify-between p-4 sm:p-5 border-b border-[rgba(200,214,206,0.1)]">
              <div>
                <p className="text-[10px] sm:text-xs text-[var(--forest-100)]">
                  لوحة التحكم
                </p>
                <strong className="block text-xs sm:text-sm font-bold text-[var(--color-text-on-dark)] mt-1">
                  فرص الحملات والمؤشرات
                </strong>
              </div>
              <span className="text-[10px] sm:text-xs font-black bg-[var(--color-brand)] text-[var(--color-text-on-brand)] px-2.5 py-1 rounded-[var(--radius-pill)]">
                نشط الآن
              </span>
            </div>

            <div className="product-grid grid gap-4 p-4 sm:p-5 sm:grid-cols-[1.6fr_1fr]">
              <section className="panel border border-[rgba(200,214,206,0.16)] bg-[rgba(250,252,251,0.04)] rounded-[var(--radius-lg)] p-4 space-y-4">
                <div className="flex items-baseline justify-between">
                  <h2 className="text-xs font-black text-[var(--color-text-on-dark)]">
                    حملات مستهدفة
                  </h2>
                  <span className="text-[9px] sm:text-[10px] text-[var(--forest-300)] font-bold">
                    فلترة نشطة
                  </span>
                </div>

                <div className="campaign-list grid gap-3">
                  {campaignCards.map((campaign, idx) => (
                    <article
                      className="flex items-center gap-3 p-3 rounded-[var(--radius-md)] bg-[rgba(250,252,251,0.06)] border border-[rgba(200,214,206,0.06)] hover:border-[rgba(214,246,29,0.2)] transition-all duration-300 group/card cursor-pointer"
                      key={campaign.title}
                    >
                      <div className="h-9 w-9 sm:h-10 sm:w-10 flex-shrink-0 rounded-[12px] bg-gradient-to-br from-[var(--forest-600)] to-[var(--forest-700)] flex items-center justify-center text-xs font-extrabold text-[var(--color-brand)] border border-[rgba(214,246,29,0.15)]">
                        {idx === 0 ? "🔥" : "✨"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-xs font-bold text-[var(--mist-50)] truncate">
                          {campaign.title}
                        </h3>
                        <p className="text-[9px] sm:text-[10px] text-[var(--forest-200)] mt-1 flex items-center gap-1">
                          <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-brand)] animate-pulse" />
                          {campaign.brand}
                        </p>
                        <small className="block text-[8px] sm:text-[9px] text-[var(--forest-300)] mt-0.5">
                          {campaign.platform}
                        </small>
                      </div>
                      <div className="text-left flex-shrink-0">
                        <strong className="text-[9px] sm:text-[10px] text-[var(--color-brand)] font-extrabold block">
                          {campaign.cpm}
                        </strong>
                      </div>
                    </article>
                  ))}
                </div>
              </section>

              <aside className="grid grid-cols-3 gap-2 sm:flex sm:flex-col sm:gap-3">
                <div className="rounded-[var(--radius-md)] bg-[rgba(214,246,29,0.06)] border border-[rgba(214,246,29,0.1)] p-2.5 sm:p-3 flex flex-col justify-between sm:justify-start">
                  <p className="text-[8px] sm:text-[10px] text-[var(--forest-200)] font-bold">
                    الرصيد المتاح
                  </p>
                  <strong className="text-xs sm:text-sm text-[var(--color-brand)] font-black block mt-1">
                    <LiveMockStat target={38000} suffix=" د.ع" />
                  </strong>
                  <span className="text-[7px] sm:text-[9px] text-[var(--forest-300)] mt-0.5 block">
                    قيد المراجعة
                  </span>
                </div>

                <div className="rounded-[var(--radius-md)] bg-[rgba(250,252,251,0.03)] border border-[rgba(200,214,206,0.08)] p-2.5 sm:p-3 relative overflow-hidden flex flex-col justify-between sm:justify-start">
                  <p className="text-[8px] sm:text-[10px] text-[var(--forest-200)] font-bold">
                    المشاهدات
                  </p>
                  <strong className="text-xs sm:text-sm text-[var(--color-brand)] font-black block mt-1">
                    <LiveMockStat target={1280} />
                  </strong>
                  {/* Small visual graph */}
                  <svg
                    className="absolute bottom-0 left-0 right-0 h-4 w-full"
                    viewBox="0 0 100 20"
                    preserveAspectRatio="none"
                  >
                    <path
                      d="M0 15 Q25 5 50 12 T100 2"
                      fill="none"
                      stroke="rgba(214,246,29,0.2)"
                      strokeWidth="1.5"
                    />
                  </svg>
                </div>

                <div className="rounded-[var(--radius-md)] bg-[rgba(250,252,251,0.03)] border border-[rgba(200,214,206,0.08)] p-2.5 sm:p-3 flex flex-col justify-between sm:justify-start">
                  <p className="text-[8px] sm:text-[10px] text-[var(--forest-200)] font-bold">
                    الموثوقية
                  </p>
                  <div className="flex items-center justify-between mt-1 gap-1">
                    <strong className="text-[10px] sm:text-xs text-[var(--color-brand)] font-black">
                      50
                    </strong>
                    <span className="text-[7px] sm:text-[8px] px-1 rounded bg-[var(--forest-600)] text-[var(--mist-100)] font-bold leading-none py-0.5">
                      مبتدئ
                    </span>
                  </div>
                  {/* Progress bar */}
                  <div className="mt-2 h-1 w-full bg-[var(--forest-700)] rounded-full overflow-hidden hidden sm:block">
                    <div
                      className="h-full bg-[var(--color-brand)] rounded-full"
                      style={{ width: "50%" }}
                    />
                  </div>
                </div>
              </aside>
            </div>
          </div>
        </div>
      </section>

      {/* رحلة موحّدة: من إطلاق الحملة إلى وصول الأرباح */}
      <section className="border-t border-[rgba(200,214,206,0.08)] bg-[var(--color-surface-dark)] py-12 md:py-20 text-[var(--color-text-on-dark)] relative">
        {/* Corner glow */}
        <div className="absolute left-0 bottom-0 h-48 w-48 rounded-full bg-[var(--color-brand)] opacity-5 blur-3xl pointer-events-none" />

        <ScrollReveal className="mx-auto max-w-6xl px-5 lg:px-8 dir-rtl text-right">
          <div className="max-w-2xl">
            <span className="text-xs font-black uppercase tracking-widest text-[var(--color-brand)]">
              دورة العمل والتحقق
            </span>
            <h2 className="mt-3 text-3xl font-extrabold sm:text-4xl leading-tight">
              من الفكرة إلى الأرباح، بأربع خطوات واضحة
            </h2>
          </div>

          <div className="mt-8 md:mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {journeySteps.map((step, index) => {
              const Icon = step.icon;
              return (
                <div
                  key={step.title}
                  className="fade-in-up card-interactive rounded-[var(--radius-lg)] border border-[rgba(200,214,206,0.12)] bg-[rgba(250,252,251,0.03)] p-5 sm:p-6 hover:bg-[rgba(250,252,251,0.07)] hover:border-[var(--color-brand)] group transition-all duration-300"
                  style={{ animationDelay: `${index * 70}ms` }}
                >
                  <span className="flex h-11 w-11 items-center justify-center rounded-[var(--radius-md)] bg-[rgba(214,246,29,0.12)] text-[var(--color-brand)] transition-transform duration-300 group-hover:scale-110 group-hover:bg-[var(--color-brand)] group-hover:text-[var(--color-surface-dark)]">
                    <Icon size={20} strokeWidth={1.8} />
                  </span>
                  <h3 className="mt-4 text-base font-extrabold text-[var(--color-text-on-dark)]">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-xs leading-relaxed text-[var(--forest-100)] font-medium">
                    {step.body}
                  </p>
                </div>
              );
            })}
          </div>
        </ScrollReveal>
      </section>

      {/* مسارين: صناع المحتوى والتجار */}
      <section className="mx-auto max-w-7xl px-5 py-12 md:py-20 dir-rtl text-right">
        <div className="grid gap-8 lg:grid-cols-2">
          {/* Card 1: Creator */}
          <ScrollReveal className="tilt-3d">
            <div className="tilt-3d-surface flex h-full flex-col rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 sm:p-8 shadow-[var(--shadow-sm)] hover:border-[var(--color-brand)] transition-all duration-300 relative overflow-hidden group">
              <div className="absolute -left-10 -top-10 h-32 w-32 rounded-full bg-[var(--color-brand)] opacity-5 blur-3xl pointer-events-none transition-opacity group-hover:opacity-10" />

              <span className="flex h-12 w-12 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-surface-muted)] text-[var(--color-brand-active)] transition-transform duration-300 group-hover:scale-110">
                <VideoIcon size={22} strokeWidth={1.8} />
              </span>
              <h3 className="mt-5 text-xl font-extrabold text-[var(--color-text)]">
                لصناع المحتوى
              </h3>
              <ul className="mt-4 flex-1 space-y-3.5 text-sm font-medium text-[var(--color-text-secondary)]">
                {creatorPoints.map((point) => (
                  <li key={point} className="flex gap-2.5 items-start">
                    <span className="text-[var(--color-brand-active)] text-xs font-black mt-0.5">
                      ✓
                    </span>
                    <span className="leading-relaxed">{point}</span>
                  </li>
                ))}
              </ul>
              <ButtonLink
                href="/register"
                className="mt-6 justify-center text-center py-3.5 text-sm font-bold shadow-[var(--shadow-sm)] w-full sm:w-auto"
              >
                سجّل كصانع محتوى
              </ButtonLink>
            </div>
          </ScrollReveal>

          {/* Card 2: Merchant */}
          <ScrollReveal delayMs={80} className="tilt-3d">
            <div className="tilt-3d-surface flex h-full flex-col rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 sm:p-8 shadow-[var(--shadow-sm)] hover:border-[var(--color-brand)] transition-all duration-300 relative overflow-hidden group">
              <div className="absolute -left-10 -top-10 h-32 w-32 rounded-full bg-[var(--forest-400)] opacity-5 blur-3xl pointer-events-none transition-opacity group-hover:opacity-10" />

              <span className="flex h-12 w-12 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-surface-muted)] text-[var(--forest-500)] transition-transform duration-300 group-hover:scale-110">
                <MegaphoneIcon size={22} strokeWidth={1.8} />
              </span>
              <h3 className="mt-5 text-xl font-extrabold text-[var(--color-text)]">
                للتجار والعلامات التجارية
              </h3>
              <ul className="mt-4 flex-1 space-y-3.5 text-sm font-medium text-[var(--color-text-secondary)]">
                {brandPoints.map((point) => (
                  <li key={point} className="flex gap-2.5 items-start">
                    <span className="text-[var(--color-success)] text-xs font-black mt-0.5">
                      ✓
                    </span>
                    <span className="leading-relaxed">{point}</span>
                  </li>
                ))}
              </ul>
              <ButtonLink
                href="/register"
                variant="secondary"
                className="mt-6 justify-center text-center py-3.5 text-sm font-bold shadow-[var(--shadow-sm)] w-full sm:w-auto"
              >
                أنشئ حملتك الأولى
              </ButtonLink>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* حملات مميزة — بيانات حقيقية فقط، لا يظهر القسم إن لم توجد حملات نشطة */}
      {featuredCampaigns.length > 0 && (
        <section className="border-t border-[var(--color-border)] bg-[var(--color-surface-muted)] py-12 md:py-20 dir-rtl text-right">
          <div className="mx-auto max-w-7xl px-5 lg:px-8">
            <ScrollReveal className="mb-10 flex flex-wrap items-end justify-between gap-4">
              <div>
                <span className="text-xs font-black uppercase tracking-wide text-[var(--color-brand-active)]">
                  حملات مميزة
                </span>
                <h2 className="mt-2 text-3xl font-extrabold text-[var(--color-text)]">
                  حملات نشطة الآن
                </h2>
              </div>
              <ButtonLink
                href="/campaigns"
                variant="ghost"
                className="transition-transform hover:scale-102"
              >
                تصفح كل الحملات
              </ButtonLink>
            </ScrollReveal>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {featuredCampaigns.map((campaign, index) => (
                <div
                  key={campaign.id}
                  className="fade-in-up"
                  style={{ animationDelay: `${index * 70}ms` }}
                >
                  <CampaignCard campaign={campaign} featured />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* شفافية احتساب المشاهدات */}
      <section className="mx-auto max-w-6xl px-5 py-12 md:py-20 dir-rtl text-right">
        <ScrollReveal>
          <div className="rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 sm:p-10 shadow-[var(--shadow-sm)] relative overflow-hidden group">
            {/* Background pattern */}
            <div className="absolute right-0 top-0 h-24 w-24 rounded-full bg-[var(--color-brand)] opacity-5 blur-2xl pointer-events-none" />

            <div className="max-w-xl">
              <span className="text-xs font-black uppercase tracking-wide text-[var(--color-brand-active)]">
                شفافية كاملة
              </span>
              <h2 className="mt-2 text-2xl font-extrabold text-[var(--color-text)] sm:text-3xl">
                كل مشاهدة لها مصير واضح
              </h2>
            </div>
            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              {viewStates.map((state, idx) => (
                <div
                  key={state.label}
                  className="p-4 sm:p-5 rounded-[var(--radius-md)] bg-[var(--color-surface-muted)] border border-[var(--color-border)] hover:border-[var(--color-border-strong)] transition-all"
                >
                  <div className="flex items-center gap-2 mb-3">
                    {idx === 0 && (
                      <span className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
                    )}
                    {idx === 1 && (
                      <span className="h-2 w-2 rounded-full bg-[var(--color-brand)] animate-pulse" />
                    )}
                    {idx === 2 && (
                      <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                    )}
                    <h3 className="text-sm font-black text-[var(--color-text)]">
                      {state.label}
                    </h3>
                  </div>
                  <p className="text-xs leading-relaxed text-[var(--color-text-secondary)] font-medium">
                    {state.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </ScrollReveal>
      </section>

      {/* إحصائيات حقيقية من قاعدة البيانات — بلا أرقام وهمية */}
      {stats && (
        <section className="bg-[var(--color-surface-dark)] py-10 md:py-16 text-[var(--color-text-on-dark)] relative">
          {/* Subtle background flow */}
          <div className="absolute right-1/4 top-1/4 h-64 w-64 rounded-full bg-[var(--color-brand)] opacity-5 blur-3xl pointer-events-none" />

          <ScrollReveal className="mx-auto grid max-w-6xl grid-cols-2 gap-6 px-5 sm:gap-8 lg:grid-cols-4 lg:px-8 dir-rtl text-center">
            {/* Stat 1 */}
            <div className="group flex flex-col items-center p-3 sm:p-4 hover:bg-[rgba(250,252,251,0.03)] rounded-[var(--radius-md)] transition-all duration-300">
              <span className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-sm)] bg-[rgba(214,246,29,0.12)] text-[var(--color-brand)] transition-transform duration-300 group-hover:scale-110">
                <MegaphoneIcon size={18} />
              </span>
              <div className="mt-4 text-2xl sm:text-3xl font-black text-[var(--color-brand)] tracking-tight">
                <CountUpNumber value={stats.activeCampaigns} />
              </div>
              <p className="mt-1.5 text-[10px] sm:text-xs font-bold text-[var(--forest-100)] uppercase tracking-wider">
                حملة نشطة حالياً
              </p>
            </div>

            {/* Stat 2 */}
            <div className="group flex flex-col items-center p-3 sm:p-4 hover:bg-[rgba(250,252,251,0.03)] rounded-[var(--radius-md)] transition-all duration-300">
              <span className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-sm)] bg-[rgba(214,246,29,0.12)] text-[var(--color-brand)] transition-transform duration-300 group-hover:scale-110">
                <UsersIcon size={18} />
              </span>
              <div className="mt-4 text-2xl sm:text-3xl font-black text-[var(--color-brand)] tracking-tight">
                <CountUpNumber value={stats.creators} />
              </div>
              <p className="mt-1.5 text-[10px] sm:text-xs font-bold text-[var(--forest-100)] uppercase tracking-wider">
                صانع محتوى مسجل
              </p>
            </div>

            {/* Stat 3 */}
            <div className="group flex flex-col items-center p-3 sm:p-4 hover:bg-[rgba(250,252,251,0.03)] rounded-[var(--radius-md)] transition-all duration-300">
              <span className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-sm)] bg-[rgba(214,246,29,0.12)] text-[var(--color-brand)] transition-transform duration-300 group-hover:scale-110">
                <BriefcaseIcon size={18} />
              </span>
              <div className="mt-4 text-2xl sm:text-3xl font-black text-[var(--color-brand)] tracking-tight">
                <CountUpNumber value={stats.brands} />
              </div>
              <p className="mt-1.5 text-[10px] sm:text-xs font-bold text-[var(--forest-100)] uppercase tracking-wider">
                علامة تجارية شريكة
              </p>
            </div>

            {/* Stat 4 */}
            <div className="group flex flex-col items-center p-3 sm:p-4 hover:bg-[rgba(250,252,251,0.03)] rounded-[var(--radius-md)] transition-all duration-300">
              <span className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-sm)] bg-[rgba(214,246,29,0.12)] text-[var(--color-brand)] transition-transform duration-300 group-hover:scale-110">
                <TrendingUpIcon size={18} />
              </span>
              <div className="mt-4 text-2xl sm:text-3xl font-black text-[var(--color-brand)] tracking-tight">
                <CountUpNumber value={stats.qualifiedViews} />
              </div>
              <p className="mt-1.5 text-[10px] sm:text-xs font-bold text-[var(--forest-100)] uppercase tracking-wider">
                مشاهدة مؤهلة وموثقة
              </p>
            </div>
          </ScrollReveal>
        </section>
      )}

      {/* CTA section */}
      <section className="next-preview py-20 text-center border-t border-[var(--color-border)] bg-[var(--color-surface)]">
        <ScrollReveal className="mx-auto max-w-3xl px-5 space-y-6">
          <h2 className="text-3xl font-black text-[var(--color-text)]">
            جاهز تسوّي محتوى يجيب أرباح؟
          </h2>
          <p className="text-base text-[var(--color-text-secondary)] font-medium max-w-xl mx-auto leading-relaxed">
            انضم اليوم كصانع محتوى لتحقيق عوائد من مشاهداتك، أو أطلق حملتك الإعلانية
            الأولى كعلامة تجارية. التسجيل مجاني وسريع.
          </p>
          <div className="pt-2 flex flex-col gap-3 sm:flex-row justify-center">
            <ButtonLink
              href="/register"
              className="px-8 py-3 text-sm font-bold shadow-[var(--shadow-sm)] cursor-pointer"
            >
              ابدأ الآن مجاناً
            </ButtonLink>
            <ButtonLink
              href="/campaigns"
              variant="secondary"
              className="px-8 py-3 text-sm font-bold shadow-[var(--shadow-sm)] cursor-pointer transition-transform hover:scale-102"
            >
              تصفح الحملات المتوفرة
            </ButtonLink>
          </div>
        </ScrollReveal>
      </section>
    </main>
  );
}
