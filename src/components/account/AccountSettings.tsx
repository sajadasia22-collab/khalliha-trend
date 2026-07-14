"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PasswordField } from "../auth/PasswordField";
import { Checkbox } from "../ui/Checkbox";
import { Skeleton } from "../ui/Skeleton";
import { Button } from "../ui/button";
import { useToast } from "../ui/Toast";
import { ShieldCheckIcon, BellIcon, UserIcon, InfoIcon, UsersIcon } from "../ui/icons";
import { Tabs } from "../ui/Tabs";

type NotificationType =
  | "CAMPAIGN_APPROVED"
  | "CAMPAIGN_NEEDS_CHANGES"
  | "CAMPAIGN_REJECTED"
  | "SUBMISSION_REVIEWED"
  | "DEPOSIT_REVIEWED"
  | "PAYOUT_REVIEWED"
  | "DISPUTE_UPDATED"
  | "FRAUD_FLAGGED"
  | "FOLLOW_RECEIVED"
  | "COMMUNITY_ACTIVITY";

type Preference = { type: NotificationType; enabled: boolean };

type FollowingCreator = {
  followId: string;
  fullName: string;
  username: string;
  avatarUrl: string | null;
  bio: string | null;
  contentCategories: string[];
};

const typeLabels: Record<NotificationType, string> = {
  CAMPAIGN_APPROVED: "اعتماد الحملة",
  CAMPAIGN_NEEDS_CHANGES: "طلب تعديلات على الحملة",
  CAMPAIGN_REJECTED: "رفض الحملة",
  SUBMISSION_REVIEWED: "مراجعة الفيديو المُرسل",
  DEPOSIT_REVIEWED: "مراجعة طلب الإيداع",
  PAYOUT_REVIEWED: "مراجعة طلب السحب",
  DISPUTE_UPDATED: "تحديثات النزاعات",
  FRAUD_FLAGGED: "نتائج مراجعة الاحتيال",
  FOLLOW_RECEIVED: "المتابعون الجدد",
  COMMUNITY_ACTIVITY: "تفاعلات المجتمع",
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
          setPhone(json.user.phone || "");
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

function FollowingSection() {
  const { showToast } = useToast();
  const [items, setItems] = useState<FollowingCreator[] | null>(null);
  const [busyUsername, setBusyUsername] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/v1/account/following")
      .then(async (response) => {
        const json = await response.json();
        if (!response.ok) throw new Error("failed");
        setItems(json.data);
      })
      .catch(() => setItems([]));
  }, []);

  async function unfollow(username: string) {
    setBusyUsername(username);
    try {
      const response = await fetch(
        `/api/v1/creators/${encodeURIComponent(username)}/follow`,
        { method: "DELETE" },
      );
      if (!response.ok) throw new Error("failed");
      setItems((current) => current?.filter((item) => item.username !== username) ?? []);
      showToast("تم إلغاء المتابعة.", "success");
    } catch {
      showToast("تعذّر إلغاء المتابعة، حاول مرة أخرى.", "error");
    } finally {
      setBusyUsername(null);
    }
  }

  return (
    <div className="card rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm">
      <div className="mb-5 flex items-center gap-3">
        <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-surface-muted)] text-[var(--color-brand-active)]">
          <UsersIcon size={20} aria-hidden="true" />
        </span>
        <div>
          <h2 className="text-lg font-extrabold text-[var(--color-text)]">
            صناع المحتوى الذين تتابعهم
          </h2>
          <p className="text-xs text-[var(--color-text-muted)]">
            وصول سريع للملفات المهنية التي تهمك.
          </p>
        </div>
      </div>

      {!items ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-20" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-[var(--radius-lg)] bg-[var(--color-surface-muted)] p-6 text-center">
          <p className="font-bold text-[var(--color-text-secondary)]">
            لم تتابع أي صانع محتوى بعد.
          </p>
          <Link href="/creators" className="btn-primary mt-4 inline-flex text-sm">
            استكشف صناع المحتوى
          </Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {items.map((item) => (
            <li
              key={item.followId}
              className="flex flex-col gap-4 rounded-[var(--radius-lg)] border border-[var(--color-border)] p-4 sm:flex-row sm:items-center"
            >
              <Link
                href={`/creators/${encodeURIComponent(item.username)}`}
                className="flex min-w-0 flex-1 items-center gap-3"
              >
                <span className="flex h-12 w-12 flex-shrink-0 overflow-hidden rounded-full bg-[var(--color-brand)] text-[var(--color-text-on-brand)]">
                  {item.avatarUrl ? (
                    // The URL is restricted to the configured profile-image storage;
                    // keep it consistent with the public creator profile rendering.
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.avatarUrl}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center text-lg font-black">
                      {item.fullName.slice(0, 1)}
                    </span>
                  )}
                </span>
                <span className="min-w-0">
                  <strong className="block truncate">{item.fullName}</strong>
                  <span
                    className="block truncate text-xs text-[var(--color-text-muted)]"
                    dir="ltr"
                  >
                    @{item.username}
                  </span>
                  {item.bio && (
                    <span className="mt-1 block line-clamp-1 text-xs text-[var(--color-text-secondary)]">
                      {item.bio}
                    </span>
                  )}
                </span>
              </Link>
              <button
                type="button"
                className="btn-outline justify-center text-xs"
                disabled={busyUsername === item.username}
                onClick={() => unfollow(item.username)}
              >
                {busyUsername === item.username ? "جارٍ الإلغاء..." : "إلغاء المتابعة"}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function PrivacySection() {
  const { showToast } = useToast();
  const [permission, setPermission] = useState("CAMPAIGN_CONTACTS");
  const [relationships, setRelationships] = useState<{
    blocks: Array<{ id: string; fullName: string; username: string }>;
    mutes: Array<{ id: string; fullName: string; username: string }>;
  }>({ blocks: [], mutes: [] });
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    Promise.all([
      fetch("/api/v1/account/privacy").then((response) => response.json()),
      fetch("/api/v1/account/relationships").then((response) => response.json()),
    ])
      .then(([privacy, relationData]) => {
        setPermission(privacy.data?.messagePermission ?? "CAMPAIGN_CONTACTS");
        setRelationships(relationData.data ?? { blocks: [], mutes: [] });
      })
      .finally(() => setLoading(false));
  }, []);

  async function save(value: string) {
    setPermission(value);
    const response = await fetch("/api/v1/account/privacy", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messagePermission: value }),
    });
    if (!response.ok) showToast("تعذّر حفظ إعداد الخصوصية.", "error");
    else showToast("تم حفظ خصوصية المراسلة.", "success");
  }

  async function release(kind: "block" | "mute", username: string) {
    const response = await fetch(
      `/api/v1/community/users/${encodeURIComponent(username)}/${kind}`,
      { method: "DELETE" },
    );
    if (!response.ok) return showToast("تعذّر تحديث القائمة.", "error");
    setRelationships((current) => ({
      ...current,
      [kind === "block" ? "blocks" : "mutes"]: current[
        kind === "block" ? "blocks" : "mutes"
      ].filter((item) => item.username !== username),
    }));
    showToast(kind === "block" ? "تم رفع الحظر." : "تم إلغاء الكتم.", "success");
  }

  return (
    <div className="card rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm">
      <div className="mb-5 flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-surface-muted)] text-[var(--color-brand-active)]">
          <ShieldCheckIcon size={20} />
        </span>
        <div>
          <h2 className="text-lg font-extrabold">خصوصية المراسلة</h2>
          <p className="text-xs text-[var(--color-text-muted)]">
            يُطبّق هذا الخيار عند تفعيل رسائل الحملات.
          </p>
        </div>
      </div>
      {loading ? (
        <Skeleton className="h-36" />
      ) : (
        <>
          <div className="space-y-3">
            {[
              ["CAMPAIGN_CONTACTS", "أطراف الحملات المشتركة فقط"],
              ["FOLLOWING", "الحسابات التي أتابعها أيضاً"],
              ["NOBODY", "لا أستقبل رسائل جديدة"],
            ].map(([value, label]) => (
              <label
                key={value}
                className="flex cursor-pointer items-center gap-3 rounded-[var(--radius-md)] border border-[var(--color-border)] p-4"
              >
                <input
                  type="radio"
                  name="messagePermission"
                  value={value}
                  checked={permission === value}
                  onChange={() => save(value)}
                />
                <span className="text-sm font-bold">{label}</span>
              </label>
            ))}
          </div>
          <div className="mt-7 grid gap-5 sm:grid-cols-2">
            {(
              [
                ["blocks", "الحسابات المحظورة", "block"],
                ["mutes", "الحسابات المكتومة", "mute"],
              ] as const
            ).map(([key, title, kind]) => (
              <section key={key}>
                <h3 className="text-sm font-black">{title}</h3>
                <ul className="mt-3 space-y-2">
                  {relationships[key].map((item) => (
                    <li
                      key={item.id}
                      className="flex items-center justify-between rounded-[var(--radius-md)] bg-[var(--color-surface-muted)] p-3 text-xs"
                    >
                      <span>
                        <strong>{item.fullName}</strong>
                        <span className="ms-1 text-[var(--color-text-muted)]" dir="ltr">
                          @{item.username}
                        </span>
                      </span>
                      <button
                        type="button"
                        className="font-black text-[var(--color-brand-active)]"
                        onClick={() => release(kind, item.username)}
                      >
                        إلغاء
                      </button>
                    </li>
                  ))}
                  {relationships[key].length === 0 && (
                    <li className="text-xs text-[var(--color-text-muted)]">
                      القائمة فارغة.
                    </li>
                  )}
                </ul>
              </section>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

type SessionData = {
  current: { ipAddress: string | null; userAgent: string | null };
  recent: Array<{
    id: string;
    ipAddress: string | null;
    userAgent: string | null;
    createdAt: string;
  }>;
};

function describeAgent(agent: string | null) {
  if (!agent) return "جهاز غير معروف";
  const browser = agent.includes("Firefox")
    ? "Firefox"
    : agent.includes("Edg")
      ? "Edge"
      : agent.includes("Chrome")
        ? "Chrome"
        : agent.includes("Safari")
          ? "Safari"
          : "متصفح";
  const os = agent.includes("Android")
    ? "Android"
    : agent.includes("iPhone") || agent.includes("iPad")
      ? "iOS"
      : agent.includes("Mac")
        ? "macOS"
        : agent.includes("Windows")
          ? "Windows"
          : agent.includes("Linux")
            ? "Linux"
            : "نظام غير معروف";
  return `${browser} على ${os}`;
}

function SessionSection() {
  const [data, setData] = useState<SessionData | null>(null);
  useEffect(() => {
    fetch("/api/v1/account/sessions")
      .then((response) => response.json())
      .then((json) => setData(json.data ?? null))
      .catch(() => setData(null));
  }, []);

  return (
    <div className="space-y-6">
      <div className="card rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-sm)]">
        <div className="mb-5 flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-surface-muted)] text-[var(--color-brand-active)]">
            <InfoIcon size={20} />
          </span>
          <div>
            <h2 className="text-lg font-extrabold">الجلسة الحالية</h2>
            <p className="text-xs text-[var(--color-text-muted)]">
              بيانات حقيقية من الطلب الحالي، وليست قيماً تجريبية.
            </p>
          </div>
        </div>
        {!data ? (
          <Skeleton className="h-24" />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-[var(--radius-md)] bg-[var(--color-surface-muted)] p-4">
              <span className="text-[10px] font-bold text-[var(--color-text-muted)]">
                الجهاز والمتصفح
              </span>
              <strong className="mt-1 block text-sm">
                {describeAgent(data.current.userAgent)}
              </strong>
            </div>
            <div className="rounded-[var(--radius-md)] bg-[var(--color-surface-muted)] p-4">
              <span className="text-[10px] font-bold text-[var(--color-text-muted)]">
                عنوان الاتصال
              </span>
              <strong className="mt-1 block text-sm" dir="ltr">
                {data.current.ipAddress ?? "غير متاح"}
              </strong>
            </div>
          </div>
        )}
      </div>
      <div className="card rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-sm)]">
        <h3 className="font-extrabold">آخر عمليات الدخول المسجلة</h3>
        <p className="mt-1 text-xs text-[var(--color-text-muted)]">
          راجع الجهاز والوقت، وغيّر كلمة المرور فوراً إذا لاحظت نشاطاً غريباً.
        </p>
        <ul className="mt-5 divide-y divide-[var(--color-border)]">
          {data?.recent.length ? (
            data.recent.map((session) => (
              <li
                key={session.id}
                className="flex flex-col gap-1 py-3 text-sm sm:flex-row sm:items-center sm:justify-between"
              >
                <span>
                  <strong>{describeAgent(session.userAgent)}</strong>
                  <span className="ms-2 text-xs text-[var(--color-text-muted)]" dir="ltr">
                    {session.ipAddress ?? "IP غير متاح"}
                  </span>
                </span>
                <time className="text-xs text-[var(--color-text-muted)]">
                  {new Date(session.createdAt).toLocaleString("ar-IQ")}
                </time>
              </li>
            ))
          ) : (
            <li className="py-6 text-center text-sm text-[var(--color-text-secondary)]">
              لا توجد عمليات دخول مسجلة بعد.
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}

export function AccountSettings() {
  const [activeTab, setActiveTab] = useState("profile");

  const tabItems = [
    { value: "profile", label: "بيانات الحساب" },
    { value: "following", label: "المتابَعون" },
    { value: "privacy", label: "الخصوصية" },
    { value: "security", label: "الأمان وكلمة المرور" },
    { value: "notifications", label: "تفضيلات الإشعارات" },
    { value: "sessions", label: "جلسة العمل الحالية" },
  ];

  return (
    <div className="space-y-6">
      <Tabs items={tabItems} value={activeTab} onChange={setActiveTab} />

      <div className="mt-6">
        {activeTab === "profile" && <ProfileSection />}
        {activeTab === "following" && <FollowingSection />}
        {activeTab === "privacy" && <PrivacySection />}
        {activeTab === "security" && <PasswordSection />}
        {activeTab === "notifications" && <NotificationPreferencesSection />}
        {activeTab === "sessions" && <SessionSection />}
      </div>
    </div>
  );
}
