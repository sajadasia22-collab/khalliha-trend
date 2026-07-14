import { redirect } from "next/navigation";
import { ConversationReportsClient } from "../../../../components/admin/ConversationReportsClient";
import { DashboardHeader } from "../../../../components/layout/DashboardHeader";
import { getCurrentUser } from "../../../../lib/auth/session";
import { MessagingService } from "../../../../modules/messaging/service";

export const dynamic = "force-dynamic";

export default async function MessageReportsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN") redirect("/unauthorized");
  const reports = await MessagingService.listReports();
  return (
    <main
      className="dashboard-page min-h-screen pb-24 text-[var(--color-text)] md:ps-64 md:pb-0"
      dir="rtl"
    >
      <DashboardHeader dashboardRole="admin" userLabel={`إدارة: ${user.fullName}`} />
      <section className="mx-auto max-w-5xl px-5 py-8 lg:px-8">
        <div className="mb-6">
          <h1 className="text-3xl font-black">بلاغات الرسائل</h1>
          <p className="mt-2 text-[var(--color-text-secondary)]">
            مراجعة بلاغات محادثات الحملات مع الاحتفاظ بأثر التدقيق.
          </p>
        </div>
        <ConversationReportsClient
          initialItems={reports.map((item) => ({
            ...item,
            createdAt: item.createdAt.toISOString(),
          }))}
        />
      </section>
    </main>
  );
}
