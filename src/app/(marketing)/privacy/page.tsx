import { ScrollReveal } from "../../../components/ui/ScrollReveal";

export const metadata = {
  title: "سياسة الخصوصية — خلّيها ترند",
};

const sections = [
  {
    title: "1. البيانات التي نجمعها",
    body: "بيانات الحساب (الاسم الكامل، البريد الإلكتروني أو رقم الهاتف، كلمة المرور المشفّرة)، بيانات الملف الشخصي لصانع المحتوى أو العلامة التجارية، وروابط المنشورات التي ترسلها للمراجعة.",
  },
  {
    title: "2. كلمات المرور",
    body: "لا تُخزَّن كلمات المرور كنص صريح؛ تُشفَّر عبر دالة اشتقاق مفاتيح مخصصة (PBKDF2) قبل حفظها.",
  },
  {
    title: "3. الحسابات الاجتماعية",
    body: "لا تُعرض بيانات اعتماد أو access tokens الخاصة بحساباتك الاجتماعية في الواجهة أو في سجلات النظام. أي رمز وصول يُخزَّن مشفراً عند توفر تكامل رسمي معتمد.",
  },
  {
    title: "4. البيانات المالية",
    body: "بيانات وسائل السحب الحساسة تُخزَّن مشفرة وتُعرض بصيغة مقنّعة (masked) فقط. لا تُخزَّن بيانات بطاقات مصرفية على الإطلاق.",
  },
  {
    title: "5. سجل التدقيق",
    body: "كل عملية مالية أو إدارية حساسة (اعتماد إيداع، معالجة سحب، تعليق حساب، تعديل مشاهدات) تُسجَّل في سجل تدقيق (Audit Log) لضمان قابلية المراجعة.",
  },
  {
    title: "6. مشاركة البيانات",
    body: "لا تُشارك بيانات المستخدمين مع أطراف خارجية إلا في الحدود اللازمة لتشغيل الخدمة (مثل مزود الاستضافة وقاعدة البيانات)، ودون بيع البيانات لأي جهة.",
  },
  {
    title: "7. حقوق المستخدم",
    body: "يمكنك طلب الاطلاع على بياناتك أو تصحيحها أو حذف حسابك بالتواصل مع الإدارة، مع مراعاة الالتزامات المالية والتدقيقية القائمة إن وُجدت.",
  },
];

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-3xl px-5 py-12 lg:px-8">
      <h1 className="fade-in-up text-3xl font-extrabold text-[var(--color-text)]">
        سياسة الخصوصية
      </h1>
      <p
        className="fade-in-up mt-3 text-sm font-medium text-[var(--color-text-secondary)]"
        style={{ animationDelay: "60ms" }}
      >
        هذه النسخة تعكس ممارسات حماية البيانات المطبّقة حالياً في مرحلة تطوير المنصة
        (MVP).
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
