"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { navByRole, isNavItemActive, type DashboardRole } from "./dashboardNav";

export function BottomTabBar({ dashboardRole }: { dashboardRole: DashboardRole }) {
  const pathname = usePathname();
  const links = navByRole[dashboardRole];

  return (
    <nav
      aria-label="التنقل داخل اللوحة"
      className="fixed inset-x-0 bottom-0 z-30 flex border-t border-[var(--color-border)] bg-[rgba(250,252,251,0.94)] pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:hidden"
    >
      {links.map((link) => {
        const Icon = link.icon;
        const active = isNavItemActive(pathname, link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={active ? "page" : undefined}
            className="flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-bold"
          >
            <span
              className={`flex h-9 w-9 items-center justify-center rounded-full transition-colors duration-150 ease-[var(--ease-brand)] ${
                active
                  ? "bg-[var(--color-brand)] text-[var(--color-text-on-brand)]"
                  : "text-[var(--color-text-secondary)]"
              }`}
            >
              <Icon size={18} strokeWidth={2} />
            </span>
            <span
              className={
                active ? "text-[var(--color-text)]" : "text-[var(--color-text-secondary)]"
              }
            >
              {link.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
