import { ScrollReveal } from "../../../components/ui/ScrollReveal";

export const metadata = {
  title: "سياسة الدفع — خلّيها ترند",
};

const sections = [
  {
    title: "1. المعالجة اليدوية في هذه المرحلة",
    body: "تعتمد المنصة حالياً على معالجة يدوية للإيداع والسحب. لا يوجد تكامل حقيقي مع ZainCash أو FastPay أو أي مزود دفع آخر قبل توفر وثائق رسمية وCredentials وSandbox وموافقة صريحة ومراجعة قانونية ومحاسبية عراقية.",
  },
  {
    title: "2. تمويل ميزانية الحملة",
    body: "تنشئ العلامة التجارية طلب إيداع وتختار وسيلة دفع يدوية (مثل تحويل مصرفي)، ثم ترفع إثبات الدفع عند الحاجة. تراجع الإدارة الطلب وتقبله أو ترفضه؛ عند القبول يُضاف الرصيد إلى حساب العلامة عبر سجل مالي (Ledger) حقيقي، ثم تحجز العلامة جزءاً من رصيدها كميزانية للحملة.",
  },
  {
    title: "3. لماذا لا نستخدم مصطلح Escrow",
    body: "تستخدم واجهة المنصة مصطلح «ميزانية الحملة المحجوزة» بدلاً من Escrow، لحين إجراء مراجعة قانونية لهذا المصطلح في السياق العراقي.",
  },
  {
    title: "4. طلبات السحب",
    body: "يضيف صانع المحتوى وسيلة سحب؛ تُخزَّن البيانات الحساسة مشفرة وتُعرض مقنّعة فقط. عند تقديم طلب السحب يُحجز المبلغ من الرصيد المتاح، ولا يمكن سحب أرباح ما زالت قيد التحقق (HELD أو PENDING). تعالج الإدارة الطلب يدوياً؛ عند الدفع تُسجَّل بيانات مرجعية وإثبات، وعند الرفض يُحرَّر المبلغ المحجوز.",
  },
  {
    title: "5. الأمان والتدقيق",
    body: "لا تُخزَّن بيانات بطاقات مصرفية على الإطلاق. تُستخدم مفاتيح idempotency لمنع تكرار العمليات المالية، ولا يمكن اعتماد طلب سحب واحد مرتين. كل قرار مالي يُسجَّل في سجل تدقيق (Audit Log).",
  },
];

export default function PaymentPolicyPage() {
  return (
    <main className="mx-auto max-w-3xl px-5 py-12 lg:px-8">
      <h1 className="fade-in-up text-3xl font-extrabold text-[var(--color-text)]">
        سياسة الدفع
      </h1>
      <p
        className="fade-in-up mt-3 text-sm font-medium text-[var(--color-text-secondary)]"
        style={{ animationDelay: "60ms" }}
      >
        هذه النسخة تعكس آلية الدفع اليدوية المطبّقة في مرحلة تطوير المنصة (MVP)، ولا تمثّل
        ادعاءً بوجود تكامل دفع إلكتروني حقيقي.
      </p>

      <div className="mt-8 space-y-6">
        {sections.map((section, index) => (
          <ScrollReveal key={section.title} delayMs={Math.min(index * 40, 240)}>
            <div>
              <h2 className="text-lg font-extrabold text-[var(--color-text)]">
                {section.title}
              </h2>
              <p className="mt-2 leading-relaxed text-[var(--color-text-secondary)]">
                {section.body}
              </p>
            </div>
          </ScrollReveal>
        ))}
      </div>
    </main>
  );
}
