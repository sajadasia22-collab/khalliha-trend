"use client";

import { useMemo, useState } from "react";
import { useToast } from "../ui/Toast";

type Report = {
  id: string;
  reason: string;
  details: string | null;
  status: "OPEN" | "REVIEWED" | "DISMISSED" | "ACTIONED";
  reviewNote: string | null;
  createdAt: string;
  reporter: { fullName: string; email: string | null };
  post: {
    id: string;
    body: string | null;
    imageUrl: string | null;
    author: { fullName: string };
  } | null;
  comment: { id: string; body: string; author: { fullName: string } } | null;
  reviewer: { fullName: string } | null;
};

const reasonLabels: Record<string, string> = {
  SPAM: "محتوى مزعج",
  HARASSMENT: "إساءة أو مضايقة",
  HATE: "خطاب كراهية",
  MISINFORMATION: "معلومات مضللة",
  COPYRIGHT: "حقوق ملكية",
  OTHER: "سبب آخر",
};

const statusLabels: Record<string, string> = {
  OPEN: "بانتظار المراجعة",
  REVIEWED: "تمت المراجعة",
  DISMISSED: "بلاغ مرفوض",
  ACTIONED: "اتُخذ إجراء",
};

export function CommunityReportsClient({ initialReports }: { initialReports: Report[] }) {
  const { showToast } = useToast();
  const [reports, setReports] = useState(initialReports);
  const [filter, setFilter] = useState("OPEN");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [decision, setDecision] = useState<"REVIEWED" | "DISMISSED" | "ACTIONED">(
    "REVIEWED",
  );
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const visible = useMemo(
    () => reports.filter((report) => filter === "ALL" || report.status === filter),
    [filter, reports],
  );

  async function review(id: string) {
    setSaving(true);
    const response = await fetch(`/api/v1/admin/community-reports/${id}/review`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: decision, reviewNote: note }),
    });
    const json = await response.json();
    setSaving(false);
    if (!response.ok)
      return showToast(json.error?.message ?? "تعذّرت المراجعة.", "error");
    setReports((current) =>
      current.map((item) =>
        item.id === id
          ? { ...item, status: json.data.status, reviewNote: json.data.reviewNote }
          : item,
      ),
    );
    setEditingId(null);
    setNote("");
    showToast("تم حفظ قرار المراجعة.", "success");
  }

  return (
    <div>
      <div className="mb-5 flex flex-wrap gap-2">
        {[
          ["OPEN", "مفتوحة"],
          ["ALL", "الكل"],
          ["ACTIONED", "إجراء"],
          ["DISMISSED", "مرفوضة"],
        ].map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setFilter(value)}
            className={`rounded-full px-4 py-2 text-xs font-black ${filter === value ? "bg-[var(--color-brand)]" : "bg-[var(--color-surface)] text-[var(--color-text-secondary)]"}`}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="space-y-4">
        {visible.map((report) => {
          const target = report.post ?? report.comment;
          return (
            <article
              key={report.id}
              className="rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-sm)]"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <span className="rounded-full bg-[var(--color-surface-muted)] px-3 py-1 text-[11px] font-black">
                    {reasonLabels[report.reason]}
                  </span>
                  <h2 className="mt-3 font-black">
                    محتوى بواسطة {target?.author.fullName ?? "مستخدم"}
                  </h2>
                </div>
                <span className="text-xs font-bold text-[var(--color-brand-active)]">
                  {statusLabels[report.status]}
                </span>
              </div>
              <blockquote className="mt-4 rounded-[var(--radius-md)] border-r-4 border-[var(--color-brand)] bg-[var(--color-surface-muted)] p-4 text-sm leading-7">
                {target?.body || "منشور بصورة بدون نص"}
              </blockquote>
              <div className="mt-4 grid gap-3 text-xs text-[var(--color-text-secondary)] sm:grid-cols-2">
                <p>
                  <strong>المبلّغ:</strong> {report.reporter.fullName}
                </p>
                <p>
                  <strong>التاريخ:</strong>{" "}
                  {new Date(report.createdAt).toLocaleString("ar-IQ")}
                </p>
              </div>
              {report.details && <p className="mt-3 text-sm">{report.details}</p>}
              {report.status === "OPEN" && editingId !== report.id && (
                <button
                  className="btn-primary mt-5 text-sm"
                  onClick={() => setEditingId(report.id)}
                >
                  مراجعة البلاغ
                </button>
              )}
              {editingId === report.id && (
                <div className="mt-5 rounded-[var(--radius-lg)] border border-[var(--color-brand)] bg-[rgba(214,246,29,.07)] p-4">
                  <label className="text-xs font-black" htmlFor={`decision-${report.id}`}>
                    القرار
                  </label>
                  <select
                    id={`decision-${report.id}`}
                    value={decision}
                    onChange={(event) =>
                      setDecision(event.target.value as typeof decision)
                    }
                    className="mt-2 w-full rounded border border-[var(--color-border)] bg-[var(--color-surface)] p-2"
                  >
                    <option value="REVIEWED">مراجعة بدون حذف</option>
                    <option value="DISMISSED">رفض البلاغ</option>
                    <option value="ACTIONED">حذف المحتوى</option>
                  </select>
                  <textarea
                    className="mt-3 min-h-24 w-full rounded border border-[var(--color-border)] bg-[var(--color-surface)] p-3"
                    placeholder="سبب القرار (إلزامي)"
                    value={note}
                    onChange={(event) => setNote(event.target.value)}
                    maxLength={1000}
                  />
                  <div className="mt-3 flex gap-2">
                    <button
                      className="btn-primary text-sm"
                      disabled={saving || note.trim().length < 3}
                      onClick={() => review(report.id)}
                    >
                      حفظ القرار
                    </button>
                    <button
                      className="btn-ghost text-sm"
                      onClick={() => setEditingId(null)}
                    >
                      إلغاء
                    </button>
                  </div>
                </div>
              )}
              {report.reviewNote && (
                <p className="mt-4 rounded bg-[var(--color-surface-muted)] p-3 text-xs">
                  <strong>ملاحظة الإدارة:</strong> {report.reviewNote}
                </p>
              )}
            </article>
          );
        })}
        {visible.length === 0 && (
          <div className="rounded-[var(--radius-xl)] border border-dashed border-[var(--color-border)] p-12 text-center text-sm text-[var(--color-text-secondary)]">
            لا توجد بلاغات ضمن هذا الفلتر.
          </div>
        )}
      </div>
    </div>
  );
}
