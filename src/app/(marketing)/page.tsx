import { ButtonLink } from "../../components/ui/button";
import { ScrollReveal } from "../../components/ui/ScrollReveal";
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
    <main className="overflow-hidden">
      <section className="relative mx-auto grid min-h-[calc(100vh-73px)] max-w-7xl items-center gap-12 px-5 py-12 lg:grid-cols-[1fr_1.05fr] lg:px-8 lg:py-16">
        <div className="hero-copy fade-in-up">
          <h1>سوّي المحتوى، انشره، واربح من المشاهدات</h1>
          <p>
            منصة عراقية تدير الحملات بين العلامات التجارية وصناع المحتوى: شروط واضحة،
            روابط منشورة خارجياً، مراجعة منظمة، وأرباح مبنية على مشاهدات مؤهلة.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <ButtonLink className="lime-signal justify-center" href="/register">
              ابدأ كصانع محتوى
            </ButtonLink>
            <ButtonLink className="justify-center" href="/register" variant="secondary">
              أنشئ حملة
            </ButtonLink>
          </div>

          <div className="mt-10 grid gap-3 sm:grid-cols-3">
            {workflowItems.map((item, index) => (
              <div
                className="workflow-step fade-in-up"
                key={item}
                style={{ animationDelay: `${150 + index * 80}ms` }}
              >
                <span>{String(index + 1).padStart(2, "0")}</span>
                <p>{item}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="tilt-3d fade-in-up" style={{ animationDelay: "120ms" }}>
          <div
            className="product-shell tilt-3d-surface"
            aria-label="معاينة واجهة خلّيها ترند"
          >
            <div className="product-header">
              <div>
                <p>لوحة الحملات</p>
                <strong>مراجعة الفرص المؤهلة</strong>
              </div>
              <span>تجريبي</span>
            </div>

            <div className="product-grid">
              <section className="panel panel-main">
                <div className="panel-title">
                  <h2>حملات متاحة</h2>
                  <span>فلترة حسب المنصة</span>
                </div>

                <div className="campaign-list">
                  {campaignCards.map((campaign) => (
                    <article className="campaign-card" key={campaign.title}>
                      <div className="campaign-icon" aria-hidden="true" />
                      <div>
                        <h3>{campaign.title}</h3>
                        <p>{campaign.brand}</p>
                        <small>{campaign.platform}</small>
                      </div>
                      <strong>{campaign.cpm}</strong>
                    </article>
                  ))}
                </div>
              </section>

              <aside className="panel metrics-panel">
                <div>
                  <p>الرصيد</p>
                  <strong>يعرض بعد تفعيل الحساب</strong>
                </div>
                <div>
                  <p>المشاهدات المؤهلة</p>
                  <strong>تحتسب بعد المراجعة</strong>
                </div>
                <div>
                  <p>Trust Score</p>
                  <strong>يبدأ من 50</strong>
                </div>
              </aside>
            </div>
          </div>
        </div>
      </section>

      {/* رحلة موحّدة: من إطلاق الحملة إلى وصول الأرباح */}
      <section className="border-t border-[rgba(200,214,206,0.14)] bg-[var(--color-surface-dark)] py-20 text-[var(--color-text-on-dark)]">
        <ScrollReveal className="mx-auto max-w-6xl px-5 lg:px-8">
          <div className="max-w-2xl">
            <span className="text-xs font-black uppercase tracking-wide text-[var(--color-brand)]">
              كيف تعمل المنصة
            </span>
            <h2 className="mt-3 text-3xl font-extrabold sm:text-4xl">
              من الفكرة إلى الأرباح، بأربع خطوات واضحة
            </h2>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {journeySteps.map((step, index) => {
              const Icon = step.icon;
              return (
                <div
                  key={step.title}
                  className="fade-in-up rounded-[var(--radius-lg)] border border-[rgba(200,214,206,0.16)] bg-[rgba(250,252,251,0.05)] p-6"
                  style={{ animationDelay: `${index * 70}ms` }}
                >
                  <span className="flex h-11 w-11 items-center justify-center rounded-[var(--radius-md)] bg-[rgba(214,246,29,0.14)] text-[var(--color-brand)]">
                    <Icon size={20} strokeWidth={1.8} />
                  </span>
                  <h3 className="mt-4 text-base font-extrabold">{step.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--forest-100)]">
                    {step.body}
                  </p>
                </div>
              );
            })}
          </div>
        </ScrollReveal>
      </section>

      {/* مسارين: صناع المحتوى والتجار */}
      <section className="mx-auto max-w-7xl px-5 py-20 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-2">
          <ScrollReveal className="tilt-3d">
            <div className="tilt-3d-surface flex h-full flex-col rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface)] p-8">
              <span className="flex h-12 w-12 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-surface-muted)] text-[var(--color-brand-active)]">
                <VideoIcon size={22} strokeWidth={1.8} />
              </span>
              <h3 className="mt-5 text-xl font-extrabold text-[var(--color-text)]">
                لصناع المحتوى
              </h3>
              <ul className="mt-4 flex-1 space-y-3 text-sm font-medium text-[var(--color-text-secondary)]">
                {creatorPoints.map((point) => (
                  <li key={point} className="flex gap-2.5">
                    <span
                      className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[var(--color-brand)]"
                      aria-hidden="true"
                    />
                    {point}
                  </li>
                ))}
              </ul>
              <ButtonLink href="/register" className="mt-6 justify-center">
                سجّل كصانع محتوى
              </ButtonLink>
            </div>
          </ScrollReveal>

          <ScrollReveal delayMs={80} className="tilt-3d">
            <div className="tilt-3d-surface flex h-full flex-col rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface)] p-8">
              <span className="flex h-12 w-12 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-surface-muted)] text-[var(--forest-500)]">
                <MegaphoneIcon size={22} strokeWidth={1.8} />
              </span>
              <h3 className="mt-5 text-xl font-extrabold text-[var(--color-text)]">
                للتجار والعلامات التجارية
              </h3>
              <ul className="mt-4 flex-1 space-y-3 text-sm font-medium text-[var(--color-text-secondary)]">
                {brandPoints.map((point) => (
                  <li key={point} className="flex gap-2.5">
                    <span
                      className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[var(--forest-400)]"
                      aria-hidden="true"
                    />
                    {point}
                  </li>
                ))}
              </ul>
              <ButtonLink
                href="/register"
                variant="secondary"
                className="mt-6 justify-center"
              >
                أنشئ حملتك الأولى
              </ButtonLink>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* حملات مميزة — بيانات حقيقية فقط، لا يظهر القسم إن لم توجد حملات نشطة */}
      {featuredCampaigns.length > 0 && (
        <section className="border-t border-[var(--color-border)] bg-[var(--color-surface-muted)] py-20">
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
              <ButtonLink href="/campaigns" variant="ghost">
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
      <section className="mx-auto max-w-6xl px-5 py-20 lg:px-8">
        <ScrollReveal>
          <div className="rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface)] p-8 sm:p-10">
            <div className="max-w-xl">
              <span className="text-xs font-black uppercase tracking-wide text-[var(--color-brand-active)]">
                شفافية كاملة
              </span>
              <h2 className="mt-2 text-2xl font-extrabold text-[var(--color-text)] sm:text-3xl">
                كل مشاهدة لها مصير واضح
              </h2>
            </div>
            <div className="mt-8 grid gap-6 sm:grid-cols-3">
              {viewStates.map((state) => (
                <div key={state.label}>
                  <h3 className="text-base font-extrabold text-[var(--color-text)]">
                    {state.label}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--color-text-secondary)]">
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
        <section className="bg-[var(--color-surface-dark)] py-16 text-[var(--color-text-on-dark)]">
          <ScrollReveal className="mx-auto grid max-w-6xl gap-8 px-5 sm:grid-cols-2 lg:grid-cols-4 lg:px-8">
            <div>
              <span className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-sm)] bg-[rgba(214,246,29,0.14)] text-[var(--color-brand)]">
                <MegaphoneIcon size={18} />
              </span>
              <div className="mt-3 text-3xl font-black text-[var(--color-brand)]">
                {stats.activeCampaigns.toLocaleString("ar-IQ")}
              </div>
              <p className="mt-1 text-sm font-medium text-[var(--forest-100)]">
                حملة نشطة
              </p>
            </div>
            <div>
              <span className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-sm)] bg-[rgba(214,246,29,0.14)] text-[var(--color-brand)]">
                <UsersIcon size={18} />
              </span>
              <div className="mt-3 text-3xl font-black text-[var(--color-brand)]">
                {stats.creators.toLocaleString("ar-IQ")}
              </div>
              <p className="mt-1 text-sm font-medium text-[var(--forest-100)]">
                صانع محتوى
              </p>
            </div>
            <div>
              <span className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-sm)] bg-[rgba(214,246,29,0.14)] text-[var(--color-brand)]">
                <BriefcaseIcon size={18} />
              </span>
              <div className="mt-3 text-3xl font-black text-[var(--color-brand)]">
                {stats.brands.toLocaleString("ar-IQ")}
              </div>
              <p className="mt-1 text-sm font-medium text-[var(--forest-100)]">
                علامة تجارية
              </p>
            </div>
            <div>
              <span className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-sm)] bg-[rgba(214,246,29,0.14)] text-[var(--color-brand)]">
                <TrendingUpIcon size={18} />
              </span>
              <div className="mt-3 text-3xl font-black text-[var(--color-brand)]">
                {stats.qualifiedViews.toLocaleString("ar-IQ")}
              </div>
              <p className="mt-1 text-sm font-medium text-[var(--forest-100)]">
                مشاهدة مؤهلة
              </p>
            </div>
          </ScrollReveal>
        </section>
      )}

      <section className="next-preview">
        <ScrollReveal>
          <h2>جاهز تسوّي محتوى يجيب أرباح؟</h2>
          <p>
            انضم اليوم كصانع محتوى أو أطلق حملتك الأولى كعلامة تجارية — التسجيل مجاني.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <ButtonLink href="/register">ابدأ الآن</ButtonLink>
            <ButtonLink href="/campaigns" variant="secondary">
              تصفح الحملات أولاً
            </ButtonLink>
          </div>
        </ScrollReveal>
      </section>
    </main>
  );
}
