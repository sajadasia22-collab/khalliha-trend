"use client";

import { useState } from "react";
import { platformLabels } from "../../lib/campaigns";
import { ChevronDownIcon, PlusIcon, TrashIcon, LinkIcon } from "../ui/icons";
import { Badge, type BadgeVariant } from "../ui/Badge";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/button";
import { useToast } from "../ui/Toast";

type SocialAccount = {
  id: string;
  platform: keyof typeof platformLabels;
  handle: string;
  profileUrl: string;
  status: "PENDING" | "VERIFIED" | "REJECTED";
  rejectionReason: string | null;
};

const statusLabels: Record<SocialAccount["status"], string> = {
  PENDING: "قيد المراجعة",
  VERIFIED: "موثّق",
  REJECTED: "مرفوض",
};

const statusBadgeVariant: Record<SocialAccount["status"], BadgeVariant> = {
  PENDING: "warning",
  VERIFIED: "brand",
  REJECTED: "neutral",
};

export function SocialAccountsManager({
  initialAccounts,
}: {
  initialAccounts: SocialAccount[];
}) {
  const { showToast } = useToast();
  const [accounts, setAccounts] = useState(initialAccounts);
  const [modalOpen, setModalOpen] = useState(false);
  const [platform, setPlatform] = useState<keyof typeof platformLabels>("TIKTOK");
  const [handle, setHandle] = useState("");
  const [profileUrl, setProfileUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  function closeModal() {
    setModalOpen(false);
    setError("");
    setHandle("");
    setProfileUrl("");
  }

  const handleAdd = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/v1/social-accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platform, handle, profileUrl }),
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error?.message || "فشل ربط الحساب.");
        return;
      }

      setAccounts((current) => [data.data, ...current]);
      showToast("تم إرسال الحساب للمراجعة بنجاح.", "success");
      closeModal();
    } catch {
      setError("حدث خطأ في الاتصال بالسيرفر.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    const response = await fetch(`/api/v1/social-accounts/${id}`, { method: "DELETE" });
    if (response.ok) {
      setAccounts((current) => current.filter((account) => account.id !== id));
      showToast("تم حذف الحساب.", "info");
    } else {
      showToast("تعذّر حذف الحساب.", "error");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-[var(--color-text-secondary)]">
          يمكنك ربط أكثر من حساب — حتى أكثر من حساب على نفس المنصة.
        </p>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => setModalOpen(true)}
          className="flex-shrink-0"
        >
          <PlusIcon size={16} strokeWidth={2.2} />
          إضافة حساب
        </Button>
      </div>

      {accounts.length === 0 ? (
        <div className="scale-in flex flex-col items-center gap-3 rounded-[var(--radius-lg)] border border-dashed border-[var(--color-border-strong)] bg-[var(--color-surface)] px-6 py-10 text-center">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--color-surface-muted)] text-[var(--color-text-muted)]">
            <LinkIcon size={20} />
          </span>
          <p className="text-sm font-bold text-[var(--color-text)]">
            لم تربط أي حساب اجتماعي بعد
          </p>
          <p className="text-xs font-medium text-[var(--color-text-secondary)]">
            اضغط &quot;إضافة حساب&quot; لربط أول حساب لك — ويمكنك إضافة المزيد لاحقًا بنفس
            الطريقة.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {accounts.map((account) => (
            <div
              key={account.id}
              className="fade-in-up flex items-center justify-between gap-3 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4"
            >
              <div className="min-w-0">
                <p className="truncate font-bold text-[var(--color-text)]">
                  {platformLabels[account.platform]} · @{account.handle}
                </p>
                <p className="mt-1 truncate text-xs text-[var(--color-text-secondary)]">
                  {account.profileUrl}
                </p>
                {account.status === "REJECTED" && account.rejectionReason && (
                  <p className="mt-1 text-xs font-semibold text-[var(--forest-800)]">
                    سبب الرفض: {account.rejectionReason}
                  </p>
                )}
              </div>
              <div className="flex flex-shrink-0 items-center gap-3">
                <Badge variant={statusBadgeVariant[account.status]}>
                  {statusLabels[account.status]}
                </Badge>
                <button
                  type="button"
                  onClick={() => handleDelete(account.id)}
                  aria-label={`حذف حساب @${account.handle}`}
                  className="text-[var(--color-text-muted)] transition-colors hover:text-[var(--forest-800)]"
                >
                  <TrashIcon size={17} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={closeModal} title="إضافة حساب اجتماعي جديد">
        <form onSubmit={handleAdd} className="space-y-4">
          {error && (
            <p role="alert" className="text-sm font-semibold text-[var(--forest-800)]">
              {error}
            </p>
          )}
          <div>
            <label
              htmlFor="social-platform"
              className="mb-1.5 block text-xs font-bold text-[var(--color-text-secondary)]"
            >
              المنصة
            </label>
            <div className="select-field-wrap">
              <select
                id="social-platform"
                value={platform}
                onChange={(event) =>
                  setPlatform(event.target.value as keyof typeof platformLabels)
                }
                className="select-field"
              >
                {Object.entries(platformLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
              <ChevronDownIcon
                size={16}
                strokeWidth={1.6}
                aria-hidden="true"
                className="select-field-chevron"
              />
            </div>
          </div>
          <div>
            <label
              htmlFor="social-handle"
              className="mb-1.5 block text-xs font-bold text-[var(--color-text-secondary)]"
            >
              اسم المستخدم
            </label>
            <input
              id="social-handle"
              value={handle}
              onChange={(event) => setHandle(event.target.value)}
              placeholder="مثال: khalliha_trend"
              className="input-field"
              disabled={isLoading}
            />
          </div>
          <div>
            <label
              htmlFor="social-url"
              className="mb-1.5 block text-xs font-bold text-[var(--color-text-secondary)]"
            >
              رابط الحساب
            </label>
            <input
              id="social-url"
              value={profileUrl}
              onChange={(event) => setProfileUrl(event.target.value)}
              placeholder="https://..."
              className="input-field"
              disabled={isLoading}
            />
          </div>
          <Button type="submit" loading={isLoading} className="w-full justify-center">
            ربط الحساب
          </Button>
        </form>
      </Modal>
    </div>
  );
}
