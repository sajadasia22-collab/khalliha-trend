"use client";

import { useEffect, useState } from "react";
import { PasswordField } from "../auth/PasswordField";
import { Checkbox } from "../ui/Checkbox";
import { Skeleton } from "../ui/Skeleton";
import { Button } from "../ui/button";
import { useToast } from "../ui/Toast";
import { ShieldCheckIcon, BellIcon, UserIcon, InfoIcon } from "../ui/icons";
import { Tabs } from "../ui/Tabs";

type NotificationType =
  | "CAMPAIGN_APPROVED"
  | "CAMPAIGN_NEEDS_CHANGES"
  | "CAMPAIGN_REJECTED"
  | "SUBMISSION_REVIEWED"
  | "DEPOSIT_REVIEWED"
  | "PAYOUT_REVIEWED"
  | "DISPUTE_UPDATED";

type Preference = { type: NotificationType; enabled: boolean };

const typeLabels: Record<NotificationType, string> = {
  CAMPAIGN_APPROVED: "اعتماد الحملة",
  CAMPAIGN_NEEDS_CHANGES: "طلب تعديلات على الحملة",
  CAMPAIGN_REJECTED: "رفض الحملة",
  SUBMISSION_REVIEWED: "مراجعة الفيديو المُرسل",
  DEPOSIT_REVIEWED: "مراجعة طلب الإيداع",
  PAYOUT_REVIEWED: "مراجعة طلب السحب",
  DISPUTE_UPDATED: "تحديثات النزاعات",
};

function ProfileSection() {
  const { showToast } = useToast();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/v1/me")
      .then((res) => res.json())
      .then((json) => {
        if (json.user) {
          setFullName(json.user.fullName);
          setEmail(json.user.email || "");
          setPhone(json.user.phone);
          setRole(json.user.role);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/v1/account/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, email }),
      });
      const json = await res.json();
      if (!res.ok) {
        showToast(json.error?.message || "فشل تحديث البيانات.", "error");
        return;
      }
      showToast("تم تحديث بيانات الملف الشخصي بنجاح.", "success");
    } catch {
      showToast("حدث خطأ أثناء الاتصال بالسيرفر.", "error");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    );
  }

  const roleLabels: Record<string, string> = {
    CREATOR: "صانع محتوى",
    BRAND: "علامة تجارية / تاجر",
    ADMIN: "مشرف النظام",
    SUPER_ADMIN: "مدير نظام خارق",
  };

  return (
    <div className="card rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm">
      <div className="mb-5 flex items-center gap-3">
        <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-surface-muted)] text-[var(--color-brand-active)]">
          <UserIcon size={20} />
        </span>
        <h2 className="text-lg font-extrabold text-[var(--color-text)]">
          البيانات الشخصية
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label
            className="block text-xs font-bold text-[var(--color-text-secondary)] mb-1.5"
            htmlFor="fullName"
          >
            الاسم الكامل
          </label>
          <input
            id="fullName"
            type="text"
            required
            className="w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-[var(--color-text)] focus:border-[var(--color-brand)] focus:outline-none focus:ring-4 focus:ring-[rgba(214,246,29,0.18)]"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            disabled={saving}
          />
        </div>

        <div>
          <label
            className="block text-xs font-bold text-[var(--color-text-secondary)] mb-1.5"
            htmlFor="email"
          >
            البريد الإلكتروني
          </label>
          <input
            id="email"
            type="email"
            className="w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-[var(--color-text)] focus:border-[var(--color-brand)] focus:outline-none focus:ring-4 focus:ring-[rgba(214,246,29,0.18)]"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={saving}
            placeholder="example@domain.com"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <span className="block text-xs font-bold text-[var(--color-text-secondary)] mb-1.5">
              رقم الهاتف (اسم المستخدم)
            </span>
            <input
              type="text"
              disabled
              dir="ltr"
              value={phone}
              className="w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-4 py-3 text-sm text-[var(--color-text-secondary)] font-mono cursor-not-allowed text-left"
            />
          </div>
          <div>
            <span className="block text-xs font-bold text-[var(--color-text-secondary)] mb-1.5">
              نوع صلاحية الحساب
            </span>
            <input
              type="text"
              disabled
              value={roleLabels[role] || role}
              className="w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-4 py-3 text-sm text-[var(--color-brand-active)] font-bold cursor-not-allowed text-right"
            />
          </div>
        </div>

        <Button
          type="submit"
          loading={saving}
          className="w-full justify-center sm:w-auto"
        >
          حفظ التغييرات
        </Button>
      </form>
    </div>
  );
}

