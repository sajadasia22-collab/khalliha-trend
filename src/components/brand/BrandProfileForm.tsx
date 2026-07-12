"use client";

import { useState } from "react";

type VerificationStatus = "PENDING" | "APPROVED" | "REJECTED" | null;

type Props = {
  initialName: string;
  initialDescription: string;
  isVerified: boolean;
  initialVerificationStatus: VerificationStatus;
};

const verificationLabels: Record<Exclude<VerificationStatus, null>, string> = {
  PENDING: "طلب التوثيق قيد المراجعة",
  APPROVED: "تم توثيق العلامة التجارية",
  REJECTED: "تم رفض طلب التوثيق السابق",
};

export function BrandProfileForm({
  initialName,
  initialDescription,
  isVerified,
  initialVerificationStatus,
}: Props) {
  const [name, setName] = useState(initialName);
  const [description, setDescription] = useState(initialDescription);
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus>(
    initialVerificationStatus,
  );
  const [isSaving, setIsSaving] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSaving(true);
    setMessage(null);

    try {
      const response = await fetch("/api/v1/brand/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description }),
      });
      const data = await response.json();

      if (!response.ok) {
        setMessage({ type: "error", text: data.error?.message || "فشل حفظ التغييرات." });
        return;
      }
      setMessage({ type: "success", text: "تم حفظ الملف الشخصي بنجاح." });
    } catch {
      setMessage({ type: "error", text: "حدث خطأ في الاتصال بالسيرفر." });
    } finally {
      setIsSaving(false);
    }
  };

  const handleRequestVerification = async () => {
    setIsRequesting(true);
    setMessage(null);

    try {
      const response = await fetch("/api/v1/brand/verification", { method: "POST" });
      const data = await response.json();

      if (!response.ok) {
        setMessage({ type: "error", text: data.error?.message || "فشل إرسال الطلب." });
        return;
      }
      setVerificationStatus("PENDING");
      setMessage({
        type: "success",
        text: "تم إرسال طلب التوثيق، بانتظار مراجعة الإدارة.",
      });
    } catch {
      setMessage({ type: "error", text: "حدث خطأ في الاتصال بالسيرفر." });
    } finally {
      setIsRequesting(false);
    }
  };

  return (
    <div className="space-y-6">
      {message && (
        <div
          className={`rounded-[var(--radius-sm)] p-4 text-sm font-semibold ${
            message.type === "success"
              ? "bg-[rgba(214,246,29,0.15)] text-[var(--forest-800)]"
              : "border-r-4 border-[var(--color-brand-active)] bg-[rgba(6,38,25,0.05)] text-[var(--forest-800)]"
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="flex items-center justify-between rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
        <div>
          <p className="font-bold text-[var(--color-text)]">
            {isVerified ? "علامة تجارية موثّقة ✓" : "علامة تجارية غير موثّقة"}
          </p>
          {verificationStatus && (
            <p className="mt-1 text-xs font-semibold text-[var(--color-text-secondary)]">
              {verificationLabels[verificationStatus]}
            </p>
          )}
        </div>
        {!isVerified && verificationStatus !== "PENDING" && (
          <button
            type="button"
            onClick={handleRequestVerification}
            disabled={isRequesting}
            className="btn-secondary px-5 py-2.5 text-sm"
          >
            {isRequesting ? "جاري الإرسال..." : "طلب التوثيق"}
          </button>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-5">
        <div>
          <label htmlFor="name" className="mb-2 block text-sm font-bold">
            اسم العلامة التجارية
          </label>
          <input
            id="name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="min-h-[48px] w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 text-[var(--color-text)] focus:border-[var(--color-brand)] focus:outline-none focus:ring-4 focus:ring-[rgba(214,246,29,0.18)]"
            disabled={isSaving}
          />
        </div>
        <div>
          <label htmlFor="description" className="mb-2 block text-sm font-bold">
            الوصف
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            rows={4}
            maxLength={1000}
            className="w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-[var(--color-text)] focus:border-[var(--color-brand)] focus:outline-none focus:ring-4 focus:ring-[rgba(214,246,29,0.18)]"
            disabled={isSaving}
          />
        </div>
        <button
          type="submit"
          disabled={isSaving}
          className="btn-primary px-6 py-3 text-sm"
        >
          {isSaving ? "جاري الحفظ..." : "حفظ التغييرات"}
        </button>
      </form>
    </div>
  );
}
