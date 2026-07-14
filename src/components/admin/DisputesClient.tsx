"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { EmptyState } from "../ui/EmptyState";
import { useToast } from "../ui/Toast";

const STATUS_LABELS: Record<string, string> = {
  OPEN: "مفتوح",
  AWAITING_CREATOR: "بانتظار الصانع",
  AWAITING_BRAND: "بانتظار العلامة",
  UNDER_ADMIN_REVIEW: "قيد مراجعة الإدارة",
  RESOLVED_CREATOR: "حُلّ لصالح الصانع",
  RESOLVED_BRAND: "حُلّ لصالح العلامة",
  PARTIAL_RESOLUTION: "حُلّ جزئياً",
  CLOSED: "مغلق",
};

const RESOLVED_STATUSES = new Set([
  "RESOLVED_CREATOR",
  "RESOLVED_BRAND",
  "PARTIAL_RESOLUTION",
  "CLOSED",
]);

type ResolveDecision = "CREATOR" | "BRAND" | "PARTIAL" | "CLOSE";

const DECISION_LABELS: Record<ResolveDecision, string> = {
  CREATOR: "لصالح الصانع",
  BRAND: "لصالح العلامة",
  PARTIAL: "حل جزئي",
  CLOSE: "إغلاق",
};

type DisputeItem = {
  id: string;
  title: string;
  reason: string;
  status: string;
  description: string;
  openedBy: { fullName: string; email: string | null; role: string };
  campaignTitle: string;
  creatorName: string;
  brandName: string;
  messages: Array<{
    id: string;
    body: string;
    createdAt: string;
    sender: { id: string; fullName: string; role: string };
  }>;
  attachments: Array<{
    id: string;
    fileName: string;
    mimeType: string;
    sizeBytes: number;
    createdAt: string;
    uploadedBy: { id: string; fullName: string; role: string };
  }>;
};

function formatFileSize(sizeBytes: number) {
  if (sizeBytes >= 1024 * 1024) return `${(sizeBytes / (1024 * 1024)).toFixed(1)}MB`;
  return `${Math.max(1, Math.round(sizeBytes / 1024))}KB`;
}

