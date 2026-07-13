"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const OPTIONS = [
  { value: "ACTIVE", label: "نشط" },
  { value: "SUSPENDED", label: "معلّق" },
  { value: "BANNED", label: "محظور" },
] as const;

export function UserStatusControl({
  userId,
  currentStatus,
  canManage,
}: {
  userId: string;
  currentStatus: string;
  canManage: boolean;
}) {
  const router = useRouter();
  const [status, setStatus] = useState(currentStatus);
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  if (!canManage) {
    return (
      <p className="text-sm font-bold text-[var(--color-text-muted)]">
        هذا الحساب محمي ولا يمكن تغيير حالته من هذه الصفحة.
      </p>
    );
  }

  async function submit() {
    if (status === currentStatus) {
      setMessage("اختر حالة مختلفة أولاً.");
      return;
    }
    if (reason.trim().length < 3) {
      setMessage("اكتب سبب الإجراء بثلاثة أحرف على الأقل.");
      return;
    }

    setIsLoading(true);
    setMessage("");
    try {
      const response = await fetch(`/api/v1/admin/users/${userId}/status`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status, reason: reason.trim() }),
      });
      const payload = await response.json();
      if (!response.ok) {
        setMessage(payload.error?.message ?? "تعذّر تحديث الحساب.");
        return;
      }
      setMessage("تم تحديث حالة المستخدم وتسجيل الإجراء.");
      setReason("");
      router.refresh();
    } catch {
      setMessage("تعذّر الاتصال بالخادم.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-[180px_1fr]">
        <select
          value={status}
          onChange={(event) => setStatus(event.target.value)}
          className="min-h-11 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 font-bold focus:border-[var(--color-brand-active)] focus:outline-none"
          aria-label="حالة المستخدم الجديدة"
        >
          {OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <input
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          placeholder="سبب التعليق أو الحظر أو إعادة التفعيل"
          className="min-h-11 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 text-right focus:border-[var(--color-brand-active)] focus:outline-none"
          maxLength={500}
        />
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={submit}
          disabled={isLoading}
          className="btn-primary min-h-11 rounded-[var(--radius-md)] px-5 text-sm font-black disabled:opacity-50"
        >
          {isLoading ? "جاري الحفظ..." : "تطبيق الحالة"}
        </button>
        {message && (
          <p
            role="status"
            className="text-sm font-bold text-[var(--color-text-secondary)]"
          >
            {message}
          </p>
        )}
      </div>
    </div>
  );
}
