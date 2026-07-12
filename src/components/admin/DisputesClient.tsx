"use client";

import { useState } from "react";
import { EmptyState } from "../ui/EmptyState";

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
  messages: Array<{ id: string; body: string; createdAt: string }>;
};

export function DisputesClient({ initialItems }: { initialItems: DisputeItem[] }) {
  const [items, setItems] = useState(initialItems);
  const [busyId, setBusyId] = useState<string | null>(null);

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
        alert(data.error?.message || "فشل حل النزاع");
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
            </div>
            <div className="mt-4 space-y-2">
              {item.messages.map((message) => (
                <div
                  key={message.id}
                  className="rounded-[var(--radius-md)] bg-[var(--color-bg)] px-3 py-2 text-xs font-medium"
                >
                  {message.body}
                </div>
              ))}
            </div>
          </article>
        );
      })}
    </div>
  );
}
