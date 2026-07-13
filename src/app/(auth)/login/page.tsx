"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { loginSchema } from "../../../modules/auth/schemas";
import { PasswordField } from "../../../components/auth/PasswordField";
import { PhoneInput } from "../../../components/auth/PhoneInput";
import { GoogleAuthButton } from "../../../components/auth/GoogleAuthButton";
import { getGoogleAuthErrorMessage } from "../../../lib/auth/google-error-message";

type Tab = "email" | "phone";

export default function LoginPage() {
  const [tab, setTab] = useState<Tab>("email");
  const [email, setEmail] = useState("");
  const [phoneDigits, setPhoneDigits] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ identifier?: string; password?: string }>({});
  const [apiError, setApiError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [shake, setShake] = useState(false);
  const [showRoleSelector, setShowRoleSelector] = useState(false);

  useEffect(() => {
    const message = getGoogleAuthErrorMessage(
      new URLSearchParams(window.location.search).get("googleError"),
    );
    if (message) queueMicrotask(() => setApiError(message));
  }, []);

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 450);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setApiError("");

    let identifier = "";
    if (tab === "email") {
      identifier = email.trim();
    } else {
      if (phoneDigits.length !== 10 || !phoneDigits.startsWith("7")) {
        setErrors({ identifier: "رقم الهاتف غير صالح" });
        triggerShake();
        return;
      }
      identifier = `+964${phoneDigits}`;
    }

    const parsed = loginSchema.safeParse({ identifier, password });
    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors;
      setErrors({
        identifier: fieldErrors.identifier?.[0],
        password: fieldErrors.password?.[0],
      });
      triggerShake();
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setApiError(data.error?.message || "فشل تسجيل الدخول. يرجى المحاولة مرة أخرى.");
        triggerShake();
        return;
      }

      if (data.requiresRoleSelection) {
        setShowRoleSelector(true);
        return;
      }

      const role = data.user.role;
      if (role === "CREATOR") {
        window.location.href = "/creator/dashboard";
      } else if (role === "BRAND") {
        window.location.href = "/brand/dashboard";
      } else if (role === "ADMIN" || role === "SUPER_ADMIN") {
        window.location.href = "/admin/dashboard";
      } else {
        window.location.href = "/";
      }
    } catch {
      setApiError("حدث خطأ في الاتصال بالسيرفر. يرجى المحاولة لاحقاً.");
      triggerShake();
    } finally {
      setIsLoading(false);
    }
  };

  const handleRoleSelect = async (roleChoice: "CREATOR" | "BRAND" | "ADMIN") => {
    setIsLoading(true);
    setApiError("");

    let identifier = "";
    if (tab === "email") {
      identifier = email.trim();
    } else {
      identifier = `+964${phoneDigits}`;
    }

    try {
      const response = await fetch("/api/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, password, selectedRole: roleChoice }),
      });

      const data = await response.json();

      if (!response.ok) {
        setApiError(data.error?.message || "فشل تسجيل الدخول بالدور المحدد.");
        triggerShake();
        return;
      }

      const role = data.user.role;
      if (role === "CREATOR") {
        window.location.href = "/creator/dashboard";
      } else if (role === "BRAND") {
        window.location.href = "/brand/dashboard";
      } else if (role === "ADMIN" || role === "SUPER_ADMIN") {
        window.location.href = "/admin/dashboard";
      } else {
        window.location.href = "/";
      }
    } catch {
      setApiError("حدث خطأ في الاتصال بالسيرفر. يرجى المحاولة لاحقاً.");
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
        {/* Brand Link */}
        <div className="text-center mb-8">
          <Link className="brand-lockup inline-flex justify-center" href="/">
            <span className="brand-mark" aria-hidden="true" />
            <span className="text-2xl font-black">خلّيها ترند</span>
          </Link>
          <h1 className="text-xl font-bold mt-4">تسجيل الدخول إلى حسابك</h1>
          <p className="text-[var(--color-text-secondary)] text-sm mt-1">
            مرحباً بك مجدداً في المنصة
          </p>
        </div>

        {/* Global Error Banner */}
        {apiError && (
          <div
            role="alert"
            className="mb-6 p-4 rounded-[var(--radius-sm)] bg-[rgba(6,38,25,0.05)] border-r-4 border-[var(--color-brand-active)] text-[var(--forest-800)] text-sm font-semibold"
          >
            {apiError}
          </div>
        )}

        {showRoleSelector ? (
          <div className="space-y-6">
            <div className="text-center mb-4">
              <h2 className="text-lg font-extrabold text-[var(--forest-700)]">
                اختر الدور للدخول
              </h2>
              <p className="text-xs text-[var(--color-text-secondary)] mt-1">
                لقد سجلت الدخول بحساب الجوكر، يرجى اختيار الواجهة المناسبة لتجربتها:
              </p>
            </div>

            <div className="flex flex-col gap-4">
              {/* Creator Card */}
              <button
                type="button"
                onClick={() => handleRoleSelect("CREATOR")}
                disabled={isLoading}
                className="flex items-center gap-4 w-full p-4 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-muted)] hover:bg-[var(--color-brand)] hover:text-[var(--color-text-on-brand)] hover:border-[var(--color-brand)] transition-all text-right group cursor-pointer disabled:opacity-50"
              >
                <div className="flex items-center justify-center w-12 h-12 rounded-[var(--radius-sm)] bg-[rgba(6,38,25,0.05)] group-hover:bg-[rgba(6,38,25,0.15)] text-[var(--forest-700)] transition-colors">
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </div>
                <div className="flex-1">
                  <div className="font-extrabold text-base">صانع محتوى (Creator)</div>
                  <div className="text-xs text-[var(--color-text-secondary)] group-hover:text-[var(--color-text-on-brand)] transition-colors mt-0.5">
                    تصفح لوحة التحكم، الأرباح، وتقديم المنشورات
                  </div>
                </div>
              </button>

              {/* Brand Card */}
              <button
                type="button"
                onClick={() => handleRoleSelect("BRAND")}
                disabled={isLoading}
                className="flex items-center gap-4 w-full p-4 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-muted)] hover:bg-[var(--color-brand)] hover:text-[var(--color-text-on-brand)] hover:border-[var(--color-brand)] transition-all text-right group cursor-pointer disabled:opacity-50"
              >
                <div className="flex items-center justify-center w-12 h-12 rounded-[var(--radius-sm)] bg-[rgba(6,38,25,0.05)] group-hover:bg-[rgba(6,38,25,0.15)] text-[var(--forest-700)] transition-colors">
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                    <line x1="3" y1="6" x2="21" y2="6" />
                    <path d="M16 10a4 4 0 0 1-8 0" />
                  </svg>
                </div>
                <div className="flex-1">
                  <div className="font-extrabold text-base">
                    علامة تجارية / تاجر (Brand)
                  </div>
                  <div className="text-xs text-[var(--color-text-secondary)] group-hover:text-[var(--color-text-on-brand)] transition-colors mt-0.5">
                    إدارة الحملات، الميزانية، ومراجعة المحتوى
                  </div>
                </div>
              </button>

              {/* Admin Card */}
              <button
                type="button"
                onClick={() => handleRoleSelect("ADMIN")}
                disabled={isLoading}
                className="flex items-center gap-4 w-full p-4 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-muted)] hover:bg-[var(--color-brand)] hover:text-[var(--color-text-on-brand)] hover:border-[var(--color-brand)] transition-all text-right group cursor-pointer disabled:opacity-50"
              >
                <div className="flex items-center justify-center w-12 h-12 rounded-[var(--radius-sm)] bg-[rgba(6,38,25,0.05)] group-hover:bg-[rgba(6,38,25,0.15)] text-[var(--forest-700)] transition-colors">
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                </div>
                <div className="flex-1">
                  <div className="font-extrabold text-base">مدير النظام (Admin)</div>
                  <div className="text-xs text-[var(--color-text-secondary)] group-hover:text-[var(--color-text-on-brand)] transition-colors mt-0.5">
                    اللوحة الإدارية ومكافحة الاحتيال والنزاعات
                  </div>
                </div>
              </button>
            </div>

            <button
              type="button"
              onClick={() => {
                setShowRoleSelector(false);
                setApiError("");
              }}
              disabled={isLoading}
              className="text-sm underline hover:text-[var(--color-brand-active)] text-[var(--color-text-secondary)] mt-6 block mx-auto font-bold transition-colors disabled:opacity-50"
            >
              الرجوع إلى صفحة تسجيل الدخول
            </button>
          </div>
        ) : (
          <>
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Identifier tabs */}
              <div>
                <span className="block text-sm font-bold mb-2">
                  تسجيل الدخول باستخدام
                </span>
                <div className="auth-tabs">
                  <div className="auth-tab-indicator" data-active={tab} />
                  <button
                    type="button"
                    data-active={tab === "email"}
                    onClick={() => setTab("email")}
                    className="auth-tab-button"
                    disabled={isLoading}
                  >
                    البريد الإلكتروني
                  </button>
                  <button
                    type="button"
                    data-active={tab === "phone"}
                    onClick={() => setTab("phone")}
                    className="auth-tab-button"
                    disabled={isLoading}
                  >
                    رقم الهاتف
                  </button>
                </div>
              </div>

              {tab === "email" ? (
                <div className="auth-field">
                  <label htmlFor="email" className="block text-sm font-bold mb-2">
                    البريد الإلكتروني
                  </label>
                  <div className="auth-input-group relative">
                    <span className="auth-input-icon">
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        aria-hidden="true"
                      >
                        <rect
                          x="3"
                          y="5"
                          width="18"
                          height="14"
                          rx="2"
                          stroke="currentColor"
                          strokeWidth="1.8"
                        />
                        <path
                          d="M4 7l8 6 8-6"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </span>
                    <input
                      type="email"
                      id="email"
                      dir="ltr"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="example@mail.com"
                      autoComplete="email"
                      aria-invalid={Boolean(errors.identifier)}
                      aria-describedby={
                        errors.identifier ? "identifier-error" : undefined
                      }
                      className="w-full min-h-[48px] ps-11 pe-4 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] focus:border-[var(--color-brand)] focus:ring-4 focus:ring-[rgba(214,246,29,0.18)] focus:outline-none transition-all text-right font-medium"
                      disabled={isLoading}
                    />
                  </div>
                </div>
              ) : (
                <div className="auth-field">
                  <label htmlFor="phone" className="block text-sm font-bold mb-2">
                    رقم الهاتف
                  </label>
                  <PhoneInput
                    id="phone"
                    digits={phoneDigits}
                    onChange={setPhoneDigits}
                    disabled={isLoading}
                  />
                </div>
              )}

              {errors.identifier && (
                <p
                  id="identifier-error"
                  role="alert"
                  className="text-xs text-[var(--forest-800)] font-bold -mt-3"
                >
                  {errors.identifier}
                </p>
              )}

              <div className="auth-field" style={{ animationDelay: "60ms" }}>
                <PasswordField
                  id="password"
                  label="كلمة المرور"
                  value={password}
                  onChange={setPassword}
                  placeholder="••••••••"
                  disabled={isLoading}
                  error={errors.password}
                />
              </div>

              <div className="text-end -mt-2">
                <Link
                  href="/forgot-password"
                  className="text-xs font-semibold text-[var(--color-text-secondary)] hover:text-[var(--forest-700)] underline"
                >
                  نسيت كلمة المرور؟
                </Link>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="btn-primary w-full flex justify-center items-center gap-2 py-3.5 text-sm font-extrabold rounded-[var(--radius-md)] bg-[var(--color-brand)] text-[var(--color-text-on-brand)] hover:bg-[var(--color-brand-hover)] transition-all cursor-pointer disabled:opacity-50"
              >
                {isLoading && <span className="auth-spinner" aria-hidden="true" />}
                {isLoading ? "جاري التحقق والدخول..." : "تسجيل الدخول"}
              </button>
            </form>

            <div className="my-6 flex items-center gap-3" aria-hidden="true">
              <span className="h-px flex-1 bg-[var(--color-border)]" />
              <span className="text-xs font-bold text-[var(--color-text-secondary)]">
                أو
              </span>
              <span className="h-px flex-1 bg-[var(--color-border)]" />
            </div>

            <GoogleAuthButton
              label="الدخول بواسطة Google"
              onClick={() => {
                window.location.href = "/api/v1/auth/google?intent=login";
              }}
              disabled={isLoading}
            />

            {/* Footer Link */}
            <div className="mt-8 text-center text-sm font-semibold text-[var(--color-text-secondary)] space-y-3">
              <div>
                ليس لديك حساب؟{" "}
                <Link
                  href="/register"
                  className="text-[var(--forest-700)] underline hover:text-[var(--forest-900)]"
                >
                  إنشاء حساب جديد
                </Link>
              </div>
              <div>
                <Link
                  href="/"
                  className="text-[var(--color-text-secondary)] hover:text-[var(--forest-700)] text-xs underline font-medium block pt-1"
                >
                  التسجيل لاحقاً (التصفح كزائر)
                </Link>
              </div>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
