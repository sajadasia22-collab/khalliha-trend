import Link from "next/link";
import { redirect } from "next/navigation";
import { DashboardHeader } from "../../../../components/layout/DashboardHeader";
import { UsersIcon } from "../../../../components/ui/icons";
import { UserRole, UserStatus } from "../../../../generated/prisma/enums";
import { getCurrentUser } from "../../../../lib/auth/session";
import { AdminUsersService } from "../../../../modules/admin-users/service";

type SearchParams = Promise<{
  search?: string;
  role?: string;
  status?: string;
  page?: string;
}>;

const ROLE_LABELS: Record<string, string> = {
  CREATOR: "صانع محتوى",
  BRAND: "تاجر",
  ADMIN: "مشرف",
  SUPER_ADMIN: "مدير النظام",
};
const STATUS_LABELS: Record<string, string> = {
  ACTIVE: "نشط",
  SUSPENDED: "معلّق",
  BANNED: "محظور",
  PENDING_VERIFICATION: "بانتظار التحقق",
};
const STATUS_CLASSES: Record<string, string> = {
  ACTIVE: "bg-emerald-50 text-emerald-800",
  SUSPENDED: "bg-amber-50 text-amber-800",
  BANNED: "bg-red-50 text-red-800",
  PENDING_VERIFICATION: "bg-slate-100 text-slate-700",
};

function pageHref(params: Record<string, string | undefined>, page: number) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => value && query.set(key, value));
  query.set("page", String(page));
  return `/admin/users?${query.toString()}`;
}

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const admin = await getCurrentUser();
  if (!admin) redirect("/login");
  if (admin.role !== "ADMIN" && admin.role !== "SUPER_ADMIN") redirect("/unauthorized");

  const params = await searchParams;
  const role = Object.values(UserRole).includes(params.role as UserRole)
    ? (params.role as UserRole)
    : undefined;
  const status = Object.values(UserStatus).includes(params.status as UserStatus)
    ? (params.status as UserStatus)
    : undefined;
  const result = await AdminUsersService.list({
    search: params.search,
    role,
    status,
    page: Number(params.page) || 1,
  });
  const pageCount = Math.max(1, Math.ceil(result.total / result.pageSize));
  const countByStatus = Object.fromEntries(
    result.statusCounts.map((item) => [item.status, item._count._all]),
  );

  return (
    <main className="min-h-screen bg-[var(--color-bg)] pb-20 text-[var(--color-text)] dir-rtl md:ps-64 md:pb-0">
      <DashboardHeader
        dashboardRole="admin"
        userLabel={`${admin.role === "SUPER_ADMIN" ? "مدير النظام" : "مشرف"}: ${admin.fullName}`}
      />
      <section className="mx-auto max-w-7xl px-5 py-10 lg:px-8">
        <div className="mb-7 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-brand)]">
              <UsersIcon />
            </span>
            <div>
              <h1 className="text-3xl font-extrabold">إدارة المستخدمين</h1>
              <p className="text-sm font-medium text-[var(--color-text-secondary)]">
                البحث في الحسابات ومراجعة حالتها ونشاطها واتخاذ الإجراءات الإدارية.
              </p>
            </div>
          </div>
          <span className="rounded-full bg-[var(--color-surface)] px-4 py-2 text-sm font-black shadow-sm">
            {result.total} نتيجة
          </span>
        </div>

        <div className="mb-6 grid gap-3 sm:grid-cols-4">
          {Object.entries(STATUS_LABELS).map(([key, label]) => (
            <div
              key={key}
              className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4"
            >
              <p className="text-xs font-bold text-[var(--color-text-secondary)]">
                {label}
              </p>
              <p className="mt-1 text-2xl font-black">{countByStatus[key] ?? 0}</p>
            </div>
          ))}
        </div>

        <form className="mb-5 grid gap-3 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 md:grid-cols-[1fr_180px_180px_auto]">
          <input
            name="search"
            defaultValue={params.search}
            placeholder="ابحث بالاسم أو البريد أو الهاتف"
            className="min-h-11 rounded-[var(--radius-md)] border border-[var(--color-border)] px-4 text-right focus:border-[var(--color-brand-active)] focus:outline-none"
          />
          <select
            name="role"
            defaultValue={role ?? ""}
            className="min-h-11 rounded-[var(--radius-md)] border border-[var(--color-border)] px-3 font-bold"
          >
            <option value="">كل الأدوار</option>
            {Object.entries(ROLE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <select
            name="status"
            defaultValue={status ?? ""}
            className="min-h-11 rounded-[var(--radius-md)] border border-[var(--color-border)] px-3 font-bold"
          >
            <option value="">كل الحالات</option>
            {Object.entries(STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <button className="btn-primary min-h-11 rounded-[var(--radius-md)] px-6 font-black">
            تصفية
          </button>
        </form>

        <div className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-right text-sm">
              <thead className="bg-[var(--color-surface-muted)] text-xs text-[var(--color-text-secondary)]">
                <tr>
                  <th className="px-5 py-4">المستخدم</th>
                  <th className="px-5 py-4">الدور</th>
                  <th className="px-5 py-4">الحالة</th>
                  <th className="px-5 py-4">مؤشر الحساب</th>
                  <th className="px-5 py-4">التسجيل</th>
                  <th className="px-5 py-4">التفاصيل</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)]">
                {result.users.map((user) => (
                  <tr
                    key={user.id}
                    className="transition-colors hover:bg-[var(--color-surface-muted)]"
                  >
                    <td className="px-5 py-4">
                      <p className="font-black">{user.fullName}</p>
                      <p className="text-xs text-[var(--color-text-muted)]" dir="ltr">
                        {user.email ?? user.phone ?? "—"}
                      </p>
                    </td>
                    <td className="px-5 py-4 font-bold">{ROLE_LABELS[user.role]}</td>
                    <td className="px-5 py-4">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-black ${STATUS_CLASSES[user.status]}`}
                      >
                        {STATUS_LABELS[user.status]}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-xs font-bold text-[var(--color-text-secondary)]">
                      {user.creatorProfile
                        ? `ثقة ${user.creatorProfile.trustScore}`
                        : (user.brandMembers[0]?.brand.name ??
                          `${user._count.openedDisputes} نزاع`)}
                    </td>
                    <td className="px-5 py-4 text-xs font-bold">
                      {user.createdAt.toLocaleDateString("ar-IQ")}
                    </td>
                    <td className="px-5 py-4">
                      <Link
                        href={`/admin/users/${user.id}`}
                        className="font-black text-[var(--forest-700)] underline"
                      >
                        فتح الملف
                      </Link>
                    </td>
                  </tr>
                ))}
                {result.users.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-5 py-12 text-center font-bold text-[var(--color-text-muted)]"
                    >
                      لا توجد حسابات مطابقة.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-5 flex items-center justify-between gap-3">
          {result.page > 1 ? (
            <Link
              className="btn-secondary rounded-md px-4 py-2 font-bold"
              href={pageHref(params, result.page - 1)}
            >
              السابق
            </Link>
          ) : (
            <span />
          )}
          <span className="text-sm font-bold">
            صفحة {result.page} من {pageCount}
          </span>
          {result.page < pageCount ? (
            <Link
              className="btn-secondary rounded-md px-4 py-2 font-bold"
              href={pageHref(params, result.page + 1)}
            >
              التالي
            </Link>
          ) : (
            <span />
          )}
        </div>
      </section>
    </main>
  );
}
