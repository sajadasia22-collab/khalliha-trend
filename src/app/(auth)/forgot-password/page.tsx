"use client";

import { useState } from "react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [identifier, setIdentifier] = useState("");
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [shake, setShake] = useState(false);

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 450);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!identifier.trim()) {
      setError("البريد الإلكتروني أو الهاتف مطلوب");
      triggerShake();
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/v1/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: identifier.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error?.message || "حدث خطأ. يرجى المحاولة مرة أخرى.");
        triggerShake();
        return;
      }

      setSuccessMessage(data.message as string);
    } catch {
      setError("حدث خطأ في الاتصال بالسيرفر. يرجى المحاولة لاحقاً.");
      triggerShake();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--color-bg)] px-5 py-12 text-[var(--color-text)] dir-rtl">
      <div
        className={`auth-card card max-w-md w-full p-8 border border-[var(--color-border)] bg-[var(--color-surface)] shadow-lg rounded-[var(--radius-lg)] ${shake ? "auth-shake" : ""}`}
      >
        <div className="text-center mb-8">
          <Link className="brand-lockup inline-flex justify-center" href="/">
            <span className="brand-mark" aria-hidden="true" />
            <span className="text-2xl font-black">خلّيها ترند</span>
          </Link>
          <h1 className="text-xl font-bold mt-4">استعادة كلمة المرور</h1>
          <p className="text-[var(--color-text-secondary)] text-sm mt-1">
            أدخل بريدك الإلكتروني أو رقم هاتفك المسجل وسنرسل لك رابط إعادة التعيين
          </p>
        </div>

        {error && (
          <div
            role="alert"
            className="mb-6 p-4 rounded-[var(--radius-sm)] bg-[rgba(6,38,25,0.05)] border-r-4 border-[var(--color-brand-active)] text-[var(--forest-800)] text-sm font-semibold"
          >
            {error}
          </div>
        )}

        {successMessage ? (
          <div
            role="status"
            className="p-4 rounded-[var(--radius-sm)] bg-[rgba(6,38,25,0.05)] border-r-4 border-[var(--forest-700)] text-[var(--forest-800)] text-sm font-semibold"
          >
            {successMessage}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="auth-field">
              <label htmlFor="identifier" className="block text-sm font-bold mb-2">
                البريد الإلكتروني أو رقم الهاتف
              </label>
              <div className="auth-input-group relative">
                <input
                  type="text"
                  id="identifier"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="example@mail.com"
                  autoComplete="email"
                  disabled={isLoading}
                  className="w-full min-h-[48px] ps-4 pe-4 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] focus:border-[var(--color-brand)] focus:ring-4 focus:ring-[rgba(214,246,29,0.18)] focus:outline-none transition-all text-left font-medium"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full flex justify-center items-center gap-2 py-3.5 text-sm font-extrabold rounded-[var(--radius-md)] bg-[var(--color-brand)] text-[var(--color-text-on-brand)] hover:bg-[var(--color-brand-hover)] transition-all cursor-pointer disabled:opacity-50"
            >
              {isLoading && <span className="auth-spinner" aria-hidden="true" />}
              {isLoading ? "جاري الإرسال..." : "إرسال رابط إعادة التعيين"}
            </button>
          </form>
        )}

        <div className="mt-8 text-center text-sm font-semibold text-[var(--color-text-secondary)]">
          <Link
            href="/login"
            className="text-[var(--forest-700)] underline hover:text-[var(--forest-900)]"
          >
            الرجوع إلى تسجيل الدخول
          </Link>
        </div>
      </div>
    </main>
  );
}
