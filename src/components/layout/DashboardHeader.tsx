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

      <header className="sticky top-0 z-20 border-b border-[rgba(210,221,214,.8)] bg-[rgba(250,252,251,.88)] backdrop-blur-xl">
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
              className="hidden max-w-52 truncate rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-3.5 py-1.5 text-xs font-bold text-[var(--color-text-secondary)] transition-all hover:bg-[var(--color-surface-muted)] lg:inline-block"
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
