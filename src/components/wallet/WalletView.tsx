"use client";

import { useEffect, useState } from "react";
import { Badge } from "../ui/Badge";
import { Table, type TableColumn } from "../ui/Table";
import { Skeleton } from "../ui/Skeleton";
import { ConnectionErrorCard } from "../ui/ConnectionErrorCard";
import { WalletIcon } from "../ui/icons";

type Transaction = {
  id: string;
  transactionId: string;
  type: string;
  description: string | null;
  direction: "CREDIT" | "DEBIT";
  amount: string;
  signedAmount: string;
  createdAt: string;
};

type WalletCurrency = {
  currency: "IQD" | "USD";
  balance: string;
  transactions: Transaction[];
};

const typeLabels: Record<string, string> = {
  DEPOSIT: "إيداع",
  PAYOUT_RESERVATION: "حجز طلب سحب",
  PAYOUT_SETTLEMENT: "تسوية سحب",
  PAYOUT_RESERVATION_RELEASE: "تحرير حجز سحب",
  CAMPAIGN_BUDGET_RESERVATION: "حجز ميزانية حملة",
  EARNING_RELEASE: "تحرير أرباح",
  REVERSAL: "عملية مسترجعة",
};

function formatAmount(value: string, currency: "IQD" | "USD") {
  const num = BigInt(value);
  if (currency === "IQD") {
    return `${num.toLocaleString("ar-IQ")} د.ع`;
  }
  return `$${(Number(num) / 100).toLocaleString("en-US", { minimumFractionDigits: 2 })}`;
}

export function WalletView() {
  const [data, setData] = useState<WalletCurrency[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [currencyFilter, setCurrencyFilter] = useState<"ALL" | "IQD" | "USD">("ALL");

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/v1/wallet");
        if (!res.ok) throw new Error("failed");
        const json = await res.json();
        setData(json.data);
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-6 sm:grid-cols-2">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (error || !data) {
    return <ConnectionErrorCard message="تعذّر تحميل بيانات المحفظة حالياً." />;
  }

  const allTransactions = data
    .filter((wallet) => currencyFilter === "ALL" || wallet.currency === currencyFilter)
    .flatMap((wallet) =>
      wallet.transactions.map((tx) => ({ ...tx, currency: wallet.currency })),
    )
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const columns: TableColumn<(typeof allTransactions)[number]>[] = [
    {
      key: "type",
      header: "نوع العملية",
      render: (tx) => (
        <div>
          <p className="font-bold text-[var(--color-text)]">
            {typeLabels[tx.type] ?? tx.type}
          </p>
          {tx.description && (
            <p className="mt-0.5 text-xs text-[var(--color-text-muted)]">
              {tx.description}
            </p>
          )}
        </div>
      ),
    },
    {
      key: "amount",
      header: "المبلغ",
      align: "end",
      render: (tx) => (
        <span
          className={`font-black ${
            tx.direction === "CREDIT"
              ? "text-[var(--forest-700)]"
              : "text-[var(--color-text)]"
          }`}
        >
          {tx.direction === "CREDIT" ? "+" : "−"}
          {formatAmount(tx.amount, tx.currency)}
        </span>
      ),
    },
    {
      key: "date",
      header: "التاريخ",
      hideOnMobile: false,
      render: (tx) => (
        <span className="text-xs font-medium text-[var(--color-text-secondary)]">
          {new Date(tx.createdAt).toLocaleDateString("ar-IQ")}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-8">
      <div className="grid gap-6 sm:grid-cols-2">
        {data.map((wallet) => (
          <div key={wallet.currency} className="tilt-3d fade-in-up">
            <div className="tilt-3d-surface rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
              <div className="flex items-center justify-between">
                <span className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-surface-muted)] text-[var(--color-brand-active)]">
                  <WalletIcon size={20} />
                </span>
                <Badge variant="neutral">
                  {wallet.currency === "IQD" ? "دينار عراقي" : "دولار أمريكي"}
                </Badge>
              </div>
              <p className="mt-4 text-sm font-bold text-[var(--color-text-secondary)]">
                الرصيد المتاح
              </p>
              <p className="mt-1 text-3xl font-black text-[var(--color-text)]">
                {formatAmount(wallet.balance, wallet.currency)}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-lg font-extrabold text-[var(--color-text)]">
            سجل العمليات
          </h2>
          <div className="flex gap-2">
            {(["ALL", "IQD", "USD"] as const).map((curr) => (
              <button
                key={curr}
                type="button"
                onClick={() => setCurrencyFilter(curr)}
                className={`rounded-[var(--radius-md)] px-3 py-1.5 text-xs font-bold transition-colors ${
                  currencyFilter === curr
                    ? "bg-[var(--color-brand)] text-[var(--color-text-on-brand)]"
                    : "border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text-secondary)] hover:bg-[var(--mist-100)]"
                }`}
              >
                {curr === "ALL" ? "الكل" : curr === "IQD" ? "بالدينار" : "بالدولار"}
              </button>
            ))}
          </div>
        </div>
        <Table
          columns={columns}
          rows={allTransactions}
          rowKey={(tx) => tx.id}
          emptyMessage="لا توجد عمليات مالية بعد."
        />
      </div>
    </div>
  );
}
