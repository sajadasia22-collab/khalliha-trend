"use client";

import { useEffect, useMemo, useState, type ComponentType } from "react";
import Link from "next/link";
import { PasswordField } from "../auth/PasswordField";
import { Checkbox } from "../ui/Checkbox";
import { Skeleton } from "../ui/Skeleton";
import { Button } from "../ui/button";
import { useToast } from "../ui/Toast";
import {
  ShieldCheckIcon,
  BellIcon,
  UserIcon,
  InfoIcon,
  UsersIcon,
  SearchIcon,
  ChevronStartIcon,
  PaletteIcon,
  SmartphoneIcon,
  DataIcon,
  ExportIcon,
  LinkIcon,
  type IconProps,
} from "../ui/icons";
import {
  applyExperiencePreferences,
  defaultExperiencePreferences,
  EXPERIENCE_STORAGE_KEY,
  readExperiencePreferences,
  type ExperiencePreferences,
} from "./ExperiencePreferencesLoader";
import type { DashboardRole } from "../layout/dashboardNav";

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
  | "COMMUNITY_ACTIVITY"
  | "MESSAGE_RECEIVED";

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
  MESSAGE_RECEIVED: "رسائل الحملات",
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
              رقم الهاتف
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
            تحكم بمن يستطيع بدء محادثة حملة جديدة معك.
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
                  {new Date(session.createdAt).toLocaleString("ar-IQ", {
                    numberingSystem: "latn",
                  })}
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

function AppearanceSection() {
  const { showToast } = useToast();
  const [preferences, setPreferences] = useState<ExperiencePreferences>(
    defaultExperiencePreferences,
  );

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- browser-only preferences are unavailable during SSR.
    setPreferences(readExperiencePreferences());
  }, []);

  function save(next: ExperiencePreferences) {
    setPreferences(next);
    localStorage.setItem(EXPERIENCE_STORAGE_KEY, JSON.stringify(next));
    applyExperiencePreferences(next);
    showToast("تم حفظ تفضيلات العرض على هذا الجهاز.", "success");
  }

  return (
    <div className="space-y-5">
      <section className="card rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-sm)]">
        <div className="mb-5 flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-brand)] text-[var(--color-text-on-brand)]">
            <PaletteIcon />
          </span>
          <div>
            <h2 className="text-lg font-black">المظهر</h2>
            <p className="text-xs text-[var(--color-text-muted)]">
              اختر الشكل الأريح لعينك على هذا الجهاز.
            </p>
          </div>
        </div>
        <fieldset>
          <legend className="mb-3 text-sm font-bold">نمط الألوان</legend>
          <div className="grid grid-cols-3 gap-3">
            {(
              [
                ["system", "حسب الجهاز"],
                ["light", "فاتح"],
                ["dark", "داكن"],
              ] as const
            ).map(([value, label]) => (
              <label
                key={value}
                className={`cursor-pointer rounded-[var(--radius-md)] border p-3 text-center text-xs font-black transition ${
                  preferences.theme === value
                    ? "border-[var(--color-brand)] bg-[rgba(214,246,29,.16)]"
                    : "border-[var(--color-border)] bg-[var(--color-surface-muted)]"
                }`}
              >
                <input
                  type="radio"
                  name="theme"
                  className="sr-only"
                  checked={preferences.theme === value}
                  onChange={() => save({ ...preferences, theme: value })}
                />
                <span className="mx-auto mb-2 block h-9 rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-sm)]" />
                {label}
              </label>
            ))}
          </div>
        </fieldset>
      </section>

      <section className="card divide-y divide-[var(--color-border)] rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface)] px-5 shadow-[var(--shadow-sm)]">
        <div className="flex items-center justify-between gap-4 py-5">
          <div>
            <h3 className="font-black">عرض مدمج</h3>
            <p className="mt-1 text-xs text-[var(--color-text-muted)]">
              يقلل حجم العناصر حتى يظهر محتوى أكثر في اللوحات.
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={preferences.density === "compact"}
            onClick={() =>
              save({
                ...preferences,
                density: preferences.density === "compact" ? "comfortable" : "compact",
              })
            }
            className={`relative h-7 w-12 flex-shrink-0 rounded-full transition ${preferences.density === "compact" ? "bg-[var(--color-brand)]" : "bg-[var(--color-border-strong)]"}`}
          >
            <span
              className={`absolute top-1 h-5 w-5 rounded-full bg-[var(--color-surface)] shadow-[var(--shadow-sm)] transition ${preferences.density === "compact" ? "start-1" : "start-6"}`}
            />
          </button>
        </div>
        <div className="flex items-center justify-between gap-4 py-5">
          <div>
            <h3 className="font-black">تقليل الحركة</h3>
            <p className="mt-1 text-xs text-[var(--color-text-muted)]">
              يوقف الحركات والانتقالات الطويلة لتجربة أهدأ.
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={preferences.reduceMotion}
            onClick={() =>
              save({ ...preferences, reduceMotion: !preferences.reduceMotion })
            }
            className={`relative h-7 w-12 flex-shrink-0 rounded-full transition ${preferences.reduceMotion ? "bg-[var(--color-brand)]" : "bg-[var(--color-border-strong)]"}`}
          >
            <span
              className={`absolute top-1 h-5 w-5 rounded-full bg-[var(--color-surface)] shadow-[var(--shadow-sm)] transition ${preferences.reduceMotion ? "start-1" : "start-6"}`}
            />
          </button>
        </div>
      </section>
    </div>
  );
}

