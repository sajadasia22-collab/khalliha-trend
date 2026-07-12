import { IraqFlag } from "../ui/IraqFlag";

type Props = {
  id: string;
  digits: string;
  onChange: (digits: string) => void;
  disabled?: boolean;
  error?: string;
};

export function PhoneInput({ id, digits, onChange, disabled, error }: Props) {
  return (
    <div>
      <div
        dir="ltr"
        className="auth-input-group flex overflow-hidden rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] transition-all focus-within:border-[var(--color-brand)] focus-within:ring-4 focus-within:ring-[rgba(214,246,29,0.18)]"
      >
        <span className="flex items-center gap-2 border-e border-[var(--color-border)] bg-[var(--color-surface-muted)] px-3 text-sm font-bold text-[var(--color-text-secondary)]">
          <IraqFlag />
          <span>+964</span>
        </span>
        <input
          type="tel"
          inputMode="numeric"
          id={id}
          value={digits}
          onChange={(event) => onChange(event.target.value.replace(/[^0-9]/g, ""))}
          placeholder="7XX XXX XXXX"
          maxLength={10}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          className="min-h-[48px] w-full px-4 text-left font-medium text-[var(--color-text)] focus:outline-none"
          disabled={disabled}
        />
      </div>
      {error && (
        <p
          id={`${id}-error`}
          role="alert"
          className="text-xs text-[var(--forest-800)] font-bold mt-1.5"
        >
          {error}
        </p>
      )}
    </div>
  );
}
