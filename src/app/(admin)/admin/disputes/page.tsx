import { redirect } from "next/navigation";
import { DisputesClient } from "../../../../components/admin/DisputesClient";
import { DashboardHeader } from "../../../../components/layout/DashboardHeader";
import { getCurrentUser } from "../../../../lib/auth/session";
import { DisputeService } from "../../../../modules/disputes/service";
import { AlertTriangleIcon } from "../../../../components/ui/icons";
import { ACTIVE_DISPUTE_STATUSES } from "../../../../modules/disputes/service";

export default async function AdminDisputesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN") redirect("/unauthorized");

  const disputes = await DisputeService.listForAdmin();
  const activeCount = disputes.filter((item) =>
    (ACTIVE_DISPUTE_STATUSES as readonly string[]).includes(item.status),
  ).length;

  return (
    <main className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)] dir-rtl md:ps-64 pb-20 md:pb-0">
      <DashboardHeader
        dashboardRole="admin"
        userLabel={`${user.role === "SUPER_ADMIN" ? "مدير النظام" : "مشرف"}: ${user.fullName}`}
      />

      <section className="mx-auto max-w-7xl px-5 py-12 lg:px-8">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-surface-muted)] text-[var(--forest-500)]">
              <AlertTriangleIcon />
            </span>
            <div>
              <h1 className="text-3xl font-extrabold">النزاعات</h1>
              <p className="text-sm font-medium text-[var(--color-text-secondary)]">
                مراجعة اعتراضات صناع المحتوى والعلامات التجارية وحلها.
              </p>
            </div>
          </div>
          {activeCount > 0 && (
            <span className="rounded-[var(--radius-pill)] bg-[var(--color-brand)] px-3 py-1 text-xs font-black text-[var(--color-text-on-brand)]">
              {activeCount} نزاع نشط
            </span>
          )}
        </div>
        <DisputesClient
          currentUserId={user.id}
          initialItems={disputes.map((item) => ({
            id: item.id,
            title: item.title,
            reason: item.reason,
            status: item.status,
            description: item.description,
            openedBy: item.openedBy,
            campaignTitle: item.submission.campaignMembership.campaign.title,
            creatorName: item.submission.socialAccount.creatorProfile.user.fullName,
            brandName: item.submission.campaignMembership.campaign.brand.name,
            messages: item.messages.map((message) => ({
              id: message.id,
              body: message.body,
              createdAt: message.createdAt.toISOString(),
              sender: message.sender,
            })),
          }))}
        />
      </section>
    </main>
  );
}
