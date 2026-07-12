"use client";

import { useId, useState, type ReactNode } from "react";

type TooltipSide = "top" | "bottom";

export function Tooltip({
  content,
  side = "top",
  children,
}: {
  content: ReactNode;
  side?: TooltipSide;
  children: ReactNode;
}) {
  const [visible, setVisible] = useState(false);
  const id = useId();

  return (
    <span
      className="relative inline-flex"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onFocus={() => setVisible(true)}
      onBlur={() => setVisible(false)}
    >
      <span aria-describedby={visible ? id : undefined}>{children}</span>
      <span
        role="tooltip"
        id={id}
        className={`pointer-events-none absolute start-1/2 z-40 w-max max-w-56 -translate-x-1/2 rounded-[var(--radius-sm)] bg-[var(--color-surface-dark)] px-2.5 py-1.5 text-xs font-semibold text-[var(--color-text-on-dark)] shadow-[var(--shadow-md)] transition-all duration-150 ease-[var(--ease-brand)] ${
          side === "top" ? "bottom-full mb-2" : "top-full mt-2"
        } ${visible ? "translate-y-0 opacity-100" : `${side === "top" ? "translate-y-1" : "-translate-y-1"} opacity-0`}`}
      >
        {content}
      </span>
    </span>
  );
}