export function DisputesClient({
  initialItems,
  currentUserId,
}: {
  initialItems: DisputeItem[];
  currentUserId: string;
}) {
  const { showToast } = useToast();
  const router = useRouter();
  const [items, setItems] = useState(initialItems);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [replies, setReplies] = useState<Record<string, string>>({});
  const [pendingResolve, setPendingResolve] = useState<{
    id: string;
    decision: ResolveDecision;
  } | null>(null);
  const [resolutionNote, setResolutionNote] = useState("");

  async function sendReply(id: string) {
    const body = replies[id]?.trim();
    if (!body || body.length < 2) return;
    setBusyId(id);
    try {
      const response = await fetch(`/api/v1/disputes/${id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body }),
      });
      const data = await response.json();
      if (!response.ok) {
        showToast(data.error?.message || "فشل إرسال الرد", "error");
        return;
      }
      setItems((current) =>
        current.map((item) =>
          item.id === id
            ? {
                ...item,
                messages: [
                  ...item.messages,
                  {
                    ...data.data,
                    createdAt: new Date(data.data.createdAt).toISOString(),
                  },
                ],
              }
            : item,
        ),
      );
      setReplies((current) => ({ ...current, [id]: "" }));
    } finally {
      setBusyId(null);
    }
  }

  function startResolve(id: string, decision: ResolveDecision) {
    if (pendingResolve?.id === id && pendingResolve.decision === decision) {
      setPendingResolve(null);
      return;
    }
    setPendingResolve({ id, decision });
    setResolutionNote("");
  }

  async function resolve(id: string, decision: ResolveDecision) {
    const trimmed = resolutionNote.trim();
    if (trimmed.length < 5) {
      showToast("ملاحظة القرار مطلوبة (5 أحرف على الأقل)", "error");
      return;
    }

    setBusyId(id);
    try {
      const response = await fetch(`/api/v1/admin/disputes/${id}/resolve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision, resolutionNote: trimmed }),
      });
      if (!response.ok) {
        const data = await response.json();
        showToast(data.error?.message || "فشل حل النزاع", "error");
        return;
      }
      setItems((current) =>
        current.map((item) =>
          item.id === id
            ? {
                ...item,
                status:
                  decision === "CREATOR"
                    ? "RESOLVED_CREATOR"
                    : decision === "BRAND"
                      ? "RESOLVED_BRAND"
                      : decision === "PARTIAL"
                        ? "PARTIAL_RESOLUTION"
                        : "CLOSED",
              }
            : item,
        ),
      );
      setPendingResolve(null);
      setResolutionNote("");
      // يحدّث عدّاد النزاعات النشطة المصيَّر من الخادم في ترويسة الصفحة.
      router.refresh();
    } finally {
      setBusyId(null);
    }
  }

  if (items.length === 0) {
    return <EmptyState message="لا توجد نزاعات حالياً." />;
  }

  return (
    <div className="space-y-4">
      {items.map((item) => {
        const resolved = RESOLVED_STATUSES.has(item.status);
        return (
          <article
            key={item.id}
            className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-sm)] transition-shadow duration-150 hover:shadow-[var(--shadow-md)]"
          >
            <div className="flex flex-col gap-4 lg:flex-row lg:justify-between">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`rounded-[var(--radius-pill)] px-2.5 py-0.5 text-xs font-extrabold ${
                      resolved
                        ? "bg-[var(--color-surface-muted)] text-[var(--color-text-muted)]"
                        : "bg-[var(--forest-700)] text-[var(--mist-50)]"
                    }`}
                  >
                    {STATUS_LABELS[item.status] ?? item.status}
                  </span>
                  <span className="text-xs font-bold text-[var(--color-text-secondary)]">
                    {item.reason}
                  </span>
                </div>
                <h2 className="text-lg font-extrabold">{item.title}</h2>
                <p className="text-sm font-medium text-[var(--color-text-secondary)]">
                  {item.campaignTitle} · {item.creatorName} · {item.brandName}
                </p>
                <p className="text-sm leading-7 text-[var(--color-text)]">
                  {item.description}
                </p>
                <p className="text-xs font-bold text-[var(--color-text-secondary)]">
                  فتحه: {item.openedBy.fullName} ({item.openedBy.role})
                </p>
              </div>
              {!resolved && (
                <div className="flex flex-wrap gap-2 lg:max-w-xs">
                  <button
                    disabled={busyId === item.id}
                    className="btn-secondary px-3 py-2 text-xs font-bold"
                    onClick={() => startResolve(item.id, "CREATOR")}
                  >
                    لصالح الصانع
                  </button>
                  <button
                    disabled={busyId === item.id}
                    className="btn-secondary px-3 py-2 text-xs font-bold"
                    onClick={() => startResolve(item.id, "BRAND")}
                  >
                    لصالح العلامة
                  </button>
                  <button
                    disabled={busyId === item.id}
                    className="btn-secondary px-3 py-2 text-xs font-bold"
                    onClick={() => startResolve(item.id, "PARTIAL")}
                  >
                    حل جزئي
                  </button>
                  <button
                    disabled={busyId === item.id}
                    className="btn-primary px-3 py-2 text-xs font-bold"
                    onClick={() => startResolve(item.id, "CLOSE")}
                  >
                    إغلاق
                  </button>
                </div>
              )}
            </div>
            {!resolved && pendingResolve?.id === item.id && (
              <div className="mt-4 space-y-2 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg)] p-4">
                <label
                  htmlFor={`dispute-resolution-note-${item.id}`}
                  className="block text-xs font-extrabold"
                >
                  ملاحظة قرار «{DECISION_LABELS[pendingResolve.decision]}» — تظهر للطرفين
                </label>
                <textarea
                  id={`dispute-resolution-note-${item.id}`}
                  value={resolutionNote}
                  onChange={(event) => setResolutionNote(event.target.value)}
                  rows={2}
                  maxLength={2000}
                  placeholder="اشرح أساس القرار (5 أحرف على الأقل)..."
                  className="w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm font-medium"
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={busyId === item.id || resolutionNote.trim().length < 5}
                    onClick={() => resolve(item.id, pendingResolve.decision)}
                    className="btn-primary px-4 py-2 text-xs font-bold disabled:opacity-50"
                  >
                    تأكيد القرار
                  </button>
                  <button
                    type="button"
                    disabled={busyId === item.id}
                    onClick={() => setPendingResolve(null)}
                    className="btn-secondary px-4 py-2 text-xs font-bold disabled:opacity-50"
                  >
                    إلغاء
                  </button>
                </div>
              </div>
            )}
            <div className="mt-4 space-y-2">
              {item.messages.map((message) => (
                <div
                  key={message.id}
                  className={`max-w-[88%] rounded-[var(--radius-md)] px-3 py-2 text-xs font-medium ${message.sender.id === currentUserId ? "bg-[var(--forest-900)] text-[var(--color-text-on-dark)]" : "bg-[var(--color-bg)]"}`}
                >
                  <span className="mb-1 block text-[10px] font-black opacity-60">
                    {message.sender.fullName}
                  </span>
                  {message.body}
                </div>
              ))}
            </div>
            {item.attachments.length > 0 && (
              <div className="mt-4 border-t border-[var(--color-border)] pt-4">
                <p className="mb-2 text-xs font-black">
                  الأدلة المرفقة ({item.attachments.length})
                </p>
                <ul className="flex flex-wrap gap-2">
                  {item.attachments.map((attachment) => (
                    <li key={attachment.id}>
                      <a
                        href={`/api/v1/disputes/${item.id}/attachments/${attachment.id}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-xs font-bold hover:border-[var(--forest-200)]"
                      >
                        📎 {attachment.fileName}
                        <span className="text-[10px] font-black text-[var(--color-text-muted)]">
                          {formatFileSize(attachment.sizeBytes)} ·{" "}
                          {attachment.uploadedBy.fullName}
                        </span>
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {!resolved && (
              <div className="mt-4 flex gap-2 border-t border-[var(--color-border)] pt-4">
                <input
                  value={replies[item.id] ?? ""}
                  onChange={(event) =>
                    setReplies((current) => ({
                      ...current,
                      [item.id]: event.target.value,
                    }))
                  }
                  placeholder="اكتب رداً للطرفين..."
                  maxLength={2000}
                  className="input-field min-w-0 flex-1"
                />
                <button
                  type="button"
                  disabled={
                    busyId === item.id || (replies[item.id]?.trim().length ?? 0) < 2
                  }
                  onClick={() => sendReply(item.id)}
                  className="btn-primary px-4 text-xs font-black disabled:opacity-50"
                >
                  إرسال
                </button>
              </div>
            )}
          </article>
        );
      })}
    </div>
  );
}
