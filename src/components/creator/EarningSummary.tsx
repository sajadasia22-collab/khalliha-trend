"use client";

import { useEffect, useState } from "react";

type EarningTotal = {
  total: string;
  held: string;
  available: string;
  paid: string;
};

type EarningLog = {
  id: string;
  submissionId: string;
  amount: string;
  currency: "IQD" | "USD";
  status:
    "ESTIMATED" | "PENDING_VERIFICATION" | "HELD" | "AVAILABLE" | "PAID" | "REVERSED";
  heldUntil: string | null;
  createdAt: string;
  campaignTitle: string;
  postUrl: string;
};

type EarningData = {
  IQD: EarningTotal;
  USD: EarningTotal;
  history: EarningLog[];
};

const statusLabels: Record<
  EarningLog["status"],
  { label: string; bg: string; text: string }
> = {
  ESTIMATED: {
    label: "تقديري",
    bg: "var(--mist-100)",
    text: "var(--color-text-secondary)",
  },
  PENDING_VERIFICATION: {
    label: "قيد التحقق",
    bg: "var(--trend-100)",
    text: "var(--forest-700)",
  },
  HELD: { label: "محجوز", bg: "var(--trend-100)", text: "var(--forest-700)" },
  AVAILABLE: {
    label: "متاح للسحب",
    bg: "var(--color-brand)",
    text: "var(--color-text-on-brand)",
  },
  PAID: { label: "مدفوع", bg: "var(--forest-100)", text: "var(--forest-900)" },
  REVERSED: { label: "مسترجع", bg: "var(--mist-200)", text: "var(--color-text-muted)" },
};

