"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { Dropdown } from "../ui/Dropdown";

export function CampaignFilters({
  platformOptions,
  categoryOptions,
}: {
  platformOptions: { value: string; label: string }[];
  categoryOptions: { value: string; label: string }[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState(searchParams.get("search") ?? "");

  const platform = searchParams.get("platform") ?? "";
  const category = searchParams.get("category") ?? "";
  const hasActiveFilters = Boolean(platform || category || search);

  function applyParams(next: { platform?: string; category?: string; search?: string }) {
    const params = new URLSearchParams(searchParams.toString());
    const values = {
      platform: next.platform ?? platform,
      category: next.category ?? category,
      search: next.search ?? search,
    };
    for (const [key, value] of Object.entries(values)) {
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    }
    startTransition(() => {
      router.push(`/campaigns?${params.toString()}`);
    });
  }

  function handleClear() {
    setSearch("");
    startTransition(() => {
      router.push("/campaigns");
    });
  }

  return (
    <div className="mb-8 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-[0_2px_8px_rgba(6,38,25,.06)] sm:p-5">
      <form
        className="flex flex-col gap-4 sm:flex-row sm:items-end sm:flex-wrap"
        onSubmit={(event) => {
          event.preventDefault();
          applyParams({ search });
        }}
      >
        <div className="min-w-[200px] flex-1">
          <label
            htmlFor="search"
            className="mb-1.5 block text-xs font-bold text-[var(--color-text-secondary)]"
          >
            بحث
          </label>
          <div className="relative">
            <input
              id="search"
              name="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="ابحث باسم الحملة..."
              className="min-h-[48px] w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 text-sm font-semibold text-[var(--color-text)] transition-colors duration-150 ease-[cubic-bezier(.2,.8,.2,1)] placeholder:text-[var(--color-text-muted)] hover:border-[var(--color-border-strong)] focus:outline-none focus:border-[var(--color-brand)] focus:shadow-[0_0_0_4px_rgba(214,246,29,.18)]"
            />
          </div>
        </div>

        <div className="w-full sm:w-44">
          <Dropdown
            label="الفئة"
            placeholder="كل الفئات"
            options={categoryOptions}
            value={category}
            onChange={(next) => applyParams({ category: next })}
          />
        </div>

        <div className="w-full sm:w-44">
          <Dropdown
            label="المنصة"
            placeholder="كل المنصات"
            options={platformOptions}
            value={platform}
            onChange={(next) => applyParams({ platform: next })}
          />
        </div>

        <div className="flex gap-2 sm:w-auto">
          <button
            type="submit"
            className="btn-primary flex min-h-[48px] flex-1 items-center justify-center px-6 text-sm sm:flex-none"
          >
            بحث
          </button>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleClear}
              className="flex min-h-[48px] items-center justify-center rounded-[var(--radius-md)] px-4 text-sm font-bold text-[var(--color-text-secondary)] transition-colors duration-150 ease-[cubic-bezier(.2,.8,.2,1)] hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-text)]"
            >
              مسح الفلاتر
            </button>
          )}
        </div>
      </form>
      <div
        aria-hidden={!isPending}
        className={`mt-3 h-0.5 overflow-hidden rounded-full bg-[var(--color-surface-muted)] transition-opacity duration-200 ${isPending ? "opacity-100" : "opacity-0"}`}
      >
        <div className="h-full w-1/3 animate-[loading-bar_1s_ease-in-out_infinite] rounded-full bg-[var(--color-brand)]" />
      </div>
    </div>
  );
}
