"use client";

import Link from "next/link";
import LogoutButton from "../auth/LogoutButton";
import { NotificationBell } from "../notifications/NotificationBell";
import { Sidebar } from "./Sidebar";
import { BottomTabBar } from "./BottomTabBar";
import type { DashboardRole } from "./dashboardNav";

export function DashboardHeader({
  dashboardRole,
  userLabel,
}: {
  dashboardRole: DashboardRole;
  userLabel: string;
}) {
  return (
    <>
      <Sidebar dashboardRole={dashboardRole} />

      <header className="sticky top-0 z-20 border-b border-[var(--color-border)] bg-[var(--color-surface)] shadow-[0_12px_34px_rgba(6,38,25,0.045)]">
        <div className="flex items-center justify-between gap-3 px-5 py-3.5 lg:px-8">
          <Link
            className="brand-lockup transition-transform hover:scale-[1.02] md:hidden"
            href="/"
            aria-label="خلّيها ترند"
          >
            <span className="brand-mark" aria-hidden="true" />
            <span className="hidden sm:inline text-lg font-black tracking-tight">
              خلّيها ترند
            </span>
          </Link>

          <div className="flex flex-1 items-center justify-end gap-2.5 sm:gap-3">
            <span
              className="surface-3d hidden max-w-52 truncate rounded-full px-3.5 py-1.5 text-xs font-bold text-[var(--color-text-secondary)] transition-all hover:text-[var(--color-text)] lg:inline-block"
              title={userLabel}
            >
              {userLabel}
            </span>
            <NotificationBell />
            <LogoutButton />
          </div>
        </div>
      </header>

      <BottomTabBar dashboardRole={dashboardRole} />
    </>
  );
}