function DataAndSupportSection() {
  const { showToast } = useToast();
  const [exporting, setExporting] = useState(false);

  async function exportData() {
    setExporting(true);
    try {
      const response = await fetch("/api/v1/account/export");
      if (!response.ok) throw new Error("failed");
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `khalliha-trend-data-${new Date().toISOString().slice(0, 10)}.json`;
      anchor.click();
      URL.revokeObjectURL(url);
      showToast("تم تجهيز نسخة بياناتك.", "success");
    } catch {
      showToast("تعذّر تصدير البيانات حالياً.", "error");
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="space-y-5">
      <section className="card rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-sm)]">
        <div className="flex items-start gap-4">
          <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-brand)] text-[var(--color-text-on-brand)]">
            <DataIcon />
          </span>
          <div className="flex-1">
            <h2 className="text-lg font-black">نسخة من بياناتك</h2>
            <p className="mt-1 text-sm leading-6 text-[var(--color-text-secondary)]">
              نزّل ملف JSON يحتوي بيانات حسابك ونشاطك الأساسي ومحادثات الحملات الخاصة بك.
            </p>
            <button
              type="button"
              onClick={exportData}
              disabled={exporting}
              className="btn-primary mt-5 inline-flex items-center gap-2 text-sm"
            >
              <ExportIcon size={17} />
              {exporting ? "جارٍ التجهيز..." : "تنزيل بياناتي"}
            </button>
          </div>
        </div>
      </section>
      <section className="card rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface)] p-2 shadow-[var(--shadow-sm)]">
        {[
          ["/privacy", "سياسة الخصوصية", "كيف نحفظ بياناتك ونستخدمها"],
          ["/terms", "الشروط والأحكام", "حقوقك والتزامات استخدام المنصة"],
          ["/payment-policy", "سياسة الدفع", "قواعد الأرباح والسحب والإيداع"],
        ].map(([href, title, description]) => (
          <Link
            key={href}
            href={href}
            className="flex items-center gap-3 rounded-[var(--radius-md)] p-4 transition hover:bg-[var(--color-surface-muted)]"
          >
            <LinkIcon className="text-[var(--color-text-muted)]" />
            <span className="min-w-0 flex-1">
              <strong className="block">{title}</strong>
              <span className="block text-xs text-[var(--color-text-muted)]">
                {description}
              </span>
            </span>
            <ChevronStartIcon size={17} />
          </Link>
        ))}
      </section>
    </div>
  );
}

type SettingItem = {
  value: string;
  label: string;
  description: string;
  group: string;
  icon: ComponentType<IconProps>;
};

const settingItems: SettingItem[] = [
  {
    value: "profile",
    label: "معلومات الحساب",
    description: "الاسم والبريد ورقم الهاتف",
    group: "الحساب",
    icon: UserIcon,
  },
  {
    value: "privacy",
    label: "الخصوصية",
    description: "المراسلة والحظر والكتم",
    group: "الخصوصية والأمان",
    icon: ShieldCheckIcon,
  },
  {
    value: "security",
    label: "كلمة المرور",
    description: "تغيير كلمة المرور وحماية الدخول",
    group: "الخصوصية والأمان",
    icon: ShieldCheckIcon,
  },
  {
    value: "sessions",
    label: "الأجهزة وعمليات الدخول",
    description: "راجع نشاط الدخول إلى حسابك",
    group: "الخصوصية والأمان",
    icon: SmartphoneIcon,
  },
  {
    value: "notifications",
    label: "الإشعارات",
    description: "تحكم بما تريد استلامه",
    group: "التفضيلات",
    icon: BellIcon,
  },
  {
    value: "appearance",
    label: "المظهر وسهولة الاستخدام",
    description: "الوضع الداكن والكثافة والحركة",
    group: "التفضيلات",
    icon: PaletteIcon,
  },
  {
    value: "following",
    label: "الحسابات المتابَعة",
    description: "إدارة صناع المحتوى الذين تتابعهم",
    group: "المحتوى والتواصل",
    icon: UsersIcon,
  },
  {
    value: "data",
    label: "بياناتك والمساعدة",
    description: "تصدير البيانات والسياسات",
    group: "معلومات ودعم",
    icon: DataIcon,
  },
];

