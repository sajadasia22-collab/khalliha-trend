"use client";

/* eslint-disable @next/next/no-img-element -- profile media comes from the configured Supabase bucket; avoid an open image proxy. */

import { useCallback, useState } from "react";
import Link from "next/link";
import type {
  CampaignCategory,
  Platform,
  SocialAccountStatus,
} from "../../generated/prisma/enums";
import { categoryLabels, platformIcons, platformLabels } from "../../lib/campaigns";
import {
  ArrowUpRightIcon,
  BriefcaseIcon,
  ChevronDownIcon,
  LinkIcon,
  SettingsIcon,
} from "../ui/icons";
import { ProfileForm } from "./ProfileForm";
import { PortfolioManager } from "./PortfolioManager";
import { SocialAccountsManager } from "./SocialAccountsManager";
import { ProfileShareButton } from "./ProfileShareButton";

type PortfolioItem = {
  id: string;
  title: string;
  description: string | null;
  platform: Platform;
  projectUrl: string;
  thumbnailUrl: string | null;
  sortOrder: number;
};

type SocialAccount = {
  id: string;
  platform: Platform;
  handle: string;
  profileUrl: string;
  status: SocialAccountStatus;
  rejectionReason: string | null;
};

type TabId = "works" | "info" | "accounts";

const numberFormatter = new Intl.NumberFormat("ar-IQ", {
  numberingSystem: "latn",
  notation: "compact",
  maximumFractionDigits: 1,
});

