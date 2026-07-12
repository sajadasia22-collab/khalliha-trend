"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { categoryLabels, platformLabels, detectAssetSource } from "../../lib/campaigns";
import { useToast } from "../ui/Toast";
import { Button } from "../ui/button";
import {
  DeviceUploadIcon,
  GoogleDriveIcon,
  DropboxIcon,
  OneDriveIcon,
} from "../ui/icons";
import { PlatformSelect } from "./PlatformSelect";

type PlatformValue = keyof typeof platformLabels;

type RateRow = {
  platforms: PlatformValue[];
  cpmMinorUnits: string;
  minimumQualifiedViews: string;
  maximumReward: string;
};

/** Shape the API expects/returns: one entry per platform (DB is unique on [campaignId, platform]). */
type InitialRateRow = {
  platform: PlatformValue;
  cpmMinorUnits: string;
  minimumQualifiedViews: string;
  maximumReward: string;
};

type AssetRow = {
  id: string;
  type: "upload" | "google_drive" | "dropbox" | "onedrive";
  url: string;
  label: string;
  fileName?: string;
  fileSize?: number;
  uploadProgress?: number;
};

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
  rates: InitialRateRow[];
  assets: { url: string; label: string }[];
};

const emptyRate: RateRow = {
  platforms: [],
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
  const { showToast } = useToast();
  const [focusedField, setFocusedField] = useState<string | null>(null);
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
  const [rates, setRates] = useState<RateRow[]>(
    initialValues?.rates
      ? initialValues.rates.map((rate) => ({
          platforms: [rate.platform],
          cpmMinorUnits: rate.cpmMinorUnits,
          minimumQualifiedViews: rate.minimumQualifiedViews,
          maximumReward: rate.maximumReward,
        }))
      : [emptyRate],
  );
  const [assets, setAssets] = useState<AssetRow[]>(() => {
    if (!initialValues?.assets) return [];
    return initialValues.assets.map((asset, i) => {
      const type = detectAssetSource(asset.url);
      return {
        id: `initial-${i}-${Date.now()}`,
        type,
        url: asset.url,
        label: asset.label,
        fileName:
          type === "upload"
            ? decodeURIComponent(asset.url.split("/").pop() || "")
            : undefined,
        uploadProgress: type === "upload" ? 100 : undefined,
      };
    });
  });
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

    if (rates.some((rate) => rate.platforms.length === 0)) {
      setFieldErrors({ rates: "اختر منصة واحدة على الأقل لكل سعر" });
      return;
    }
    const seenPlatforms = new Set<PlatformValue>();
    for (const rate of rates) {
      for (const platform of rate.platforms) {
        if (seenPlatforms.has(platform)) {
          setFieldErrors({
            rates: `تم اختيار منصة ${platformLabels[platform]} في أكثر من سعر`,
          });
          return;
        }
        seenPlatforms.add(platform);
      }
    }

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
      rates: rates.flatMap((rate) =>
        rate.platforms.map((platform) => ({
          platform,
          cpmMinorUnits: rate.cpmMinorUnits,
          minimumQualifiedViews: rate.minimumQualifiedViews,
          maximumReward: rate.maximumReward,
        })),
      ),
      assets: assets
        .filter((asset) => asset.url && asset.label)
        .map((a) => ({ url: a.url, label: a.label })),
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
          className="rounded-[var(--radius-md)] border-r-4 border-red-500 bg-red-500/5 p-4 text-sm font-semibold text-red-400"
        >
          {error}
        </div>
      )}

      {/* Card 1: Core Details */}
      <div className="bg-[rgba(250,252,251,0.01)] border border-[var(--color-border)] p-6 rounded-[var(--radius-xl)] space-y-6">
        <div className="border-b border-[rgba(200,214,206,0.06)] pb-3">
          <h2 className="text-xs font-black text-[var(--color-brand)] bg-[var(--color-surface-dark)] px-4 py-1.5 rounded-[var(--radius-sm)] inline-block shadow-[var(--shadow-brand)]">
            بيانات الحملة الأساسية
          </h2>
        </div>

        <div className="space-y-5">
          <div>
            <label
              htmlFor="title"
              className="mb-1 block text-xs font-bold text-[var(--color-text-secondary)]"
            >
              عنوان الحملة
            </label>
            <span className="block text-[10px] text-[var(--color-text-muted)] mb-2">
              العنوان الجذاب الذي يظهر لصناع المحتوى في قائمة الحملات.
            </span>
            <input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              aria-invalid={Boolean(fieldErrors.title)}
              aria-describedby={fieldErrors.title ? "title-error" : undefined}
              className="min-h-[48px] w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 focus:border-[var(--color-brand)] focus:outline-none focus:ring-4 focus:ring-[rgba(214,246,29,0.18)] text-sm font-medium"
              disabled={isLoading}
              placeholder="مثال: مراجعة منتج SA Studio الجديد"
            />
            {fieldErrors.title && (
              <p
                id="title-error"
                role="alert"
                className="mt-1.5 text-xs font-bold text-red-400"
              >
                {fieldErrors.title}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="summary"
              className="mb-1 block text-xs font-bold text-[var(--color-text-secondary)]"
            >
              ملخص فكرة الحملة
            </label>
            <span className="block text-[10px] text-[var(--color-text-muted)] mb-2">
              وصف موجز يوضح طبيعة المنتج والفكرة المطلوبة من الفيديوهات.
            </span>
            <textarea
              id="summary"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              rows={3}
              aria-invalid={Boolean(fieldErrors.summary)}
              aria-describedby={fieldErrors.summary ? "summary-error" : undefined}
              className="w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 focus:border-[var(--color-brand)] focus:outline-none focus:ring-4 focus:ring-[rgba(214,246,29,0.18)] text-sm font-medium"
              disabled={isLoading}
              placeholder="مثال: يرجى تصوير فيديو ريلز يوضح تجربة فتح الصندوق للمنتج الجديد واستعراض مزاياه."
            />
            {fieldErrors.summary && (
              <p
                id="summary-error"
                role="alert"
                className="mt-1.5 text-xs font-bold text-red-400"
              >
                {fieldErrors.summary}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="terms"
              className="mb-1 block text-xs font-bold text-[var(--color-text-secondary)]"
            >
              شروط وأحكام الحملة
            </label>
            <span className="block text-[10px] text-[var(--color-text-muted)] mb-2">
              القواعد الملزمة لصانع المحتوى والتي يجب عليه الالتزام بها للحصول على
              مكافأته.
            </span>
            <textarea
              id="terms"
              value={terms}
              onChange={(e) => setTerms(e.target.value)}
              onFocus={() => setFocusedField("terms")}
              onBlur={() => setTimeout(() => setFocusedField(null), 250)}
              rows={5}
              aria-invalid={Boolean(fieldErrors.terms)}
              aria-describedby={fieldErrors.terms ? "terms-error" : undefined}
              className="w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 focus:border-[var(--color-brand)] focus:outline-none focus:ring-4 focus:ring-[rgba(214,246,29,0.18)] text-sm font-medium"
              disabled={isLoading}
              placeholder="اكتب شروط الحملة بالتفصيل هنا..."
            />
            {fieldErrors.terms && (
              <p
                id="terms-error"
                role="alert"
                className="mt-1.5 text-xs font-bold text-red-400"
              >
                {fieldErrors.terms}
              </p>
            )}
            {focusedField === "terms" && (
              <div className="mt-3 p-4 rounded-[var(--radius-md)] bg-[rgba(214,246,29,0.03)] border border-[rgba(214,246,29,0.15)] space-y-3">
                <span className="block text-[11px] font-black text-[var(--color-brand)]">
                  قوالب الشروط المقترحة للاستخدام المباشر:
                </span>
                <div className="grid gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => {
                      setTerms(`1. استعراض ميزات وشكل المنتج بوضوح في أول 5 ثوانٍ من الفيديو.
2. تقديم مراجعة صادقة وطبيعية تتناسب مع محتوى حسابك اليومي.
3. ذكر اسم العلامة التجارية بشكل مسموع واستخدام هاشتاقات الحملة الرسمية.
4. عدم حذف الفيديو أو إخفائه لمدة لا تقل عن 30 يوماً من النشر.`);
                      showToast("تم تطبيق قالب تيك توك بنجاح!", "success");
                    }}
                    className="text-xs text-right p-2.5 rounded bg-[var(--color-surface)] border border-[var(--color-border)] hover:border-[var(--color-brand)] text-[var(--color-text)] font-bold transition-all"
                  >
                    تطبيق قالب ترويج منتج (تيك توك)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setTerms(`1. تصوير جودة الطعام، الديكورات، وجودة الخدمة بدقة عالية (Reels).
2. الإشارة إلى الحساب الرسمي للمطعم (Tag) وتضمين الموقع الجغرافي.
3. توفير كود الخصم الممنوح للمتابعين في وصف الفيديو.
4. الالتزام بالنشر خلال أوقات الذروة (بين الساعة 6:00 مساءً إلى 9:00 مساءً).`);
                      showToast("تم تطبيق قالب انستغرام بنجاح!", "success");
                    }}
                    className="text-xs text-right p-2.5 rounded bg-[var(--color-surface)] border border-[var(--color-border)] hover:border-[var(--color-brand)] text-[var(--color-text)] font-bold transition-all"
                  >
                    تطبيق قالب مراجعة مطعم (انستغرام)
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="category"
                className="mb-2 block text-xs font-bold text-[var(--color-text-secondary)]"
              >
                تصنيف الحملة
              </label>
              <div className="select-field-wrap">
                <select
                  id="category"
                  value={category}
                  onChange={(e) =>
                    setCategory(e.target.value as keyof typeof categoryLabels)
                  }
                  className="select-field text-sm font-medium"
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
              <label
                htmlFor="thumbnailUrl"
                className="mb-2 block text-xs font-bold text-[var(--color-text-secondary)]"
              >
                رابط صورة الحملة المصغّرة (اختياري)
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
                className="min-h-[48px] w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 focus:border-[var(--color-brand)] focus:outline-none focus:ring-4 focus:ring-[rgba(214,246,29,0.18)] text-sm font-medium"
                disabled={isLoading}
              />
              {fieldErrors.thumbnailUrl && (
                <p
                  id="thumbnailUrl-error"
                  role="alert"
                  className="mt-1.5 text-xs font-bold text-red-400"
                >
                  {fieldErrors.thumbnailUrl}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Card 2: Budget & Eligibility */}
      <div className="bg-[rgba(250,252,251,0.01)] border border-[var(--color-border)] p-6 rounded-[var(--radius-xl)] space-y-6">
        <div className="border-b border-[rgba(200,214,206,0.06)] pb-3">
          <h2 className="text-xs font-black text-[var(--color-brand)] bg-[var(--color-surface-dark)] px-4 py-1.5 rounded-[var(--radius-sm)] inline-block shadow-[var(--shadow-brand)]">
            الميزانية المالية وأهلية الشركاء
          </h2>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label
              htmlFor="currency"
              className="mb-2 block text-xs font-bold text-[var(--color-text-secondary)]"
            >
              عملة الدفع
            </label>
            <div className="select-field-wrap">
              <select
                id="currency"
                value={currency}
                onChange={(e) => setCurrency(e.target.value as "IQD" | "USD")}
                className="select-field text-sm font-medium"
                disabled={isLoading}
              >
                <option value="IQD">IQD (دينار عراقي)</option>
                <option value="USD">USD (دولار أمريكي)</option>
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
            <label
              htmlFor="totalBudget"
              className="mb-2 block text-xs font-bold text-[var(--color-text-secondary)]"
            >
              الميزانية الكلية للحملة
            </label>
            <input
              id="totalBudget"
              inputMode="numeric"
              value={totalBudget}
              onChange={(e) => setTotalBudget(e.target.value.replace(/[^0-9]/g, ""))}
              onFocus={() => setFocusedField("totalBudget")}
              onBlur={() => setTimeout(() => setFocusedField(null), 250)}
              aria-invalid={Boolean(fieldErrors.totalBudget)}
              aria-describedby={fieldErrors.totalBudget ? "totalBudget-error" : undefined}
              className="min-h-[48px] w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 focus:border-[var(--color-brand)] focus:outline-none focus:ring-4 focus:ring-[rgba(214,246,29,0.18)] text-sm font-medium"
              disabled={isLoading}
              placeholder="ادخل الميزانية بالعملة المختارة"
            />
            {fieldErrors.totalBudget && (
              <p
                id="totalBudget-error"
                role="alert"
                className="mt-1.5 text-xs font-bold text-red-400"
              >
                {fieldErrors.totalBudget}
              </p>
            )}
            {focusedField === "totalBudget" && (
              <div className="mt-2.5 p-3.5 rounded-[var(--radius-md)] bg-[rgba(214,246,29,0.02)] border border-[rgba(214,246,29,0.1)] space-y-2">
                <span className="block text-[10px] font-black text-[var(--color-brand)]">
                  حاسبة تقدير الميزانية الكلية:
                </span>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="targetViewsEstimator"
                      className="block text-[8px] text-[var(--color-text-muted)] font-black mb-1"
                    >
                      المشاهدات المستهدفة الكلية
                    </label>
                    <input
                      id="targetViewsEstimator"
                      type="text"
                      placeholder="مثال: 100,000"
                      className="w-full rounded bg-[var(--color-surface)] border border-[var(--color-border)] px-2.5 py-1 text-[10px] text-[var(--color-text)] focus:border-[var(--color-brand)] focus:outline-none"
                      onChange={(e) => {
                        const val = parseInt(e.target.value.replace(/[^0-9]/g, "")) || 0;
                        const est = Math.round((val * 10000) / 1000);
                        setTotalBudget(est.toString());
                      }}
                    />
                    <span className="text-[7px] text-[var(--color-text-muted)] mt-0.5 block">
                      * يفترض CPM افتراضي بقيمة 10,000 د.ع
                    </span>
                  </div>
                  <div className="flex flex-col justify-center bg-[rgba(250,252,251,0.02)] p-2 rounded border border-[rgba(200,214,206,0.06)] text-center">
                    <span className="text-[7px] text-[var(--color-text-muted)] font-bold">
                      الميزانية المقترحة
                    </span>
                    <strong className="text-[11px] text-[var(--color-brand)] mt-1">
                      {parseInt(totalBudget || "0").toLocaleString("en-US")} {currency}
                    </strong>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div>
            <label
              htmlFor="minTrustScore"
              className="mb-2 block text-xs font-bold text-[var(--color-text-secondary)]"
            >
              الحد الأدنى لـ Trust Score
            </label>
            <input
              id="minTrustScore"
              type="number"
              min={0}
              max={100}
              value={minTrustScore}
              onChange={(e) => setMinTrustScore(Number(e.target.value))}
              onFocus={() => setFocusedField("minTrustScore")}
              onBlur={() => setTimeout(() => setFocusedField(null), 250)}
              className="min-h-[48px] w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 focus:border-[var(--color-brand)] focus:outline-none focus:ring-4 focus:ring-[rgba(214,246,29,0.18)] text-sm font-medium"
              disabled={isLoading}
            />
            {focusedField === "minTrustScore" && (
              <div className="mt-2.5 p-3.5 rounded-[var(--radius-md)] bg-[rgba(200,214,206,0.04)] border border-[var(--color-border)] space-y-2 text-[10px] text-[var(--color-text-secondary)] font-medium leading-relaxed">
                <span className="block font-bold text-[var(--color-brand)]">
                  دليلك لاختيار الحد الأدنى لنقاط الموثوقية المناسب:
                </span>
                <div className="space-y-1">
                  <p>
                    <strong className="text-yellow-400">80 فأكثر (ذهبي):</strong> صناع
                    محتوى ذوو تسليم موثوق 100% ونسب مشاهدات عالية جداً.
                  </p>
                  <p>
                    <strong className="text-blue-400">60 فأكثر (محترف):</strong> صناع
                    محتوى ذوو سجلات مقبولة ومنشورات موثقة نشطة.
                  </p>
                  <p>
                    <strong className="text-gray-400">
                      50 فأكثر (مبتدئ - الافتراضي):
                    </strong>{" "}
                    يتيح لجميع المنضمين الجدد المشاركة والانتشار السريع.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label
              htmlFor="startsAt"
              className="mb-2 block text-xs font-bold text-[var(--color-text-secondary)]"
            >
              تاريخ بدء نشر الحملة (اختياري)
            </label>
            <input
              id="startsAt"
              type="date"
              value={startsAt}
              onChange={(e) => setStartsAt(e.target.value)}
              className="min-h-[48px] w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 focus:border-[var(--color-brand)] focus:outline-none focus:ring-4 focus:ring-[rgba(214,246,29,0.18)] text-sm font-medium"
              disabled={isLoading}
            />
          </div>
          <div>
            <label
              htmlFor="endsAt"
              className="mb-2 block text-xs font-bold text-[var(--color-text-secondary)]"
            >
              تاريخ نهاية نشر الحملة (اختياري)
            </label>
            <input
              id="endsAt"
              type="date"
              value={endsAt}
              onChange={(e) => setEndsAt(e.target.value)}
              className="min-h-[48px] w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 focus:border-[var(--color-brand)] focus:outline-none focus:ring-4 focus:ring-[rgba(214,246,29,0.18)] text-sm font-medium"
              disabled={isLoading}
            />
          </div>
        </div>
      </div>

      {/* Card 3: Rates Table */}
      <div className="bg-[rgba(250,252,251,0.01)] border border-[var(--color-border)] p-6 rounded-[var(--radius-xl)] space-y-6">
        <div className="flex items-center justify-between border-b border-[rgba(200,214,206,0.06)] pb-3">
          <h2 className="text-xs font-black text-[var(--color-brand)] bg-[var(--color-surface-dark)] px-4 py-1.5 rounded-[var(--radius-sm)] inline-block shadow-[var(--shadow-brand)]">
            أسعار المنصات والمشاهدات
          </h2>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() =>
                setRates((current) => {
                  const existing = new Set(current.flatMap((r) => r.platforms));
                  const missing = (Object.keys(platformLabels) as PlatformValue[]).filter(
                    (platform) => !existing.has(platform),
                  );
                  if (missing.length === 0) return current;
                  return [...current, { ...emptyRate, platforms: missing }];
                })
              }
              className="btn-secondary px-3 py-1.5 text-xs font-bold"
              disabled={isLoading}
            >
              + كل المنصات بنفس السعر
            </button>
            <button
              type="button"
              onClick={() => setRates((current) => [...current, emptyRate])}
              className="btn-secondary px-3 py-1.5 text-xs font-bold"
              disabled={isLoading}
            >
              + إضافة منصة إعلانية
            </button>
          </div>
        </div>

        {fieldErrors.rates && (
          <p role="alert" className="text-xs font-bold text-red-400">
            {fieldErrors.rates}
          </p>
        )}

        <div className="space-y-4">
          {rates.map((rate, index) => (
            <div
              key={index}
              className="bg-[var(--color-surface)] border border-[var(--color-border)] p-4 rounded-[var(--radius-md)] space-y-4 shadow-sm hover:border-[rgba(214,246,29,0.15)] transition-all"
            >
              <div>
                <span className="block text-[10px] font-bold text-[var(--color-text-muted)] mb-2">
                  المنصة
                </span>
                <PlatformSelect
                  values={rate.platforms}
                  onChange={(platforms) => updateRate(index, { platforms })}
                  disabled={isLoading}
                />
              </div>

              <div className="grid gap-4 items-end sm:grid-cols-[1fr_1fr_1fr_auto]">
                <div>
                  <label
                    htmlFor={`rate-${index}-cpm`}
                    className="block text-[10px] font-bold text-[var(--color-text-muted)] mb-1"
                  >
                    الـ CPM (سعر الـ 1000 مشاهدة)
                  </label>
                  <input
                    id={`rate-${index}-cpm`}
                    value={rate.cpmMinorUnits}
                    onChange={(e) =>
                      updateRate(index, {
                        cpmMinorUnits: e.target.value.replace(/[^0-9]/g, ""),
                      })
                    }
                    placeholder="مثال: 8,000 د.ع"
                    className="min-h-[40px] w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-xs focus:border-[var(--color-brand)] focus:outline-none focus:ring-2 focus:ring-[rgba(214,246,29,0.18)]"
                    disabled={isLoading}
                  />
                </div>

                <div>
                  <label
                    htmlFor={`rate-${index}-minimum-views`}
                    className="block text-[10px] font-bold text-[var(--color-text-muted)] mb-1"
                  >
                    أدنى مشاهدات مؤهلة
                  </label>
                  <input
                    id={`rate-${index}-minimum-views`}
                    value={rate.minimumQualifiedViews}
                    onChange={(e) =>
                      updateRate(index, {
                        minimumQualifiedViews: e.target.value.replace(/[^0-9]/g, ""),
                      })
                    }
                    placeholder="مثال: 5,000 مشاهدة"
                    className="min-h-[40px] w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-xs focus:border-[var(--color-brand)] focus:outline-none focus:ring-2 focus:ring-[rgba(214,246,29,0.18)]"
                    disabled={isLoading}
                  />
                </div>

                <div>
                  <label
                    htmlFor={`rate-${index}-maximum-reward`}
                    className="block text-[10px] font-bold text-[var(--color-text-muted)] mb-1"
                  >
                    الحد الأقصى للأرباح للفيديو
                  </label>
                  <input
                    id={`rate-${index}-maximum-reward`}
                    value={rate.maximumReward}
                    onChange={(e) =>
                      updateRate(index, {
                        maximumReward: e.target.value.replace(/[^0-9]/g, ""),
                      })
                    }
                    placeholder="مثال: 250,000 د.ع"
                    className="min-h-[40px] w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-xs focus:border-[var(--color-brand)] focus:outline-none focus:ring-2 focus:ring-[rgba(214,246,29,0.18)]"
                    disabled={isLoading}
                  />
                </div>

                <div>
                  <button
                    type="button"
                    onClick={() =>
                      setRates((current) => current.filter((_, i) => i !== index))
                    }
                    disabled={rates.length === 1 || isLoading}
                    className="min-h-[40px] text-xs font-bold text-red-400 hover:text-red-300 disabled:opacity-30 transition-colors"
                  >
                    حذف
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Card 4: Assets */}
      <div className="bg-[rgba(250,252,251,0.01)] border border-[var(--color-border)] p-6 rounded-[var(--radius-xl)] space-y-6">
        <div className="border-b border-[rgba(200,214,206,0.06)] pb-3">
          <h2 className="text-xs font-black text-[var(--color-brand)] bg-[var(--color-surface-dark)] px-4 py-1.5 rounded-[var(--radius-sm)] inline-block shadow-[var(--shadow-brand)]">
            أصول الحملة ومصادرها (روابط خارجية)
          </h2>
        </div>

        {/* Always-visible selector panel */}
        <div className="p-4 rounded-[var(--radius-md)] border border-[rgba(200,214,206,0.04)] space-y-3">
          <span className="block text-[10px] font-bold text-[var(--color-text-secondary)]">
            اختر المنصة لإضافة ملف أو رابط أصل جديد:
          </span>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <button
              type="button"
              onClick={() =>
                setAssets((current) => [
                  ...current,
                  {
                    id: `new-${Date.now()}-${Math.random()}`,
                    type: "upload",
                    url: "",
                    label: "",
                  },
                ])
              }
              className="flex flex-col items-center gap-1.5 p-2 rounded-[var(--radius-md)] hover:bg-[var(--color-surface)] transition-all font-bold text-xs text-[var(--color-text)] text-center w-full"
            >
              <span className="flex items-center justify-center w-16 h-16 rounded-[var(--radius-md)] bg-[var(--color-surface)] border border-[var(--color-border)]">
                <DeviceUploadIcon className="w-8 h-8 text-[var(--color-text-secondary)]" />
              </span>
              <span className="leading-tight">رفع ملف من جهازك</span>
            </button>

            <button
              type="button"
              onClick={() =>
                setAssets((current) => [
                  ...current,
                  {
                    id: `new-${Date.now()}-${Math.random()}`,
                    type: "google_drive",
                    url: "",
                    label: "",
                  },
                ])
              }
              className="flex flex-col items-center gap-1.5 p-2 rounded-[var(--radius-md)] hover:bg-[var(--color-surface)] transition-all font-bold text-xs text-[var(--color-text)] text-center w-full"
            >
              <span className="flex items-center justify-center w-16 h-16 rounded-[var(--radius-md)] bg-[var(--color-surface)] border border-[var(--color-border)]">
                <GoogleDriveIcon className="w-8 h-8" />
              </span>
              <span className="leading-tight">رابط غوغل درايف</span>
            </button>

            <button
              type="button"
              onClick={() =>
                setAssets((current) => [
                  ...current,
                  {
                    id: `new-${Date.now()}-${Math.random()}`,
                    type: "dropbox",
                    url: "",
                    label: "",
                  },
                ])
              }
              className="flex flex-col items-center gap-1.5 p-2 rounded-[var(--radius-md)] hover:bg-[var(--color-surface)] transition-all font-bold text-xs text-[var(--color-text)] text-center w-full"
            >
              <span className="flex items-center justify-center w-16 h-16 rounded-[var(--radius-md)] bg-[var(--color-surface)] border border-[var(--color-border)]">
                <DropboxIcon className="w-8 h-8" />
              </span>
              <span className="leading-tight">رابط دروب بوكس</span>
            </button>

            <button
              type="button"
              onClick={() =>
                setAssets((current) => [
                  ...current,
                  {
                    id: `new-${Date.now()}-${Math.random()}`,
                    type: "onedrive",
                    url: "",
                    label: "",
                  },
                ])
              }
              className="flex flex-col items-center gap-1.5 p-2 rounded-[var(--radius-md)] hover:bg-[var(--color-surface)] transition-all font-bold text-xs text-[var(--color-text)] text-center w-full"
            >
              <span className="flex items-center justify-center w-16 h-16 rounded-[var(--radius-md)] bg-[var(--color-surface)] border border-[var(--color-border)]">
                <OneDriveIcon className="w-8 h-8" />
              </span>
              <span className="leading-tight">رابط ون درايف</span>
            </button>
          </div>
        </div>

        {/* Selected asset rows list */}
        <div className="space-y-4">
          {assets.length === 0 ? (
            <p className="text-xs text-[var(--color-text-muted)] text-center py-4 font-semibold">
              لا توجد روابط أصول مضافة حالياً. اختر منصة من الأعلى للبدء.
            </p>
          ) : (
            assets.map((asset, index) => (
              <div
                key={asset.id}
                className="bg-[var(--color-surface)] border border-[var(--color-border)] p-4 rounded-[var(--radius-md)] space-y-4 shadow-sm"
              >
                <div className="flex items-center justify-between border-b border-[rgba(200,214,206,0.04)] pb-3">
                  <div className="flex items-center gap-2">
                    {asset.type === "google_drive" && (
                      <GoogleDriveIcon className="w-4 h-4" />
                    )}
                    {asset.type === "dropbox" && <DropboxIcon className="w-4 h-4" />}
                    {asset.type === "onedrive" && <OneDriveIcon className="w-4 h-4" />}
                    {asset.type === "upload" && (
                      <DeviceUploadIcon className="w-4 h-4 text-[var(--color-brand)]" />
                    )}
                    <span className="text-[10px] font-bold text-[var(--color-text-secondary)]">
                      {asset.type === "google_drive" && "غوغل درايف"}
                      {asset.type === "dropbox" && "دروب بوكس"}
                      {asset.type === "onedrive" && "ون درايف"}
                      {asset.type === "upload" && "ملف مرفوع من جهازك"}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setAssets((current) => current.filter((a) => a.id !== asset.id))
                    }
                    className="text-[10px] font-bold text-red-400 hover:text-red-300 transition-colors"
                  >
                    حذف
                  </button>
                </div>

                {asset.type === "upload" ? (
                  <div className="space-y-3">
                    <div className="grid gap-3 sm:grid-cols-2 items-center">
                      <div>
                        <label
                          htmlFor={`asset-${asset.id}-upload-label`}
                          className="block text-[10px] font-bold text-[var(--color-text-muted)] mb-1"
                        >
                          اسم الملف / الوصف
                        </label>
                        <input
                          id={`asset-${asset.id}-upload-label`}
                          value={asset.label}
                          onChange={(e) => updateAsset(index, { label: e.target.value })}
                          placeholder="مثال: الشعار الرسمي بدقة عالية"
                          className="min-h-[40px] w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-xs focus:border-[var(--color-brand)] focus:outline-none focus:ring-2 focus:ring-[rgba(214,246,29,0.18)]"
                          disabled={isLoading}
                        />
                      </div>
                      <div>
                        <label
                          htmlFor={`file-picker-${asset.id}`}
                          className="block text-[10px] font-bold text-[var(--color-text-muted)] mb-1"
                        >
                          ملف التحميل (أقصى حجم: 100 ميغابايت)
                        </label>
                        <div className="flex items-center gap-3">
                          <input
                            type="file"
                            id={`file-picker-${asset.id}`}
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;

                              if (file.size > 100 * 1024 * 1024) {
                                showToast(
                                  "حجم الملف يتجاوز الحد الأقصى المسموح به وهو 100 ميغابايت.",
                                  "error",
                                );
                                e.target.value = "";
                                return;
                              }

                              updateAsset(index, {
                                fileName: file.name,
                                fileSize: file.size,
                                uploadProgress: 10,
                              });

                              let progress = 10;
                              const interval = setInterval(() => {
                                progress += 30;
                                if (progress >= 100) {
                                  progress = 100;
                                  clearInterval(interval);
                                  updateAsset(index, {
                                    uploadProgress: 100,
                                    url: `https://assets.khallihatrend.com/brand-uploads/${encodeURIComponent(
                                      file.name,
                                    )}`,
                                    label: asset.label || file.name.split(".")[0],
                                  });
                                  showToast("تم رفع الملف بنجاح!", "success");
                                } else {
                                  updateAsset(index, { uploadProgress: progress });
                                }
                              }, 300);
                            }}
                          />
                          <button
                            type="button"
                            onClick={() =>
                              document.getElementById(`file-picker-${asset.id}`)?.click()
                            }
                            className="btn-secondary min-h-[40px] px-4 py-2 text-xs font-bold w-full"
                          >
                            {asset.fileName ? "🔄 تغيير الملف" : "📤 اختيار ملف من جهازك"}
                          </button>
                        </div>
                      </div>
                    </div>

                    {asset.fileName && (
                      <div className="bg-[var(--color-surface-dark)] p-3 rounded-[var(--radius-sm)] space-y-2">
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="font-semibold text-[var(--color-text-secondary)]">
                            {asset.fileName}
                          </span>
                          <span className="text-[var(--color-text-muted)] font-bold">
                            {(asset.fileSize
                              ? asset.fileSize / (1024 * 1024)
                              : 0
                            ).toFixed(2)}{" "}
                            MB / 100 MB
                          </span>
                        </div>
                        {asset.uploadProgress !== undefined && (
                          <div className="w-full bg-[var(--color-border)] h-1 rounded-full overflow-hidden">
                            <div
                              className="bg-[var(--color-brand)] h-full transition-all duration-300"
                              style={{ width: `${asset.uploadProgress}%` }}
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-[1fr_2.5fr] items-center">
                    <div>
                      <label
                        htmlFor={`asset-${asset.id}-link-label`}
                        className="block text-[10px] font-bold text-[var(--color-text-muted)] mb-1"
                      >
                        اسم الرابط
                      </label>
                      <input
                        id={`asset-${asset.id}-link-label`}
                        value={asset.label}
                        onChange={(e) => updateAsset(index, { label: e.target.value })}
                        placeholder="مثال: مجلد ملفات الهوية المفتوحة"
                        className="min-h-[40px] w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-xs focus:border-[var(--color-brand)] focus:outline-none focus:ring-2 focus:ring-[rgba(214,246,29,0.18)]"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor={`asset-${asset.id}-url`}
                        className="block text-[10px] font-bold text-[var(--color-text-muted)] mb-1"
                      >
                        رابط المشاركة
                      </label>
                      <div className="relative flex items-center">
                        <input
                          id={`asset-${asset.id}-url`}
                          value={asset.url}
                          onChange={(e) => updateAsset(index, { url: e.target.value })}
                          placeholder={
                            asset.type === "google_drive"
                              ? "https://drive.google.com/drive/folders/..."
                              : asset.type === "dropbox"
                                ? "https://www.dropbox.com/sh/..."
                                : "https://onedrive.live.com/..."
                          }
                          dir="ltr"
                          className="min-h-[40px] w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-xs focus:border-[var(--color-brand)] focus:outline-none focus:ring-2 focus:ring-[rgba(214,246,29,0.18)]"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button
          type="submit"
          disabled={isLoading}
          className="btn-primary min-h-[48px] px-8 py-3 text-sm font-bold shadow-lg shadow-[rgba(214,246,29,0.15)] hover:shadow-xl"
        >
          {isLoading
            ? "جاري الحفظ..."
            : mode === "create"
              ? "💾 حفظ كمسودة وبدء المراجعة"
              : "💾 حفظ التعديلات"}
        </Button>
      </div>
    </form>
  );
}
