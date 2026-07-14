import { redirect } from "next/navigation";
import { CommunityReportsClient } from "../../../../components/admin/CommunityReportsClient";
import { DashboardHeader } from "../../../../components/layout/DashboardHeader";
import { getCurrentUser } from "../../../../lib/auth/session";
import { CommunityService } from "../../../../modules/community/service";

export default async function AdminCommunityPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN") redirect("/unauthorized");
  const reports = await CommunityService.listReports();

  return (
    <main className="min-h-screen bg-[var(--color-bg)] pb-20 text-[var(--color-text)] md:ps-64 md:pb-0">
      <DashboardHeader dashboardRole="admin" userLabel={`الإدارة: ${user.fullName}`} />
      <section className="mx-auto max-w-6xl px-5 py-12 lg:px-8">
        <span className="rounded-full bg-[rgba(214,246,29,.18)] px-3 py-1 text-xs font-black text-[var(--color-brand-active)]">
          الإشراف البشري
        </span>
        <h1 className="mt-3 text-3xl font-black">بلاغات المجتمع</h1>
        <p className="mt-2 max-w-2xl text-sm leading-7 text-[var(--color-text-secondary)]">
          راجع المحتوى المُبلّغ عنه واتخذ قراراً موثقاً. لا يُحذف المحتوى تلقائياً بمجرد
          البلاغ.
        </p>
        <div className="mt-8">
          <CommunityReportsClient initialReports={JSON.parse(JSON.stringify(reports))} />
        </div>
      </section>
    </main>
  );
}
