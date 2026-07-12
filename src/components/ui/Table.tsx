import type { ReactNode } from "react";

export type TableColumn<T> = {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  hideOnMobile?: boolean;
  align?: "start" | "end";
};

export function Table<T>({
  columns,
  rows,
  rowKey,
  emptyMessage = "لا توجد بيانات لعرضها حالياً.",
}: {
  columns: TableColumn<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  emptyMessage?: string;
}) {
  if (rows.length === 0) {
    return (
      <p className="py-8 text-center text-sm font-medium text-[var(--color-text-secondary)]">
        {emptyMessage}
      </p>
    );
  }

  return (
    <>
      {/* Real table from md up */}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-[var(--color-border)] text-xs font-extrabold text-[var(--color-text-secondary)]">
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={`py-3 px-4 ${column.align === "end" ? "text-end" : "text-start"}`}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-border)]">
            {rows.map((row) => (
              <tr
                key={rowKey(row)}
                className="transition-colors hover:bg-[var(--mist-50)]"
              >
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={`px-4 py-3.5 ${column.align === "end" ? "text-end" : "text-start"}`}
                  >
                    {column.render(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Stacked cards under md — no horizontal scroll of a squeezed table */}
      <div className="space-y-3 md:hidden">
        {rows.map((row) => (
          <div
            key={rowKey(row)}
            className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4"
          >
            {columns
              .filter((column) => !column.hideOnMobile)
              .map((column) => (
                <div
                  key={column.key}
                  className="flex items-center justify-between gap-3 py-1.5 first:pt-0 last:pb-0"
                >
                  <span className="text-xs font-bold text-[var(--color-text-secondary)]">
                    {column.header}
                  </span>
                  <span className="text-sm font-semibold text-[var(--color-text)]">
                    {column.render(row)}
                  </span>
                </div>
              ))}
          </div>
        ))}
      </div>
    </>
  );
}
