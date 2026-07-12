"use client";

import { useEffect, useState } from "react";

type DepositLog = {
  id: string;
  amount: string;
  currency: "IQD" | "USD";
  status: "PENDING" | "APPROVED" | "REJECTED";
  referenceNumber: string | null;
  note: string | null;
  createdAt: string;
};

export function BrandDeposits() {
  const [deposits, setDeposits] = useState<DepositLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState<"IQD" | "USD">("IQD");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchDeposits = async () => {
    try {
      const res = await fetch("/api/v1/brand/deposits");
      if (res.ok) {
        const json = await res.json();
        setDeposits(json.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchDeposits();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      alert("الرجاء إدخال مبلغ صحيح أكبر من الصفر");
      return;
    }

    // Convert to minor units (multiply by 100 for USD)
    const finalAmount =
      currency === "USD" ? Math.round(parsedAmount * 100) : Math.round(parsedAmount);

    setSubmitting(true);
    try {
      const res = await fetch("/api/v1/brand/deposits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: finalAmount,
          currency,
          referenceNumber: referenceNumber.trim() || undefined,
          note: note.trim() || undefined,
        }),
      });

      if (res.ok) {
        alert("تم إرسال طلب الإيداع وهو قيد المراجعة الإدارية الآن.");
        setAmount("");
        setReferenceNumber("");
        setNote("");
        fetchDeposits();
      } else {
        const data = await res.json();
        alert(data.error?.message || "فشل إرسال طلب الإيداع");
      }
    } catch {
      alert("حدث خطأ في الاتصال بالخادم");
    } finally {
      setSubmitting(false);
    }
  };

  const formatAmountVal = (val: string, curr: "IQD" | "USD") => {
    const num = parseInt(val, 10);
    if (curr === "IQD") {
      return `${num.toLocaleString("ar-IQ")} د.ع`;
    }
    return `$${(num / 100).toLocaleString("en-US", { minimumFractionDigits: 2 })}`;
  };

  const statusLabels = {
    PENDING: { label: "قيد الانتظار", bg: "var(--trend-100)", text: "var(--forest-700)" },
    APPROVED: { label: "مقبول", bg: "var(--forest-100)", text: "var(--forest-900)" },
    REJECTED: {
      label: "مرفوض",
      bg: "var(--mist-200)",
      text: "var(--color-text-secondary)",
    },
  };

  return (
    <div className="grid gap-8 lg:grid-cols-3 dir-rtl text-right">
      {/* Deposit Form */}
      <div className="card p-6 border border-[var(--color-border)] bg-[var(--color-surface)] rounded-[var(--radius-xl)] lg:col-span-1 space-y-4 shadow-[var(--shadow-sm)] scale-in">
        <div className="pb-2 border-b border-[var(--color-border)] flex items-center justify-between">
          <h3 className="text-lg font-extrabold text-[var(--color-text)]">
            طلب تمويل يدوي (إيداع)
          </h3>
          <span className="h-2 w-2 rounded-full bg-[var(--color-brand)] animate-pulse" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <span className="block text-xs font-bold text-[var(--color-text-secondary)] mb-1.5">
              العملة
            </span>
            <div className="flex gap-2">
              {(["IQD", "USD"] as const).map((curr) => (
                <button
                  key={curr}
                  type="button"
                  onClick={() => setCurrency(curr)}
                  className={`w-full py-2.5 text-xs font-bold rounded-[var(--radius-md)] border transition-all active:scale-95 duration-200 cursor-pointer ${
                    currency === curr
                      ? "bg-[var(--color-brand)] text-[var(--color-text-on-brand)] border-[var(--color-brand)] shadow-[var(--shadow-brand)]"
                      : "bg-[var(--color-bg)] text-[var(--color-text-secondary)] border-[var(--color-border)] hover:bg-[var(--mist-100)]"
                  }`}
                >
                  {curr === "IQD" ? "دينار عراقي (IQD)" : "دولار أمريكي (USD)"}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label
              htmlFor="deposit-amount"
              className="block text-xs font-bold text-[var(--color-text-secondary)] mb-1"
            >
              مبلغ التمويل
            </label>
            <input
              id="deposit-amount"
              type="number"
              step="any"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="input-field w-full transition-all focus:border-[var(--color-brand)]"
              placeholder={currency === "IQD" ? "مثال: 500000" : "مثال: 250.00"}
            />
          </div>

          <div>
            <label
              htmlFor="deposit-reference"
              className="block text-xs font-bold text-[var(--color-text-secondary)] mb-1"
            >
              رقم الحوالة أو الإشارة (Reference Number)
            </label>
            <input
              id="deposit-reference"
              type="text"
              value={referenceNumber}
              onChange={(e) => setReferenceNumber(e.target.value)}
              className="input-field w-full transition-all focus:border-[var(--color-brand)]"
              placeholder="رقم العملية بزين كاش، أو رقم الحوالة..."
            />
          </div>

          <div>
            <label
              htmlFor="deposit-note"
              className="block text-xs font-bold text-[var(--color-text-secondary)] mb-1"
            >
              ملاحظات إضافية
            </label>
            <textarea
              id="deposit-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="input-field w-full transition-all focus:border-[var(--color-brand)]"
              placeholder="اكتب تفاصيل التحويل، مثل رقم الهاتف المرسل منه..."
              rows={3}
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="btn-primary w-full py-3 text-sm font-bold disabled:opacity-50 transition-all hover:bg-[var(--color-brand-hover)] active:scale-[0.98] duration-200 cursor-pointer shadow-[var(--shadow-sm)]"
          >
            {submitting ? (
              <span className="flex items-center justify-center gap-2">
                <span className="h-4 w-4 border-2 border-[var(--color-text-on-brand)] border-t-transparent rounded-full animate-spin" />
                جاري الإرسال...
              </span>
            ) : (
              "إرسال طلب التمويل"
            )}
          </button>
        </form>
      </div>

      {/* Deposits History */}
      <div
        className="card p-6 border border-[var(--color-border)] bg-[var(--color-surface)] rounded-[var(--radius-xl)] lg:col-span-2 space-y-4 shadow-[var(--shadow-sm)] scale-in"
        style={{ animationDelay: "100ms" }}
      >
        <h3 className="text-lg font-extrabold text-[var(--color-text)] pb-2 border-b border-[var(--color-border)]">
          سجل طلبات التمويل الأخيرة
        </h3>

        {loading ? (
          <div className="space-y-4 animate-pulse">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="h-16 rounded-[var(--radius-md)] bg-[var(--color-border)] opacity-20"
              />
            ))}
          </div>
        ) : deposits.length === 0 ? (
          <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-surface-muted)] text-[var(--color-text-muted)]">
              ⚖️
            </span>
            <p className="text-sm font-bold text-[var(--color-text)]">
              لا توجد طلبات تمويل سابقة
            </p>
            <p className="text-xs text-[var(--color-text-muted)] max-w-xs">
              موّل رصيدك لإطلاق أولى حملاتك الإعلانية عبر المنصة.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse text-right">
              <thead>
                <tr className="border-b border-[var(--color-border)] text-xs font-extrabold text-[var(--color-text-secondary)] bg-[var(--color-surface-muted)]">
                  <th className="py-3 px-4">المبلغ</th>
                  <th className="py-3 px-4">رقم المرجع</th>
                  <th className="py-3 px-4">الحالة</th>
                  <th className="py-3 px-4">تاريخ الطلب</th>
                  <th className="py-3 px-4">ملاحظات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)]">
                {deposits.map((item) => {
                  const badge = statusLabels[item.status] || {
                    label: item.status,
                    bg: "var(--mist-100)",
                    text: "var(--color-text)",
                  };
                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-[var(--color-surface-muted)] transition-colors"
                    >
                      <td className="py-3.5 px-4 font-bold text-[var(--forest-700)] dark:text-[var(--color-text)]">
                        {formatAmountVal(item.amount, item.currency)}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-xs text-[var(--color-text-secondary)]">
                        {item.referenceNumber || "—"}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-bold rounded-[var(--radius-pill)] border"
                          style={{
                            backgroundColor: badge.bg,
                            color: badge.text,
                            borderColor: `color-mix(in srgb, ${badge.text} 20%, transparent)`,
                          }}
                        >
                          {item.status === "PENDING" && (
                            <span className="h-1.5 w-1.5 rounded-full bg-[var(--forest-500)] animate-pulse" />
                          )}
                          {item.status === "APPROVED" && (
                            <span
                              className="h-1.5 w-1.5 rounded-full bg-[var(--color-success)] animate-pulse"
                              style={{ animationDuration: "2s" }}
                            />
                          )}
                          {item.status === "REJECTED" && (
                            <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-text-muted)]" />
                          )}
                          {badge.label}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-xs font-medium text-[var(--color-text-secondary)]">
                        {new Date(item.createdAt).toLocaleDateString("ar-IQ")}
                      </td>
                      <td
                        className="py-3.5 px-4 text-xs font-medium text-[var(--color-text-secondary)] max-w-[200px] truncate"
                        title={item.note || undefined}
                      >
                        {item.note || "—"}
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
