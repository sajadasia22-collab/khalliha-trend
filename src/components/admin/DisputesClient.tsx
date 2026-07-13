"use client";

import { useState } from "react";
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
};

export function DisputesClient({
  initialItems,
  currentUserId,
}: {
  initialItems: DisputeItem[];
  currentUserId: string;
}) {
  const { showToast } = useToast();
  const [items, setItems] = useState(initialItems);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [replies, setReplies] = useState<Record<string, string>>({});

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

  async function resolve(
    id: string,
    decision: "CREATOR" | "BRAND" | "PARTIAL" | "CLOSE",
  ) {
    const resolutionNote = window.prompt("اكتب ملاحظة قرار النزاع:");
    if (!resolutionNote) return;

    setBusyId(id);
    try {
      const response = await fetch(`/api/v1/admin/disputes/${id}/resolve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision, resolutionNote }),
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
                    onClick={() => resolve(item.id, "CREATOR")}
                  >
                    لصالح الصانع
                  </button>
                  <button
                    disabled={busyId === item.id}
                    className="btn-secondary px-3 py-2 text-xs font-bold"
                    onClick={() => resolve(item.id, "BRAND")}
                  >
                    لصالح العلامة
                  </button>
                  <button
                    disabled={busyId === item.id}
                    className="btn-secondary px-3 py-2 text-xs font-bold"
                    onClick={() => resolve(item.id, "PARTIAL")}
                  >
                    حل جزئي
                  </button>
                  <button
                    disabled={busyId === item.id}
                    className="btn-primary px-3 py-2 text-xs font-bold"
                    onClick={() => resolve(item.id, "CLOSE")}
                  >
                    إغلاق
                  </button>
                </div>
              )}
            </div>
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
