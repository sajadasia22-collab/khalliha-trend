"use client";

import { useState } from "react";
import { EmptyState } from "../ui/EmptyState";
import { useToast } from "../ui/Toast";

const RISK_STYLES: Record<string, string> = {
  HIGH: "bg-[var(--forest-700)] text-[var(--mist-50)]",
  MEDIUM:
    "border border-[var(--forest-200)] bg-[var(--color-surface-muted)] text-[var(--forest-500)]",
  LOW: "bg-[var(--color-surface-muted)] text-[var(--color-text-muted)]",
};

const RISK_LABELS: Record<string, string> = {
  HIGH: "خطر مرتفع",
  MEDIUM: "خطر متوسط",
  LOW: "خطر منخفض",
};

type FraudItem = {
  id: string;
  submissionId: string;
  fraudScore: number;
  riskLevel: string;
  status: string;
  campaignTitle: string;
  brandName: string;
  creatorName: string;
  postUrl: string;
  signals: Array<{ id: string; kind: string; scoreImpact: number; note: string | null }>;
};

export function FraudQueueClient({ initialItems }: { initialItems: FraudItem[] }) {
  const { showToast } = useToast();
  const [items, setItems] = useState(initialItems);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function review(id: string, decision: "CLEAR" | "CONFIRM") {
    const note = window.prompt(
      decision === "CONFIRM" ? "سبب تأكيد الاشتباه:" : "سبب إزالة الاشتباه:",
    );
    if (!note) return;

    setBusyId(id);
    try {
      const response = await fetch(`/api/v1/admin/fraud-queue/${id}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision, note }),
      });
      if (!response.ok) {
        const data = await response.json();
        showToast(data.error?.message || "فشلت مراجعة الحالة", "error");
        return;
      }
      setItems((current) => current.filter((item) => item.id !== id));
    } finally {
      setBusyId(null);
    }
  }

  if (items.length === 0) {
    return <EmptyState message="لا توجد حالات احتيال مفتوحة حالياً." />;
  }

  return (
    <div className="space-y-4">
      {items.map((item) => (
        <article
          key={item.id}
          className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-sm)] transition-shadow duration-150 hover:shadow-[var(--shadow-md)]"
        >
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span
                  className={`rounded-[var(--radius-pill)] px-2.5 py-0.5 text-xs font-extrabold ${RISK_STYLES[item.riskLevel] ?? RISK_STYLES.LOW}`}
                >
                  {RISK_LABELS[item.riskLevel] ?? item.riskLevel}
                </span>
                <span className="text-xs font-bold text-[var(--color-text-muted)]">
                  Score {item.fraudScore}
                </span>
              </div>
              <h2 className="text-lg font-extrabold">{item.campaignTitle}</h2>
              <p className="text-sm font-medium text-[var(--color-text-secondary)]">
                {item.creatorName} · {item.brandName}
              </p>
              <a
                href={item.postUrl}
                target="_blank"
                rel="noreferrer"
                className="block break-all text-xs font-bold text-[var(--forest-700)]"
              >
                {item.postUrl}
              </a>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={busyId === item.id}
                onClick={() => review(item.id, "CLEAR")}
                className="btn-secondary px-4 py-2 text-xs font-bold disabled:opacity-50"
              >
                إزالة الاشتباه
              </button>
              <button
                type="button"
                disabled={busyId === item.id}
                onClick={() => review(item.id, "CONFIRM")}
                className="btn-primary px-4 py-2 text-xs font-bold disabled:opacity-50"
              >
                تأكيد الاحتيال
              </button>
            </div>
          </div>
          <div className="mt-4 grid gap-2">
            {item.signals.map((signal) => (
              <div
                key={signal.id}
                className="rounded-[var(--radius-md)] bg-[var(--color-bg)] px-3 py-2 text-xs font-bold text-[var(--color-text-secondary)]"
              >
                {signal.kind} · +{signal.scoreImpact} · {signal.note || "بدون ملاحظة"}
              </div>
            ))}
          </div>
        </article>
      ))}
    </div>
  );
}
