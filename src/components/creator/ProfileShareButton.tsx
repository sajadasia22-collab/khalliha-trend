"use client";

import { ShareIcon } from "../ui/icons";
import { useToast } from "../ui/Toast";

export function ProfileShareButton({
  fullName,
  url,
  iconOnly = false,
}: {
  fullName: string;
  // مسار الصفحة العامة إن وجد؛ الافتراضي رابط الصفحة الحالية.
  url?: string;
  iconOnly?: boolean;
}) {
  const { showToast } = useToast();

  async function share() {
    const data = {
      title: `${fullName} — خلّيها ترند`,
      text: `شاهد الملف المهني لـ ${fullName} على خلّيها ترند`,
      url: url ? new URL(url, window.location.origin).href : window.location.href,
    };
    try {
      if (navigator.share) await navigator.share(data);
      else {
        await navigator.clipboard.writeText(data.url);
        showToast("تم نسخ رابط الملف.", "success");
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      showToast("تعذّرت مشاركة الرابط.", "error");
    }
  }

  if (iconOnly) {
    return (
      <button
        type="button"
        onClick={share}
        title="مشاركة الملف"
        className="inline-flex min-h-11 w-11 items-center justify-center rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] transition-colors hover:border-[var(--forest-200)]"
      >
        <ShareIcon size={17} aria-hidden="true" />
        <span className="sr-only">مشاركة الملف</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={share}
      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[var(--radius-pill)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 text-sm font-black shadow-[var(--shadow-sm)] transition hover:border-[var(--color-brand)]"
    >
      <ShareIcon size={17} /> مشاركة
    </button>
  );
}
