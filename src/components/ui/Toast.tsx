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
};

type ToastContextValue = {
  showToast: (message: string, variant?: ToastVariant) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

const variantStyles: Record<ToastVariant, { icon: ReactNode; className: string }> = {
  success: {
    icon: <CircleCheckIcon size={20} className="text-[var(--forest-500)]" />,
    className: "border-[var(--color-border)]",
  },
  error: {
    icon: <CircleAlertIcon size={20} className="text-[var(--forest-800)]" />,
    className: "border-[var(--color-border)]",
  },
  info: {
    icon: <InfoIcon size={20} className="text-[var(--color-text-secondary)]" />,
    className: "border-[var(--color-border)]",
  },
};

let toastIdCounter = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastEntry[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback(
    (message: string, variant: ToastVariant = "info") => {
      toastIdCounter += 1;
      const id = toastIdCounter;
      setToasts((current) => [...current, { id, message, variant }]);
      window.setTimeout(() => dismiss(id), 4500);
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
                  className={`toast-in pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-[var(--radius-md)] border bg-[var(--color-surface)] px-4 py-3 shadow-[var(--shadow-lg)] ${style.className}`}
                >
                  <span className="mt-0.5 flex-shrink-0">{style.icon}</span>
                  <p className="flex-1 text-sm font-semibold text-[var(--color-text)]">
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
