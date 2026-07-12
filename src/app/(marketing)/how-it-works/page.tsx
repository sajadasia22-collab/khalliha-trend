import { ScrollReveal } from "../../../components/ui/ScrollReveal";

export const metadata = {
  title: "كيف تعمل المنصة — خلّيها ترند",
};

const creatorSteps = [
  {
    icon: "👤",
    title: "الملف الشخصي",
    text: "أنشئ ملفك الشخصي كصانع محتوى واربط حساباتك الاجتماعية يدوياً.",
  },
  {
    icon: "🔍",
    title: "تصفح الحملات",
    text: "تصفح الحملات المتوفرة وانضم للحملة المتوافقة مع شروط منصتك.",
  },
  {
    icon: "🎥",
    title: "نشر الفيديو",
    text: "حمّل الملفات المطلوبة، واقرأ الشروط، ثم انشر الفيديو على حسابك الخارجي.",
  },
  {
    icon: "📥",
    title: "إرسال الرابط",
    text: "أرسل رابط المنشور (Normalised URL) عبر حسابك لتوثيقه ومنع التكرار.",
  },
  {
    icon: "⚖️",
    title: "مراجعة المشاركات",
    text: "تخضع المشاركات للمراجعة الإدارية للتحقق من المشاهدات واستبعاد الاحتيال.",
  },
  {
    icon: "💰",
    title: "تحرير الأرباح",
    text: "تُضاف الأرباح للمحفظة بعد فترة الحجز، وتُسحب يدوياً فور طلبها.",
  },
];

const brandSteps = [
  {
    icon: "🏢",
    title: "توثيق العلامة",
    text: "أنشئ ملف علامتك التجارية وقدم طلب التوثيق لضمان المصداقية.",
  },
  {
    icon: "📣",
    title: "إطلاق الحملة",
    text: "أنشئ حملتك الإعلانية وحدد ميزانيتها وسعر الـ CPM والمنصات المستهدفة.",
  },
  {
    icon: "🔍",
    title: "المراجعة الإدارية",
    text: "ترسل الحملة للمراجعة الإدارية لتنقيح الشروط قبل إطلاقها للعامة.",
  },
  {
    icon: "💳",
    title: "تمويل الرصيد",
    text: "موّل حسابك التجاري عبر إرسال طلب تمويل (إيداع يدوي) برقم إشارة مرجعي.",
  },
  {
    icon: "🔓",
    title: "حجز الميزانية",
    text: "يتم حجز ميزانية الحملة لتأمين مستحقات صناع المحتوى وتنشيط الحملة.",
  },
  {
    icon: "📊",
    title: "متابعة الأداء",
    text: "تابع التحليلات التفصيلية للإنفاق والمشاهدات المؤهلة من لوحتك الخاصة.",
  },
];

