import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { UserStatusControl } from "../../../../../components/admin/UserStatusControl";
import { DashboardHeader } from "../../../../../components/layout/DashboardHeader";
import { UserIcon } from "../../../../../components/ui/icons";
import { getCurrentUser } from "../../../../../lib/auth/session";
import { AdminUsersService } from "../../../../../modules/admin-users/service";

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

function date(value: Date) {
  return value.toLocaleString("ar-IQ", { dateStyle: "medium", timeStyle: "short" });
}

function amount(value: bigint, currency: string) {
  return `${value.toLocaleString("ar-IQ", { numberingSystem: "latn" })} ${currency}`;
}

function Info({
  label,
  value,
  ltr = false,
}: {
  label: string;
  value: React.ReactNode;
  ltr?: boolean;
}) {
  return (
    <div className="rounded-[var(--radius-md)] bg-[var(--color-surface-muted)] p-4">
      <p className="text-xs font-bold text-[var(--color-text-muted)]">{label}</p>
      <div className="mt-1 font-black" dir={ltr ? "ltr" : undefined}>
        {value || "—"}
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm sm:p-6">
      <h2 className="mb-4 text-lg font-black">{title}</h2>
      {children}
    </section>
  );
}

export default async function AdminUserDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const admin = await getCurrentUser();
  if (!admin) redirect("/login");
  if (admin.role !== "ADMIN" && admin.role !== "SUPER_ADMIN") redirect("/unauthorized");
  const { id } = await params;
  const user = await AdminUsersService.getDetails(id);
  if (!user) notFound();

  const canManage =
    user.id !== admin.id &&
    user.role !== "SUPER_ADMIN" &&
    (user.role !== "ADMIN" || admin.role === "SUPER_ADMIN");

  return (
    <main className="min-h-screen bg-[var(--color-bg)] pb-20 text-[var(--color-text)] dir-rtl md:ps-64 md:pb-0">
      <DashboardHeader
        dashboardRole="admin"
        userLabel={`${admin.role === "SUPER_ADMIN" ? "مدير النظام" : "مشرف"}: ${admin.fullName}`}
      />
      <div className="mx-auto max-w-7xl px-5 py-10 lg:px-8">
        <Link
          href="/admin/users"
          className="mb-5 inline-flex text-sm font-black text-[var(--forest-700)] underline"
        >
          الرجوع إلى المستخدمين
        </Link>
        <div className="mb-7 flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-brand)]">
              <UserIcon />
            </span>
            <div>
              <h1 className="text-3xl font-extrabold">{user.fullName}</h1>
              <p className="text-sm font-bold text-[var(--color-text-secondary)]">
                {ROLE_LABELS[user.role]} · {STATUS_LABELS[user.status]}
              </p>
            </div>
          </div>
          <code className="rounded-md bg-[var(--color-surface-muted)] px-3 py-2 text-xs">
            {user.id}
          </code>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.35fr_.65fr]">
          <div className="space-y-6">
            <Section title="بيانات الحساب">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <Info label="الاسم الكامل" value={user.fullName} />
                <Info label="البريد الإلكتروني" value={user.email} ltr />
                <Info label="رقم الهاتف" value={user.phone} ltr />
                <Info label="الدور" value={ROLE_LABELS[user.role]} />
                <Info label="الحالة" value={STATUS_LABELS[user.status]} />
                <Info
                  label="طريقة الدخول"
                  value={user.passwordHash ? "كلمة مرور / Google" : "Google"}
                />
                <Info label="تاريخ التسجيل" value={date(user.createdAt)} />
                <Info label="آخر تحديث" value={date(user.updatedAt)} />
              </div>
            </Section>

            {user.creatorProfile && (
              <Section title="ملف صانع المحتوى">
                <div className="mb-4 grid gap-3 sm:grid-cols-3">
                  <Info
                    label="درجة الثقة"
                    value={`${user.creatorProfile.trustScore}/100`}
                  />
                  <Info label="المحافظة" value={user.creatorProfile.governorate} />
                  <Info
                    label="الحملات المنضم لها"
                    value={user.creatorProfile._count.memberships}
                  />
                </div>
                <div className="space-y-2">
                  {user.creatorProfile.socialAccounts.map((account) => (
                    <div
                      key={account.id}
                      className="flex flex-wrap justify-between gap-2 rounded-md border border-[var(--color-border)] p-3 text-sm"
                    >
                      <span className="font-black">
                        {account.platform} · @{account.handle}
                      </span>
                      <span className="font-bold">{account.status}</span>
                    </div>
                  ))}
                  {user.creatorProfile.socialAccounts.length === 0 && (
                    <p className="text-sm font-bold text-[var(--color-text-muted)]">
                      لا توجد حسابات اجتماعية مرتبطة.
                    </p>
                  )}
                </div>
              </Section>
            )}

            {user.brandMembers.length > 0 && (
              <Section title="العلامات التجارية المرتبطة">
                <div className="space-y-3">
                  {user.brandMembers.map((membership) => (
                    <div
                      key={membership.id}
                      className="rounded-md border border-[var(--color-border)] p-4"
                    >
                      <p className="font-black">{membership.brand.name}</p>
                      <p className="mt-1 text-xs font-bold text-[var(--color-text-secondary)]">
                        {membership.role} · {membership.brand._count.campaigns} حملة ·{" "}
                        {membership.brand.verifiedAt ? "موثقة" : "غير موثقة"}
                      </p>
                    </div>
                  ))}
                </div>
              </Section>
            )}

            <Section title="الأموال والعمليات">
              <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {user.wallets.map((wallet) => (
                  <Info
                    key={wallet.id}
                    label={`رصيد ${wallet.currency}`}
                    value={amount(wallet.balance, wallet.currency)}
                  />
                ))}
                <Info label="طلبات الإيداع" value={user._count.deposits} />
                <Info label="طلبات السحب" value={user._count.payouts} />
              </div>
              <div className="grid gap-4 lg:grid-cols-2">
                <div>
                  <h3 className="mb-2 text-sm font-black">آخر الإيداعات</h3>
                  {user.deposits.slice(0, 5).map((item) => (
                    <p
                      key={item.id}
                      className="border-t border-[var(--color-border)] py-2 text-xs font-bold"
                    >
                      {amount(item.amount, item.currency)} · {item.status} ·{" "}
                      {date(item.createdAt)}
                    </p>
                  ))}
                </div>
                <div>
                  <h3 className="mb-2 text-sm font-black">آخر السحوبات</h3>
                  {user.payouts.slice(0, 5).map((item) => (
                    <p
                      key={item.id}
                      className="border-t border-[var(--color-border)] py-2 text-xs font-bold"
                    >
                      {amount(item.amount, item.currency)} · {item.status} ·{" "}
                      {date(item.createdAt)}
                    </p>
                  ))}
                </div>
              </div>
            </Section>

            <Section title="سجل النشاط والأمان">
              <div className="space-y-3">
                {user.auditLogs.map((log) => (
                  <div
                    key={log.id}
                    className="rounded-md border border-[var(--color-border)] p-3"
                  >
                    <div className="flex flex-wrap justify-between gap-2">
                      <span className="font-black">{log.action}</span>
                      <time className="text-xs font-bold text-[var(--color-text-muted)]">
                        {date(log.createdAt)}
                      </time>
                    </div>
                    <p className="mt-1 text-xs font-bold text-[var(--color-text-secondary)]">
                      بواسطة: {log.actor?.fullName ?? log.actorEmail ?? "النظام"}
                    </p>
                    {log.after && (
                      <pre
                        className="mt-2 overflow-x-auto rounded bg-[var(--color-surface-muted)] p-2 text-left text-[11px]"
                        dir="ltr"
                      >
                        {JSON.stringify(log.after, null, 2)}
                      </pre>
                    )}
                  </div>
                ))}
                {user.auditLogs.length === 0 && (
                  <p className="text-sm font-bold text-[var(--color-text-muted)]">
                    لا يوجد نشاط مسجل لهذا الحساب.
                  </p>
                )}
              </div>
            </Section>
          </div>

          <aside className="space-y-6">
            <Section title="إجراء إداري">
              <UserStatusControl
                userId={user.id}
                currentStatus={user.status}
                canManage={canManage}
              />
            </Section>
            <Section title="ملخص النشاط">
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                <Info
                  label="نزاعات مفتوحة بواسطة المستخدم"
                  value={user._count.openedDisputes}
                />
                <Info label="إشارات احتيال" value={user._count.fraudSignals} />
                <Info label="إشعارات" value={user._count.notifications} />
              </div>
            </Section>
            <div className="rounded-[var(--radius-xl)] border border-amber-200 bg-amber-50 p-5 text-sm font-bold text-amber-900">
              التعليق والحظر يمنعان استخدام الجلسة الحالية وتسجيل الدخول الجديد. كل إجراء
              يُحفظ مع السبب وهوية المسؤول.
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
