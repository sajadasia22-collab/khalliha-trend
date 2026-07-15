import { redirect } from "next/navigation";
import { getCurrentUser } from "../../../../lib/auth/session";
import { CreatorProfileService } from "../../../../modules/creator/service";
import { FollowService } from "../../../../modules/follows/service";
import { DashboardHeader } from "../../../../components/layout/DashboardHeader";
import { CreatorProfileHub } from "../../../../components/creator/CreatorProfileHub";
import { SocialAccountStatus } from "../../../../generated/prisma/enums";

export default async function CreatorProfilePage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const [profile, followState] = await Promise.all([
    CreatorProfileService.getByUserId(user.id),
    FollowService.getState(user.id, user.id),
  ]);

  return (
    <main
      className="dashboard-page min-h-screen bg-[var(--color-bg)] pb-24 text-[var(--color-text)] md:ps-64 md:pb-0"
      dir="rtl"
    >
      <DashboardHeader
        dashboardRole="creator"
        userLabel={`صانع محتوى: ${user.fullName}`}
      />

      <section className="mx-auto max-w-5xl">
        <CreatorProfileHub
          fullName={user.fullName}
          username={profile?.username ?? ""}
          bio={profile?.bio ?? ""}
          avatarUrl={profile?.avatarUrl ?? ""}
          governorate={profile?.governorate ?? ""}
          contentCategories={profile?.contentCategories ?? []}
          isProfilePublic={profile?.isProfilePublic ?? true}
          followersCount={followState.followersCount}
          followingCount={followState.followingCount}
          verifiedPlatforms={
            profile?.socialAccounts
              .filter((account) => account.status === SocialAccountStatus.VERIFIED)
              .map((account) => account.platform) ?? []
          }
          portfolioItems={
            profile?.portfolioItems.map((item) => ({
              id: item.id,
              title: item.title,
              description: item.description,
              platform: item.platform,
              projectUrl: item.projectUrl,
              thumbnailUrl: item.thumbnailUrl,
              sortOrder: item.sortOrder,
            })) ?? []
          }
          socialAccounts={
            profile?.socialAccounts.map((account) => ({
              id: account.id,
              platform: account.platform,
              handle: account.handle,
              profileUrl: account.profileUrl,
              status: account.status,
              rejectionReason: account.rejectionReason,
            })) ?? []
          }
          profileFormProps={{
            initialUsername: profile?.username ?? "",
            initialBio: profile?.bio ?? "",
            initialAvatarUrl: profile?.avatarUrl ?? "",
            initialCoverUrl: profile?.coverUrl ?? "",
            initialCountry: profile?.country ?? "IQ",
            initialGovernorate: profile?.governorate ?? "",
            initialContentCategories: profile?.contentCategories ?? [],
            initialLanguages: profile?.languages ?? [],
            initialIsProfilePublic: profile?.isProfilePublic ?? true,
          }}
        />
      </section>
    </main>
  );
}
