import { redirect } from "next/navigation";
import { FraudQueueClient } from "../../../../components/admin/FraudQueueClient";
import { DashboardHeader } from "../../../../components/layout/DashboardHeader";
import { getCurrentUser } from "../../../../lib/auth/session";
import { FraudService } from "../../../../modules/fraud/service";
import { ShieldAlertIcon } from "../../../../components/ui/icons";

export default async function AdminFraudPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN") redirect("/unauthorized");

  const queue = await FraudService.listQueue();

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
              <ShieldAlertIcon />
            </span>
            <div>
              <h1 className="text-3xl font-extrabold">قائمة مكافحة الاحتيال</h1>
              <p className="text-sm font-medium text-[var(--color-text-secondary)]">
                مراجعة بشرية للحالات التي رفعتها قواعد الاحتيال المبدئية.
              </p>
            </div>
          </div>
          {queue.length > 0 && (
            <span className="rounded-[var(--radius-pill)] bg-[var(--color-brand)] px-3 py-1 text-xs font-black text-[var(--color-text-on-brand)]">
              {queue.length} حالة قيد المراجعة
            </span>
          )}
        </div>
        <FraudQueueClient
          initialItems={queue.map((item) => ({
            id: item.id,
            submissionId: item.submissionId,
            fraudScore: item.fraudScore,
            riskLevel: item.riskLevel,
            status: item.status,
            campaignTitle: item.submission.campaignMembership.campaign.title,
            brandName: item.submission.campaignMembership.campaign.brand.name,
            creatorName: item.submission.socialAccount.creatorProfile.user.fullName,
            postUrl: item.submission.postUrl,
            signals: item.submission.fraudSignals.map((signal) => ({
              id: signal.id,
              kind: signal.kind,
              scoreImpact: signal.scoreImpact,
              note: signal.note,
            })),
          }))}
        />
      </section>
    </main>
  );
}