function StepsTimeline({
  title,
  steps,
  delayMs = 0,
}: {
  title: string;
  steps: { icon: string; title: string; text: string }[];
  delayMs?: number;
}) {
  return (
    <ScrollReveal delayMs={delayMs} className="tilt-3d">
      <div className="tilt-3d-surface card border border-[var(--color-border)] bg-[var(--color-surface)] p-6 sm:p-8 rounded-[var(--radius-xl)] shadow-[var(--shadow-sm)] hover:border-[var(--color-brand)] transition-colors">
        <h2 className="mb-8 text-xl font-black text-[var(--color-text)] flex items-center gap-2">
          <span>{title}</span>
        </h2>

        {/* Timeline Path */}
        <ol className="relative border-r-2 border-[var(--color-border)] mr-3.5 space-y-8 pr-6 text-right">
          {steps.map((step, index) => (
            <li key={step.title} className="relative flex flex-col items-start gap-1">
              {/* Bullet circle centered on path */}
              <span className="absolute -right-[36px] top-0 flex h-7 w-7 items-center justify-center rounded-full bg-[var(--color-brand)] border-2 border-[var(--color-surface)] text-xs font-black text-[var(--color-text-on-brand)] shadow-[var(--shadow-sm)]">
                {index + 1}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-base">{step.icon}</span>
                <h3 className="text-sm font-extrabold text-[var(--color-text)]">
                  {step.title}
                </h3>
              </div>
              <p className="text-xs leading-relaxed text-[var(--color-text-secondary)] font-medium mt-1">
                {step.text}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </ScrollReveal>
  );
}

export default function HowItWorksPage() {
  return (
    <main className="mx-auto max-w-4xl px-5 py-12 lg:px-8 dir-rtl text-right space-y-10">
      {/* Header section */}
      <div className="space-y-4">
        <span className="text-xs font-black uppercase tracking-widest text-[var(--color-brand-active)]">
          دليل استخدام المنصة
        </span>
        <h1 className="fade-in-up text-3xl font-extrabold text-[var(--color-text)] sm:text-4xl">
          كيف تعمل منصة خلّيها ترند؟
        </h1>
        <p className="fade-in-up leading-relaxed text-sm sm:text-base text-[var(--color-text-secondary)] font-medium max-w-3xl">
          «خلّيها ترند» هي منصة وسيطة آمنة لإدارة الحملات التسويقية والتمويل والتحقق
          الإداري من المشاهدات بين العلامات التجارية وصناع المحتوى. المنصة لا تستضيف
          فيديوهات داخلية، بل تتعامل مع روابط منشورة خارجياً في شبكات التواصل الاجتماعي.
        </p>
      </div>

      {/* Journeys Grid */}
      <div className="grid gap-8 sm:grid-cols-2">
        <StepsTimeline title="رحلة صانع المحتوى (Creator)" steps={creatorSteps} />
        <StepsTimeline
          title="رحلة العلامة التجارية (Brand)"
          steps={brandSteps}
          delayMs={100}
        />
      </div>

      {/* Calculations & Business Rules */}
      <ScrollReveal>
        <div className="card border border-[var(--color-border)] bg-[var(--color-surface)] p-6 sm:p-8 rounded-[var(--radius-xl)] shadow-[var(--shadow-sm)] space-y-4">
          <h2 className="text-lg font-extrabold text-[var(--color-text)] flex items-center gap-2">
            <span>🧮</span>
            <span>شفافية احتساب الأرباح المالية</span>
          </h2>
          <p className="text-xs leading-relaxed text-[var(--color-text-secondary)] font-medium">
            تلتزم المنصة بتطبيق شروط وقواعد صارمة ومبرهنة لحساب مستحقات صناع المحتوى. يتم
            احتساب الأرباح النهائية للمنشور بناءً على المعادلة التالية لضمان عدم تجاوز
            ميزانية الحملة أو سقف الأرباح المحدد لكل فيديو.
          </p>

          {/* Formula Box */}
          <div className="flex flex-col md:flex-row items-center gap-4 bg-[var(--color-surface-muted)] p-5 rounded-[var(--radius-md)] border border-[var(--color-border)]">
            <div className="text-center md:text-right flex-1 space-y-1">
              <div className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider">
                معادلة احتساب الأرباح:
              </div>
              <div className="text-xs sm:text-sm font-black text-[var(--forest-700)] dark:text-[var(--color-brand)] font-mono leading-relaxed tracking-wide">
                الأرباح = Min( (المشاهدات المؤهلة × CPM ÷ 1000) , سقف مكافأة المنشور ,
                ميزانية الحملة المتبقية )
              </div>
            </div>
            <div className="text-3xl flex-shrink-0">🧮</div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3 pt-2 text-right">
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-[var(--color-text)]">
                1. المشاهدات المؤهلة
              </h4>
              <p className="text-[11px] text-[var(--color-text-secondary)] leading-relaxed">
                تفرز المنصة المشاهدات المرصودة وتستبعد المشاهدات الناتجة عن زيادات غير
                طبيعية أو احتيالية بشكل آلي وبشري معلن.
              </p>
            </div>
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-[var(--color-text)]">
                2. سقف المكافأة (Cap)
              </h4>
              <p className="text-[11px] text-[var(--color-text-secondary)] leading-relaxed">
                لكل منصة حد أقصى للربح لكل فيديو لحماية التاجر من القفزات الفجائية ولضمان
                توزيع الميزانية على أكبر عدد من المشاركين.
              </p>
            </div>
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-[var(--color-text)]">
                3. تأمين المحفظة (Ledger)
              </h4>
              <p className="text-[11px] text-[var(--color-text-secondary)] leading-relaxed">
                تُحجز ميزانية الحملة مسبقاً من محفظة التاجر وتودع في حساب الضمان لضمان
                تحريرها لصانع المحتوى فور اعتماد مشاهداته.
              </p>
            </div>
          </div>
        </div>
      </ScrollReveal>
    </main>
  );
}
