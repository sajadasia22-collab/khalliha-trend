"use client";

import { useEffect, useState } from "react";
import { PasswordField } from "../auth/PasswordField";
import { Checkbox } from "../ui/Checkbox";
import { Skeleton } from "../ui/Skeleton";
import { Button } from "../ui/button";
import { useToast } from "../ui/Toast";
import { ShieldCheckIcon, BellIcon } from "../ui/icons";

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
    <div className="tilt-3d">
      <div className="tilt-3d-surface rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
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
    <div className="tilt-3d">
      <div className="tilt-3d-surface rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
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
    </div>
  );
}

export function AccountSettings() {
  return (
    <div className="space-y-6">
      <PasswordSection />
      <NotificationPreferencesSection />
    </div>
  );
}
