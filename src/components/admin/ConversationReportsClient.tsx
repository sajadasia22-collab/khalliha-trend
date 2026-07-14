"use client";

import { useState } from "react";
import { FlagIcon, MessageIcon } from "../ui/icons";
import { useToast } from "../ui/Toast";

type Report = {
  id: string;
  reason: string;
  details: string | null;
  createdAt: string;
  reporter: { fullName: string; role: string };
  message: { body: string; sender: { fullName: string; role: string } } | null;
  conversation: {
    campaign: { title: string; brand: { name: string } };
    creatorProfile: { user: { fullName: string } };
  };
};

const reasons: Record<string, string> = {
  SPAM: "رسائل مزعجة",
  HARASSMENT: "مضايقة",
  HATE: "خطاب كراهية",
  MISINFORMATION: "معلومات مضللة",
  COPYRIGHT: "حقوق ملكية",
  OTHER: "سبب آخر",
};

export function ConversationReportsClient({ initialItems }: { initialItems: Report[] }) {
  const { showToast } = useToast();
  const [items, setItems] = useState(initialItems);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  async function review(id: string, decision: "DISMISS" | "ACTION") {
    if (note.trim().length < 3) return showToast("اكتب ملاحظة قرار واضحة", "error");
    setBusy(true);
    try {
      const response = await fetch(`/api/v1/admin/conversation-reports/${id}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision, reviewNote: note }),
      });
      const json = await response.json();
      if (!response.ok)
        return showToast(json.error?.message ?? "تعذر حفظ القرار", "error");
      setItems((current) => current.filter((item) => item.id !== id));
      setSelectedId(null);
      setNote("");
      showToast(
        decision === "ACTION" ? "تم توثيق البلاغ وإزالة الرسالة" : "تم رفض البلاغ",
        "success",
      );
    } finally {
      setBusy(false);
    }
  }

  if (items.length === 0)
    return (
      <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-12 text-center">
        <MessageIcon className="mx-auto text-[var(--color-text-muted)]" size={42} />
        <h2 className="mt-4 text-xl font-bold">لا توجد بلاغات رسائل مفتوحة</h2>
        <p className="mt-2 text-[var(--color-text-muted)]">
          كل بلاغات المراسلة تمت مراجعتها.
        </p>
      </div>
    );
  return (
    <div className="space-y-4">
      {items.map((item) => (
        <article
          key={item.id}
          className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-sm)]"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full bg-[var(--color-surface-muted)] px-3 py-1 text-sm font-bold">
                <FlagIcon size={15} />
                {reasons[item.reason] ?? item.reason}
              </span>
              <h2 className="mt-3 text-lg font-bold">
                {item.conversation.campaign.title}
              </h2>
              <p className="text-sm text-[var(--color-text-secondary)]">
                {item.conversation.campaign.brand.name} ↔{" "}
                {item.conversation.creatorProfile.user.fullName}
              </p>
            </div>
            <time className="text-xs text-[var(--color-text-muted)]">
              {new Date(item.createdAt).toLocaleString("ar-IQ", {
                numberingSystem: "latn",
              })}
            </time>
          </div>
          <div className="mt-4 rounded-[var(--radius-md)] bg-[var(--color-surface-muted)] p-4">
            <p className="text-xs text-[var(--color-text-muted)]">
              الرسالة من {item.message?.sender.fullName ?? "غير متاحة"}
            </p>
            <p className="mt-2 whitespace-pre-wrap font-medium">
              {item.message?.body ?? "تم حذف الرسالة أو لم يحدد المبلّغ رسالة بعينها."}
            </p>
          </div>
          <p className="mt-3 text-sm">
            <strong>المبلّغ:</strong> {item.reporter.fullName}
          </p>
          {item.details && (
            <p className="mt-2 text-sm">
              <strong>التفاصيل:</strong> {item.details}
            </p>
          )}
          {selectedId === item.id ? (
            <div className="mt-4 space-y-3 border-t border-[var(--color-border)] pt-4">
              <textarea
                value={note}
                onChange={(event) => setNote(event.target.value)}
                placeholder="ملاحظة قرار المراجعة"
                className="min-h-24 w-full rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3"
              />
              <div className="flex flex-wrap gap-2">
                <button
                  disabled={busy}
                  onClick={() => review(item.id, "ACTION")}
                  className="rounded-[var(--radius-sm)] bg-[var(--color-text)] px-4 py-2 text-sm font-bold text-[var(--color-bg)]"
                >
                  تأكيد وإزالة الرسالة
                </button>
                <button
                  disabled={busy}
                  onClick={() => review(item.id, "DISMISS")}
                  className="rounded-[var(--radius-sm)] border border-[var(--color-border)] px-4 py-2 text-sm font-bold"
                >
                  رفض البلاغ
                </button>
                <button
                  onClick={() => setSelectedId(null)}
                  className="px-3 py-2 text-sm underline"
                >
                  إلغاء
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setSelectedId(item.id)}
              className="mt-4 rounded-[var(--radius-sm)] bg-[var(--color-brand)] px-4 py-2 text-sm font-bold text-[var(--color-text-on-brand)]"
            >
              مراجعة البلاغ
            </button>
          )}
        </article>
      ))}
    </div>
  );
}
