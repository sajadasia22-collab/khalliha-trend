"use client";

import { useState } from "react";
import { EyeIcon, EyeOffIcon } from "../ui/icons";

type Props = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  error?: string;
  autoComplete?: string;
};

export function PasswordField({
  id,
  label,
  value,
  onChange,
  placeholder,
  disabled,
  error,
  autoComplete = "current-password",
}: Props) {
  const [isVisible, setIsVisible] = useState(false);
  const [hasToggled, setHasToggled] = useState(false);

  return (
    <div>
      <label htmlFor={id} className="block text-sm font-bold mb-2">
        {label}
      </label>
      <div className="auth-input-group relative">
        <span className="auth-input-icon">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <rect
              x="5"
              y="11"
              width="14"
              height="9"
              rx="2"
              stroke="currentColor"
              strokeWidth="1.8"
            />
            <path
              d="M8 11V7a4 4 0 0 1 8 0v4"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
          </svg>
        </span>
        <input
          type={isVisible ? "text" : "password"}
          id={id}
          dir="ltr"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          className="w-full min-h-[48px] ps-11 pe-11 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] focus:border-[var(--color-brand)] focus:ring-4 focus:ring-[rgba(214,246,29,0.18)] focus:outline-none transition-all text-left font-medium"
          disabled={disabled}
        />
        {hasToggled && (
          <span
            key={isVisible ? "password-revealed" : "password-concealed"}
            className="password-field-flash"
            aria-hidden="true"
          />
        )}
        <button
          type="button"
          onClick={() => {
            setHasToggled(true);
            setIsVisible((visible) => !visible);
          }}
          className={`password-toggle absolute end-0 top-0 z-10 flex h-full w-11 items-center justify-center text-[var(--color-text-muted)] transition-colors hover:text-[var(--forest-700)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-active)] ${hasToggled ? "has-toggled" : ""} ${isVisible ? "is-visible" : ""}`}
          aria-label={isVisible ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
          aria-pressed={isVisible}
        >
          <span
            key={isVisible ? "hide-password" : "show-password"}
            className="password-toggle-effect"
            aria-hidden="true"
          >
            {isVisible ? <EyeOffIcon /> : <EyeIcon />}
          </span>
        </button>
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
