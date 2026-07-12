"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { categoryLabels, platformLabels } from "../../lib/campaigns";

type RateRow = {
  platform: keyof typeof platformLabels;
  cpmMinorUnits: string;
  minimumQualifiedViews: string;
  maximumReward: string;
};

type AssetRow = { url: string; label: string };

type InitialValues = {
  title: string;
  summary: string;
  terms: string;
  category: keyof typeof categoryLabels;
  thumbnailUrl: string;
  currency: "IQD" | "USD";
  totalBudget: string;
  minTrustScore: number;
  startsAt: string;
  endsAt: string;
  rates: RateRow[];
  assets: AssetRow[];
};

const emptyRate: RateRow = {
  platform: "TIKTOK",
  cpmMinorUnits: "",
  minimumQualifiedViews: "0",
  maximumReward: "",
};

export function CampaignForm({
  mode,
  campaignId,
  initialValues,
}: {
  mode: "create" | "edit";
  campaignId?: string;
  initialValues?: InitialValues;
}) {
  const router = useRouter();
  const [title, setTitle] = useState(initialValues?.title ?? "");
  const [summary, setSummary] = useState(initialValues?.summary ?? "");
  const [terms, setTerms] = useState(initialValues?.terms ?? "");
  const [category, setCategory] = useState<keyof typeof categoryLabels>(
    initialValues?.category ?? "OTHER",
  );
  const [thumbnailUrl, setThumbnailUrl] = useState(initialValues?.thumbnailUrl ?? "");
  const [currency, setCurrency] = useState<"IQD" | "USD">(
    initialValues?.currency ?? "IQD",
  );
  const [totalBudget, setTotalBudget] = useState(initialValues?.totalBudget ?? "");
  const [minTrustScore, setMinTrustScore] = useState(initialValues?.minTrustScore ?? 0);
  const [startsAt, setStartsAt] = useState(initialValues?.startsAt ?? "");
  const [endsAt, setEndsAt] = useState(initialValues?.endsAt ?? "");
  const [rates, setRates] = useState<RateRow[]>(initialValues?.rates ?? [emptyRate]);
  const [assets, setAssets] = useState<AssetRow[]>(initialValues?.assets ?? []);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const updateRate = (index: number, patch: Partial<RateRow>) => {
    setRates((current) =>
      current.map((rate, i) => (i === index ? { ...rate, ...patch } : rate)),
    );
  };

  const updateAsset = (index: number, patch: Partial<AssetRow>) => {
    setAssets((current) =>
      current.map((asset, i) => (i === index ? { ...asset, ...patch } : asset)),
    );
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setFieldErrors({});
    setIsLoading(true);

    const payload = {
      title,
      summary,
      terms,
      category,
      thumbnailUrl: thumbnailUrl || undefined,
      currency,
      totalBudget,
      minTrustScore,
      startsAt: startsAt || undefined,
      endsAt: endsAt || undefined,
      rates,
      assets: assets.filter((asset) => asset.url && asset.label),
    };

    try {
      const url =
        mode === "create"
          ? "/api/v1/brand/campaigns"
          : `/api/v1/brand/campaigns/${campaignId}`;
      const response = await fetch(url, {
        method: mode === "create" ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error?.message || "فشل حفظ الحملة.");
        if (data.error?.details) {
          const flattened: Record<string, string> = {};
          for (const [key, value] of Object.entries(
            data.error.details as Record<string, string[]>,
          )) {
            flattened[key] = value[0];
          }
          setFieldErrors(flattened);
        }
        return;
      }

      router.push(`/brand/campaigns/${data.data.id}`);
      router.refresh();
    } catch {
      setError("حدث خطأ في الاتصال بالسيرفر.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {error && (
        <div
          role="alert"
          className="rounded-[var(--radius-sm)] border-r-4 border-[var(--color-brand-active)] bg-[rgba(6,38,25,0.05)] p-4 text-sm font-semibold text-[var(--forest-800)]"
        >
          {error}
        </div>
      )}

      <div className="space-y-5">
        <h2 className="text-lg font-extrabold text-[var(--color-text)]">تفاصيل الحملة</h2>

        <div>
          <label htmlFor="title" className="mb-2 block text-sm font-bold">
            عنوان الحملة
          </label>
          <input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            aria-invalid={Boolean(fieldErrors.title)}
            aria-describedby={fieldErrors.title ? "title-error" : undefined}
            className="min-h-[48px] w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 focus:border-[var(--color-brand)] focus:outline-none focus:ring-4 focus:ring-[rgba(214,246,29,0.18)]"
            disabled={isLoading}
          />
          {fieldErrors.title && (
            <p
              id="title-error"
              role="alert"
              className="mt-1.5 text-xs font-bold text-[var(--forest-800)]"
            >
              {fieldErrors.title}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="summary" className="mb-2 block text-sm font-bold">
            الملخص
          </label>
          <textarea
            id="summary"
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            rows={3}
            aria-invalid={Boolean(fieldErrors.summary)}
            aria-describedby={fieldErrors.summary ? "summary-error" : undefined}
            className="w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 focus:border-[var(--color-brand)] focus:outline-none focus:ring-4 focus:ring-[rgba(214,246,29,0.18)]"
            disabled={isLoading}
          />
          {fieldErrors.summary && (
            <p
              id="summary-error"
              role="alert"
              className="mt-1.5 text-xs font-bold text-[var(--forest-800)]"
            >
              {fieldErrors.summary}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="terms" className="mb-2 block text-sm font-bold">
            شروط الحملة (ستُحفظ نسخة منها عند انضمام كل صانع محتوى)
          </label>
          <textarea
            id="terms"
            value={terms}
            onChange={(e) => setTerms(e.target.value)}
            rows={5}
            aria-invalid={Boolean(fieldErrors.terms)}
            aria-describedby={fieldErrors.terms ? "terms-error" : undefined}
            className="w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 focus:border-[var(--color-brand)] focus:outline-none focus:ring-4 focus:ring-[rgba(214,246,29,0.18)]"
            disabled={isLoading}
          />
          {fieldErrors.terms && (
            <p
              id="terms-error"
              role="alert"
              className="mt-1.5 text-xs font-bold text-[var(--forest-800)]"
            >
              {fieldErrors.terms}
            </p>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="category" className="mb-2 block text-sm font-bold">
              فئة الحملة
            </label>
            <div className="select-field-wrap">
              <select
                id="category"
                value={category}
                onChange={(e) =>
                  setCategory(e.target.value as keyof typeof categoryLabels)
                }
                className="select-field"
                disabled={isLoading}
              >
                {Object.entries(categoryLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                aria-hidden="true"
                className="select-field-chevron"
              >
                <path
                  d="M4 6l4 4 4-4"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>
          <div>
            <label htmlFor="thumbnailUrl" className="mb-2 block text-sm font-bold">
              رابط الصورة المصغّرة (اختياري)
            </label>
            <input
              id="thumbnailUrl"
              value={thumbnailUrl}
              onChange={(e) => setThumbnailUrl(e.target.value)}
              placeholder="https://..."
              dir="ltr"
              aria-invalid={Boolean(fieldErrors.thumbnailUrl)}
              aria-describedby={
                fieldErrors.thumbnailUrl ? "thumbnailUrl-error" : undefined
              }
              className="min-h-[48px] w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 text-sm"
              disabled={isLoading}
            />
            {fieldErrors.thumbnailUrl && (
              <p
                id="thumbnailUrl-error"
                role="alert"
                className="mt-1.5 text-xs font-bold text-[var(--forest-800)]"
              >
                {fieldErrors.thumbnailUrl}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-5">
        <h2 className="text-lg font-extrabold text-[var(--color-text)]">
          الميزانية والأهلية
        </h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label htmlFor="currency" className="mb-2 block text-sm font-bold">
              العملة
            </label>
            <div className="select-field-wrap">
              <select
                id="currency"
                value={currency}
                onChange={(e) => setCurrency(e.target.value as "IQD" | "USD")}
                className="select-field"
                disabled={isLoading}
              >
                <option value="IQD">IQD</option>
                <option value="USD">USD</option>
              </select>
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                aria-hidden="true"
                className="select-field-chevron"
              >
                <path
                  d="M4 6l4 4 4-4"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>
          <div>
            <label htmlFor="totalBudget" className="mb-2 block text-sm font-bold">
              الميزانية الكلية المُعلنة
            </label>
            <input
              id="totalBudget"
              inputMode="numeric"
              value={totalBudget}
              onChange={(e) => setTotalBudget(e.target.value.replace(/[^0-9]/g, ""))}
              aria-invalid={Boolean(fieldErrors.totalBudget)}
              aria-describedby={fieldErrors.totalBudget ? "totalBudget-error" : undefined}
              className="min-h-[48px] w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4"
              disabled={isLoading}
            />
            {fieldErrors.totalBudget && (
              <p
                id="totalBudget-error"
                role="alert"
                className="mt-1.5 text-xs font-bold text-[var(--forest-800)]"
              >
                {fieldErrors.totalBudget}
              </p>
            )}
          </div>
          <div>
            <label htmlFor="minTrustScore" className="mb-2 block text-sm font-bold">
              الحد الأدنى لـ Trust Score
            </label>
            <input
              id="minTrustScore"
              type="number"
              min={0}
              max={100}
              value={minTrustScore}
              onChange={(e) => setMinTrustScore(Number(e.target.value))}
              className="min-h-[48px] w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4"
              disabled={isLoading}
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="startsAt" className="mb-2 block text-sm font-bold">
              تاريخ البدء (اختياري)
            </label>
            <input
              id="startsAt"
              type="date"
              value={startsAt}
              onChange={(e) => setStartsAt(e.target.value)}
              className="min-h-[48px] w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4"
              disabled={isLoading}
            />
          </div>
          <div>
            <label htmlFor="endsAt" className="mb-2 block text-sm font-bold">
              تاريخ الانتهاء (اختياري)
            </label>
            <input
              id="endsAt"
              type="date"
              value={endsAt}
              onChange={(e) => setEndsAt(e.target.value)}
              className="min-h-[48px] w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4"
              disabled={isLoading}
            />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-extrabold text-[var(--color-text)]">
            أسعار المنصات
          </h2>
          <button
            type="button"
            onClick={() => setRates((current) => [...current, emptyRate])}
            className="btn-secondary px-4 py-2 text-xs"
          >
            + إضافة منصة
          </button>
        </div>
        {fieldErrors.rates && (
          <p role="alert" className="text-xs font-bold text-[var(--forest-800)]">
            {fieldErrors.rates}
          </p>
        )}
        {rates.map((rate, index) => (
          <div
            key={index}
            className="grid gap-3 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 sm:grid-cols-[1fr_1fr_1fr_1fr_auto]"
          >
            <div className="select-field-wrap">
              <select
                value={rate.platform}
                onChange={(e) =>
                  updateRate(index, { platform: e.target.value as RateRow["platform"] })
                }
                className="select-field select-field--compact"
                disabled={isLoading}
              >
                {Object.entries(platformLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                aria-hidden="true"
                className="select-field-chevron"
              >
                <path
                  d="M4 6l4 4 4-4"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <input
              value={rate.cpmMinorUnits}
              onChange={(e) =>
                updateRate(index, {
                  cpmMinorUnits: e.target.value.replace(/[^0-9]/g, ""),
                })
              }
              placeholder="CPM"
              className="min-h-[44px] rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] px-2 text-sm"
              disabled={isLoading}
            />
            <input
              value={rate.minimumQualifiedViews}
              onChange={(e) =>
                updateRate(index, {
                  minimumQualifiedViews: e.target.value.replace(/[^0-9]/g, ""),
                })
              }
              placeholder="أدنى مشاهدات"
              className="min-h-[44px] rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] px-2 text-sm"
              disabled={isLoading}
            />
            <input
              value={rate.maximumReward}
              onChange={(e) =>
                updateRate(index, {
                  maximumReward: e.target.value.replace(/[^0-9]/g, ""),
                })
              }
              placeholder="أقصى ربح للفيديو"
              className="min-h-[44px] rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] px-2 text-sm"
              disabled={isLoading}
            />
            <button
              type="button"
              onClick={() => setRates((current) => current.filter((_, i) => i !== index))}
              disabled={rates.length === 1 || isLoading}
              className="text-xs font-bold text-[var(--color-text-secondary)] hover:text-[var(--forest-800)] disabled:opacity-30"
            >
              حذف
            </button>
          </div>
        ))}
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-extrabold text-[var(--color-text)]">
            أصول الحملة (روابط)
          </h2>
          <button
            type="button"
            onClick={() => setAssets((current) => [...current, { url: "", label: "" }])}
            className="btn-secondary px-4 py-2 text-xs"
          >
            + إضافة رابط
          </button>
        </div>
        {assets.map((asset, index) => (
          <div key={index} className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
            <input
              value={asset.label}
              onChange={(e) => updateAsset(index, { label: e.target.value })}
              placeholder="عنوان الأصل"
              className="min-h-[44px] rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm"
              disabled={isLoading}
            />
            <input
              value={asset.url}
              onChange={(e) => updateAsset(index, { url: e.target.value })}
              placeholder="https://..."
              dir="ltr"
              className="min-h-[44px] rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm"
              disabled={isLoading}
            />
            <button
              type="button"
              onClick={() =>
                setAssets((current) => current.filter((_, i) => i !== index))
              }
              className="text-xs font-bold text-[var(--color-text-secondary)] hover:text-[var(--forest-800)]"
              disabled={isLoading}
            >
              حذف
            </button>
          </div>
        ))}
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="btn-primary px-6 py-3 text-sm"
      >
        {isLoading ? "جاري الحفظ..." : mode === "create" ? "حفظ كمسودة" : "حفظ التعديلات"}
      </button>
    </form>
  );
}
