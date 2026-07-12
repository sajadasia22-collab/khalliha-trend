import type { InputHTMLAttributes, ReactNode } from "react";

type RadioProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  label?: ReactNode;
};

export function Radio({ className, label, id, ...props }: RadioProps) {
  const input = (
    <span className="relative inline-flex h-5 w-5 flex-shrink-0 items-center justify-center">
      <input
        type="radio"
        id={id}
        className="peer relative h-5 w-5 cursor-pointer appearance-none rounded-full border border-[var(--color-border-strong)] bg-[var(--color-surface)] transition-colors duration-150 ease-[var(--ease-brand)] checked:border-[5px] checked:border-[var(--color-brand)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[rgba(214,246,29,0.25)] disabled:cursor-not-allowed disabled:opacity-50"
        {...props}
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