export function AccountSettings({ dashboardRole }: { dashboardRole: DashboardRole }) {
  const [activeTab, setActiveTab] = useState("profile");
  const [showMobileDetail, setShowMobileDetail] = useState(false);
  const [search, setSearch] = useState("");
  const filteredItems = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("ar-IQ");
    return query
      ? settingItems.filter((item) =>
          `${item.label} ${item.description} ${item.group}`
            .toLocaleLowerCase("ar-IQ")
            .includes(query),
        )
      : settingItems;
  }, [search]);
  const activeItem = settingItems.find((item) => item.value === activeTab)!;
  const ActiveIcon = activeItem.icon;
  const professionalHref =
    dashboardRole === "creator"
      ? "/creator/profile"
      : dashboardRole === "brand"
        ? "/brand/profile"
        : "/admin/users";

  return (
    <div className="settings-center overflow-hidden rounded-[28px] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-md)] lg:grid lg:min-h-[720px] lg:grid-cols-[310px_1fr]">
      <aside
        className={`${showMobileDetail ? "hidden lg:block" : "block"} border-b border-[var(--color-border)] bg-[var(--color-surface-muted)] p-4 lg:border-e lg:border-b-0 lg:p-5`}
      >
        <label className="flex items-center gap-2 rounded-[var(--radius-pill)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 shadow-[var(--shadow-sm)]">
          <SearchIcon size={18} />
          <span className="sr-only">بحث في الإعدادات</span>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="ابحث في الإعدادات"
            className="w-full bg-transparent text-sm outline-none"
          />
        </label>

        <Link
          href={professionalHref}
          className="mt-4 flex items-center gap-3 rounded-[var(--radius-lg)] bg-[var(--color-surface-dark)] p-4 text-[var(--color-text-on-dark)] shadow-[var(--shadow-sm)]"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-brand)] text-[var(--color-text-on-brand)]">
            <UserIcon size={18} />
          </span>
          <span className="min-w-0 flex-1">
            <strong className="block text-sm">ملفك على المنصة</strong>
            <span className="block truncate text-[11px] text-[var(--forest-100)]">
              تعديل الهوية والمعلومات المهنية
            </span>
          </span>
          <ChevronStartIcon size={17} />
        </Link>

        <nav className="mt-5 space-y-5" aria-label="فئات الإعدادات">
          {[...new Set(filteredItems.map((item) => item.group))].map((group) => (
            <section key={group}>
              <h2 className="mb-2 px-2 text-[10px] font-black uppercase tracking-wide text-[var(--color-text-muted)]">
                {group}
              </h2>
              <div className="space-y-1">
                {filteredItems
                  .filter((item) => item.group === group)
                  .map((item) => {
                    const Icon = item.icon;
                    const active = item.value === activeTab;
                    return (
                      <button
                        key={item.value}
                        type="button"
                        onClick={() => {
                          setActiveTab(item.value);
                          setShowMobileDetail(true);
                        }}
                        aria-current={active ? "page" : undefined}
                        className={`flex w-full items-center gap-3 rounded-[var(--radius-md)] p-3 text-start transition ${active ? "bg-[var(--color-surface)] shadow-[var(--shadow-sm)]" : "hover:bg-[var(--color-surface)]"}`}
                      >
                        <span
                          className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full ${active ? "bg-[var(--color-brand)] text-[var(--color-text-on-brand)]" : "bg-[var(--color-surface)] text-[var(--color-text-secondary)]"}`}
                        >
                          <Icon size={17} />
                        </span>
                        <span className="min-w-0 flex-1">
                          <strong className="block text-sm">{item.label}</strong>
                          <span className="block truncate text-[11px] text-[var(--color-text-muted)]">
                            {item.description}
                          </span>
                        </span>
                        <ChevronStartIcon
                          size={15}
                          className="text-[var(--color-text-muted)]"
                        />
                      </button>
                    );
                  })}
              </div>
            </section>
          ))}
          {filteredItems.length === 0 && (
            <p className="rounded-[var(--radius-md)] bg-[var(--color-surface)] p-4 text-center text-sm text-[var(--color-text-muted)]">
              لا توجد إعدادات مطابقة.
            </p>
          )}
        </nav>
      </aside>

      <section
        className={`${showMobileDetail ? "block" : "hidden lg:block"} min-w-0 bg-[var(--color-bg)] p-4 sm:p-6 lg:p-8`}
      >
        <button
          type="button"
          onClick={() => setShowMobileDetail(false)}
          className="mb-5 inline-flex items-center gap-2 rounded-[var(--radius-pill)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-xs font-bold lg:hidden"
        >
          <ChevronStartIcon className="rotate-180" size={15} /> كل الإعدادات
        </button>
        <div className="mb-6 flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-brand)] text-[var(--color-text-on-brand)]">
            <ActiveIcon />
          </span>
          <div>
            <p className="text-[10px] font-black text-[var(--color-text-muted)]">
              الإعدادات
            </p>
            <h2 className="text-xl font-black sm:text-2xl">{activeItem.label}</h2>
          </div>
        </div>
        {activeTab === "profile" && <ProfileSection />}
        {activeTab === "following" && <FollowingSection />}
        {activeTab === "privacy" && <PrivacySection />}
        {activeTab === "security" && <PasswordSection />}
        {activeTab === "notifications" && <NotificationPreferencesSection />}
        {activeTab === "sessions" && <SessionSection />}
        {activeTab === "appearance" && <AppearanceSection />}
        {activeTab === "data" && <DataAndSupportSection />}
      </section>
    </div>
  );
}
