"use client";

import type { ComponentType } from "react";
import { platformLabels } from "../../lib/campaigns";
import {
  TikTokIcon,
  InstagramIcon,
  FacebookIcon,
  YouTubeIcon,
  XIcon,
  ThreadsIcon,
  CheckIcon,
} from "../ui/icons";

type PlatformValue = keyof typeof platformLabels;

const platformIcons: Record<PlatformValue, ComponentType<{ className?: string }>> = {
  TIKTOK: TikTokIcon,
  INSTAGRAM: InstagramIcon,
  FACEBOOK: FacebookIcon,
  YOUTUBE: YouTubeIcon,
  X: XIcon,
  THREADS: ThreadsIcon,
};

const platformOptions = Object.entries(platformLabels) as [PlatformValue, string][];

/** Always-visible icon toggle grid for picking one or more platforms — every option reads by its real logo, none hidden behind a collapsed dropdown. */
export function PlatformSelect({
  values,
  onChange,
  disabled,
}: {
  values: PlatformValue[];
  onChange: (values: PlatformValue[]) => void;
  disabled?: boolean;
}) {
  function toggle(platform: PlatformValue) {
    if (values.includes(platform)) {
      onChange(values.filter((v) => v !== platform));
    } else {
      onChange([...values, platform]);
    }
  }

  return (
    <div
      role="group"
      aria-label="اختر منصة أو أكثر"
      className="grid grid-cols-3 gap-2 sm:grid-cols-6"
    >
      {platformOptions.map(([optionValue, label]) => {
        const Icon = platformIcons[optionValue];
        const selected = values.includes(optionValue);
        return (
          <button
            key={optionValue}
            type="button"
            role="checkbox"
            aria-checked={selected}
            disabled={disabled}
            onClick={() => toggle(optionValue)}
            className={`flex flex-col items-center gap-1.5 rounded-[var(--radius-md)] border-2 p-2 transition-all disabled:opacity-60 ${
              selected
                ? "border-[var(--color-brand)] bg-[var(--color-surface-muted)]"
                : "border-transparent hover:bg-[var(--color-surface-muted)]"
            }`}
          >
            <span className="relative flex items-center justify-center w-11 h-11 rounded-[var(--radius-md)] bg-white border border-[var(--color-border)] shadow-sm">
              <Icon className="w-6 h-6" />
              {selected && (
                <span className="absolute -top-1.5 -end-1.5 flex items-center justify-center w-4.5 h-4.5 rounded-full bg-[var(--color-brand)] border border-[var(--color-surface)]">
                  <CheckIcon
                    size={10}
                    strokeWidth={3}
                    className="text-[var(--color-text-on-brand)]"
                  />
                </span>
              )}
            </span>
            <span
              dir="ltr"
              className="w-full text-center text-[10px] font-bold leading-tight text-[var(--color-text)]"
            >
              {label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
