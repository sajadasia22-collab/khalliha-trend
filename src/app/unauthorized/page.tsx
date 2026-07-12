import Link from "next/link";

export default function UnauthorizedPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[var(--color-bg)] p-6 text-[var(--color-text)] dir-rtl">
      <div className="card max-w-md w-full p-8 text-center border border-[var(--color-border)] bg-[var(--color-surface)] shadow-lg rounded-[var(--radius-lg)]">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-[rgba(6,38,25,0.06)] text-[var(--color-text-secondary)]">
          <svg
            className="h-8 w-8"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>

        <h1 className="text-2xl font-extrabold text-[var(--color-text)] mb-3">
          غير مصرح بالوصول
        </h1>

        <p className="text-[var(--color-text-secondary)] font-medium leading-relaxed mb-8 text-sm">
          عذراً، لا تملك الصلاحيات الكافية للوصول إلى هذه الصفحة. يرجى التأكد من تسجيل
          الدخول بالحساب الصحيح.
        </p>

        <div className="flex flex-col gap-3">
          <Link
            href="/"
            className="btn-primary w-full inline-flex justify-center items-center text-center py-3 text-sm font-semibold rounded-[var(--radius-md)] bg-[var(--color-brand)] text-[var(--color-text-on-brand)] hover:bg-[var(--color-brand-hover)] transition-all"
          >
            العودة للصفحة الرئيسية
          </Link>

          <Link
            href="/login"
            className="btn-secondary w-full inline-flex justify-center items-center text-center py-3 text-sm font-semibold rounded-[var(--radius-md)] border border-[var(--color-border-strong)] text-[var(--color-text)] hover:bg-[var(--color-surface-muted)] transition-all"
          >
            تسجيل الدخول بحساب آخر
          </Link>
        </div>
      </div>
    </main>
  );
}
