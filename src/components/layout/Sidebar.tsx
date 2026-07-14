"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { navByRole, isNavItemActive, type DashboardRole } from "./dashboardNav";

export function Sidebar({ dashboardRole }: { dashboardRole: DashboardRole }) {
  const pathname = usePathname();
  const links = navByRole[dashboardRole];

  return (
    <aside className="fixed inset-y-0 start-0 z-30 hidden w-64 flex-col border-e border-[var(--color-border)] bg-[var(--color-surface)] shadow-[18px_0_42px_rgba(6,38,25,0.06)] md:flex">
      <Link className="brand-lockup px-6 py-6" href="/" aria-label="خلّيها ترند">
        <span className="brand-mark" aria-hidden="true" />
        <span>خلّيها ترند</span>
      </Link>

      <nav className="flex-1 space-y-1 px-4" aria-label="التنقل داخل اللوحة">
        {links.map((link) => {
          const Icon = link.icon;
          const active = isNavItemActive(pathname, link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              aria-current={active ? "page" : undefined}
              className={`group flex items-center gap-3 rounded-[var(--radius-md)] px-3 py-2.5 text-sm font-bold transition-all duration-150 ease-[var(--ease-brand)] ${
                active
                  ? "surface-3d text-[var(--forest-900)]"
                  : "text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-text)] hover:shadow-[var(--shadow-sm)]"
              }`}
            >
              <span
                className={`flex h-9 w-9 items-center justify-center rounded-[var(--radius-sm)] ${
                  active
                    ? "icon-3d"
                    : "bg-[var(--color-surface)] text-[var(--color-text-secondary)] shadow-[var(--shadow-sm)]"
                }`}
              >
                <Icon size={18} strokeWidth={2.2} />
              </span>
              <span>{link.label}</span>
              {active && (
                <span
                  aria-hidden="true"
                  className="ms-auto h-1.5 w-1.5 rounded-full bg-[var(--color-brand)]"
                />
              )}
            </Link>
          );
        })}
      </nav>

      <div className="px-4 pb-6 pt-4 text-xs font-medium text-[var(--color-text-muted)]">
        خلّيها ترند — SA Studio
      </div>
    </aside>
  );
}
