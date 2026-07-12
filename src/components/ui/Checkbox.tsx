import type { InputHTMLAttributes, ReactNode } from "react";
import { CheckIcon } from "./icons";

type CheckboxProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  label?: ReactNode;
};

export function Checkbox({ className, label, id, ...props }: CheckboxProps) {
  const input = (
    <span className="relative inline-flex h-5 w-5 flex-shrink-0 items-center justify-center">
      <input
        type="checkbox"
        id={id}
        className="peer absolute inset-0 h-5 w-5 cursor-pointer appearance-none rounded-[6px] border border-[var(--color-border-strong)] bg-[var(--color-surface)] transition-colors duration-150 ease-[var(--ease-brand)] checked:border-[var(--color-brand)] checked:bg-[var(--color-brand)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[rgba(214,246,29,0.25)] disabled:cursor-not-allowed disabled:opacity-50"
        {...props}
      />
      <CheckIcon
        size={14}
        strokeWidth={3}
        className="pointer-events-none relative text-[var(--color-text-on-brand)] opacity-0 transition-opacity duration-150 peer-checked:opacity-100"
      />
    </span>
  );

  if (!label) return input;

  return (
    <label
      htmlFor={id}
      className={[
        "inline-flex cursor-pointer items-center gap-2.5 text-sm font-semibold text-[var(--color-text)]",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {input}
      {label}
    </label>
  );
}
