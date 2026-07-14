"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { CloseIcon, MenuIcon } from "../ui/icons";
import { navByRole, isNavItemActive, type DashboardRole } from "./dashboardNav";

const primaryHrefs: Record<DashboardRole, string[]> = {
  creator: ["/creator/dashboard", "/community", "/campaigns", "/creator/messages"],
  brand: ["/brand/dashboard", "/brand/campaigns", "/brand/messages", "/brand/wallet"],
  admin: ["/admin/dashboard", "/admin/reviews", "/admin/users", "/admin/fraud"],
};

export function BottomTabBar({ dashboardRole }: { dashboardRole: DashboardRole }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const links = navByRole[dashboardRole];
  const primary = useMemo(
    () =>
      primaryHrefs[dashboardRole]
        .map((href) => links.find((link) => link.href === href))
        .filter((link): link is (typeof links)[number] => Boolean(link)),
    [dashboardRole, links],
  );
  const secondary = links.filter(
    (link) => !primary.some((item) => item.href === link.href),
  );
  const secondaryActive = secondary.some((link) => isNavItemActive(pathname, link.href));

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-40 md:hidden" role="presentation">
          <button
            type="button"
            aria-label="إغلاق قائمة الأقسام"
            className="absolute inset-0 bg-[rgba(6,38,25,.58)] backdrop-blur-[2px]"
            onClick={() => setOpen(false)}
          />
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="mobile-more-title"
            className="absolute inset-x-0 bottom-0 max-h-[78vh] overflow-y-auto rounded-t-[28px] border-t border-[var(--color-border)] bg-[var(--color-surface)] px-5 pb-[calc(92px+env(safe-area-inset-bottom))] pt-4 shadow-[var(--shadow-lg)]"
          >
            <div className="mx-auto mb-4 h-1 w-12 rounded-full bg-[var(--color-border-strong)]" />
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 id="mobile-more-title" className="text-xl font-black">
                  كل الأقسام
                </h2>
                <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                  الخدمات الأقل استخداماً محفوظة هنا حتى يبقى الشريط خفيفاً.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-surface-muted)]"
                aria-label="إغلاق"
              >
                <CloseIcon />
              </button>
            </div>
            <nav className="grid grid-cols-2 gap-3" aria-label="الأقسام الإضافية">
              {secondary.map((link) => {
                const Icon = link.icon;
                const active = isNavItemActive(pathname, link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setOpen(false)}
                    aria-current={active ? "page" : undefined}
                    className={`flex min-h-24 flex-col justify-between rounded-[var(--radius-lg)] border p-4 text-start transition active:scale-[.98] ${
                      active
                        ? "border-[var(--color-brand)] bg-[rgba(214,246,29,.16)]"
                        : "border-[var(--color-border)] bg-[var(--color-surface-muted)]"
                    }`}
                  >
                    <span className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-surface)] shadow-[var(--shadow-sm)]">
                      <Icon size={19} />
                    </span>
                    <strong className="mt-3 text-sm">{link.label}</strong>
                  </Link>
                );
              })}
            </nav>
          </section>
        </div>
      )}

      <nav
        aria-label="التنقل الأساسي داخل اللوحة"
        className="fixed inset-x-0 bottom-0 z-50 grid grid-cols-5 border-t border-[var(--color-border)] bg-[var(--color-surface)] px-1 shadow-[0_-16px_34px_rgba(6,38,25,0.08)] pb-[env(safe-area-inset-bottom)] md:hidden"
      >
        {primary.map((link) => {
          const Icon = link.icon;
          const active = isNavItemActive(pathname, link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              aria-current={active ? "page" : undefined}
              className="group flex min-w-0 flex-col items-center gap-1 px-0.5 py-2 text-[10px] font-bold"
            >
              <span
                className={`flex h-8 w-10 items-center justify-center rounded-[var(--radius-pill)] transition ${
                  active
                    ? "bg-[var(--color-brand)] text-[var(--color-text-on-brand)]"
                    : "text-[var(--color-text-secondary)]"
                }`}
              >
                <Icon size={19} strokeWidth={active ? 2.4 : 1.9} />
              </span>
              <span className="w-full truncate text-center">{link.label}</span>
            </Link>
          );
        })}
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-expanded={open}
          aria-haspopup="dialog"
          className="group flex min-w-0 flex-col items-center gap-1 px-0.5 py-2 text-[10px] font-bold"
        >
          <span
            className={`flex h-8 w-10 items-center justify-center rounded-[var(--radius-pill)] transition ${
              secondaryActive || open
                ? "bg-[var(--color-brand)] text-[var(--color-text-on-brand)]"
                : "text-[var(--color-text-secondary)]"
            }`}
          >
            <MenuIcon size={19} />
          </span>
          <span>المزيد</span>
        </button>
      </nav>
    </>
  );
}
