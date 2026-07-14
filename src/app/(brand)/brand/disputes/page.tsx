import { redirect } from "next/navigation";
import { DashboardHeader } from "../../../../components/layout/DashboardHeader";
import { DisputeCenter } from "../../../../components/disputes/DisputeCenter";
import { getCurrentUser } from "../../../../lib/auth/session";
import { DisputeService } from "../../../../modules/disputes/service";

export const dynamic = "force-dynamic";

export default async function BrandDisputesPage({
  searchParams,
}: {
  searchParams: Promise<{ submission?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "BRAND") redirect("/unauthorized");
  const [disputes, submissions] = await Promise.all([
    DisputeService.listForUser(user.id),
    DisputeService.listEligibleSubmissions(user.id),
  ]);
  const { submission } = await searchParams;
  return (
    <main
      className="dashboard-page min-h-screen pb-24 text-[var(--color-text)] md:ps-64 md:pb-0"
      dir="rtl"
    >
      <DashboardHeader
        dashboardRole="brand"
        userLabel={`العلامة التجارية: ${user.brandMembers?.[0]?.brand.name ?? user.fullName}`}
      />
      <section className="mx-auto max-w-7xl px-5 py-10 lg:px-8">
        <DisputeCenter
          currentUserId={user.id}
          initialSubmissionId={submission}
          initialItems={disputes.map((item) => ({
            id: item.id,
            title: item.title,
            reason: item.reason,
            status: item.status,
            description: item.description,
            resolutionNote: item.resolutionNote,
            createdAt: item.createdAt.toISOString(),
            openedBy: item.openedBy,
            submission: {
              id: item.submissionId,
              postUrl: item.submission.postUrl,
              campaignTitle: item.submission.campaignMembership.campaign.title,
              creatorName: item.submission.socialAccount.creatorProfile.user.fullName,
              brandName: item.submission.campaignMembership.campaign.brand.name,
            },
            messages: item.messages.map((message) => ({
              id: message.id,
              body: message.body,
              createdAt: message.createdAt.toISOString(),
              sender: message.sender,
            })),
            attachments: item.attachments.map((attachment) => ({
              id: attachment.id,
              fileName: attachment.fileName,
              mimeType: attachment.mimeType,
              sizeBytes: attachment.sizeBytes,
              createdAt: attachment.createdAt.toISOString(),
              uploadedBy: attachment.uploadedBy,
            })),
          }))}
          eligibleSubmissions={submissions.map((item) => ({
            id: item.id,
            postUrl: item.postUrl,
            platform: item.platform,
            status: item.status,
            createdAt: item.createdAt.toISOString(),
            campaignTitle: item.campaignMembership.campaign.title,
            hasActiveDispute: item.disputes.length > 0,
          }))}
        />
      </section>
    </main>
  );
}