export function CreatorProfileHub({
  fullName,
  username,
  bio,
  avatarUrl,
  governorate,
  contentCategories,
  isProfilePublic,
  followersCount,
  followingCount,
  verifiedPlatforms,
  portfolioItems,
  socialAccounts,
  profileFormProps,
}: {
  fullName: string;
  username: string;
  bio: string;
  avatarUrl: string;
  governorate: string;
  contentCategories: string[];
  isProfilePublic: boolean;
  followersCount: number;
  followingCount: number;
  verifiedPlatforms: Platform[];
  portfolioItems: PortfolioItem[];
  socialAccounts: SocialAccount[];
  profileFormProps: {
    initialUsername: string;
    initialBio: string;
    initialAvatarUrl: string;
    initialCoverUrl: string;
    initialCountry: string;
    initialGovernorate: string;
    initialContentCategories: CampaignCategory[];
    initialLanguages: string[];
    initialIsProfilePublic: boolean;
  };
}) {
  // من لم يكمل هويته بعد يهبط على تبويب المعلومات مباشرة.
  const [activeTab, setActiveTab] = useState<TabId>(username ? "works" : "info");
  const [gridItems, setGridItems] = useState(portfolioItems);
  const [manageOpen, setManageOpen] = useState(false);

  const handleItemsChange = useCallback((items: PortfolioItem[]) => {
    setGridItems(items);
  }, []);

  const publicPath = username ? `/creators/${encodeURIComponent(username)}` : null;
  const stats: Array<{ value: number; label: string }> = [
    { value: followingCount, label: "يتابع" },
    { value: followersCount, label: "متابِع" },
    { value: gridItems.length, label: "عمل" },
  ];

  const tabs: Array<{ id: TabId; label: string }> = [
    { id: "works", label: "أعمالي" },
    { id: "info", label: "معلوماتي" },
    { id: "accounts", label: "الحسابات" },
  ];

  return (
    <div>
      {/* ترويسة الملف بأسلوب تيك توك: عمودية على الهاتف، صف على الديسكتوب */}
      <header className="flex flex-col items-center gap-4 px-5 pt-8 md:flex-row md:items-start md:gap-8 md:px-8">
        <div className="relative flex-shrink-0">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt=""
              className="h-24 w-24 rounded-full border border-[var(--color-border)] object-cover md:h-32 md:w-32"
            />
          ) : (
            <span
              aria-hidden="true"
              className="grid h-24 w-24 place-items-center rounded-full bg-[var(--forest-900)] text-4xl font-black text-[var(--color-brand)] md:h-32 md:w-32 md:text-5xl"
            >
              {fullName.trim().charAt(0) || "؟"}
            </span>
          )}
          {!isProfilePublic && (
            <span className="absolute -bottom-1 start-1/2 -translate-x-[-50%] rounded-[var(--radius-pill)] bg-[var(--forest-900)] px-2 py-0.5 text-[10px] font-black text-[var(--mist-50)] md:start-auto md:end-0 md:translate-x-0">
              مخفي
            </span>
          )}
        </div>

        <div className="flex min-w-0 flex-col items-center gap-3 md:items-start">
          <div className="text-center md:text-start">
            <h1 className="text-xl font-extrabold md:text-2xl">{fullName}</h1>
            {username ? (
              <p
                className="mt-0.5 text-sm font-bold text-[var(--color-text-secondary)]"
                dir="ltr"
              >
                @{username}
              </p>
            ) : (
              <button
                type="button"
                onClick={() => setActiveTab("info")}
                className="mt-0.5 text-sm font-bold text-[var(--color-text-muted)] underline underline-offset-4 hover:text-[var(--color-text-secondary)]"
              >
                أضف اسم مستخدم ليظهر ملفك العام
              </button>
            )}
          </div>

          {/* صف الإحصائيات: رقم فوق تسمية، بفواصل رفيعة كما في تيك توك */}
          <dl className="flex items-center">
            {stats.map((stat, index) => (
              <div
                key={stat.label}
                className={`flex flex-col items-center px-5 md:items-start md:ps-0 md:pe-8 ${
                  index > 0 ? "border-s border-[var(--color-border)] md:border-none" : ""
                }`}
              >
                <dt className="sr-only">{stat.label}</dt>
                <dd className="flex flex-col items-center md:flex-row md:items-baseline md:gap-1.5">
                  <span className="text-lg font-extrabold leading-6">
                    {numberFormatter.format(stat.value)}
                  </span>
                  <span className="text-xs font-bold text-[var(--color-text-muted)]">
                    {stat.label}
                  </span>
                </dd>
              </div>
            ))}
          </dl>

          <div className="flex w-full max-w-sm items-stretch gap-2 md:max-w-none">
            <button
              type="button"
              onClick={() => setActiveTab("info")}
              className="btn-primary min-h-11 flex-1 px-6 text-sm font-black md:flex-none"
            >
              تعديل الملف
            </button>
            <ProfileShareButton
              fullName={fullName}
              url={publicPath ?? undefined}
              iconOnly
            />
            {publicPath && isProfilePublic && (
              <Link
                href={publicPath}
                className="inline-flex min-h-11 w-11 items-center justify-center rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] transition-colors hover:border-[var(--forest-200)]"
                title="عرض الصفحة العامة"
              >
                <ArrowUpRightIcon size={17} />
                <span className="sr-only">عرض الصفحة العامة</span>
              </Link>
            )}
          </div>

          {(bio || governorate || contentCategories.length > 0) && (
            <div className="max-w-xl text-center md:text-start">
              {bio && (
                <p className="whitespace-pre-line text-sm font-medium leading-6">{bio}</p>
              )}
              {(governorate || contentCategories.length > 0) && (
                <p className="mt-1.5 text-xs font-bold text-[var(--color-text-muted)]">
                  {[
                    governorate,
                    ...contentCategories
                      .slice(0, 3)
                      .map(
                        (category) =>
                          categoryLabels[category as keyof typeof categoryLabels] ??
                          category,
                      ),
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              )}
            </div>
          )}

          {verifiedPlatforms.length > 0 && (
            <ul className="flex items-center gap-3" aria-label="منصات موثقة">
              {verifiedPlatforms.map((platform) => {
                const Icon = platformIcons[platform];
                return (
                  <li
                    key={platform}
                    title={`${platformLabels[platform]} موثق`}
                    className="text-[var(--forest-500)]"
                  >
                    <Icon className="h-4 w-4" />
                    <span className="sr-only">{platformLabels[platform]} موثق</span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </header>

      {/* شريط تبويبات بخط سفلي كما في تيك توك */}
      <div
        role="tablist"
        aria-label="أقسام الملف"
        className="sticky top-[69px] z-10 mt-6 flex border-b border-[var(--color-border)] bg-[var(--color-bg)]"
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            id={`profile-tab-${tab.id}`}
            aria-selected={activeTab === tab.id}
            aria-controls={`profile-panel-${tab.id}`}
            onClick={() => setActiveTab(tab.id)}
            className={`relative flex-1 py-3 text-sm font-black transition-colors duration-150 md:flex-none md:px-10 ${
              activeTab === tab.id
                ? "text-[var(--color-text)]"
                : "text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]"
            }`}
          >
            {tab.label}
            <span
              aria-hidden="true"
              className={`absolute inset-x-6 bottom-0 h-0.5 rounded-full bg-[var(--forest-900)] transition-opacity duration-150 ${
                activeTab === tab.id ? "opacity-100" : "opacity-0"
              }`}
            />
          </button>
        ))}
      </div>

      <div className="px-3 pb-16 pt-4 md:px-8 md:pt-6">
        <section
          role="tabpanel"
          id="profile-panel-works"
          aria-labelledby="profile-tab-works"
          hidden={activeTab !== "works"}
        >
          {gridItems.length > 0 ? (
            <div className="overflow-hidden rounded-[var(--radius-lg)]">
              <ul className="grid grid-cols-3 gap-0.5 md:grid-cols-4 lg:grid-cols-5">
                {gridItems.map((item) => {
                  const Icon = platformIcons[item.platform];
                  return (
                    <li key={item.id} className="relative">
                      <a
                        href={item.projectUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="group block aspect-[3/4] overflow-hidden bg-[var(--forest-900)]"
                      >
                        {item.thumbnailUrl ? (
                          <img
                            src={item.thumbnailUrl}
                            alt={item.title}
                            loading="lazy"
                            className="h-full w-full object-cover transition-transform duration-300 ease-out group-hover:scale-[1.04]"
                          />
                        ) : (
                          <span className="grid h-full w-full place-items-center text-[var(--forest-300)]">
                            <Icon className="h-8 w-8" aria-hidden="true" />
                          </span>
                        )}
                        <span
                          aria-hidden="true"
                          className="absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-[rgba(6,38,25,.78)] to-transparent"
                        />
                        <span className="absolute inset-x-2 bottom-1.5 line-clamp-1 text-[11px] font-bold text-[var(--mist-50)]">
                          {item.title}
                        </span>
                        <span className="absolute end-1.5 top-1.5 grid h-6 w-6 place-items-center rounded-full bg-[rgba(6,38,25,.55)] text-[var(--mist-50)]">
                          <Icon className="h-3 w-3" aria-hidden="true" />
                          <span className="sr-only">{platformLabels[item.platform]}</span>
                        </span>
                      </a>
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 py-14 text-center">
              <span className="grid h-14 w-14 place-items-center rounded-full bg-[var(--color-surface-muted)] text-[var(--forest-500)]">
                <BriefcaseIcon aria-hidden="true" />
              </span>
              <p className="text-sm font-extrabold">معرضك فارغ حالياً</p>
              <p className="max-w-xs text-xs font-medium leading-5 text-[var(--color-text-muted)]">
                أضف أفضل أعمالك لتظهر هنا كشبكة يتصفحها أصحاب العلامات قبل قبولك في
                الحملات.
              </p>
              <button
                type="button"
                onClick={() => setManageOpen(true)}
                className="btn-secondary min-h-11 px-6 text-sm font-black"
              >
                أضف أول عمل
              </button>
            </div>
          )}

          <div className="mt-6">
            <button
              type="button"
              onClick={() => setManageOpen((value) => !value)}
              aria-expanded={manageOpen}
              className="inline-flex min-h-11 items-center gap-2 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-5 text-sm font-black transition-colors hover:border-[var(--forest-200)]"
            >
              <BriefcaseIcon size={16} aria-hidden="true" />
              إدارة المعرض
              <ChevronDownIcon
                size={15}
                aria-hidden="true"
                className={`transition-transform duration-200 ${manageOpen ? "rotate-180" : ""}`}
              />
            </button>
            {manageOpen && (
              <div className="mt-4 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
                <PortfolioManager
                  initialItems={portfolioItems}
                  onItemsChange={handleItemsChange}
                />
              </div>
            )}
          </div>
        </section>

        <section
          role="tabpanel"
          id="profile-panel-info"
          aria-labelledby="profile-tab-info"
          hidden={activeTab !== "info"}
        >
          <div className="mb-4 flex items-center gap-2 text-xs font-bold text-[var(--color-text-muted)]">
            <SettingsIcon size={14} aria-hidden="true" />
            التعديلات هنا تنعكس مباشرة على ترويسة ملفك وصفحتك العامة.
          </div>
          <ProfileForm fullName={fullName} {...profileFormProps} />
        </section>

        <section
          role="tabpanel"
          id="profile-panel-accounts"
          aria-labelledby="profile-tab-accounts"
          hidden={activeTab !== "accounts"}
        >
          <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
            <div className="mb-4 flex items-center gap-3">
              <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-surface-muted)] text-[var(--forest-500)]">
                <LinkIcon />
              </span>
              <div>
                <h2 className="text-lg font-extrabold">الحسابات الاجتماعية</h2>
                <p className="text-xs text-[var(--color-text-muted)]">
                  الحسابات الموثقة تظهر كشارات في ترويسة ملفك.
                </p>
              </div>
            </div>
            <SocialAccountsManager initialAccounts={socialAccounts} />
          </div>
        </section>
      </div>
    </div>
  );
}
