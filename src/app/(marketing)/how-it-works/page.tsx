import { ScrollReveal } from "../../../components/ui/ScrollReveal";

export const metadata = {
  title: "كيف تعمل المنصة — خلّيها ترند",
};

const creatorSteps = [
  "أنشئ ملفك الشخصي كصانع محتوى واربط حساباتك الاجتماعية.",
  "تصفح الحملات النشطة وانضم إلى الحملة المناسبة بعد تحقق الأهلية.",
  "اطّلع على شروط الحملة وأصولها، ثم انشر الفيديو على حسابك الخارجي.",
  "أرسل رابط المنشور إلى المنصة عبر نموذج الإرسال.",
  "تراجع الإدارة الرابط، ويتم احتساب المشاهدات المؤهلة بعد فترة تحقق.",
  "تُحرَّر الأرباح إلى محفظتك، ويمكنك طلب السحب بعد توفر الرصيد.",
];

const brandSteps = [
  "أنشئ ملف العلامة التجارية واطلب التوثيق.",
  "أنشئ حملة عبر معالج الحملة: العنوان، الشروط، الأصول، وسعر CPM لكل منصة.",
  "أرسل الحملة لمراجعة الإدارة قبل التفعيل.",
  "أنشئ طلب إيداع لتمويل ميزانية الحملة يدوياً في هذه المرحلة.",
  "بعد اعتماد الإيداع تُحجز الميزانية وتُفعَّل الحملة.",
  "راجع مشاركات صناع المحتوى وتابع المصروفات والتحليلات.",
];

function StepsList({
  title,
  steps,
  delayMs = 0,
}: {
  title: string;
  steps: string[];
  delayMs?: number;
}) {
  return (
    <ScrollReveal delayMs={delayMs} className="tilt-3d">
      <div className="tilt-3d-surface card border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
        <h2 className="mb-4 text-lg font-extrabold text-[var(--color-text)]">{title}</h2>
        <ol className="space-y-3">
          {steps.map((step, index) => (
            <li
              key={step}
              className="flex gap-3 text-sm font-medium text-[var(--color-text-secondary)]"
            >
              <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-[var(--color-brand)] text-xs font-black text-[var(--color-text-on-brand)]">
                {index + 1}
              </span>
              <span className="leading-relaxed">{step}</span>
            </li>
          ))}
        </ol>
      </div>
    </ScrollReveal>
  );
}

export default function HowItWorksPage() {
  return (
    <main className="mx-auto max-w-4xl px-5 py-12 lg:px-8">
      <h1 className="fade-in-up text-3xl font-extrabold text-[var(--color-text)]">
        كيف تعمل المنصة
      </h1>
      <p
        className="fade-in-up mt-3 max-w-2xl leading-relaxed text-[var(--color-text-secondary)]"
        style={{ animationDelay: "60ms" }}
      >
        «خلّيها ترند» لا تستضيف الفيديوهات ولا تعمل كشبكة اجتماعية. دورها إدارة الحملات
        والشروط والروابط والمراجعات والمشاهدات المؤهلة والأرباح والمحافظ بين العلامات
        التجارية وصناع المحتوى.
      </p>

      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        <StepsList title="رحلة صانع المحتوى" steps={creatorSteps} />
        <StepsList title="رحلة العلامة التجارية" steps={brandSteps} delayMs={90} />
      </div>

      <ScrollReveal>
        <div className="mt-10 card border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
          <h2 className="mb-3 text-lg font-extrabold text-[var(--color-text)]">
            احتساب الأرباح
          </h2>
          <p className="leading-relaxed text-[var(--color-text-secondary)]">
            يُحتسب الربح المستحق كأقل قيمة بين: (المشاهدات المؤهلة الجديدة × سعر CPM ÷
            1000)، والحد الأقصى المسموح لكل فيديو، والميزانية المتبقية للحملة. تفصل المنصة
            دائماً بين المشاهدات المرصودة والمؤهلة والمستبعدة مع سبب واضح لكل استبعاد.
          </p>
        </div>
      </ScrollReveal>
    </main>
  );
}
