"use client";

import { useLayoutEffect, useRef, useState } from "react";

export type TabItem = {
  value: string;
  label: string;
};

export function Tabs({
  items,
  value,
  onChange,
  className,
}: {
  items: TabItem[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
}) {
  const listRef = useRef<HTMLDivElement>(null);
  const buttonRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [indicator, setIndicator] = useState<{ start: number; width: number } | null>(
    null,
  );

  useLayoutEffect(() => {
    const list = listRef.current;
    const active = buttonRefs.current[value];
    if (!list || !active) return;

    const isRtl = getComputedStyle(list).direction === "rtl";
    const listRect = list.getBoundingClientRect();
    const activeRect = active.getBoundingClientRect();
    const start = isRtl
      ? listRect.right - activeRect.right
      : activeRect.left - listRect.left;

    setIndicator({ start: start + list.scrollLeft, width: activeRect.width });
  }, [value, items]);

  function handleKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    const currentIndex = items.findIndex((item) => item.value === value);
    if (currentIndex === -1) return;

    if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
      event.preventDefault();
      const isRtl = listRef.current
        ? getComputedStyle(listRef.current).direction === "rtl"
        : true;
      const forward = event.key === "ArrowRight" ? !isRtl : isRtl;
      const nextIndex = forward
        ? (currentIndex + 1) % items.length
        : (currentIndex - 1 + items.length) % items.length;
      const next = items[nextIndex];
      onChange(next.value);
      buttonRefs.current[next.value]?.focus();
    }
  }

  return (
    // Roving-tabindex pattern (WAI-ARIA APG): individual tabs manage focus via
    // tabIndex below, so the tablist container itself is intentionally not a
    // focus stop.
    // eslint-disable-next-line jsx-a11y/interactive-supports-focus
    <div
      ref={listRef}
      role="tablist"
      onKeyDown={handleKeyDown}
      className={[
        "relative flex gap-1 overflow-x-auto whitespace-nowrap border-b border-[var(--color-border)]",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {items.map((item) => {
        const active = item.value === value;
        return (
          <button
            key={item.value}
            ref={(node) => {
              buttonRefs.current[item.value] = node;
            }}
            type="button"
            role="tab"
            aria-selected={active}
            tabIndex={active ? 0 : -1}
            onClick={() => onChange(item.value)}
            className={`relative px-4 py-3 text-sm font-bold transition-colors duration-150 ease-[var(--ease-brand)] ${
              active
                ? "text-[var(--color-text)]"
                : "text-[var(--color-text-secondary)] hover:text-[var(--color-text)]"
            }`}
          >
            {item.label}
          </button>
        );
      })}
      {indicator && (
        <span
          aria-hidden="true"
          className="absolute bottom-0 h-[3px] rounded-[var(--radius-pill)] bg-[var(--color-brand)] transition-all duration-300 ease-[var(--ease-brand)]"
          style={{ insetInlineStart: indicator.start, width: indicator.width }}
        />
      )}
    </div>
  );
}
