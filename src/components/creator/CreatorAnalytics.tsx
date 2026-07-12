"use client";

import { useEffect, useMemo, useState } from "react";

type EarningLog = {
  id: string;
  amount: string;
  currency: "IQD" | "USD";
  status: string;
  createdAt: string;
};

type SubmissionItem = {
  id: string;
  status: "SUBMITTED" | "UNDER_REVIEW" | "REVISION_REQUESTED" | "APPROVED" | "REJECTED";
  createdAt: string;
  campaignTitle: string;
};

const SUBMISSION_STATUS_LABELS: Record<SubmissionItem["status"], string> = {
  SUBMITTED: "بانتظار المراجعة",
  UNDER_REVIEW: "قيد المراجعة",
  REVISION_REQUESTED: "يحتاج تعديل",
  APPROVED: "مقبول",
  REJECTED: "مرفوض",
};

const SUBMISSION_STATUS_COLORS: Record<SubmissionItem["status"], string> = {
  SUBMITTED: "var(--mist-600)",
  UNDER_REVIEW: "var(--trend-500)",
  REVISION_REQUESTED: "var(--trend-700)",
  APPROVED: "var(--forest-500)",
  REJECTED: "var(--forest-800)",
};

const DAYS_WINDOW = 30;

function buildDailyBuckets(history: EarningLog[]): { date: string; total: bigint }[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const buckets = new Map<string, bigint>();
  for (let i = DAYS_WINDOW - 1; i >= 0; i -= 1) {
    const day = new Date(today);
    day.setDate(day.getDate() - i);
    buckets.set(day.toISOString().slice(0, 10), 0n);
  }

  for (const entry of history) {
    if (entry.currency !== "IQD") continue;
    const key = entry.createdAt.slice(0, 10);
    if (buckets.has(key)) {
      buckets.set(key, (buckets.get(key) ?? 0n) + BigInt(entry.amount));
    }
  }

  return Array.from(buckets.entries()).map(([date, total]) => ({ date, total }));
}

export function CreatorAnalytics() {
  const [history, setHistory] = useState<EarningLog[] | null>(null);
  const [submissions, setSubmissions] = useState<SubmissionItem[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [earningsRes, submissionsRes] = await Promise.all([
          fetch("/api/v1/creator/earnings"),
          fetch("/api/v1/creator/submissions"),
        ]);
        if (earningsRes.ok) {
          const json = await earningsRes.json();
          setHistory(json.data.history);
        }
        if (submissionsRes.ok) {
          const json = await submissionsRes.json();
          setSubmissions(json.data);
        }
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const buckets = useMemo(() => buildDailyBuckets(history ?? []), [history]);
  const maxValue = useMemo(
    () => buckets.reduce((max, b) => (b.total > max ? b.total : max), 1n),
    [buckets],
  );

  const statusCounts = useMemo(() => {
    const counts: Record<SubmissionItem["status"], number> = {
      SUBMITTED: 0,
      UNDER_REVIEW: 0,
      REVISION_REQUESTED: 0,
      APPROVED: 0,
      REJECTED: 0,
    };
    for (const submission of submissions ?? []) {
      counts[submission.status] += 1;
    }
    return counts;
  }, [submissions]);

  const totalSubmissions = submissions?.length ?? 0;

  if (loading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 animate-pulse">
        <div className="h-56 rounded-[var(--radius-lg)] bg-[var(--color-border)] opacity-20" />
        <div className="h-56 rounded-[var(--radius-lg)] bg-[var(--color-border)] opacity-20" />
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div className="card p-6 border border-[var(--color-border)] bg-[var(--color-surface)] rounded-[var(--radius-lg)]">
        <h2 className="text-sm font-bold text-[var(--color-text-secondary)] mb-4">
          الأرباح اليومية (د.ع) - آخر 30 يوم
        </h2>
        {maxValue === 1n && buckets.every((b) => b.total === 0n) ? (
          <p className="py-8 text-center text-xs text-[var(--color-text-muted)]">
            لا توجد أرباح مسجّلة خلال الفترة الأخيرة.
          </p>
        ) : (
          <svg viewBox="0 0 320 120" className="w-full h-32" preserveAspectRatio="none">
            {buckets.map((bucket, index) => {
              const barWidth = 320 / DAYS_WINDOW;
              const heightRatio = Number((bucket.total * 1000n) / maxValue) / 1000;
              const barHeight = Math.max(heightRatio * 110, bucket.total > 0n ? 2 : 0);
              const x = index * barWidth;
              const y = 118 - barHeight;
              return (
                <rect
                  key={bucket.date}
                  x={x + barWidth * 0.15}
                  y={y}
                  width={barWidth * 0.7}
                  height={barHeight}
                  rx={1.5}
                  fill="var(--color-brand-active)"
                >
                  <title>
                    {bucket.date}:{" "}
                    {bucket.total.toLocaleString("ar-IQ", { numberingSystem: "latn" })}{" "}
                    د.ع
                  </title>
                </rect>
              );
            })}
          </svg>
        )}
        <div className="mt-2 flex justify-between text-[11px] text-[var(--color-text-muted)]">
          <span>{buckets[0]?.date}</span>
          <span>{buckets[buckets.length - 1]?.date}</span>
        </div>
      </div>

      <div className="card p-6 border border-[var(--color-border)] bg-[var(--color-surface)] rounded-[var(--radius-lg)]">
        <h2 className="text-sm font-bold text-[var(--color-text-secondary)] mb-4">
          حالة المشاركات المرسلة
        </h2>
        {totalSubmissions === 0 ? (
          <p className="py-8 text-center text-xs text-[var(--color-text-muted)]">
            لم ترسل أي مشاركة بعد.
          </p>
        ) : (
          <div className="space-y-3">
            {(Object.keys(SUBMISSION_STATUS_LABELS) as SubmissionItem["status"][]).map(
              (status) => {
                const count = statusCounts[status];
                const percentage =
                  totalSubmissions > 0 ? (count / totalSubmissions) * 100 : 0;
                return (
                  <div key={status}>
                    <div className="flex items-center justify-between text-xs font-bold text-[var(--color-text-secondary)] mb-1">
                      <span>{SUBMISSION_STATUS_LABELS[status]}</span>
                      <span>{count}</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-[var(--color-surface-muted)] overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${percentage}%`,
                          backgroundColor: SUBMISSION_STATUS_COLORS[status],
                        }}
                      />
                    </div>
                  </div>
                );
              },
            )}
          </div>
        )}
      </div>
    </div>
  );
}
