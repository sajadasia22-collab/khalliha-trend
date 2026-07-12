"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { ChevronDownIcon } from "./icons";

export type DropdownOption = {
  value: string;
  label: string;
};

export function Dropdown({
  label,
  options,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  options: DropdownOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  const labelId = useId();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const selected = options.find((option) => option.value === value);
  const allOptions: DropdownOption[] = [{ value: "", label: placeholder }, ...options];

  function closeAndFocusTrigger() {
    setOpen(false);
    triggerRef.current?.focus();
  }

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function handleEscape(event: globalThis.KeyboardEvent) {
      if (event.key === "Escape") {
        closeAndFocusTrigger();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    const selectedIndex = allOptions.findIndex((option) => option.value === value);
    const targetIndex = selectedIndex >= 0 ? selectedIndex : 0;
    optionRefs.current[targetIndex]?.focus();
    // Only re-run when `open` toggles — re-running on every value/allOptions
    // change would steal focus back to the selected option mid-keyboard-navigation.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function handleListKeyDown(event: KeyboardEvent<HTMLUListElement>) {
    if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
    event.preventDefault();
    const currentIndex = optionRefs.current.findIndex(
      (el) => el === document.activeElement,
    );
    const direction = event.key === "ArrowDown" ? 1 : -1;
    const nextIndex = (currentIndex + direction + allOptions.length) % allOptions.length;
    optionRefs.current[nextIndex]?.focus();
  }

  return (
    <div className="relative" ref={containerRef}>
      <span
        id={labelId}
        className="mb-1.5 block text-xs font-bold text-[var(--color-text-secondary)]"
      >
        {label}
      </span>
      <button
        type="button"
        ref={triggerRef}
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="flex min-h-[48px] w-full items-center justify-between gap-3 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 text-sm font-semibold text-[var(--color-text)] transition-colors duration-150 ease-[cubic-bezier(.2,.8,.2,1)] hover:border-[var(--color-border-strong)] focus-visible:outline-none focus-visible:border-[var(--color-brand)] focus-visible:shadow-[0_0_0_4px_rgba(214,246,29,.18)]"
      >
        <span
          className={
            selected ? "text-[var(--color-text)]" : "text-[var(--color-text-muted)]"
          }
        >
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDownIcon
          size={16}
          strokeWidth={1.6}
          aria-hidden="true"
          className={`flex-shrink-0 text-[var(--color-text-secondary)] transition-transform duration-200 ease-[cubic-bezier(.2,.8,.2,1)] ${open ? "rotate-180" : ""}`}
        />
      </button>

      {/* Mobile backdrop */}
      <div
        aria-hidden="true"
        onClick={closeAndFocusTrigger}
        className={`fixed inset-0 z-30 bg-[rgba(6,38,25,.32)] transition-opacity duration-200 ease-[cubic-bezier(.2,.8,.2,1)] sm:hidden ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      <ul
        role="listbox"
        aria-labelledby={labelId}
        onKeyDown={handleListKeyDown}
        className={`fixed inset-x-3 bottom-3 z-40 max-h-72 overflow-y-auto rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-2 shadow-[0_20px_50px_rgba(6,38,25,.14)] transition-[opacity,transform] duration-200 ease-[cubic-bezier(.2,.8,.2,1)] sm:absolute sm:inset-x-auto sm:bottom-auto sm:start-0 sm:top-full sm:mt-2 sm:w-56 ${
          open
            ? "translate-y-0 opacity-100"
            : "pointer-events-none translate-y-2 opacity-0 sm:translate-y-1"
        }`}
      >
        {allOptions.map((option, index) => (
          <li key={option.value || "__placeholder__"} role="presentation">
            <button
              type="button"
              ref={(el) => {
                optionRefs.current[index] = el;
              }}
              role="option"
              aria-selected={value === option.value}
              onClick={() => {
                onChange(option.value);
                closeAndFocusTrigger();
              }}
              className={`flex w-full items-center rounded-[var(--radius-sm)] px-3 py-2.5 text-start text-sm font-semibold transition-colors duration-150 hover:bg-[var(--color-surface-muted)] focus-visible:outline-none focus-visible:bg-[var(--color-surface-muted)] ${
                value === option.value
                  ? "bg-[var(--trend-100)] text-[var(--color-text)]"
                  : "text-[var(--color-text-secondary)]"
              }`}
            >
              {option.label}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
