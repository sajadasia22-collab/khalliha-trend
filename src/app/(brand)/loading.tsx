export default function BrandLoading() {
  return (
    <main
      className="min-h-screen bg-[var(--color-bg)] px-5 py-12 lg:px-8 dir-rtl"
      aria-busy="true"
      aria-live="polite"
    >
      <span className="sr-only">جاري التحميل...</span>
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="h-8 w-64 animate-pulse rounded-[var(--radius-md)] bg-[var(--color-surface-muted)]" />
        <div className="grid gap-6 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className="h-28 animate-pulse rounded-[var(--radius-lg)] bg-[var(--color-surface-muted)]"
            />
          ))}
        </div>
      </div>
    </main>
  );
}
