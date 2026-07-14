/* eslint-disable @next/next/no-img-element -- creator media is served from the configured public storage bucket. */

import type { Metadata } from "next";
import Link from "next/link";
import { Footer } from "../../components/layout/Footer";
import { Navbar } from "../../components/layout/Navbar";
import {
  ArrowUpRightIcon,
  CheckIcon,
  ChevronDownIcon,
  SearchIcon,
} from "../../components/ui/icons";
import { categoryLabels, platformIcons, platformLabels } from "../../lib/campaigns";
import { creatorDirectoryQuerySchema } from "../../modules/creator/directory-schemas";
import { CreatorDirectoryService } from "../../modules/creator/directory-service";

export const metadata: Metadata = {
  title: "دليل صناع المحتوى — خلّيها ترند",
  description: "اكتشف صناع محتوى عراقيين حسب الاختصاص والمنصة والمحافظة.",
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function pageHref(current: Record<string, string | undefined>, page: number): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(current)) {
    if (value) params.set(key, value);
  }
  params.set("page", String(page));
  return `/creators?${params.toString()}`;
}

export default async function CreatorDirectoryPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const raw = await searchParams;
  const queryValues = {
    search: first(raw.search),
    category: first(raw.category),
    platform: first(raw.platform),
    governorate: first(raw.governorate),
    language: first(raw.language),
    page: first(raw.page),
    pageSize: "12",
  };
  const parsed = creatorDirectoryQuerySchema.safeParse(queryValues);
  const query = parsed.success
    ? parsed.data
    : creatorDirectoryQuerySchema.parse({ page: 1, pageSize: 12 });

  let result: Awaited<ReturnType<typeof CreatorDirectoryService.list>> = {
    items: [],
    pagination: { page: 1, pageSize: 12, total: 0, pageCount: 0 },
  };
  let loadError = false;
  try {
    result = await CreatorDirectoryService.list(query);
  } catch {
    loadError = true;
  }

  const preserved = {
    search: query.search,
    category: query.category,
    platform: query.platform,
    governorate: query.governorate,
    language: query.language,
  };

  return (
    <div className="flex min-h-screen flex-col bg-[var(--color-bg)] text-[var(--color-text)]">
      <Navbar />
      <main className="flex-1" dir="rtl">
        <section className="relative overflow-hidden bg-[var(--color-surface-dark)] text-[var(--color-text-on-dark)]">
          <div
            className="absolute inset-0 opacity-80"
            style={{
              background:
                "radial-gradient(circle at 12% 20%, rgba(214,246,29,.36), transparent 22%), radial-gradient(circle at 82% 60%, rgba(231,237,233,.12), transparent 30%)",
            }}
            aria-hidden="true"
          />
          <div className="relative mx-auto max-w-7xl px-5 py-16 lg:px-8 lg:py-20">
            <span className="inline-flex rounded-[var(--radius-pill)] bg-[var(--color-brand)] px-3 py-1 text-xs font-black text-[var(--color-text-on-brand)]">
              مواهب عراقية جاهزة للتعاون
            </span>
            <div className="mt-5 grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
              <div>
                <h1 className="max-w-3xl text-4xl font-black leading-tight sm:text-5xl">
                  اختَر الصوت المناسب لعلامتك، مو مجرد رقم متابعين.
                </h1>
                <p className="mt-4 max-w-2xl leading-7 text-[var(--forest-100)]">
                  ابحث بالاختصاص والمنصة والموقع، وشاهد الأعمال والحسابات الموثقة قبل بدء
                  التعاون.
                </p>
              </div>
              <div className="rounded-[var(--radius-xl)] border border-[rgba(231,237,233,.16)] bg-[rgba(231,237,233,.08)] px-6 py-4 backdrop-blur-md">
                <p className="text-3xl font-black text-[var(--color-brand)]">
                  {result.pagination.total}
                </p>
                <p className="text-xs font-bold text-[var(--forest-100)]">
                  ملف ظاهر الآن
                </p>
              </div>
            </div>
          </div>
        </section>

        <div className="mx-auto max-w-7xl px-5 py-10 lg:px-8">
          <form
            method="get"
            className="relative z-10 -mt-20 grid gap-3 rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-[var(--shadow-lg)] sm:grid-cols-2 lg:grid-cols-[1.6fr_repeat(4,1fr)_auto]"
          >
            <div className="relative sm:col-span-2 lg:col-span-1">
              <label htmlFor="creator-search" className="sr-only">
                ابحث بالاسم أو اسم المستخدم
              </label>
              <SearchIcon
                size={17}
                className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]"
                aria-hidden="true"
              />
              <input
                id="creator-search"
                name="search"
                defaultValue={query.search ?? ""}
                placeholder="اسم الصانع أو @username"
                className="input-field pr-11"
              />
            </div>

            <FilterSelect
              name="category"
              label="كل الاختصاصات"
              value={query.category}
              options={Object.entries(categoryLabels)}
            />
            <FilterSelect
              name="platform"
              label="كل المنصات"
              value={query.platform}
              options={Object.entries(platformLabels)}
            />
            <div>
              <label htmlFor="creator-governorate" className="sr-only">
                المحافظة
              </label>
              <input
                id="creator-governorate"
                name="governorate"
                defaultValue={query.governorate ?? ""}
                placeholder="المحافظة"
                className="input-field"
              />
            </div>
            <div>
              <label htmlFor="creator-language" className="sr-only">
                اللغة
              </label>
              <input
                id="creator-language"
                name="language"
                defaultValue={query.language ?? ""}
                placeholder="اللغة"
                className="input-field"
              />
            </div>
            <button type="submit" className="btn-primary justify-center px-6">
              بحث
            </button>
          </form>

          <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-2xl font-black">صناع المحتوى</h2>
              <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
                {result.pagination.total
                  ? `${result.pagination.total} نتيجة مطابقة`
                  : "جرّب توسيع معايير البحث"}
              </p>
            </div>
            {(query.search ||
              query.category ||
              query.platform ||
              query.governorate ||
              query.language) && (
              <Link
                href="/creators"
                className="rounded-[var(--radius-pill)] border border-[var(--color-border)] px-4 py-2 text-xs font-black transition hover:border-[var(--color-brand)]"
              >
                مسح الفلاتر
              </Link>
            )}
          </div>

          {loadError ? (
            <div className="mt-8 rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface)] p-10 text-center">
              <p className="font-black">تعذّر تحميل دليل صناع المحتوى حالياً.</p>
            </div>
          ) : result.items.length === 0 ? (
            <div className="mt-8 rounded-[var(--radius-xl)] border border-dashed border-[var(--color-border-strong)] bg-[var(--color-surface)] p-12 text-center">
              <SearchIcon
                className="mx-auto text-[var(--color-text-muted)]"
                aria-hidden="true"
              />
              <p className="mt-3 font-black">لا توجد ملفات تطابق البحث</p>
              <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
                احذف بعض الفلاتر أو جرّب كلمة بحث مختلفة.
              </p>
            </div>
          ) : (
            <div className="mt-7 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {result.items.map((creator, index) => (
                <article
                  key={creator.id}
                  className="fade-in-up group overflow-hidden rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-sm)] transition hover:-translate-y-1 hover:border-[var(--color-brand)] hover:shadow-[var(--shadow-md)]"
                  style={{ animationDelay: `${Math.min(index * 50, 350)}ms` }}
                >
                  <div className="relative h-28 overflow-hidden bg-[var(--color-surface-dark)]">
                    {creator.coverUrl ? (
                      <img
                        src={creator.coverUrl}
                        alt=""
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                      />
                    ) : (
                      <div className="h-full bg-[radial-gradient(circle_at_18%_25%,rgba(214,246,29,.42),transparent_25%),linear-gradient(135deg,var(--forest-700),var(--forest-900))]" />
                    )}
                  </div>
                  <div className="relative px-5 pb-5 pt-14">
                    <div className="absolute -top-11 right-5 h-22 w-22 overflow-hidden rounded-full border-[5px] border-[var(--color-surface)] bg-[var(--color-brand)] shadow-[var(--shadow-sm)]">
                      {creator.avatarUrl ? (
                        <img
                          src={creator.avatarUrl}
                          alt={`صورة ${creator.user.fullName}`}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="flex h-full w-full items-center justify-center text-3xl font-black text-[var(--color-text-on-brand)]">
                          {creator.user.fullName.slice(0, 1)}
                        </span>
                      )}
                    </div>
                    <div className="absolute left-5 top-4 flex items-center gap-1 rounded-[var(--radius-pill)] bg-[rgba(214,246,29,.18)] px-2.5 py-1 text-[10px] font-black text-[var(--color-brand-active)]">
                      ثقة {creator.trustScore}
                    </div>
                    <div className="flex items-center gap-2">
                      <h3 className="truncate text-xl font-black">
                        {creator.user.fullName}
                      </h3>
                      {creator.socialAccounts.length > 0 && (
                        <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-[var(--color-brand)]">
                          <CheckIcon size={12} strokeWidth={3} aria-label="حساب موثق" />
                        </span>
                      )}
                    </div>
                    <p
                      className="mt-1 text-xs font-bold text-[var(--color-text-secondary)]"
                      dir="ltr"
                    >
                      @{creator.username}
                    </p>
                    <p className="mt-3 line-clamp-2 min-h-10 text-xs leading-5 text-[var(--color-text-secondary)]">
                      {creator.bio || "صانع محتوى مسجل في خلّيها ترند."}
                    </p>

                    <div className="mt-4 flex flex-wrap gap-1.5">
                      {creator.contentCategories.slice(0, 3).map((category) => (
                        <span
                          key={category}
                          className="rounded-[var(--radius-pill)] bg-[var(--color-surface-muted)] px-2.5 py-1 text-[10px] font-black"
                        >
                          {categoryLabels[category]}
                        </span>
                      ))}
                    </div>

                    <div className="mt-5 flex items-center justify-between gap-3 border-t border-[var(--color-border)] pt-4">
                      <div className="flex -space-x-1 space-x-reverse">
                        {creator.socialAccounts.slice(0, 4).map((account) => {
                          const PlatformIcon = platformIcons[account.platform];
                          return (
                            <span
                              key={account.id}
                              title={platformLabels[account.platform]}
                              className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-[var(--color-surface)] bg-[var(--color-surface-muted)]"
                            >
                              <PlatformIcon />
                            </span>
                          );
                        })}
                      </div>
                      <Link
                        href={`/creators/${encodeURIComponent(creator.username ?? "")}`}
                        className="inline-flex items-center gap-1.5 text-xs font-black transition group-hover:text-[var(--color-brand-active)]"
                      >
                        عرض الملف
                        <ArrowUpRightIcon size={14} aria-hidden="true" />
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}

          {result.pagination.pageCount > 1 && (
            <nav
              aria-label="صفحات دليل صناع المحتوى"
              className="mt-10 flex items-center justify-center gap-3"
            >
              {result.pagination.page > 1 && (
                <Link
                  href={pageHref(preserved, result.pagination.page - 1)}
                  className="btn-outline px-5 py-2.5 text-xs"
                >
                  السابق
                </Link>
              )}
              <span className="text-xs font-black text-[var(--color-text-secondary)]">
                صفحة {result.pagination.page} من {result.pagination.pageCount}
              </span>
              {result.pagination.page < result.pagination.pageCount && (
                <Link
                  href={pageHref(preserved, result.pagination.page + 1)}
                  className="btn-outline px-5 py-2.5 text-xs"
                >
                  التالي
                </Link>
              )}
            </nav>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}

function FilterSelect<T extends string>({
  name,
  label,
  value,
  options,
}: {
  name: string;
  label: string;
  value: T | undefined;
  options: [string, string][];
}) {
  const id = `creator-${name}`;
  return (
    <div className="select-field-wrap">
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <select id={id} name={name} defaultValue={value ?? ""} className="select-field">
        <option value="">{label}</option>
        {options.map(([optionValue, optionLabel]) => (
          <option key={optionValue} value={optionValue}>
            {optionLabel}
          </option>
        ))}
      </select>
      <ChevronDownIcon className="select-field-chevron" size={16} aria-hidden="true" />
    </div>
  );
}
