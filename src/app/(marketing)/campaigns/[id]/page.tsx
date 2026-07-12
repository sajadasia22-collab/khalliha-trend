import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "../../../../lib/prisma";
import { CampaignStatus } from "../../../../generated/prisma/enums";
import { categoryLabels, platformLabels, formatBudget } from "../../../../lib/campaigns";
import { ButtonLink } from "../../../../components/ui/button";
import { getCurrentUser } from "../../../../lib/auth/session";
import { MembershipService } from "../../../../modules/memberships/service";
import { SocialAccountService } from "../../../../modules/social-accounts/service";
import { CampaignJoinAndSubmit } from "../../../../components/campaigns/CampaignJoinAndSubmit";

export default async function CampaignDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let campaign;
  try {
    campaign = await prisma.campaign.findFirst({
      where: { id, status: CampaignStatus.ACTIVE },
      include: { brand: true, rates: true },
    });
  } catch {
    return (
      <main className="mx-auto max-w-4xl px-5 py-12 lg:px-8">
        <div className="card border border-[var(--color-border)] bg-[var(--color-surface)] p-8 text-center">
          <p className="font-bold text-[var(--color-text)]">
            تعذّر الاتصال بقاعدة البيانات حالياً.
          </p>
          <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
            حاول تحديث الصفحة بعد قليل.
          </p>
        </div>
      </main>
    );
  }

  if (!campaign) {
    notFound();
  }

  const user = await getCurrentUser();
  let isJoined = false;
  let verifiedSocialAccounts: Array<{
    id: string;
    platform: "TIKTOK" | "INSTAGRAM" | "FACEBOOK" | "YOUTUBE";
    handle: string;
    profileUrl: string;
  }> = [];
  let initialSubmissions: Array<{
    id: string;
    platform: "TIKTOK" | "INSTAGRAM" | "FACEBOOK" | "YOUTUBE";
    postUrl: string;
    platformPostId: string;
    status: string;
    rejectionReason: string | null;
    reviewNote: string | null;
    createdAt: string;
    socialAccount?: {
      handle: string;
    };
  }> = [];

  if (user && user.role === "CREATOR") {
    const membership = await MembershipService.getMembership(user.id, campaign.id);
    isJoined = !!membership;

    const accounts = await SocialAccountService.listForUser(user.id);
    verifiedSocialAccounts = accounts.filter((acc) => acc.status === "VERIFIED");

    if (isJoined && membership) {
      const rawSubs = await prisma.submission.findMany({
        where: { campaignMembershipId: membership.id },
        include: { socialAccount: true },
        orderBy: { createdAt: "desc" },
      });
      initialSubmissions = rawSubs.map((sub) => ({
        ...sub,
        createdAt: sub.createdAt.toISOString(),
      }));
    }
  }

  return (
    <main className="mx-auto max-w-4xl px-5 py-12 lg:px-8">
      <Link
        href="/campaigns"
        className="group mb-6 inline-flex items-center gap-1.5 text-sm font-bold text-[var(--color-text-secondary)] transition-colors duration-150 hover:text-[var(--forest-700)]"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          aria-hidden="true"
          className="transition-transform duration-200 ease-[cubic-bezier(.2,.8,.2,1)] group-hover:translate-x-0.5"
        >
          <path
            d="M6 4l4 4-4 4"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        العودة لقائمة الحملات
      </Link>

      {campaign.thumbnailUrl && (
        // thumbnailUrl is an unrestricted external URL (no host allowlist), so next/image's
        // remotePatterns would need to accept any host — that turns the optimizer into an
        // open image proxy. Plain <img> avoids that risk.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={campaign.thumbnailUrl}
          alt={campaign.title}
          loading="eager"
          fetchPriority="high"
          decoding="async"
          className="fade-in-up mb-6 aspect-[21/9] w-full rounded-[var(--radius-lg)] object-cover shadow-[var(--shadow-lg)]"
        />
      )}

      <span
        className="fade-in-up mb-3 inline-block rounded-[var(--radius-pill)] bg-[var(--color-surface-muted)] px-3 py-1 text-xs font-bold text-[var(--color-text-secondary)]"
        style={{ animationDelay: "60ms" }}
      >
        {categoryLabels[campaign.category]}
      </span>

      <h1
        className="fade-in-up text-3xl font-extrabold text-[var(--color-text)]"
        style={{ animationDelay: "100ms" }}
      >
        {campaign.title}
      </h1>
      <p className="mt-2 flex items-center gap-1.5 text-sm font-semibold text-[var(--color-text-secondary)]">
        {campaign.brand.name}
        {campaign.brand.verifiedAt && (
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            aria-label="علامة موثّقة"
          >
            <circle cx="12" cy="12" r="10" fill="var(--color-brand)" />
            <path
              d="M8 12.5l2.5 2.5L16 9"
              stroke="var(--forest-800)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </p>

      <p className="mt-6 leading-relaxed text-[var(--color-text)]">{campaign.summary}</p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <div className="card border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
          <h2 className="text-xs font-bold text-[var(--color-text-secondary)]">
            الميزانية الكلية
          </h2>
          <p className="mt-2 text-xl font-black text-[var(--forest-700)]">
            {formatBudget(campaign.totalBudget, campaign.currency)}
          </p>
        </div>
        <div className="card border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
          <h2 className="text-xs font-bold text-[var(--color-text-secondary)]">
            الميزانية المحجوزة حالياً
          </h2>
          <p className="mt-2 text-xl font-black text-[var(--forest-700)]">
            {formatBudget(campaign.reservedBudget, campaign.currency)}
          </p>
        </div>
      </div>

      <div className="mt-8">
        <h2 className="mb-4 text-lg font-extrabold text-[var(--color-text)]">
          شروط كل منصة
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {campaign.rates.map((rate) => (
            <div
              key={rate.platform}
              className="card border border-[var(--color-border)] bg-[var(--color-surface)] p-6"
            >
              <h3 className="font-extrabold text-[var(--color-text)]">
                {platformLabels[rate.platform]}
              </h3>
              <dl className="mt-3 space-y-1.5 text-sm text-[var(--color-text-secondary)]">
                <div className="flex justify-between">
                  <dt>CPM (لكل 1000 مشاهدة مؤهلة)</dt>
                  <dd className="font-bold text-[var(--color-text)]">
                    {rate.cpmMinorUnits.toString()} {campaign.currency}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt>الحد الأدنى للمشاهدات المؤهلة</dt>
                  <dd className="font-bold text-[var(--color-text)]">
                    {rate.minimumQualifiedViews.toString()}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt>الحد الأقصى للأرباح لكل فيديو</dt>
                  <dd className="font-bold text-[var(--color-text)]">
                    {rate.maximumReward.toString()} {campaign.currency}
                  </dd>
                </div>
              </dl>
            </div>
          ))}
        </div>
      </div>

      {user ? (
        user.role === "CREATOR" ? (
          <CampaignJoinAndSubmit
            campaignId={campaign.id}
            minTrustScore={campaign.minTrustScore}
            creatorTrustScore={user.creatorProfile?.trustScore ?? 50}
            rates={campaign.rates.map((rate) => ({ platform: rate.platform }))}
            isInitiallyJoined={isJoined}
            verifiedSocialAccounts={verifiedSocialAccounts.map((acc) => ({
              id: acc.id,
              platform: acc.platform,
              handle: acc.handle,
              profileUrl: acc.profileUrl,
            }))}
            initialSubmissions={initialSubmissions}
          />
        ) : (
          <div className="mt-10 card border border-[var(--color-border)] bg-[var(--color-surface)] p-8 text-center text-sm font-bold text-[var(--color-text-secondary)]">
            أنت مسجل كـ {user.role === "BRAND" ? "علامة تجارية" : "مسؤول نظام"}. فقط صناع
            المحتوى يمكنهم الانضمام وتقديم منشورات للحملات.
          </div>
        )
      ) : (
        <div className="mt-10 card border border-[var(--forest-500)] bg-[var(--color-surface-dark)] p-8 text-[var(--color-text-on-dark)]">
          <h2 className="text-xl font-bold text-[var(--color-brand)]">
            مهتم بالانضمام لهذه الحملة؟
          </h2>
          <p className="mt-2 max-w-xl text-sm font-medium leading-relaxed text-[var(--forest-100)]">
            سجّل كصانع محتوى لإكمال ملفك الشخصي وربط حساباتك، ثم انضم للحملة بعد تحقق
            الأهلية.
          </p>
          <ButtonLink className="mt-6 inline-flex" href="/register">
            سجّل كصانع محتوى
          </ButtonLink>
        </div>
      )}
    </main>
  );
}
