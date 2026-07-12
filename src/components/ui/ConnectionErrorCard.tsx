export function ConnectionErrorCard({
  message = "تعذّر الاتصال بقاعدة البيانات حالياً.",
}: {
  message?: string;
}) {
  return (
    <div
      role="alert"
      className="card border border-[var(--color-border)] bg-[var(--color-surface)] p-8 text-center"
    >
      <p className="font-bold text-[var(--color-text)]">{message}</p>
    </div>
  );
}
