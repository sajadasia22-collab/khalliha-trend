"use client";

import { useState } from "react";

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
        <button
          type="button"
          onClick={() => setIsVisible((visible) => !visible)}
          className="absolute end-0 top-0 flex h-full w-11 items-center justify-center text-[var(--color-text-muted)] transition-colors hover:text-[var(--forest-700)]"
          aria-label={isVisible ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
          tabIndex={-1}
        >
          {isVisible ? (
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M3 3l18 18M10.6 10.6a2.5 2.5 0 0 0 3.5 3.5M6.5 6.7C4 8.3 2.3 10.7 1.5 12c1.6 2.6 5 7 10.5 7 1.8 0 3.4-.5 4.7-1.2M9.5 4.3A10.6 10.6 0 0 1 12 4c5.5 0 8.9 4.4 10.5 7-1 1.6-2.3 3.2-3.9 4.4"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          ) : (
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M1.5 12S5 5 12 5s10.5 7 10.5 7-3.5 7-10.5 7S1.5 12 1.5 12z"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinejoin="round"
              />
              <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.7" />
            </svg>
          )}
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
