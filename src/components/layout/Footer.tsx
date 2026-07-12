import Link from "next/link";

const footerColumns = [
  {
    title: "المنصة",
    links: [
      { href: "/campaigns", label: "استكشف الحملات" },
      { href: "/how-it-works", label: "كيف تعمل المنصة" },
      { href: "/register", label: "سجّل كصانع محتوى" },
      { href: "/register", label: "سجّل كعلامة تجارية" },
    ],
  },
  {
    title: "قانوني",
    links: [
      { href: "/terms", label: "الشروط والأحكام" },
      { href: "/privacy", label: "سياسة الخصوصية" },
      { href: "/payment-policy", label: "سياسة الدفع" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-[var(--color-border)] bg-[var(--color-surface)]">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-14 sm:grid-cols-2 lg:grid-cols-[1.3fr_1fr_1fr] lg:px-8">
        <div>
          <Link className="brand-lockup" href="/" aria-label="خلّيها ترند">
            <span className="brand-mark" aria-hidden="true" />
            <span>خلّيها ترند</span>
          </Link>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-[var(--color-text-secondary)]">
            منصة عراقية تربط العلامات التجارية بصناع المحتوى — حملات ممولة، مشاهدات مؤهلة،
            وأرباح حقيقية.
          </p>
        </div>

        {footerColumns.map((column) => (
          <nav key={column.title} aria-label={column.title}>
            <h3 className="mb-4 text-xs font-extrabold uppercase tracking-wide text-[var(--color-text-muted)]">
              {column.title}
            </h3>
            <ul className="space-y-3 text-sm font-semibold text-[var(--color-text-secondary)]">
              {column.links.map((link) => (
                <li key={`${column.title}-${link.label}`}>
                  <Link href={link.href} className="nav-link">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>

      <div className="border-t border-[var(--color-border)]">
        <div className="mx-auto max-w-7xl px-5 py-5 text-xs font-medium text-[var(--color-text-muted)] lg:px-8">
          © {new Date().getFullYear()} خلّيها ترند — SA Studio. كل الحقوق محفوظة.
        </div>
      </div>
    </footer>
  );
}
