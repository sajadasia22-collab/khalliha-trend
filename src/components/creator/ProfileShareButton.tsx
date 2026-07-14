"use client";

import { ShareIcon } from "../ui/icons";
import { useToast } from "../ui/Toast";

export function ProfileShareButton({ fullName }: { fullName: string }) {
  const { showToast } = useToast();

  async function share() {
    const data = {
      title: `${fullName} — خلّيها ترند`,
      text: `شاهد الملف المهني لـ ${fullName} على خلّيها ترند`,
      url: window.location.href,
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
