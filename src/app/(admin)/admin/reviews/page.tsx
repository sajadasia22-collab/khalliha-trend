import { redirect } from "next/navigation";
import { getCurrentUser } from "../../../../lib/auth/session";
import { BrandProfileService } from "../../../../modules/brand/service";
import { SocialAccountService } from "../../../../modules/social-accounts/service";
import { CampaignService } from "../../../../modules/campaigns/service";
import { SubmissionService } from "../../../../modules/submissions/service";
import { ReviewQueues } from "../../../../components/admin/ReviewQueues";
import { DashboardHeader } from "../../../../components/layout/DashboardHeader";
import { prisma } from "../../../../lib/prisma";
import { ClipboardCheckIcon } from "../../../../components/ui/icons";

export default async function AdminReviewsPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const [brandVerifications, socialAccounts, campaigns, submissions] = await Promise.all([
    BrandProfileService.listPendingVerifications(),
    SocialAccountService.listPending(),
    CampaignService.listPendingReview(),
    SubmissionService.listPendingSubmissionsForAdmin(),
  ]);

  const pendingDeposits = await prisma.deposit.findMany({
    where: { status: "PENDING" },
    include: { user: true },
    orderBy: { createdAt: "asc" },
  });

  const pendingPayouts = await prisma.payoutRequest.findMany({
    where: { status: "PENDING" },
    include: { user: true },
    orderBy: { createdAt: "asc" },
  });

  const totalPending =
    brandVerifications.length +
    socialAccounts.length +
    campaigns.length +
    submissions.filter((item) => item.status !== "APPROVED").length +
    pendingDeposits.length +
    pendingPayouts.length;

  return (
    <main className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)] dir-rtl md:ps-64 pb-20 md:pb-0">
      <DashboardHeader
        dashboardRole="admin"
        userLabel={`${user?.role === "SUPER_ADMIN" ? "مدير النظام" : "مشرف"}: ${user?.fullName}`}
      />

      <section className="mx-auto max-w-7xl px-5 py-12 lg:px-8">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-surface-muted)] text-[var(--forest-500)]">
              <ClipboardCheckIcon />
            </span>
            <h1 className="text-3xl font-extrabold">قائمة المراجعات</h1>
          </div>
          {totalPending > 0 && (
            <span className="rounded-[var(--radius-pill)] bg-[var(--color-brand)] px-3 py-1 text-xs font-black text-[var(--color-text-on-brand)]">
              {totalPending} عنصر بانتظار المراجعة
            </span>
          )}
        </div>

        <ReviewQueues
          initialBrandVerifications={brandVerifications.map((item) => ({
            id: item.id,
            requestedAt: item.requestedAt.toISOString(),
            brand: {
              id: item.brand.id,
              name: item.brand.name,
              slug: item.brand.slug,
              description: item.brand.description,
            },
          }))}
          initialSocialAccounts={socialAccounts.map((item) => ({
            id: item.id,
            platform: item.platform,
            handle: item.handle,
            profileUrl: item.profileUrl,
            creatorProfile: {
              user: {
                fullName: item.creatorProfile.user.fullName,
                email: item.creatorProfile.user.email,
              },
            },
          }))}
          initialCampaigns={campaigns.map((item) => ({
            id: item.id,
            title: item.title,
            summary: item.summary,
            currency: item.currency,
            totalBudget: item.totalBudget.toString(),
            brand: { id: item.brand.id, name: item.brand.name, slug: item.brand.slug },
          }))}
          initialSubmissions={submissions.map((item) => ({
            id: item.id,
            platform: item.platform,
            postUrl: item.postUrl,
            platformPostId: item.platformPostId,
            status: item.status,
            createdAt: item.createdAt.toISOString(),
            creator: {
              fullName: item.socialAccount.creatorProfile.user.fullName,
              email: item.socialAccount.creatorProfile.user.email,
            },
            campaign: {
              title: item.campaignMembership.campaign.title,
            },
          }))}
          initialDeposits={pendingDeposits.map((item) => ({
            id: item.id,
            amount: item.amount.toString(),
            currency: item.currency,
            referenceNumber: item.referenceNumber,
            note: item.note,
            createdAt: item.createdAt.toISOString(),
            user: {
              fullName: item.user.fullName,
              email: item.user.email,
            },
          }))}
          initialPayouts={pendingPayouts.map((item) => ({
            id: item.id,
            amount: item.amount.toString(),
            currency: item.currency,
            payoutMethod: item.payoutMethod,
            recipientDetails: item.recipientDetails,
            createdAt: item.createdAt.toISOString(),
            user: {
              fullName: item.user.fullName,
              email: item.user.email,
            },
          }))}
        />
      </section>
    </main>
  );
}
