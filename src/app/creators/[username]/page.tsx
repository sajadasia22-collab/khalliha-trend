/* eslint-disable @next/next/no-img-element -- URLs are restricted to the configured profile image store; avoid turning Next into an open image proxy. */
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Footer } from "../../../components/layout/Footer";
import { Navbar } from "../../../components/layout/Navbar";
import { FollowButton } from "../../../components/creator/FollowButton";
import { ProfileShareButton } from "../../../components/creator/ProfileShareButton";
import { getCurrentUser } from "../../../lib/auth/session";
import { platformIcons } from "../../../lib/campaigns";
import { categoryLabels, platformLabels } from "../../../lib/campaigns";
import { CreatorProfileService } from "../../../modules/creator/service";
import { FollowService } from "../../../modules/follows/service";
import {
  ArrowUpRightIcon,
  BriefcaseIcon,
  CheckIcon,
  LinkIcon,
  UserIcon,
  SettingsIcon,
} from "../../../components/ui/icons";

type PageProps = { params: Promise<{ username: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { username } = await params;
  const profile = await CreatorProfileService.getPublicByUsername(username);

  if (!profile) return { title: "صانع المحتوى غير موجود — خلّيها ترند" };
  return {
    title: `${profile.user.fullName} (@${profile.username}) — خلّيها ترند`,
    description: profile.bio ?? `الملف المهني لصانع المحتوى ${profile.user.fullName}.`,
  };
}

export default async function PublicCreatorProfilePage({ params }: PageProps) {
  const { username } = await params;
  const [profile, viewer] = await Promise.all([
    CreatorProfileService.getPublicByUsername(username),
    getCurrentUser(),
  ]);
  if (!profile || !profile.username) notFound();

  const followState = await FollowService.getState(viewer?.id ?? null, profile.user.id);

  const completedCampaigns = profile.memberships.filter(
    (membership) => membership.campaign.status === "COMPLETED",
  ).length;
  const isSociallyVerified = profile.socialAccounts.length > 0;

  return (
    <div className="flex min-h-screen flex-col bg-[var(--color-bg)] text-[var(--color-text)]">
      <Navbar />
      <main className="flex-1 pb-16" dir="rtl">
        <section className="relative h-56 overflow-hidden bg-[var(--color-surface-dark)] sm:h-72">
          {profile.coverUrl ? (
            <img
              src={profile.coverUrl}
              alt={`غلاف ملف ${profile.user.fullName}`}
              className="h-full w-full object-cover"
            />
          ) : (
            <div
              className="absolute inset-0"
              style={{
                background:
                  "radial-gradient(circle at 20% 25%, rgba(214,246,29,.62), transparent 22%), radial-gradient(circle at 78% 45%, rgba(231,237,233,.18), transparent 30%), linear-gradient(135deg, var(--forest-700), var(--forest-900))",
              }}
              aria-hidden="true"
            />
          )}
          <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_52%,rgba(6,38,25,.46))]" />
        </section>

        <div className="mx-auto max-w-6xl px-4 sm:px-5 lg:px-8">
          <section className="relative -mt-16 rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-lg)] sm:p-8">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-end">
              <div className="h-28 w-28 flex-shrink-0 overflow-hidden rounded-full border-[6px] border-[var(--color-surface)] bg-[var(--color-brand)] shadow-[var(--shadow-md)] sm:h-36 sm:w-36">
                {profile.avatarUrl ? (
                  <img
                    src={profile.avatarUrl}
                    alt={`الصورة الشخصية لـ ${profile.user.fullName}`}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="flex h-full w-full items-center justify-center text-5xl font-black text-[var(--color-text-on-brand)]">
                    {profile.user.fullName.slice(0, 1)}
                  </span>
                )}
              </div>

              <div className="min-w-0 flex-1 pb-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-3xl font-black sm:text-4xl">
                    {profile.user.fullName}
                  </h1>
                  {isSociallyVerified && (
                    <span
                      className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[var(--color-brand)] text-[var(--color-text-on-brand)]"
                      title="لديه حساب اجتماعي موثّق"
                      aria-label="لديه حساب اجتماعي موثّق"
                    >
                      <CheckIcon size={16} strokeWidth={3} aria-hidden="true" />
                    </span>
                  )}
                </div>
                <p
                  className="mt-1 font-bold text-[var(--color-text-secondary)]"
                  dir="ltr"
                >
                  @{profile.username}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {profile.contentCategories.map((category) => (
                    <span
                      key={category}
                      className="rounded-[var(--radius-pill)] bg-[rgba(214,246,29,.18)] px-3 py-1 text-xs font-black text-[var(--color-brand-active)]"
                    >
                      {categoryLabels[category]}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <FollowButton
                  username={profile.username}
                  isAuthenticated={Boolean(viewer)}
                  isOwnProfile={followState.isOwnProfile}
                  initialIsFollowing={followState.isFollowing}
                  initialFollowersCount={followState.followersCount}
                  followingCount={followState.followingCount}
                />
                <ProfileShareButton fullName={profile.user.fullName} />
                {followState.isOwnProfile && (
                  <a
                    href="/creator/profile"
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[var(--radius-pill)] bg-[var(--color-text)] px-4 text-sm font-black text-[var(--color-bg)]"
                  >
                    <SettingsIcon size={17} /> تعديل الملف
                  </a>
                )}
              </div>
            </div>
          </section>

          <nav
            aria-label="أقسام الملف الشخصي"
            className="sticky top-[69px] z-10 mt-4 flex gap-2 overflow-x-auto rounded-[var(--radius-pill)] border border-[var(--color-border)] bg-[var(--color-surface)] p-1.5 shadow-[var(--shadow-sm)]"
          >
            {[
              ["#about", "نبذة"],
              ["#work", "الأعمال"],
              ["#accounts", "الحسابات"],
              ["#profile-stats", "المؤشرات"],
            ].map(([href, label]) => (
              <a
                key={href}
                href={href}
                className="flex-shrink-0 rounded-[var(--radius-pill)] px-4 py-2 text-xs font-black transition hover:bg-[var(--color-brand)]"
              >
                {label}
              </a>
            ))}
          </nav>

          <div className="mt-8 grid gap-7 lg:grid-cols-[1fr_320px]">
            <div className="space-y-7">
              <section
                id="about"
                className="scroll-mt-36 rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-sm)]"
              >
                <div className="mb-4 flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-surface-muted)] text-[var(--color-brand-active)]">
                    <UserIcon aria-hidden="true" />
                  </span>
                  <h2 className="text-xl font-black">عن صانع المحتوى</h2>
                </div>
                <p className="whitespace-pre-line leading-8 text-[var(--color-text-secondary)]">
                  {profile.bio || "لم يضف صانع المحتوى نبذة بعد."}
                </p>
              </section>

              {profile.portfolioItems.length > 0 && (
                <section
                  id="work"
                  className="scroll-mt-36 rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-sm)]"
                >
                  <div className="mb-5 flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-brand)] text-[var(--color-text-on-brand)]">
                      <BriefcaseIcon aria-hidden="true" />
                    </span>
                    <div>
                      <h2 className="text-xl font-black">أعمال مختارة</h2>
                      <p className="text-xs text-[var(--color-text-muted)]">
                        روابط أصلية لأعمال نشرها صانع المحتوى.
                      </p>
                    </div>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {profile.portfolioItems.map((item) => {
                      const PlatformIcon = platformIcons[item.platform];
                      return (
                        <a
                          key={item.id}
                          href={item.projectUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="group overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface-muted)] transition hover:-translate-y-1 hover:border-[var(--color-brand)] hover:shadow-[var(--shadow-md)]"
                        >
                          <div className="relative aspect-[16/10] overflow-hidden bg-[var(--color-surface-dark)]">
                            {item.thumbnailUrl ? (
                              <img
                                src={item.thumbnailUrl}
                                alt={`صورة عمل: ${item.title}`}
                                className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]"
                              />
                            ) : (
                              <div className="flex h-full items-center justify-center bg-[radial-gradient(circle_at_20%_20%,rgba(214,246,29,.38),transparent_28%),linear-gradient(135deg,var(--forest-700),var(--forest-900))]">
                                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-surface)] text-[var(--color-text)]">
                                  <PlatformIcon />
                                </span>
                              </div>
                            )}
                            <span className="absolute left-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-[rgba(6,38,25,.8)] text-[var(--color-text-on-dark)] backdrop-blur-md">
                              <ArrowUpRightIcon size={15} aria-hidden="true" />
                            </span>
                          </div>
                          <div className="p-4">
                            <p className="text-[10px] font-black text-[var(--color-brand-active)]">
                              {platformLabels[item.platform]}
                            </p>
                            <h3 className="mt-1 line-clamp-2 font-black">{item.title}</h3>
                            {item.description && (
                              <p className="mt-2 line-clamp-2 text-xs leading-5 text-[var(--color-text-secondary)]">
                                {item.description}
                              </p>
                            )}
                          </div>
                        </a>
                      );
                    })}
                  </div>
                </section>
              )}

              <section
                id="accounts"
                className="scroll-mt-36 rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-sm)]"
              >
                <div className="mb-5 flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-surface-muted)] text-[var(--color-brand-active)]">
                    <LinkIcon aria-hidden="true" />
                  </span>
                  <div>
                    <h2 className="text-xl font-black">الحسابات الموثّقة</h2>
                    <p className="text-xs text-[var(--color-text-muted)]">
                      روابط تم التحقق منها عبر مراجعة المنصة.
                    </p>
                  </div>
                </div>
                {profile.socialAccounts.length ? (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {profile.socialAccounts.map((account) => {
                      const PlatformIcon = platformIcons[account.platform];
                      return (
                        <a
                          key={account.id}
                          href={account.profileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="group flex items-center gap-3 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-4 transition hover:border-[var(--color-brand)]"
                        >
                          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-surface)]">
                            <PlatformIcon />
                          </span>
                          <span className="min-w-0">
                            <span className="block text-xs font-bold text-[var(--color-text-muted)]">
                              {platformLabels[account.platform]}
                            </span>
                            <span className="block truncate font-black" dir="ltr">
                              @{account.handle}
                            </span>
                          </span>
                        </a>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-[var(--color-text-secondary)]">
                    لا توجد حسابات اجتماعية موثّقة ظاهرة حالياً.
                  </p>
                )}
              </section>
            </div>

            <aside className="space-y-5">
              <section
                id="profile-stats"
                className="scroll-mt-36 overflow-hidden rounded-[var(--radius-xl)] bg-[var(--color-surface-dark)] p-6 text-[var(--color-text-on-dark)] shadow-[var(--shadow-md)]"
              >
                <p className="text-xs font-black text-[var(--color-brand)]">
                  مؤشرات الملف
                </p>
                <dl className="mt-5 grid grid-cols-2 gap-4">
                  <div>
                    <dt className="text-xs text-[var(--forest-100)]">مستوى الثقة</dt>
                    <dd className="mt-1 text-2xl font-black text-[var(--color-brand)]">
                      {profile.trustScore}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-[var(--forest-100)]">حملات مكتملة</dt>
                    <dd className="mt-1 text-2xl font-black">{completedCampaigns}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-[var(--forest-100)]">حسابات موثقة</dt>
                    <dd className="mt-1 text-2xl font-black">
                      {profile.socialAccounts.length}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-[var(--forest-100)]">عضو منذ</dt>
                    <dd className="mt-1 text-sm font-black">
                      {profile.user.createdAt.toLocaleDateString("ar-IQ", {
                        month: "short",
                        year: "numeric",
                      })}
                    </dd>
                  </div>
                </dl>
              </section>

              <section className="rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
                <h2 className="font-black">الموقع واللغات</h2>
                <dl className="mt-4 space-y-4 text-sm">
                  <div>
                    <dt className="text-xs font-bold text-[var(--color-text-muted)]">
                      الموقع
                    </dt>
                    <dd className="mt-1 font-bold">
                      {[profile.governorate, profile.country].filter(Boolean).join("، ")}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-bold text-[var(--color-text-muted)]">
                      اللغات
                    </dt>
                    <dd className="mt-2 flex flex-wrap gap-2">
                      {profile.languages.length
                        ? profile.languages.map((language) => (
                            <span
                              key={language}
                              className="rounded-[var(--radius-pill)] bg-[var(--color-surface-muted)] px-3 py-1 text-xs font-bold"
                            >
                              {language}
                            </span>
                          ))
                        : "غير محددة"}
                    </dd>
                  </div>
                </dl>
              </section>
            </aside>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
