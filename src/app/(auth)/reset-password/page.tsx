"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { PasswordField } from "../../../components/auth/PasswordField";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<{ password?: string; confirmPassword?: string }>({});
  const [apiError, setApiError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [shake, setShake] = useState(false);
  const [isDone, setIsDone] = useState(false);

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 450);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setApiError("");

    if (password.length < 6) {
      setErrors({ password: "كلمة المرور يجب أن تكون 6 أحرف على الأقل" });
      triggerShake();
      return;
    }

    if (password !== confirmPassword) {
      setErrors({ confirmPassword: "كلمتا المرور غير متطابقتين" });
      triggerShake();
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/v1/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setApiError(data.error?.message || "فشل إعادة تعيين كلمة المرور.");
        triggerShake();
        return;
      }

      setIsDone(true);
    } catch {
      setApiError("حدث خطأ في الاتصال بالسيرفر. يرجى المحاولة لاحقاً.");
      triggerShake();
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
    return (
      <div
        role="alert"
        className="p-4 rounded-[var(--radius-sm)] bg-[rgba(6,38,25,0.05)] border-r-4 border-[var(--color-brand-active)] text-[var(--forest-800)] text-sm font-semibold"
      >
        رابط إعادة التعيين غير صالح.{" "}
        <Link href="/forgot-password" className="underline">
          اطلب رابطاً جديداً
        </Link>
      </div>
    );
  }

  if (isDone) {
    return (
      <div className="space-y-6 text-center">
        <div
          role="status"
          className="p-4 rounded-[var(--radius-sm)] bg-[rgba(6,38,25,0.05)] border-r-4 border-[var(--forest-700)] text-[var(--forest-800)] text-sm font-semibold"
        >
          تم تغيير كلمة المرور بنجاح.
        </div>
        <Link
          href="/login"
          className="btn-primary inline-flex justify-center items-center gap-2 py-3.5 px-8 text-sm font-extrabold rounded-[var(--radius-md)] bg-[var(--color-brand)] text-[var(--color-text-on-brand)] hover:bg-[var(--color-brand-hover)] transition-all"
        >
          تسجيل الدخول
        </Link>
      </div>
    );
  }

  return (
    <div className={shake ? "auth-shake" : ""}>
      {apiError && (
        <div
          role="alert"
          className="mb-6 p-4 rounded-[var(--radius-sm)] bg-[rgba(6,38,25,0.05)] border-r-4 border-[var(--color-brand-active)] text-[var(--forest-800)] text-sm font-semibold"
        >
          {apiError}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="auth-field">
          <PasswordField
            id="password"
            label="كلمة المرور الجديدة"
            value={password}
            onChange={setPassword}
            placeholder="••••••••"
            disabled={isLoading}
            error={errors.password}
            autoComplete="new-password"
          />
        </div>

        <div className="auth-field" style={{ animationDelay: "60ms" }}>
          <PasswordField
            id="confirmPassword"
            label="تأكيد كلمة المرور"
            value={confirmPassword}
            onChange={setConfirmPassword}
            placeholder="••••••••"
            disabled={isLoading}
            error={errors.confirmPassword}
            autoComplete="new-password"
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="btn-primary w-full flex justify-center items-center gap-2 py-3.5 text-sm font-extrabold rounded-[var(--radius-md)] bg-[var(--color-brand)] text-[var(--color-text-on-brand)] hover:bg-[var(--color-brand-hover)] transition-all cursor-pointer disabled:opacity-50"
        >
          {isLoading && <span className="auth-spinner" aria-hidden="true" />}
          {isLoading ? "جاري الحفظ..." : "تعيين كلمة المرور"}
        </button>
      </form>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--color-bg)] px-5 py-12 text-[var(--color-text)] dir-rtl">
      <div className="auth-card card max-w-md w-full p-8 border border-[var(--color-border)] bg-[var(--color-surface)] shadow-lg rounded-[var(--radius-lg)]">
        <div className="text-center mb-8">
          <Link className="brand-lockup inline-flex justify-center" href="/">
            <span className="brand-mark" aria-hidden="true" />
            <span className="text-2xl font-black">خلّيها ترند</span>
          </Link>
          <h1 className="text-xl font-bold mt-4">تعيين كلمة مرور جديدة</h1>
        </div>

        <Suspense fallback={null}>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </main>
  );
}
