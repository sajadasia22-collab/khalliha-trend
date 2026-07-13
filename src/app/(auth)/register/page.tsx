"use client";

import { useState } from "react";
import Link from "next/link";
import { registerSchema } from "../../../modules/auth/schemas";
import { UserRole } from "../../../modules/auth/schemas";
import { PasswordField } from "../../../components/auth/PasswordField";
import { PhoneInput } from "../../../components/auth/PhoneInput";

export default function RegisterPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneDigits, setPhoneDigits] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>(UserRole.CREATOR);
  const [brandName, setBrandName] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [confirmAge, setConfirmAge] = useState(false);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setApiError("");

    // Validate inputs
    const parsed = registerSchema.safeParse({
      fullName,
      email: email || undefined,
      phone: phoneDigits ? `+964${phoneDigits}` : undefined,
      password,
      role,
      brandName: role === UserRole.BRAND ? brandName : undefined,
      acceptTerms,
      confirmAge,
    });

    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors as Record<
        string,
        string[] | undefined
      >;
      const formattedErrors: Record<string, string> = {};
      Object.keys(fieldErrors).forEach((key) => {
        formattedErrors[key] = fieldErrors[key]?.[0] || "";
      });
      setErrors(formattedErrors);
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/v1/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });

      const data = await response.json();

      if (!response.ok) {
        setApiError(data.error?.message || "فشل إنشاء الحساب. يرجى المحاولة مرة أخرى.");
        return;
      }

      // Redirect depending on user role
      if (role === UserRole.CREATOR) {
        window.location.href = "/creator/dashboard";
      } else if (role === UserRole.BRAND) {
        window.location.href = "/brand/dashboard";
      } else {
        window.location.href = "/";
      }
    } catch {
      setApiError("حدث خطأ في الاتصال بالسيرفر. يرجى المحاولة لاحقاً.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--color-bg)] px-5 py-12 text-[var(--color-text)] dir-rtl">
      <div className="auth-card card max-w-lg w-full p-8 border border-[var(--color-border)] bg-[var(--color-surface)] shadow-lg rounded-[var(--radius-lg)]">
        {/* Brand Link */}
        <div className="text-center mb-8">
          <Link className="brand-lockup inline-flex justify-center" href="/">
            <span className="brand-mark" aria-hidden="true" />
            <span className="text-2xl font-black">خلّيها ترند</span>
          </Link>
          <h1 className="text-xl font-bold mt-4">إنشاء حساب جديد</h1>
          <p className="text-[var(--color-text-secondary)] text-sm mt-1">
            اختر دورك وابدأ معنا اليوم
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

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Full Name field */}
          <div>
            <label htmlFor="fullName" className="block text-sm font-bold mb-2">
              الاسم الكامل
            </label>
            <input
              type="text"
              id="fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="مثال: علي حسن"
              aria-invalid={Boolean(errors.fullName)}
              aria-describedby={errors.fullName ? "fullName-error" : undefined}
              className="w-full min-h-[48px] px-4 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] focus:border-[var(--color-brand)] focus:ring-4 focus:ring-[rgba(214,246,29,0.18)] focus:outline-none transition-all text-right font-medium"
              disabled={isLoading}
            />
            {errors.fullName && (
              <p
                id="fullName-error"
                role="alert"
                className="text-xs text-[var(--forest-800)] font-bold mt-1.5"
              >
                {errors.fullName}
              </p>
            )}
          </div>

          {/* Email field */}
          <div>
            <label htmlFor="email" className="block text-sm font-bold mb-2">
              البريد الإلكتروني (اختياري إذا تم إدخال الهاتف)
            </label>
            <input
              type="email"
              id="email"
              dir="ltr"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              aria-invalid={Boolean(errors.email)}
              aria-describedby={errors.email ? "email-error" : undefined}
              className="w-full min-h-[48px] px-4 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] focus:border-[var(--color-brand)] focus:ring-4 focus:ring-[rgba(214,246,29,0.18)] focus:outline-none transition-all text-right font-medium"
              disabled={isLoading}
            />
            {errors.email && (
              <p
                id="email-error"
                role="alert"
                className="text-xs text-[var(--forest-800)] font-bold mt-1.5"
              >
                {errors.email}
              </p>
            )}
          </div>

          {/* Phone field */}
          <div>
            <label htmlFor="phone" className="block text-sm font-bold mb-2">
              رقم الهاتف العراقي (اختياري إذا تم إدخال البريد)
            </label>
            <PhoneInput
              id="phone"
              digits={phoneDigits}
              onChange={setPhoneDigits}
              disabled={isLoading}
              error={errors.phone}
            />
          </div>

          {/* Password field */}
          <PasswordField
            id="password"
            label="كلمة المرور"
            value={password}
            onChange={setPassword}
            placeholder="•••••••• (6 أحرف على الأقل)"
            disabled={isLoading}
            error={errors.password}
            autoComplete="new-password"
          />

          {/* Role selection radio buttons */}
          <div>
            <span className="block text-sm font-bold mb-3">نوع الحساب</span>
            <div className="grid grid-cols-2 gap-4">
              <label
                className={`flex items-center justify-center p-4 border rounded-[var(--radius-md)] cursor-pointer font-bold transition-all ${
                  role === UserRole.CREATOR
                    ? "border-[var(--color-brand)] bg-[rgba(214,246,29,0.08)]"
                    : "border-[var(--color-border)] hover:bg-[var(--color-surface-muted)]"
                }`}
              >
                <input
                  type="radio"
                  name="role"
                  value={UserRole.CREATOR}
                  checked={role === UserRole.CREATOR}
                  onChange={() => setRole(UserRole.CREATOR)}
                  className="sr-only"
                  disabled={isLoading}
                />
                صانع محتوى
              </label>

              <label
                className={`flex items-center justify-center p-4 border rounded-[var(--radius-md)] cursor-pointer font-bold transition-all ${
                  role === UserRole.BRAND
                    ? "border-[var(--color-brand)] bg-[rgba(214,246,29,0.08)]"
                    : "border-[var(--color-border)] hover:bg-[var(--color-surface-muted)]"
                }`}
              >
                <input
                  type="radio"
                  name="role"
                  value={UserRole.BRAND}
                  checked={role === UserRole.BRAND}
                  onChange={() => setRole(UserRole.BRAND)}
                  className="sr-only"
                  disabled={isLoading}
                />
                علامة تجارية / تاجر
              </label>
            </div>
          </div>

          {/* Conditional Brand Name field */}
          {role === UserRole.BRAND && (
            <div>
              <label htmlFor="brandName" className="block text-sm font-bold mb-2">
                اسم العلامة التجارية / الشركة
              </label>
              <input
                type="text"
                id="brandName"
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
                placeholder="مثال: شركة الرافدين للتسوق"
                aria-invalid={Boolean(errors.brandName)}
                aria-describedby={errors.brandName ? "brandName-error" : undefined}
                className="w-full min-h-[48px] px-4 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] focus:border-[var(--color-brand)] focus:ring-4 focus:ring-[rgba(214,246,29,0.18)] focus:outline-none transition-all text-right font-medium"
                disabled={isLoading}
              />
              {errors.brandName && (
                <p
                  id="brandName-error"
                  role="alert"
                  className="text-xs text-[var(--forest-800)] font-bold mt-1.5"
                >
                  {errors.brandName}
                </p>
              )}
            </div>
          )}

          {/* Acceptance checkboxes */}
          <div className="space-y-3 pt-2">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={confirmAge}
                onChange={(e) => setConfirmAge(e.target.checked)}
                aria-invalid={Boolean(errors.confirmAge)}
                aria-describedby={errors.confirmAge ? "confirmAge-error" : undefined}
                className="mt-1 h-4 w-4 rounded border-[var(--color-border)] text-[var(--forest-700)] focus:ring-[var(--color-brand)] cursor-pointer"
                disabled={isLoading}
              />
              <span className="text-xs font-semibold text-[var(--color-text-secondary)] leading-relaxed">
                أؤكد أن عمري 18 سنة أو أكثر.
              </span>
            </label>
            {errors.confirmAge && (
              <p
                id="confirmAge-error"
                role="alert"
                className="text-xs text-[var(--forest-800)] font-bold"
              >
                {errors.confirmAge}
              </p>
            )}

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={acceptTerms}
                onChange={(e) => setAcceptTerms(e.target.checked)}
                aria-invalid={Boolean(errors.acceptTerms)}
                aria-describedby={errors.acceptTerms ? "acceptTerms-error" : undefined}
                className="mt-1 h-4 w-4 rounded border-[var(--color-border)] text-[var(--forest-700)] focus:ring-[var(--color-brand)] cursor-pointer"
                disabled={isLoading}
              />
              <span className="text-xs font-semibold text-[var(--color-text-secondary)] leading-relaxed">
                أوافق على{" "}
                <Link
                  href="/terms"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="text-[var(--forest-700)] underline hover:text-[var(--forest-900)]"
                >
                  الشروط والأحكام
                </Link>{" "}
                و
                <Link
                  href="/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="text-[var(--forest-700)] underline hover:text-[var(--forest-900)]"
                >
                  سياسة الخصوصية
                </Link>{" "}
                الخاصة بالمنصة.
              </span>
            </label>
            {errors.acceptTerms && (
              <p
                id="acceptTerms-error"
                role="alert"
                className="text-xs text-[var(--forest-800)] font-bold"
              >
                {errors.acceptTerms}
              </p>
            )}
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={isLoading}
            className="btn-primary w-full justify-center items-center py-3.5 text-sm font-extrabold rounded-[var(--radius-md)] bg-[var(--color-brand)] text-[var(--color-text-on-brand)] hover:bg-[var(--color-brand-hover)] transition-all cursor-pointer disabled:opacity-50"
          >
            {isLoading ? "جاري إنشاء الحساب..." : "إنشاء حساب جديد"}
          </button>
        </form>

        {/* Footer Link */}
        <div className="mt-8 text-center text-sm font-semibold text-[var(--color-text-secondary)] space-y-3">
          <div>
            لديك حساب بالفعل؟{" "}
            <Link
              href="/login"
              className="text-[var(--forest-700)] underline hover:text-[var(--forest-900)]"
            >
              تسجيل الدخول
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
      </div>
    </main>
  );
}
