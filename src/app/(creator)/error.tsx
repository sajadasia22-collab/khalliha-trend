"use client";

import { Button, ButtonLink } from "../../components/ui/button";

export default function CreatorError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main
      role="alert"
      className="flex min-h-[60vh] flex-col items-center justify-center gap-4 bg-[var(--color-bg)] px-5 text-center text-[var(--color-text)] dir-rtl"
    >
      <h1 className="text-2xl font-extrabold">حدث خطأ غير متوقع</h1>
      <p className="max-w-md text-sm font-medium text-[var(--color-text-secondary)]">
        تعذّر تحميل هذه الصفحة. حاول مرة أخرى، أو عد إلى لوحة التحكم.
      </p>
      <div className="flex gap-3">
        <Button onClick={() => reset()}>إعادة المحاولة</Button>
        <ButtonLink variant="secondary" href="/creator/dashboard">
          لوحة التحكم
        </ButtonLink>
      </div>
    </main>
  );
}
