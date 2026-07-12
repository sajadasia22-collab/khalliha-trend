"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { CircleAlertIcon, CircleCheckIcon, CloseIcon, InfoIcon } from "./icons";

type ToastVariant = "success" | "error" | "info";

type ToastEntry = {
  id: number;
  message: string;
  variant: ToastVariant;
  leaving: boolean;
};

type ToastContextValue = {
  showToast: (message: string, variant?: ToastVariant) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

const TOAST_DURATION_MS = 4500;
const EXIT_DURATION_MS = 220;

const variantStyles: Record<
  ToastVariant,
  { icon: ReactNode; card: string; iconChip: string; bar: string }
> = {
  success: {
    icon: <CircleCheckIcon size={18} className="text-[var(--forest-700)]" />,
    card: "border-[var(--trend-300)] bg-[var(--trend-50)]",
    iconChip: "bg-[var(--trend-200)]",
    bar: "bg-[var(--color-brand)]",
  },
  error: {
    icon: <CircleAlertIcon size={18} className="text-[#b3261e]" />,
    card: "border-[rgba(179,38,30,0.35)] bg-[rgba(179,38,30,0.06)]",
    iconChip: "bg-[rgba(179,38,30,0.14)]",
    bar: "bg-[#b3261e]",
  },
  info: {
    icon: <InfoIcon size={18} className="text-[var(--color-text-secondary)]" />,
    card: "border-[var(--color-border)] bg-[var(--color-surface)]",
    iconChip: "bg-[var(--color-surface-muted)]",
    bar: "bg-[var(--color-text-secondary)]",
  },
};

let toastIdCounter = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastEntry[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  const remove = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const dismiss = useCallback(
    (id: number) => {
      setToasts((current) =>
        current.map((toast) => (toast.id === id ? { ...toast, leaving: true } : toast)),
      );
      window.setTimeout(() => remove(id), EXIT_DURATION_MS);
    },
    [remove],
  );

  const showToast = useCallback(
    (message: string, variant: ToastVariant = "info") => {
      toastIdCounter += 1;
      const id = toastIdCounter;
      setToasts((current) => [...current, { id, message, variant, leaving: false }]);
      window.setTimeout(() => dismiss(id), TOAST_DURATION_MS);
    },
    [dismiss],
  );

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {mounted &&
        createPortal(
          <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[60] flex flex-col items-center gap-2 px-4 sm:items-end sm:px-6">
            {toasts.map((toast) => {
              const style = variantStyles[toast.variant];
              return (
                <div
                  key={toast.id}
                  role="status"
                  className={`${toast.leaving ? "toast-out" : "toast-in"} pointer-events-auto relative flex w-full max-w-sm items-start gap-3 overflow-hidden rounded-[var(--radius-md)] border px-4 py-3 shadow-[var(--shadow-lg)] ${style.card}`}
                >
                  <span
                    className={`mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full ${style.iconChip}`}
                  >
                    {style.icon}
                  </span>
                  <p className="flex-1 pt-0.5 text-sm font-semibold text-[var(--color-text)]">
                    {toast.message}
                  </p>
                  <button
                    type="button"
                    onClick={() => dismiss(toast.id)}
                    aria-label="إغلاق التنبيه"
                    className="flex-shrink-0 text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text)]"
                  >
                    <CloseIcon size={16} />
                  </button>
                  {!toast.leaving && (
                    <span
                      aria-hidden="true"
                      className={`toast-countdown absolute inset-x-0 bottom-0 h-[3px] ${style.bar}`}
                      style={
                        {
                          "--toast-duration": `${TOAST_DURATION_MS}ms`,
                        } as React.CSSProperties
                      }
                    />
                  )}
                </div>
              );
            })}
          </div>,
          document.body,
        )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
