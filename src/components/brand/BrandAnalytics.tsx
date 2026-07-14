"use client";

import { useEffect, useMemo, useState } from "react";
import { campaignStatusLabels } from "../../lib/campaigns";

type CampaignAnalytics = {
  id: string;
  title: string;
  status: keyof typeof campaignStatusLabels;
  currency: "IQD" | "USD";
  totalBudget: string;
  reservedBudget: string;
  qualifiedViews: string;
  spend: string;
};

type DailyPoint = {
  date: string;
  qualifiedViews: string;
  spend: string;
};

type AnalyticsData = {
  campaigns: CampaignAnalytics[];
  daily: DailyPoint[];
};

export function BrandAnalytics() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/v1/brand/analytics");
        if (res.ok) {
          const json = await res.json();
          setData(json.data);
        }
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const maxViews = useMemo(() => {
    return (data?.daily ?? []).reduce((max, point) => {
      const value = BigInt(point.qualifiedViews);
      return value > max ? value : max;
    }, 1n);
  }, [data]);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-56 rounded-[var(--radius-lg)] bg-[var(--color-border)] opacity-20" />
        <div className="h-40 rounded-[var(--radius-lg)] bg-[var(--color-border)] opacity-20" />
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const statusColors: Record<string, { bg: string; text: string }> = {
    DRAFT: { bg: "var(--mist-200)", text: "var(--color-text-secondary)" },
    PENDING_REVIEW: { bg: "var(--trend-100)", text: "var(--forest-700)" },
    NEEDS_CHANGES: { bg: "rgba(214, 246, 29, 0.2)", text: "var(--forest-900)" },
    PENDING_FUNDING: { bg: "var(--trend-200)", text: "var(--trend-900)" },
    SCHEDULED: { bg: "var(--mist-100)", text: "var(--forest-500)" },
    ACTIVE: { bg: "var(--forest-100)", text: "var(--forest-900)" },
    PAUSED: { bg: "var(--mist-200)", text: "var(--color-text-muted)" },
    BUDGET_LOW: { bg: "rgba(214, 246, 29, 0.25)", text: "var(--forest-800)" },
    BUDGET_EXHAUSTED: { bg: "var(--forest-50)", text: "var(--forest-700)" },
    COMPLETED: { bg: "var(--forest-100)", text: "var(--forest-900)" },
    CANCELLED: { bg: "var(--mist-200)", text: "var(--color-text-secondary)" },
    REJECTED: { bg: "var(--forest-50)", text: "var(--forest-700)" },
  };

  const noViews = data.daily.every((point) => point.qualifiedViews === "0");

  return (
    <div className="space-y-6">
      <div className="card p-6 border border-[var(--color-border)] bg-[var(--color-surface)] rounded-[var(--radius-lg)] shadow-[var(--shadow-sm)] scale-in">
        <h2 className="text-sm font-bold text-[var(--color-text-secondary)] mb-4">
          المشاهدات المؤهلة اليومية - آخر 30 يوم
        </h2>
        {noViews ? (
          <p className="py-8 text-center text-xs text-[var(--color-text-muted)]">
            لا توجد مشاهدات مؤهلة مسجّلة خلال الفترة الأخيرة.
          </p>
        ) : (
          <svg viewBox="0 0 320 120" className="w-full h-32" preserveAspectRatio="none">
            <defs>
              <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--color-brand)" />
                <stop offset="100%" stopColor="var(--color-success)" />
              </linearGradient>
            </defs>
            {data.daily.map((point, index) => {
              const barWidth = 320 / data.daily.length;
              const value = BigInt(point.qualifiedViews);
              const heightRatio = Number((value * 1000n) / maxViews) / 1000;
              const barHeight = Math.max(heightRatio * 110, value > 0n ? 2 : 0);
              const x = index * barWidth;
              const y = 118 - barHeight;
              return (
                <rect
                  key={point.date}
                  x={x + barWidth * 0.15}
                  y={y}
                  width={barWidth * 0.7}
                  height={barHeight}
                  rx={1.5}
                  fill="url(#chartGrad)"
                  className="transition-opacity duration-200 hover:opacity-80 cursor-pointer"
                >
                  <title>
                    {point.date}:{" "}
                    {value.toLocaleString("ar-IQ", { numberingSystem: "latn" })} مشاهدة
                  </title>
                </rect>
              );
            })}
          </svg>
        )}
        <div className="mt-2 flex justify-between text-[11px] text-[var(--color-text-muted)] font-medium">
          <span>{data.daily[0]?.date}</span>
          <span>{data.daily[data.daily.length - 1]?.date}</span>
        </div>
      </div>

      <div
        className="card border border-[var(--color-border)] bg-[var(--color-surface)] rounded-[var(--radius-lg)] overflow-hidden shadow-[var(--shadow-sm)] scale-in"
        style={{ animationDelay: "150ms" }}
      >
        <h2 className="text-sm font-bold text-[var(--color-text-secondary)] px-6 pt-6 mb-4">
          أداء الحملات
        </h2>
        {data.campaigns.length === 0 ? (
          <p className="px-6 pb-6 text-xs text-[var(--color-text-muted)]">
            لا توجد حملات بعد.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <caption className="sr-only">أداء حملات العلامة التجارية</caption>
              <thead>
                <tr className="border-t border-[var(--color-border)] text-start text-xs font-bold text-[var(--color-text-muted)] bg-[var(--color-surface-muted)]">
                  <th scope="col" className="px-6 py-3 text-start">
                    الحملة
                  </th>
                  <th scope="col" className="px-6 py-3 text-start">
                    الحالة
                  </th>
                  <th scope="col" className="px-6 py-3 text-start">
                    المشاهدات المؤهلة
                  </th>
                  <th scope="col" className="px-6 py-3 text-start">
                    الإنفاق
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.campaigns.map((campaign) => {
                  const badge = statusColors[campaign.status] || {
                    bg: "var(--mist-100)",
                    text: "var(--color-text)",
                  };
                  return (
                    <tr
                      key={campaign.id}
                      className="border-t border-[var(--color-border)] hover:bg-[var(--color-surface-muted)] transition-colors"
                    >
                      <td className="px-6 py-3.5 font-bold text-[var(--color-text)]">
                        {campaign.title}
                      </td>
                      <td className="px-6 py-3.5">
                        <span
                          className="inline-block px-2.5 py-0.5 text-xs font-bold rounded-[var(--radius-pill)] border"
                          style={{
                            backgroundColor: badge.bg,
                            color: badge.text,
                            borderColor: `color-mix(in srgb, ${badge.text} 20%, transparent)`,
                          }}
                        >
                          {campaignStatusLabels[campaign.status]}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-[var(--color-text-secondary)] font-semibold">
                        {BigInt(campaign.qualifiedViews).toLocaleString("ar-IQ", {
                          numberingSystem: "latn",
                        })}
                      </td>
                      <td className="px-6 py-3.5 text-[var(--color-text-secondary)] font-semibold">
                        {BigInt(campaign.spend).toLocaleString("ar-IQ", {
                          numberingSystem: "latn",
                        })}{" "}
                        {campaign.currency}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
