import { ButtonLink } from "../../../components/ui/button";

export const dynamic = "force-static";

export default function OfflinePage() {
  return (
    <main className="flex min-h-[70vh] flex-col items-center justify-center gap-4 bg-[var(--color-bg)] px-5 text-center text-[var(--color-text)] dir-rtl">
      <h1 className="text-2xl font-extrabold">لا يوجد اتصال بالإنترنت</h1>
      <p className="max-w-md text-sm font-medium text-[var(--color-text-secondary)]">
        تعذّر تحميل هذه الصفحة لأنك غير متصل بالإنترنت حالياً. أعد المحاولة عند عودة
        الاتصال.
      </p>
      <ButtonLink href="/">العودة إلى الصفحة الرئيسية</ButtonLink>
    </main>
  );
}