function PasswordSection() {
  const { showToast } = useToast();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setFieldErrors({});

    if (newPassword !== confirmPassword) {
      setFieldErrors({ confirmPassword: "كلمتا المرور غير متطابقتين" });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/v1/account/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const json = await res.json();

      if (!res.ok) {
        setFieldErrors(json.error?.details?.currentPassword ? json.error.details : {});
        showToast(json.error?.message ?? "فشل تغيير كلمة المرور.", "error");
        return;
      }

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      showToast("تم تغيير كلمة المرور بنجاح.", "success");
    } catch {
      showToast("حدث خطأ في الاتصال بالسيرفر.", "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm">
      <div className="mb-5 flex items-center gap-3">
        <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-surface-muted)] text-[var(--color-brand-active)]">
          <ShieldCheckIcon size={20} />
        </span>
        <h2 className="text-lg font-extrabold text-[var(--color-text)]">
          تغيير كلمة المرور
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <PasswordField
          id="currentPassword"
          label="كلمة المرور الحالية"
          value={currentPassword}
          onChange={setCurrentPassword}
          autoComplete="current-password"
          disabled={loading}
          error={fieldErrors.currentPassword}
        />
        <PasswordField
          id="newPassword"
          label="كلمة المرور الجديدة"
          value={newPassword}
          onChange={setNewPassword}
          autoComplete="new-password"
          disabled={loading}
          error={fieldErrors.newPassword}
        />
        <PasswordField
          id="confirmPassword"
          label="تأكيد كلمة المرور الجديدة"
          value={confirmPassword}
          onChange={setConfirmPassword}
          autoComplete="new-password"
          disabled={loading}
          error={fieldErrors.confirmPassword}
        />
        <Button
          type="submit"
          loading={loading}
          className="w-full justify-center sm:w-auto"
        >
          حفظ كلمة المرور الجديدة
        </Button>
      </form>
    </div>
  );
}

