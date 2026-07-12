import { ButtonLink } from "../components/ui/button";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[var(--color-bg)] px-5 text-center text-[var(--color-text)] dir-rtl">
      <h1 className="text-3xl font-extrabold">الصفحة غير موجودة</h1>
      <p className="max-w-md text-sm font-medium text-[var(--color-text-secondary)]">
        الرابط الذي حاولت الوصول إليه غير موجود أو تم نقله.
      </p>
      <ButtonLink href="/">العودة إلى الصفحة الرئيسية</ButtonLink>
    </main>
  );
}
