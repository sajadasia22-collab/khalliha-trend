"use client";

import { useState } from "react";
import Link from "next/link";
import { ButtonLink } from "../ui/button";
import { CloseIcon, MenuIcon } from "../ui/icons";

const navLinks = [
  { href: "/", label: "الرئيسية" },
  { href: "/campaigns", label: "الحملات" },
  { href: "/creators", label: "صناع المحتوى" },
  { href: "/how-it-works", label: "كيف تعمل المنصة" },
];

export function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-20 border-b border-[rgba(210,221,214,.8)] bg-[rgba(250,252,251,.88)] backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 lg:px-8">
        <Link className="brand-lockup" href="/" aria-label="خلّيها ترند">
          <span className="brand-mark" aria-hidden="true" />
          <span>خلّيها ترند</span>
        </Link>

        <nav className="hidden items-center gap-8 text-sm font-semibold text-[var(--color-text-secondary)] md:flex">
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href} className="nav-link">
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden md:block">
          <ButtonLink href="/login">دخول المنصة</ButtonLink>
        </div>

        <button
          type="button"
          className="flex h-11 w-11 items-center justify-center rounded-[var(--radius-md)] border border-[var(--color-border)] md:hidden"
          aria-label={isMenuOpen ? "إغلاق القائمة" : "فتح القائمة"}
          aria-expanded={isMenuOpen}
          onClick={() => setIsMenuOpen((open) => !open)}
        >
          <span className="sr-only">القائمة</span>
          {isMenuOpen ? (
            <CloseIcon size={20} strokeWidth={2} aria-hidden="true" />
          ) : (
            <MenuIcon size={20} strokeWidth={2} aria-hidden="true" />
          )}
        </button>
      </div>

      <div
        className={`grid transition-[grid-template-rows] duration-250 ease-[cubic-bezier(.2,.8,.2,1)] md:hidden ${
          isMenuOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        }`}
      >
        <nav
          className={`overflow-hidden border-t border-[var(--color-border)] text-sm font-semibold text-[var(--color-text-secondary)] transition-opacity duration-200 ease-[cubic-bezier(.2,.8,.2,1)] ${
            isMenuOpen ? "opacity-100" : "opacity-0"
          }`}
        >
          <div className="flex flex-col gap-1 px-5 py-4">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-[var(--radius-sm)] px-3 py-2.5 transition-colors duration-150 hover:bg-[var(--color-surface-muted)]"
                onClick={() => setIsMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <ButtonLink className="mt-2 justify-center" href="/login">
              دخول المنصة
            </ButtonLink>
          </div>
        </nav>
      </div>
    </header>
  );
}
