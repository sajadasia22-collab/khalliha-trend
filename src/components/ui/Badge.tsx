import type { HTMLAttributes } from "react";

export type BadgeVariant =
  "neutral" | "brand" | "success" | "warning" | "danger" | "info";

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  variant?: BadgeVariant;
};

const variantClassName: Record<BadgeVariant, string> = {
  neutral: "bg-[var(--color-surface-muted)] text-[var(--color-text-secondary)]",
  brand: "bg-[var(--color-brand)] text-[var(--color-text-on-brand)]",
  success: "bg-[rgba(67,109,84,0.14)] text-[var(--forest-700)]",
  warning: "bg-[var(--trend-100)] text-[var(--forest-700)]",
  danger: "bg-[var(--forest-800)] text-[var(--mist-50)]",
  info: "bg-[var(--mist-200)] text-[var(--color-text-secondary)]",
};

export function Badge({ className, variant = "neutral", ...props }: BadgeProps) {
  return (
    <span
      className={[
        "inline-flex items-center gap-1.5 rounded-[var(--radius-pill)] px-2.5 py-1 text-xs font-bold",
        variantClassName[variant],
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    />
  );
}
