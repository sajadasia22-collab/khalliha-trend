"use client";

/* eslint-disable @next/next/no-img-element -- portfolio media comes from the configured Supabase bucket; avoid an open image proxy. */

import { useEffect, useState } from "react";
import { Platform } from "../../generated/prisma/enums";
import { platformIcons, platformLabels } from "../../lib/campaigns";
import {
  ArrowUpRightIcon,
  BriefcaseIcon,
  ChevronDownIcon,
  PlusIcon,
  TrashIcon,
  UploadIcon,
} from "../ui/icons";
import { Button } from "../ui/button";
import { Modal } from "../ui/Modal";
import { useToast } from "../ui/Toast";

type PortfolioItem = {
  id: string;
  title: string;
  description: string | null;
  platform: Platform;
  projectUrl: string;
  thumbnailUrl: string | null;
  sortOrder: number;
};

function apiMessage(data: unknown, fallback: string) {
  if (
    typeof data === "object" &&
    data !== null &&
    "error" in data &&
    typeof data.error === "object" &&
    data.error !== null &&
    "message" in data.error &&
    typeof data.error.message === "string"
  ) {
    return data.error.message;
  }
  return fallback;
}

export function PortfolioManager({
  initialItems,
  onItemsChange,
}: {
  initialItems: PortfolioItem[];
  // يُعلم الحاوية (مثل شبكة الأعمال في ترويسة الملف) بكل تغيير على العناصر.
  onItemsChange?: (items: PortfolioItem[]) => void;
}) {
  const { showToast } = useToast();
  const [items, setItems] = useState(initialItems);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    onItemsChange?.(items);
  }, [items, onItemsChange]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [platform, setPlatform] = useState<Platform>(Platform.TIKTOK);
  const [projectUrl, setProjectUrl] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadingItemId, setUploadingItemId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setPlatform(Platform.TIKTOK);
    setProjectUrl("");
    setImageFile(null);
    setError("");
  };

  const closeModal = () => {
    setModalOpen(false);
    resetForm();
  };

  const uploadThumbnail = async (itemId: string, file: File) => {
    const formData = new FormData();
    formData.set("file", file);
    const response = await fetch(`/api/v1/creator/portfolio/${itemId}/image`, {
      method: "POST",
      body: formData,
    });
    const data = await response.json();
    if (!response.ok) throw new Error(apiMessage(data, "فشل رفع صورة العمل."));
    return data.data.url as string;
  };

  const handleAdd = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/v1/creator/portfolio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description, platform, projectUrl }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(apiMessage(data, "فشل إضافة العمل."));
        return;
      }

      let created = data.data as PortfolioItem;
      if (imageFile) {
        try {
          const thumbnailUrl = await uploadThumbnail(created.id, imageFile);
          created = { ...created, thumbnailUrl };
        } catch (uploadError) {
          showToast(
            uploadError instanceof Error
              ? `أُضيف العمل، لكن ${uploadError.message}`
              : "أُضيف العمل، لكن تعذّر رفع صورته.",
            "info",
          );
        }
      }

      setItems((current) => [...current, created]);
      showToast("تمت إضافة العمل إلى معرضك.", "success");
      closeModal();
    } catch {
      setError("حدث خطأ في الاتصال بالسيرفر.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleExistingImage = async (itemId: string, file: File | undefined) => {
    if (!file) return;
    setUploadingItemId(itemId);
    try {
      const thumbnailUrl = await uploadThumbnail(itemId, file);
      setItems((current) =>
        current.map((item) => (item.id === itemId ? { ...item, thumbnailUrl } : item)),
      );
      showToast("تم تحديث صورة العمل.", "success");
    } catch (uploadError) {
      showToast(
        uploadError instanceof Error ? uploadError.message : "فشل رفع صورة العمل.",
        "error",
      );
    } finally {
      setUploadingItemId(null);
    }
  };

  const handleDelete = async (itemId: string) => {
    const response = await fetch(`/api/v1/creator/portfolio/${itemId}`, {
      method: "DELETE",
    });
    if (!response.ok) {
      showToast("تعذّر حذف العمل.", "error");
      return;
    }
    setItems((current) => current.filter((item) => item.id !== itemId));
    showToast("تم حذف العمل من المعرض.", "info");
  };

  const moveItem = async (index: number, direction: -1 | 1) => {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= items.length) return;
    const previous = [...items];
    const reordered = [...items];
    [reordered[index], reordered[nextIndex]] = [reordered[nextIndex], reordered[index]];
    setItems(reordered);

    const response = await fetch("/api/v1/creator/portfolio/reorder", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itemIds: reordered.map((item) => item.id) }),
    });
    if (!response.ok) {
      setItems(previous);
      showToast("تعذّر حفظ ترتيب الأعمال.", "error");
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-[var(--color-text-secondary)]">
            اختر أفضل أعمالك حتى تتعرف العلامات التجارية على أسلوبك قبل دعوتك.
          </p>
          <p className="mt-1 text-xs font-bold text-[var(--color-text-muted)]">
            {items.length}/12 عمل
          </p>
        </div>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => setModalOpen(true)}
          disabled={items.length >= 12}
        >
          <PlusIcon size={16} strokeWidth={2.2} aria-hidden="true" />
          إضافة عمل
        </Button>
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-[var(--radius-lg)] border border-dashed border-[var(--color-border-strong)] bg-[var(--color-surface-muted)] px-6 py-12 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-brand)] text-[var(--color-text-on-brand)]">
            <BriefcaseIcon aria-hidden="true" />
          </span>
          <p className="font-black">معرضك ينتظر أول عمل</p>
          <p className="max-w-md text-xs leading-6 text-[var(--color-text-secondary)]">
            أضف رابط فيديو أو منشور حقيقي، مع عنوان وصورة توضّح الفكرة للعلامة التجارية.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {items.map((item, index) => {
            const PlatformIcon = platformIcons[item.platform];
            return (
              <article
                key={item.id}
                className="group overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] transition hover:-translate-y-1 hover:border-[var(--color-brand)] hover:shadow-[var(--shadow-md)]"
              >
                <div className="relative aspect-[16/10] overflow-hidden bg-[var(--color-surface-dark)]">
                  {item.thumbnailUrl ? (
                    <img
                      src={item.thumbnailUrl}
                      alt={`صورة عمل: ${item.title}`}
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                    />
                  ) : (
                    <div className="flex h-full flex-col items-center justify-center gap-3 bg-[radial-gradient(circle_at_25%_20%,rgba(214,246,29,.35),transparent_28%),linear-gradient(135deg,var(--forest-700),var(--forest-900))] text-[var(--color-text-on-dark)]">
                      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-surface)] text-[var(--color-text)]">
                        <PlatformIcon />
                      </span>
                      <span className="text-xs font-black">
                        {platformLabels[item.platform]}
                      </span>
                    </div>
                  )}
                  <label className="absolute bottom-3 left-3 inline-flex cursor-pointer items-center gap-1.5 rounded-[var(--radius-pill)] bg-[rgba(6,38,25,.84)] px-3 py-2 text-[10px] font-black text-[var(--color-text-on-dark)] backdrop-blur-md">
                    <UploadIcon size={14} aria-hidden="true" />
                    {uploadingItemId === item.id ? "جاري الرفع..." : "تغيير الصورة"}
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="sr-only"
                      disabled={Boolean(uploadingItemId)}
                      onChange={(event) =>
                        handleExistingImage(item.id, event.target.files?.[0])
                      }
                    />
                  </label>
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[10px] font-black text-[var(--color-brand-active)]">
                        {platformLabels[item.platform]}
                      </p>
                      <h3 className="mt-1 truncate font-black">{item.title}</h3>
                    </div>
                    <a
                      href={item.projectUrl}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={`فتح عمل ${item.title}`}
                      className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-[var(--color-surface-muted)] transition hover:bg-[var(--color-brand)]"
                    >
                      <ArrowUpRightIcon size={16} aria-hidden="true" />
                    </a>
                  </div>
                  {item.description && (
                    <p className="mt-2 line-clamp-2 text-xs leading-5 text-[var(--color-text-secondary)]">
                      {item.description}
                    </p>
                  )}
                  <div className="mt-4 flex items-center justify-between border-t border-[var(--color-border)] pt-3">
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => moveItem(index, -1)}
                        disabled={index === 0}
                        className="rounded-[var(--radius-sm)] px-2 py-1 text-[10px] font-bold hover:bg-[var(--color-surface-muted)] disabled:opacity-30"
                      >
                        للأعلى
                      </button>
                      <button
                        type="button"
                        onClick={() => moveItem(index, 1)}
                        disabled={index === items.length - 1}
                        className="rounded-[var(--radius-sm)] px-2 py-1 text-[10px] font-bold hover:bg-[var(--color-surface-muted)] disabled:opacity-30"
                      >
                        للأسفل
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDelete(item.id)}
                      aria-label={`حذف عمل ${item.title}`}
                      className="text-[var(--color-text-muted)] transition hover:text-[var(--color-text)]"
                    >
                      <TrashIcon size={17} aria-hidden="true" />
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <Modal open={modalOpen} onClose={closeModal} title="أضف عملاً يعبّر عنك">
        <form onSubmit={handleAdd} className="space-y-4">
          {error && (
            <p role="alert" className="text-sm font-bold text-[var(--color-text)]">
              {error}
            </p>
          )}
          <div>
            <label htmlFor="portfolio-title" className="mb-1.5 block text-xs font-bold">
              عنوان العمل
            </label>
            <input
              id="portfolio-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              maxLength={100}
              placeholder="مثال: تجربة مطعم عراقي جديد"
              className="input-field"
              disabled={isLoading}
              required
            />
          </div>
          <div>
            <label
              htmlFor="portfolio-platform"
              className="mb-1.5 block text-xs font-bold"
            >
              المنصة
            </label>
            <div className="select-field-wrap">
              <select
                id="portfolio-platform"
                value={platform}
                onChange={(event) => setPlatform(event.target.value as Platform)}
                className="select-field"
                disabled={isLoading}
              >
                {Object.entries(platformLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
              <ChevronDownIcon
                className="select-field-chevron"
                size={16}
                aria-hidden="true"
              />
            </div>
          </div>
          <div>
            <label htmlFor="portfolio-url" className="mb-1.5 block text-xs font-bold">
              رابط المنشور المباشر
            </label>
            <input
              id="portfolio-url"
              type="url"
              value={projectUrl}
              onChange={(event) => setProjectUrl(event.target.value)}
              placeholder="https://..."
              className="input-field"
              dir="ltr"
              disabled={isLoading}
              required
            />
          </div>
          <div>
            <label
              htmlFor="portfolio-description"
              className="mb-1.5 block text-xs font-bold"
            >
              وصف مختصر (اختياري)
            </label>
            <textarea
              id="portfolio-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={3}
              maxLength={500}
              className="input-field py-3"
              disabled={isLoading}
            />
          </div>
          <div>
            <label htmlFor="portfolio-image" className="mb-1.5 block text-xs font-bold">
              صورة غلاف العمل (اختيارية)
            </label>
            <input
              id="portfolio-image"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(event) => setImageFile(event.target.files?.[0] ?? null)}
              className="block w-full rounded-[var(--radius-md)] border border-dashed border-[var(--color-border-strong)] bg-[var(--color-surface-muted)] p-3 text-xs file:ml-3 file:rounded-[var(--radius-pill)] file:border-0 file:bg-[var(--color-brand)] file:px-3 file:py-2 file:font-black file:text-[var(--color-text-on-brand)]"
              disabled={isLoading}
            />
          </div>
          <Button type="submit" loading={isLoading} className="w-full justify-center">
            إضافة إلى المعرض
          </Button>
        </form>
      </Modal>
    </div>
  );
}
