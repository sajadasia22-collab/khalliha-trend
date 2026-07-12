"use client";

import { useEffect, useState } from "react";

type PayoutLog = {
  id: string;
  amount: string;
  currency: "IQD" | "USD";
  status: "PENDING" | "APPROVED" | "REJECTED";
  payoutMethod: string;
  recipientDetails: string;
  referenceNumber: string | null;
  createdAt: string;
};

export function CreatorPayouts() {
  const [payouts, setPayouts] = useState<PayoutLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState<"IQD" | "USD">("IQD");
  const [payoutMethod, setPayoutMethod] = useState("ZainCash");
  const [recipientDetails, setRecipientDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchPayouts = async () => {
    try {
      const res = await fetch("/api/v1/creator/payouts");
      if (res.ok) {
        const json = await res.json();
        setPayouts(json.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchPayouts();
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

    if (!recipientDetails.trim()) {
      alert("الرجاء إدخال تفاصيل المستلم");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/v1/creator/payouts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: finalAmount,
          currency,
          payoutMethod,
          recipientDetails: recipientDetails.trim(),
        }),
      });

      if (res.ok) {
        alert("تم إرسال طلب السحب بنجاح وهو بانتظار الموافقة والتحويل.");
        setAmount("");
        setRecipientDetails("");
        fetchPayouts();
      } else {
        const data = await res.json();
        alert(data.error?.message || "فشلت عملية طلب السحب");
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
    PENDING: { label: "قيد المراجعة", bg: "var(--trend-100)", text: "var(--forest-700)" },
    APPROVED: { label: "تم التحويل", bg: "var(--forest-100)", text: "var(--forest-900)" },
    REJECTED: {
      label: "مرفوض",
      bg: "var(--mist-200)",
      text: "var(--color-text-secondary)",
    },
  };

  return (
    <div className="grid gap-8 lg:grid-cols-3 dir-rtl text-right">
      {/* Payout Form */}
      <div className="card p-6 border border-[var(--color-border)] bg-[var(--color-surface)] rounded-[var(--radius-xl)] lg:col-span-1 space-y-4">
        <h3 className="text-lg font-extrabold text-[var(--color-text)] pb-2 border-b border-[var(--color-border)]">
          طلب سحب الأرباح المتاحة
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <span className="block text-xs font-bold text-[var(--color-text-secondary)] mb-1">
              العملة المراد سحبها
            </span>
            <div className="flex gap-2">
              {(["IQD", "USD"] as const).map((curr) => (
                <button
                  key={curr}
                  type="button"
                  onClick={() => setCurrency(curr)}
                  className={`w-full py-2 text-xs font-bold rounded-[var(--radius-md)] border transition-all ${
                    currency === curr
                      ? "bg-[var(--color-brand)] text-[var(--color-text-on-brand)] border-[var(--color-brand)]"
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
              htmlFor="payout-amount"
              className="block text-xs font-bold text-[var(--color-text-secondary)] mb-1"
            >
              مبلغ السحب
            </label>
            <input
              id="payout-amount"
              type="number"
              step="any"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="input-field"
              placeholder={currency === "IQD" ? "مثال: 150000" : "مثال: 100.00"}
            />
          </div>

          <div>
            <label
              htmlFor="payout-method"
              className="block text-xs font-bold text-[var(--color-text-secondary)] mb-1"
            >
              وسيلة الدفع
            </label>
            <div className="select-field-wrap">
              <select
                id="payout-method"
                value={payoutMethod}
                onChange={(e) => setPayoutMethod(e.target.value)}
                className="select-field"
              >
                <option value="ZainCash">زين كاش (Zain Cash)</option>
                <option value="FastPay">فاست باي (FastPay)</option>
                <option value="BankTransfer">تحويل مصرفي (Bank Transfer)</option>
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
              htmlFor="payout-recipient"
              className="block text-xs font-bold text-[var(--color-text-secondary)] mb-1"
            >
              تفاصيل الحساب / رقم المحفظة للمستلم
            </label>
            <input
              id="payout-recipient"
              type="text"
              required
              value={recipientDetails}
              onChange={(e) => setRecipientDetails(e.target.value)}
              className="input-field"
              placeholder="مثال: 077xxxxxxxx أو رقم الحساب البنكي..."
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="btn-primary w-full py-2.5 text-sm font-bold disabled:opacity-50"
          >
            {submitting ? "جاري المعالجة..." : "إرسال طلب السحب"}
          </button>
        </form>
      </div>

      {/* Payouts History */}
      <div className="card p-6 border border-[var(--color-border)] bg-[var(--color-surface)] rounded-[var(--radius-xl)] lg:col-span-2 space-y-4">
        <h3 className="text-lg font-extrabold text-[var(--color-text)] pb-2 border-b border-[var(--color-border)]">
          سجل طلبات السحب الأخيرة
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
        ) : payouts.length === 0 ? (
          <p className="text-sm font-medium text-[var(--color-text-secondary)] py-8 text-center">
            لا توجد طلبات سحب سابقة حالياً.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse text-right">
              <thead>
                <tr className="border-b border-[var(--color-border)] text-xs font-extrabold text-[var(--color-text-secondary)]">
                  <th className="py-2.5 px-3">المبلغ</th>
                  <th className="py-2.5 px-3">الوسيلة</th>
                  <th className="py-2.5 px-3">رقم الحساب</th>
                  <th className="py-2.5 px-3">رقم التحويل</th>
                  <th className="py-2.5 px-3">الحالة</th>
                  <th className="py-2.5 px-3">تاريخ الطلب</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)]">
                {payouts.map((item) => {
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
                      <td className="py-3 px-3 font-bold text-[var(--forest-700)]">
                        {formatAmountVal(item.amount, item.currency)}
                      </td>
                      <td className="py-3 px-3 text-xs font-bold text-[var(--color-text-secondary)]">
                        {item.payoutMethod === "ZainCash"
                          ? "زين كاش"
                          : item.payoutMethod === "FastPay"
                            ? "فاست باي"
                            : "حوالة بنكية"}
                      </td>
                      <td className="py-3 px-3 font-mono text-xs text-[var(--color-text-secondary)]">
                        {item.recipientDetails}
                      </td>
                      <td className="py-3 px-3 font-mono text-xs text-[var(--color-text-secondary)]">
                        {item.referenceNumber || "—"}
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className="inline-block px-2 py-0.5 text-xs font-bold rounded-[var(--radius-pill)] border"
                          style={{
                            backgroundColor: badge.bg,
                            color: badge.text,
                            borderColor: `color-mix(in srgb, ${badge.text} 25%, transparent)`,
                          }}
                        >
                          {badge.label}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-xs font-medium text-[var(--color-text-secondary)]">
                        {new Date(item.createdAt).toLocaleDateString("ar-IQ")}
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