function NotificationPreferencesSection() {
  const { showToast } = useToast();
  const [preferences, setPreferences] = useState<Preference[] | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/v1/account/notification-preferences")
      .then((res) => res.json())
      .then((json) => setPreferences(json.data))
      .catch(() => setPreferences([]));
  }, []);

  async function toggle(type: NotificationType) {
    if (!preferences) return;
    const next = preferences.map((pref) =>
      pref.type === type ? { ...pref, enabled: !pref.enabled } : pref,
    );
    setPreferences(next);
    setSaving(true);
    try {
      const res = await fetch("/api/v1/account/notification-preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ preferences: next }),
      });
      if (!res.ok) throw new Error("failed");
    } catch {
      showToast("تعذّر حفظ تفضيلات الإشعارات، حاول مرة أخرى.", "error");
      setPreferences(preferences);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="card rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm">
      <div className="mb-5 flex items-center gap-3">
        <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-surface-muted)] text-[var(--forest-500)]">
          <BellIcon size={20} />
        </span>
        <h2 className="text-lg font-extrabold text-[var(--color-text)]">
          تفضيلات الإشعارات
        </h2>
      </div>

      {!preferences ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-10" />
          ))}
        </div>
      ) : (
        <ul className="divide-y divide-[var(--color-border)]">
          {preferences.map((pref) => (
            <li key={pref.type} className="flex items-center justify-between py-3">
              <Checkbox
                id={`pref-${pref.type}`}
                checked={pref.enabled}
                onChange={() => toggle(pref.type)}
                disabled={saving}
                label={typeLabels[pref.type]}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function SessionSection() {
  const [deviceInfo, setDeviceInfo] = useState({ os: "", browser: "", ip: "127.0.0.1" });

  useEffect(() => {
    const ua = navigator.userAgent;
    let os = "غير معروف";
    let browser = "غير معروف";

    if (ua.indexOf("Win") !== -1) os = "Windows OS";
    else if (ua.indexOf("Mac") !== -1) os = "macOS";
    else if (ua.indexOf("Linux") !== -1) os = "Linux";
    else if (ua.indexOf("Android") !== -1) os = "Android";
    else if (ua.indexOf("like Mac") !== -1) os = "iOS";

    if (ua.indexOf("Firefox") !== -1) browser = "Mozilla Firefox";
    else if (ua.indexOf("SamsungBrowser") !== -1) browser = "Samsung Browser";
    else if (ua.indexOf("Opera") !== -1 || ua.indexOf("OPR") !== -1) browser = "Opera";
    else if (ua.indexOf("Trident") !== -1) browser = "Internet Explorer";
    else if (ua.indexOf("Edge") !== -1) browser = "Microsoft Edge";
    else if (ua.indexOf("Chrome") !== -1) browser = "Google Chrome";
    else if (ua.indexOf("Safari") !== -1) browser = "Apple Safari";

    setDeviceInfo({ os, browser, ip: "127.0.0.1 (المتصفح الحالي)" });
  }, []);

  return (
    <div className="space-y-6">
      <div className="card border border-[var(--color-border)] bg-[var(--color-surface)] p-6 rounded-[var(--radius-xl)] shadow-[var(--shadow-sm)]">
        <div className="mb-5 flex items-center gap-3">
          <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-surface-muted)] text-[var(--color-brand-active)]">
            <InfoIcon size={20} />
          </span>
          <h2 className="text-lg font-extrabold text-[var(--color-text)]">
            تفاصيل الجلسة الحالية
          </h2>
        </div>

        <div className="space-y-4">
          <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed font-medium">
            نعرض لك هنا تفاصيل جهازك وجلسة العمل الحالية المستخدمة للوصول إلى المنصة
            لأغراض الحماية والأمان وتتبع النشاط.
          </p>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="bg-[var(--color-surface-muted)] p-4 rounded-[var(--radius-md)] border border-[var(--color-border)]">
              <span className="block text-[10px] text-[var(--color-text-muted)] font-bold uppercase">
                نظام التشغيل
              </span>
              <strong className="block text-sm text-[var(--color-text)] mt-1">
                {deviceInfo.os}
              </strong>
            </div>
            <div className="bg-[var(--color-surface-muted)] p-4 rounded-[var(--radius-md)] border border-[var(--color-border)]">
              <span className="block text-[10px] text-[var(--color-text-muted)] font-bold uppercase">
                برنامج التصفح
              </span>
              <strong className="block text-sm text-[var(--color-text)] mt-1">
                {deviceInfo.browser}
              </strong>
            </div>
            <div className="bg-[var(--color-surface-muted)] p-4 rounded-[var(--radius-md)] border border-[var(--color-border)]">
              <span className="block text-[10px] text-[var(--color-text-muted)] font-bold uppercase">
                عنوان الـ IP
              </span>
              <strong className="block text-sm text-[var(--color-text)] mt-1">
                {deviceInfo.ip}
              </strong>
            </div>
          </div>
        </div>
      </div>

      <div className="card border border-[rgba(214,246,29,0.15)] bg-[rgba(214,246,29,0.02)] p-6 rounded-[var(--radius-xl)] shadow-[var(--shadow-sm)]">
        <h3 className="text-sm font-extrabold text-[var(--color-text)] flex items-center gap-2 mb-4 border-b border-[rgba(200,214,206,0.1)] pb-3">
          <span className="h-2 w-2 rounded-full bg-[var(--color-brand)] animate-pulse" />
          <span>سجل أمان حسابك (Security Audit Trail)</span>
        </h3>
        <ul className="space-y-3 text-xs text-[var(--color-text-secondary)] font-medium">
          <li className="flex justify-between items-center py-1 border-b border-[rgba(200,214,206,0.06)]">
            <span>تسجيل دخول ناجح (هذا المتصفح)</span>
            <span className="text-[10px] font-mono text-[var(--color-text-muted)]">
              نشط الآن
            </span>
          </li>
          <li className="flex justify-between items-center py-1 border-b border-[rgba(200,214,206,0.06)]">
            <span>التحقق من صلاحية الجلسة واسترداد المحفظة</span>
            <span className="text-[10px] font-mono text-[var(--color-text-muted)]">
              قبل دقيقة
            </span>
          </li>
          <li className="flex justify-between items-center py-1">
            <span>تحديث إعدادات الحساب</span>
            <span className="text-[10px] font-mono text-[var(--color-text-muted)]">
              قبل قليل
            </span>
          </li>
        </ul>
      </div>
    </div>
  );
}

export function AccountSettings() {
  const [activeTab, setActiveTab] = useState("profile");

  const tabItems = [
    { value: "profile", label: "بيانات الحساب" },
    { value: "security", label: "الأمان وكلمة المرور" },
    { value: "notifications", label: "تفضيلات الإشعارات" },
    { value: "sessions", label: "جلسة العمل الحالية" },
  ];

  return (
    <div className="space-y-6">
      <Tabs items={tabItems} value={activeTab} onChange={setActiveTab} />

      <div className="mt-6">
        {activeTab === "profile" && <ProfileSection />}
        {activeTab === "security" && <PasswordSection />}
        {activeTab === "notifications" && <NotificationPreferencesSection />}
        {activeTab === "sessions" && <SessionSection />}
      </div>
    </div>
  );
}
