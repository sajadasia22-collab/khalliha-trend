"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangleIcon,
  ArrowUpRightIcon,
  CheckIcon,
  ClockIcon,
  DisputeIcon,
  MegaphoneIcon,
} from "../ui/icons";
import { useToast } from "../ui/Toast";

export type DisputeCenterItem = {
  id: string;
  title: string;
  reason: string;
  status: string;
  description: string;
  resolutionNote: string | null;
  createdAt: string;
  openedBy: { id: string; fullName: string; role: string };
  submission: {
    id: string;
    postUrl: string;
    campaignTitle: string;
    creatorName: string;
    brandName: string;
  };
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

export type EligibleSubmission = {
  id: string;
  postUrl: string;
  platform: string;
  status: string;
  createdAt: string;
  campaignTitle: string;
  hasActiveDispute: boolean;
};

const ACTIVE = new Set([
  "OPEN",
  "AWAITING_CREATOR",
  "AWAITING_BRAND",
  "UNDER_ADMIN_REVIEW",
]);

const statusLabels: Record<string, string> = {
  OPEN: "مفتوح",
  AWAITING_CREATOR: "بانتظار صانع المحتوى",
  AWAITING_BRAND: "بانتظار العلامة",
  UNDER_ADMIN_REVIEW: "قيد مراجعة الإدارة",
  RESOLVED_CREATOR: "حُلّ لصالح الصانع",
  RESOLVED_BRAND: "حُلّ لصالح العلامة",
  PARTIAL_RESOLUTION: "حل جزئي",
  CLOSED: "مغلق",
};

const reasonLabels: Record<string, string> = {
  SUBMISSION_REJECTION: "رفض المشاركة",
  QUALIFIED_VIEWS: "المشاهدات المؤهلة",
  DISQUALIFICATION: "استبعاد مشاهدات",
  EARNINGS: "الأرباح",
  PAYOUT: "السحب",
  BRAND_MISUSE: "استخدام غير مصرح من العلامة",
  FRAUD_CLAIM: "اعتراض على ادعاء احتيال",
  OTHER: "سبب آخر",
};

export function DisputeCenter({
  initialItems,
  eligibleSubmissions,
  currentUserId,
  initialSubmissionId,
}: {
  initialItems: DisputeCenterItem[];
  eligibleSubmissions: EligibleSubmission[];
  currentUserId: string;
  initialSubmissionId?: string;
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const [items, setItems] = useState(initialItems);
  const [selectedId, setSelectedId] = useState(initialItems[0]?.id ?? null);
  const [filter, setFilter] = useState<"ACTIVE" | "CLOSED">("ACTIVE");
  const [showCreate, setShowCreate] = useState(Boolean(initialSubmissionId));
  const [busy, setBusy] = useState(false);
  const [reply, setReply] = useState("");
  const [form, setForm] = useState({
    submissionId: initialSubmissionId ?? "",
    reason: "QUALIFIED_VIEWS",
    title: "",
    description: "",
  });

  const filtered = useMemo(
    () =>
      items.filter((item) =>
        filter === "ACTIVE" ? ACTIVE.has(item.status) : !ACTIVE.has(item.status),
      ),
    [filter, items],
  );
  const selected = filtered.find((item) => item.id === selectedId) ?? filtered[0];
  const available = eligibleSubmissions.filter((item) => !item.hasActiveDispute);

  async function createDispute(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    try {
      const response = await fetch("/api/v1/disputes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await response.json();
      if (!response.ok) {
        showToast(json.error?.message ?? "تعذر فتح النزاع", "error");
        return;
      }
      showToast("تم فتح النزاع وتجميد الأرباح المرتبطة لحين القرار", "success");
      setShowCreate(false);
      router.refresh();
      window.setTimeout(() => window.location.reload(), 250);
    } finally {
      setBusy(false);
    }
  }

  async function sendReply(event: React.FormEvent) {
    event.preventDefault();
    if (!selected || reply.trim().length < 2) return;
    setBusy(true);
    try {
      const response = await fetch(`/api/v1/disputes/${selected.id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: reply }),
      });
      const json = await response.json();
      if (!response.ok) {
        showToast(json.error?.message ?? "تعذر إرسال الرد", "error");
        return;
      }
      setItems((current) =>
        current.map((item) =>
          item.id === selected.id
            ? {
                ...item,
                messages: [
                  ...item.messages,
                  {
                    ...json.data,
                    createdAt: new Date(json.data.createdAt).toISOString(),
                  },
                ],
              }
            : item,
        ),
      );
      setReply("");
    } finally {
      setBusy(false);
    }
  }

  async function uploadAttachment(file: File) {
    if (!selected) return;
    setBusy(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch(`/api/v1/disputes/${selected.id}/attachments`, {
        method: "POST",
        body: formData,
      });
      const json = await response.json();
      if (!response.ok) {
        showToast(json.error?.message ?? "تعذر رفع الدليل", "error");
        return;
      }
      setItems((current) =>
        current.map((item) =>
          item.id === selected.id
            ? {
                ...item,
                attachments: [
                  ...item.attachments,
                  {
                    ...json.data,
                    createdAt: new Date(json.data.createdAt).toISOString(),
                  },
                ],
              }
            : item,
        ),
      );
      showToast("تم رفع الدليل", "success");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-sm)]">
        <div className="relative overflow-hidden bg-[var(--forest-900)] px-6 py-7 text-[var(--color-text-on-dark)]">
          <div className="absolute -left-10 -top-16 h-40 w-40 rounded-full border-[28px] border-[var(--color-brand)]/10" />
          <div className="relative flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
            <div className="flex items-center gap-4">
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[var(--color-brand)] text-[var(--color-text-on-brand)]">
                <DisputeIcon size={24} />
              </span>
              <div>
                <h1 className="text-2xl font-black">مركز النزاعات</h1>
                <p className="mt-1 text-sm font-medium text-[var(--forest-100)]">
                  اعتراض موثق، محادثة واضحة، وقرار مسجل من الإدارة.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowCreate((value) => !value)}
              disabled={available.length === 0}
              className="btn-primary px-5 py-3 text-sm font-black disabled:cursor-not-allowed disabled:opacity-50"
            >
              {showCreate ? "إلغاء" : "فتح نزاع جديد"}
            </button>
          </div>
        </div>
        {showCreate && (
          <form
            onSubmit={createDispute}
            className="grid gap-5 border-b border-[var(--color-border)] bg-[var(--color-surface-muted)] p-6 lg:grid-cols-2"
          >
            <div className="lg:col-span-2">
              <div className="mb-3 flex items-center gap-2 text-sm font-black">
                <AlertTriangleIcon size={18} /> عند فتح النزاع ستتوقف أرباح المشاركة غير
                المحررة حتى يصدر القرار.
              </div>
            </div>
            <label className="space-y-2 text-sm font-black">
              المشاركة
              <select
                required
                value={form.submissionId}
                onChange={(event) =>
                  setForm({ ...form, submissionId: event.target.value })
                }
                className="input-field w-full bg-[var(--color-surface)]"
              >
                <option value="">اختر الحملة والمشاركة</option>
                {available.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.campaignTitle} · {item.platform}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-2 text-sm font-black">
              سبب النزاع
              <select
                value={form.reason}
                onChange={(event) => setForm({ ...form, reason: event.target.value })}
                className="input-field w-full bg-[var(--color-surface)]"
              >
                {Object.entries(reasonLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-2 text-sm font-black lg:col-span-2">
              عنوان مختصر
              <input
                required
                minLength={3}
                maxLength={120}
                value={form.title}
                onChange={(event) => setForm({ ...form, title: event.target.value })}
                className="input-field w-full bg-[var(--color-surface)]"
                placeholder="مثال: اعتراض على عدد المشاهدات المؤهلة"
              />
            </label>
            <label className="space-y-2 text-sm font-black lg:col-span-2">
              التفاصيل والأدلة
              <textarea
                required
                minLength={10}
                maxLength={2000}
                rows={4}
                value={form.description}
                onChange={(event) =>
                  setForm({ ...form, description: event.target.value })
                }
                className="input-field w-full resize-y bg-[var(--color-surface)]"
                placeholder="اشرح المشكلة بدقة، وما النتيجة التي تتوقعها..."
              />
            </label>
            <button
              disabled={busy}
              className="btn-primary px-6 py-3 text-sm font-black lg:col-span-2"
            >
              {busy ? "جاري الفتح..." : "تأكيد وفتح النزاع"}
            </button>
          </form>
        )}
      </div>
      <div className="flex w-fit rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-1">
        {(["ACTIVE", "CLOSED"] as const).map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setFilter(value)}
            className={`rounded-lg px-4 py-2 text-xs font-black ${filter === value ? "bg-[var(--color-text)] text-[var(--color-bg)]" : "text-[var(--color-text-secondary)]"}`}
          >
            {value === "ACTIVE" ? "النزاعات النشطة" : "القرارات السابقة"}
          </button>
        ))}
      </div>
      {filtered.length === 0 ? (
        <div className="rounded-[var(--radius-xl)] border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] p-12 text-center">
          <CheckIcon className="mx-auto text-[var(--color-text-muted)]" size={32} />
          <h2 className="mt-4 font-black">
            {filter === "ACTIVE" ? "لا توجد نزاعات نشطة" : "لا توجد قرارات سابقة"}
          </h2>
          <p className="mt-2 text-sm text-[var(--color-text-muted)]">
            كل شيء هادئ في هذا القسم حالياً.
          </p>
        </div>
      ) : (
        <div className="grid gap-5 lg:grid-cols-[340px_1fr]">
          <aside className="space-y-2">
            {filtered.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setSelectedId(item.id)}
                className={`w-full rounded-2xl border p-4 text-right transition ${selected?.id === item.id ? "border-[var(--color-brand)] bg-[var(--trend-50)] shadow-[var(--shadow-brand)]" : "border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--forest-200)]"}`}
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="rounded-full bg-[var(--color-surface-muted)] px-2.5 py-1 text-[10px] font-black">
                    {statusLabels[item.status] ?? item.status}
                  </span>
                  <ClockIcon size={15} className="text-[var(--color-text-muted)]" />
                </div>
                <h3 className="mt-3 line-clamp-1 font-black">{item.title}</h3>
                <p className="mt-1 line-clamp-1 text-xs font-bold text-[var(--color-text-muted)]">
                  {item.submission.campaignTitle}
                </p>
              </button>
            ))}
          </aside>
          {selected && (
            <article className="overflow-hidden rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-sm)]">
              <div className="border-b border-[var(--color-border)] p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <span className="text-xs font-black text-[var(--color-brand-active)]">
                      {reasonLabels[selected.reason] ?? selected.reason}
                    </span>
                    <h2 className="mt-1 text-xl font-black">{selected.title}</h2>
                    <p className="mt-2 text-sm font-medium text-[var(--color-text-secondary)]">
                      {selected.submission.campaignTitle} ·{" "}
                      {selected.submission.creatorName} · {selected.submission.brandName}
                    </p>
                  </div>
                  <a
                    href={selected.submission.postUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 text-xs font-black underline"
                  >
                    فتح المنشور <ArrowUpRightIcon size={15} />
                  </a>
                </div>
              </div>
              <div className="max-h-[460px] space-y-3 overflow-y-auto bg-[var(--color-surface-muted)] p-5">
                {selected.messages.map((message) => {
                  const mine = message.sender.id === currentUserId;
                  return (
                    <div
                      key={message.id}
                      className={`flex ${mine ? "justify-start" : "justify-end"}`}
                    >
                      <div
                        className={`max-w-[85%] rounded-2xl px-4 py-3 ${mine ? "rounded-tr-sm bg-[var(--forest-900)] text-[var(--color-text-on-dark)]" : "rounded-tl-sm border border-[var(--color-border)] bg-[var(--color-surface)]"}`}
                      >
                        <p className="mb-1 text-[10px] font-black opacity-60">
                          {message.sender.fullName}
                        </p>
                        <p className="whitespace-pre-wrap text-sm leading-6">
                          {message.body}
                        </p>
                        <time className="mt-2 block text-[10px] opacity-50">
                          {new Date(message.createdAt).toLocaleString("ar-IQ", {
                            numberingSystem: "latn",
                          })}
                        </time>
                      </div>
                    </div>
                  );
                })}
              </div>
              {selected.attachments.length > 0 && (
                <div className="border-t border-[var(--color-border)] p-4">
                  <p className="mb-2 text-xs font-black">
                    الأدلة المرفقة ({selected.attachments.length})
                  </p>
                  <ul className="flex flex-wrap gap-2">
                    {selected.attachments.map((attachment) => (
                      <li key={attachment.id}>
                        <a
                          href={`/api/v1/disputes/${selected.id}/attachments/${attachment.id}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-2 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-3 py-2 text-xs font-bold hover:border-[var(--forest-200)]"
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
              {selected.resolutionNote && (
                <div className="border-t border-[var(--color-border)] bg-[var(--trend-50)] p-4">
                  <p className="text-xs font-black">قرار الإدارة</p>
                  <p className="mt-1 text-sm">{selected.resolutionNote}</p>
                </div>
              )}
              {ACTIVE.has(selected.status) && (
                <form
                  onSubmit={sendReply}
                  className="flex gap-3 border-t border-[var(--color-border)] p-4"
                >
                  <label
                    className={`btn-secondary grid cursor-pointer place-items-center px-4 text-sm font-black ${busy ? "pointer-events-none opacity-50" : ""}`}
                    title="أرفق دليلاً (PNG, JPEG, WebP, PDF — حتى 2MB)"
                  >
                    📎
                    <span className="sr-only">أرفق دليلاً</span>
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp,application/pdf"
                      className="hidden"
                      disabled={busy}
                      onChange={(event) => {
                        const file = event.target.files?.[0];
                        event.target.value = "";
                        if (file) void uploadAttachment(file);
                      }}
                    />
                  </label>
                  <input
                    value={reply}
                    onChange={(event) => setReply(event.target.value)}
                    minLength={2}
                    maxLength={2000}
                    placeholder="اكتب رداً أو أضف دليلاً..."
                    className="input-field min-w-0 flex-1"
                  />
                  <button
                    disabled={busy || reply.trim().length < 2}
                    className="btn-primary px-5 text-sm font-black disabled:opacity-50"
                  >
                    إرسال
                  </button>
                </form>
              )}
            </article>
          )}
        </div>
      )}
      {available.length === 0 && eligibleSubmissions.length > 0 && (
        <p className="text-center text-xs font-bold text-[var(--color-text-muted)]">
          كل المشاركات المتاحة لديها نزاع نشط حالياً، لذلك لا يمكن فتح نزاع مكرر.
        </p>
      )}
      {eligibleSubmissions.length === 0 && (
        <div className="flex items-center justify-center gap-2 text-sm font-bold text-[var(--color-text-muted)]">
          <MegaphoneIcon size={17} /> ستظهر هنا المشاركات بعد الانضمام إلى حملة وإرسال
          المحتوى.
        </div>
      )}
    </div>
  );
}