export function EarningSummary() {
  const [data, setData] = useState<EarningData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currencyFilter, setCurrencyFilter] = useState<"ALL" | "IQD" | "USD">("ALL");

  useEffect(() => {
    async function fetchEarnings() {
      try {
        const res = await fetch("/api/v1/creator/earnings");
        if (!res.ok) {
          throw new Error("فشل جلب تفاصيل الأرباح");
        }
        const json = await res.json();
        setData(json.data);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "حدث خطأ غير متوقع");
      } finally {
        setLoading(false);
      }
    }
    fetchEarnings();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="h-28 rounded-[var(--radius-lg)] bg-[var(--color-border)] opacity-20"
            />
          ))}
        </div>
        <div className="h-64 rounded-[var(--radius-lg)] bg-[var(--color-border)] opacity-20" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="card p-6 border border-[var(--forest-200)] bg-[var(--mist-100)] text-center rounded-[var(--radius-lg)]">
        <p className="font-bold text-[var(--forest-800)]">
          {error || "فشل تحميل البيانات المالية"}
        </p>
        <p className="mt-1 text-xs font-medium text-[var(--color-text-secondary)]">
          حاول تحديث الصفحة بعد قليل.
        </p>
      </div>
    );
  }

  const formatCurrencyVal = (val: string, curr: "IQD" | "USD") => {
    const num = parseInt(val, 10);
    if (curr === "IQD") {
      return `${num.toLocaleString("ar-IQ", { numberingSystem: "latn" })} د.ع`;
    }
    return `$${(num / 100).toLocaleString("en-US", { minimumFractionDigits: 2 })}`;
  };

  const filteredHistory = data.history.filter(
    (item) => currencyFilter === "ALL" || item.currency === currencyFilter,
  );

  return (
    <div className="space-y-8 dir-rtl text-right">
      {/* Balances Section */}
      <div>
        <h2 className="text-xl font-bold mb-4 text-[var(--color-text)]">
          المحفظة والأرباح
        </h2>

        <div className="grid gap-6 md:grid-cols-2">
          {/* IQD Wallet */}
          <div className="card p-6 border border-[var(--color-border)] bg-[var(--color-surface)] rounded-[var(--radius-xl)] space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-3">
              <span className="font-extrabold text-[var(--color-text)]">
                المحفظة بالدينار العراقي (IQD)
              </span>
              <span className="text-xs font-bold px-2 py-0.5 rounded-[var(--radius-pill)] bg-[var(--mist-100)] text-[var(--color-text-secondary)]">
                د.ع
              </span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-bold text-[var(--color-text-secondary)]">
                  الرصيد المتاح
                </p>
                <p className="text-xl font-black text-[var(--forest-700)] mt-1">
                  {formatCurrencyVal(data.IQD.available, "IQD")}
                </p>
              </div>
              <div>
                <p className="text-xs font-bold text-[var(--color-text-secondary)]">
                  المعلق / المحجوز
                </p>
                <p className="text-xl font-black text-[var(--trend-800)] mt-1">
                  {formatCurrencyVal(data.IQD.held, "IQD")}
                </p>
              </div>
              <div className="pt-2 border-t border-[var(--color-border)]">
                <p className="text-xs font-bold text-[var(--color-text-secondary)]">
                  المجموع المستلم
                </p>
                <p className="text-sm font-black text-[var(--color-text)] mt-1">
                  {formatCurrencyVal(data.IQD.paid, "IQD")}
                </p>
              </div>
              <div className="pt-2 border-t border-[var(--color-border)]">
                <p className="text-xs font-bold text-[var(--color-text-secondary)]">
                  إجمالي الأرباح
                </p>
                <p className="text-sm font-black text-[var(--color-text)] mt-1">
                  {formatCurrencyVal(data.IQD.total, "IQD")}
                </p>
              </div>
            </div>
          </div>

          {/* USD Wallet */}
          <div className="card p-6 border border-[var(--color-border)] bg-[var(--color-surface)] rounded-[var(--radius-xl)] space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-3">
              <span className="font-extrabold text-[var(--color-text)]">
                المحفظة بالدولار الأمريكي (USD)
              </span>
              <span className="text-xs font-bold px-2 py-0.5 rounded-[var(--radius-pill)] bg-[var(--mist-100)] text-[var(--color-text-secondary)]">
                $
              </span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-bold text-[var(--color-text-secondary)]">
                  الرصيد المتاح
                </p>
                <p className="text-xl font-black text-[var(--forest-700)] mt-1">
                  {formatCurrencyVal(data.USD.available, "USD")}
                </p>
              </div>
              <div>
                <p className="text-xs font-bold text-[var(--color-text-secondary)]">
                  المعلق / المحجوز
                </p>
                <p className="text-xl font-black text-[var(--trend-800)] mt-1">
                  {formatCurrencyVal(data.USD.held, "USD")}
                </p>
              </div>
              <div className="pt-2 border-t border-[var(--color-border)]">
                <p className="text-xs font-bold text-[var(--color-text-secondary)]">
                  المجموع المستلم
                </p>
                <p className="text-sm font-black text-[var(--color-text)] mt-1">
                  {formatCurrencyVal(data.USD.paid, "USD")}
                </p>
              </div>
              <div className="pt-2 border-t border-[var(--color-border)]">
                <p className="text-xs font-bold text-[var(--color-text-secondary)]">
                  إجمالي الأرباح
                </p>
                <p className="text-sm font-black text-[var(--color-text)] mt-1">
                  {formatCurrencyVal(data.USD.total, "USD")}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* History Log Table */}
      <div className="card p-6 border border-[var(--color-border)] bg-[var(--color-surface)] rounded-[var(--radius-xl)]">
        <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-4 mb-4 flex-wrap gap-4">
          <h3 className="font-extrabold text-[var(--color-text)]">
            سجل عمليات احتساب الأرباح
          </h3>

          <div className="flex gap-2">
            {(["ALL", "IQD", "USD"] as const).map((curr) => (
              <button
                key={curr}
                type="button"
                onClick={() => setCurrencyFilter(curr)}
                className={`px-3 py-1.5 text-xs font-bold rounded-[var(--radius-md)] transition-all ${
                  currencyFilter === curr
                    ? "bg-[var(--color-brand)] text-[var(--color-text-on-brand)]"
                    : "bg-[var(--color-bg)] text-[var(--color-text-secondary)] border border-[var(--color-border)] hover:bg-[var(--mist-100)]"
                }`}
              >
                {curr === "ALL" ? "الكل" : curr === "IQD" ? "بالدينار د.ع" : "بالدولار $"}
              </button>
            ))}
          </div>
        </div>

        {filteredHistory.length === 0 ? (
          <p className="text-center text-sm font-medium text-[var(--color-text-secondary)] py-8">
            لا توجد سجلات أرباح مطابقة حالياً.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse text-right">
              <thead>
                <tr className="border-b border-[var(--color-border)] text-xs font-extrabold text-[var(--color-text-secondary)]">
                  <th className="py-3 px-4">الحملة</th>
                  <th className="py-3 px-4">رابط المنشور</th>
                  <th className="py-3 px-4">المبلغ المستحق</th>
                  <th className="py-3 px-4">حالة الاستحقاق</th>
                  <th className="py-3 px-4">تاريخ الاحتساب</th>
                  <th className="py-3 px-4">اعتراض</th>
                  <th className="py-3 px-4">تاريخ فك الحجز</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)]">
                {filteredHistory.map((item) => {
                  const badge = statusLabels[item.status] || {
                    label: item.status,
                    bg: "var(--mist-100)",
                    text: "var(--color-text)",
                  };
                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-[var(--mist-50)] transition-colors"
                    >
                      <td className="py-3.5 px-4 font-bold text-[var(--color-text)]">
                        {item.campaignTitle}
                      </td>
                      <td className="py-3.5 px-4">
                        <a
                          href={item.postUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[var(--color-text-secondary)] hover:text-[var(--forest-700)] hover:underline break-all max-w-[200px] inline-block font-mono"
                        >
                          {item.postUrl}
                        </a>
                      </td>
                      <td className="py-3.5 px-4 font-black text-[var(--forest-700)]">
                        {formatCurrencyVal(item.amount, item.currency)}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className="inline-block px-2.5 py-0.5 text-xs font-bold rounded-[var(--radius-pill)] border"
                          style={{
                            backgroundColor: badge.bg,
                            color: badge.text,
                            borderColor: `color-mix(in srgb, ${badge.text} 25%, transparent)`,
                          }}
                        >
                          {badge.label}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-xs font-medium text-[var(--color-text-secondary)]">
                        {new Date(item.createdAt).toLocaleDateString("ar-IQ", {
                          numberingSystem: "latn",
                        })}
                      </td>
                      <td className="py-3.5 px-4">
                        <a
                          href={`/creator/disputes?submission=${item.submissionId}`}
                          className="whitespace-nowrap text-xs font-black underline"
                        >
                          فتح نزاع
                        </a>
                      </td>
                      <td className="py-3.5 px-4 text-xs font-medium text-[var(--color-text-secondary)]">
                        {item.heldUntil
                          ? new Date(item.heldUntil).toLocaleDateString("ar-IQ", {
                              numberingSystem: "latn",
                            })
                          : "—"}
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
