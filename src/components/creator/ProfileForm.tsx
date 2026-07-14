"use client";

/* eslint-disable @next/next/no-img-element -- profile images come from the configured Supabase project; an open Next image proxy is intentionally avoided. */

import Link from "next/link";
import { useMemo, useState } from "react";
import { CampaignCategory } from "../../generated/prisma/enums";
import { categoryLabels } from "../../lib/campaigns";
import { EyeIcon, UploadIcon } from "../ui/icons";

type Props = {
  fullName: string;
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

type Message = { type: "success" | "error"; text: string };
type UploadKind = "avatar" | "cover";

const inputClassName =
  "min-h-[48px] w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 text-[var(--color-text)] transition focus:border-[var(--color-brand)] focus:outline-none focus:ring-4 focus:ring-[rgba(214,246,29,0.18)] disabled:cursor-not-allowed disabled:opacity-60";

function getApiMessage(data: unknown, fallback: string) {
  if (
    typeof data === "object" &&
    data !== null &&
    "error" in data &&
    typeof data.error === "object" &&
    data.error !== null &&
    "message" in data.error &&
    typeof data.error.message === "string"
  ) {
    return data.error.message;
  }
  return fallback;
}

export function ProfileForm({
  fullName,
  initialUsername,
  initialBio,
  initialAvatarUrl,
  initialCoverUrl,
  initialCountry,
  initialGovernorate,
  initialContentCategories,
  initialLanguages,
  initialIsProfilePublic,
}: Props) {
  const [username, setUsername] = useState(initialUsername);
  const [savedUsername, setSavedUsername] = useState(initialUsername);
  const [bio, setBio] = useState(initialBio);
  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl);
  const [coverUrl, setCoverUrl] = useState(initialCoverUrl);
  const [country, setCountry] = useState(initialCountry);
  const [governorate, setGovernorate] = useState(initialGovernorate);
  const [contentCategories, setContentCategories] = useState<CampaignCategory[]>(
    initialContentCategories,
  );
  const [languagesText, setLanguagesText] = useState(initialLanguages.join("، "));
  const [isProfilePublic, setIsProfilePublic] = useState(initialIsProfilePublic);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadingKind, setUploadingKind] = useState<UploadKind | null>(null);
  const [message, setMessage] = useState<Message | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const completion = useMemo(() => {
    const checks = [
      Boolean(username),
      Boolean(bio),
      Boolean(avatarUrl),
      Boolean(coverUrl),
      Boolean(governorate),
      contentCategories.length > 0,
      Boolean(languagesText.trim()),
    ];
    return Math.round((checks.filter(Boolean).length / checks.length) * 100);
  }, [
    avatarUrl,
    bio,
    contentCategories.length,
    coverUrl,
    governorate,
    languagesText,
    username,
  ]);

  const toggleCategory = (category: CampaignCategory) => {
    setContentCategories((current) =>
      current.includes(category)
        ? current.filter((item) => item !== category)
        : current.length < 5
          ? [...current, category]
          : current,
    );
  };

  const uploadImage = async (kind: UploadKind, file: File | undefined) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setMessage({ type: "error", text: "حجم الصورة يجب ألا يتجاوز 5 ميغابايت." });
      return;
    }

    setUploadingKind(kind);
    setMessage(null);
    const body = new FormData();
    body.set("kind", kind);
    body.set("file", file);

    try {
      const response = await fetch("/api/v1/creator/profile/image", {
        method: "POST",
        body,
      });
      const data = await response.json();
      if (!response.ok) {
        setMessage({
          type: "error",
          text: getApiMessage(data, "فشل رفع الصورة."),
        });
        return;
      }

      const url = data.data?.url as string | undefined;
      if (!url) throw new Error("Missing image URL");
      if (kind === "avatar") setAvatarUrl(url);
      else setCoverUrl(url);
      setMessage({
        type: "success",
        text: kind === "avatar" ? "تم تحديث الصورة الشخصية." : "تم تحديث صورة الغلاف.",
      });
    } catch {
      setMessage({ type: "error", text: "حدث خطأ في الاتصال أثناء رفع الصورة." });
    } finally {
      setUploadingKind(null);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    setMessage(null);
    setFieldErrors({});

    const languages = languagesText
      .split(/[،,]/)
      .map((item) => item.trim())
      .filter(Boolean);

    try {
      const response = await fetch("/api/v1/creator/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          bio,
          country,
          governorate,
          contentCategories,
          languages,
          isProfilePublic,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        const details = data.error?.details as
          Record<string, string[] | undefined> | undefined;
        if (details) {
          setFieldErrors(
            Object.fromEntries(
              Object.entries(details)
                .filter(([, value]) => value?.[0])
                .map(([key, value]) => [key, value?.[0] ?? ""]),
            ),
          );
        }
        setMessage({
          type: "error",
          text: getApiMessage(data, "فشل حفظ التغييرات."),
        });
        return;
      }

      setSavedUsername(data.data?.username ?? username);
      setMessage({ type: "success", text: "تم حفظ ملفك المهني بنجاح." });
    } catch {
      setMessage({ type: "error", text: "حدث خطأ في الاتصال بالسيرفر." });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <section className="overflow-hidden rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-md)]">
        <div className="relative h-44 overflow-hidden bg-[var(--color-surface-dark)] sm:h-56">
          {coverUrl ? (
            <img
              src={coverUrl}
              alt="صورة غلاف الملف الشخصي"
              className="h-full w-full object-cover"
            />
          ) : (
            <div
              className="absolute inset-0 opacity-90"
              style={{
                background:
                  "radial-gradient(circle at 18% 25%, rgba(214,246,29,.52), transparent 22%), radial-gradient(circle at 74% 40%, rgba(200,214,206,.18), transparent 28%), linear-gradient(135deg, var(--forest-700), var(--forest-900))",
              }}
              aria-hidden="true"
            />
          )}
          <label className="absolute bottom-4 left-4 inline-flex cursor-pointer items-center gap-2 rounded-[var(--radius-pill)] border border-[rgba(231,237,233,.35)] bg-[rgba(6,38,25,.82)] px-4 py-2 text-xs font-bold text-[var(--color-text-on-dark)] shadow-[var(--shadow-sm)] backdrop-blur-md transition hover:bg-[var(--forest-600)]">
            <UploadIcon size={16} aria-hidden="true" />
            {uploadingKind === "cover" ? "جاري رفع الغلاف..." : "تغيير الغلاف"}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              disabled={Boolean(uploadingKind)}
              onChange={(event) => uploadImage("cover", event.target.files?.[0])}
            />
          </label>
        </div>

        <div className="relative px-5 pb-6 pt-16 sm:px-8 sm:pt-5">
          <div className="absolute -top-14 right-5 sm:-top-16 sm:right-8">
            <div className="relative h-28 w-28 overflow-hidden rounded-full border-[6px] border-[var(--color-surface)] bg-[var(--color-brand)] shadow-[var(--shadow-md)] sm:h-32 sm:w-32">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={`الصورة الشخصية لـ ${fullName}`}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="flex h-full w-full items-center justify-center text-4xl font-black text-[var(--color-text-on-brand)]">
                  {fullName.slice(0, 1)}
                </span>
              )}
              <label className="absolute inset-x-0 bottom-0 flex cursor-pointer justify-center bg-[rgba(6,38,25,.82)] py-2 text-[var(--color-text-on-dark)] transition hover:bg-[var(--forest-600)]">
                <span className="sr-only">تغيير الصورة الشخصية</span>
                <UploadIcon size={17} aria-hidden="true" />
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="sr-only"
                  disabled={Boolean(uploadingKind)}
                  onChange={(event) => uploadImage("avatar", event.target.files?.[0])}
                />
              </label>
            </div>
          </div>

          <div className="flex flex-col gap-4 sm:mr-36 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-2xl font-black">{fullName}</h2>
              <p className="mt-1 text-sm font-semibold text-[var(--color-text-secondary)]">
                {savedUsername ? `@${savedUsername}` : "احجز اسم المستخدم الخاص بك"}
              </p>
            </div>
            <div className="min-w-40">
              <div className="mb-1.5 flex justify-between text-xs font-bold">
                <span>اكتمال الملف</span>
                <span>{completion}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-[var(--color-surface-muted)]">
                <span
                  className="block h-full rounded-full bg-[var(--color-brand)] transition-[width] duration-500"
                  style={{ width: `${completion}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {message && (
        <div
          className={`scale-in rounded-[var(--radius-sm)] border p-4 text-sm font-semibold ${
            message.type === "success"
              ? "border-transparent bg-[rgba(214,246,29,0.15)] text-[var(--color-text)]"
              : "border-[var(--color-border-strong)] bg-[var(--color-surface-muted)] text-[var(--color-text)]"
          }`}
          role={message.type === "error" ? "alert" : "status"}
        >
          {message.text}
        </div>
      )}

      <section className="grid gap-6 rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-sm)] sm:p-7 lg:grid-cols-2">
        <div className="lg:col-span-2">
          <div className="mb-5 flex items-center justify-between gap-3 border-b border-[var(--color-border)] pb-4">
            <div>
              <h3 className="text-lg font-black">هويتك المهنية</h3>
              <p className="mt-1 text-xs font-medium text-[var(--color-text-secondary)]">
                هذه المعلومات تساعد العلامات التجارية على اكتشافك.
              </p>
            </div>
            {savedUsername && isProfilePublic && (
              <Link
                href={`/creators/${encodeURIComponent(savedUsername)}`}
                target="_blank"
                className="inline-flex items-center gap-2 rounded-[var(--radius-pill)] border border-[var(--color-border)] px-3 py-2 text-xs font-bold transition hover:border-[var(--color-brand)]"
              >
                <EyeIcon size={15} aria-hidden="true" /> معاينة الملف
              </Link>
            )}
          </div>
        </div>

        <div>
          <label htmlFor="username" className="mb-2 block text-sm font-bold">
            اسم المستخدم
          </label>
          <div className="relative" dir="ltr">
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 font-black text-[var(--color-text-muted)]">
              @
            </span>
            <input
              id="username"
              value={username}
              onChange={(event) => setUsername(event.target.value.replace(/^@/, ""))}
              maxLength={30}
              autoComplete="username"
              aria-describedby={fieldErrors.username ? "username-error" : "username-help"}
              aria-invalid={Boolean(fieldErrors.username)}
              className={`${inputClassName} pl-9`}
              disabled={isLoading}
            />
          </div>
          <p id="username-help" className="mt-1.5 text-xs text-[var(--color-text-muted)]">
            حروف وأرقام وشرطة سفلية، ويمكن استخدام العربية.
          </p>
          {fieldErrors.username && (
            <p id="username-error" className="mt-1.5 text-xs font-bold" role="alert">
              {fieldErrors.username}
            </p>
          )}
        </div>

        <div className="grid grid-cols-[100px_1fr] gap-3">
          <div>
            <label htmlFor="country" className="mb-2 block text-sm font-bold">
              الدولة
            </label>
            <input
              id="country"
              value={country}
              onChange={(event) => setCountry(event.target.value.toUpperCase())}
              maxLength={2}
              className={inputClassName}
              disabled={isLoading}
            />
          </div>
          <div>
            <label htmlFor="governorate" className="mb-2 block text-sm font-bold">
              المحافظة
            </label>
            <input
              id="governorate"
              value={governorate}
              onChange={(event) => setGovernorate(event.target.value)}
              maxLength={100}
              className={inputClassName}
              disabled={isLoading}
            />
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="mb-2 flex items-center justify-between gap-3">
            <label htmlFor="bio" className="block text-sm font-bold">
              نبذة عنك
            </label>
            <span className="text-xs font-medium text-[var(--color-text-muted)]">
              {bio.length}/500
            </span>
          </div>
          <textarea
            id="bio"
            value={bio}
            onChange={(event) => setBio(event.target.value)}
            rows={5}
            maxLength={500}
            placeholder="عرّف العلامات التجارية بأسلوبك، جمهورك، ونوع المحتوى الذي تبدع به."
            className={`${inputClassName} py-3`}
            disabled={isLoading}
          />
        </div>

        <fieldset className="lg:col-span-2">
          <legend className="text-sm font-bold">اختصاصات المحتوى</legend>
          <p className="mt-1 text-xs text-[var(--color-text-muted)]">
            اختر حتى خمسة اختصاصات.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {Object.entries(categoryLabels).map(([value, label]) => {
              const category = value as CampaignCategory;
              const checked = contentCategories.includes(category);
              return (
                <label
                  key={value}
                  className={`cursor-pointer rounded-[var(--radius-pill)] border px-4 py-2 text-xs font-bold transition ${
                    checked
                      ? "border-[var(--color-brand)] bg-[var(--color-brand)] text-[var(--color-text-on-brand)]"
                      : "border-[var(--color-border)] bg-[var(--color-surface-muted)] hover:border-[var(--color-brand)]"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    className="sr-only"
                    onChange={() => toggleCategory(category)}
                    disabled={isLoading}
                  />
                  {label}
                </label>
              );
            })}
          </div>
        </fieldset>

        <div className="lg:col-span-2">
          <label htmlFor="languages" className="mb-2 block text-sm font-bold">
            اللغات
          </label>
          <input
            id="languages"
            value={languagesText}
            onChange={(event) => setLanguagesText(event.target.value)}
            placeholder="العربية، الكردية، الإنجليزية"
            className={inputClassName}
            aria-describedby={
              fieldErrors.languages ? "languages-error" : "languages-help"
            }
            aria-invalid={Boolean(fieldErrors.languages)}
            disabled={isLoading}
          />
          <p
            id="languages-help"
            className="mt-1.5 text-xs text-[var(--color-text-muted)]"
          >
            افصل بين اللغات بفاصلة، وبحد أقصى خمس لغات.
          </p>
          {fieldErrors.languages && (
            <p id="languages-error" className="mt-1.5 text-xs font-bold" role="alert">
              {fieldErrors.languages}
            </p>
          )}
        </div>

        <div className="flex items-start gap-3 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-4 lg:col-span-2">
          <input
            id="is-profile-public"
            type="checkbox"
            checked={isProfilePublic}
            onChange={(event) => setIsProfilePublic(event.target.checked)}
            className="mt-1 h-4 w-4 accent-[var(--color-brand-active)]"
            disabled={isLoading}
          />
          <label htmlFor="is-profile-public" className="cursor-pointer">
            <span className="block text-sm font-black">إظهار ملفي للعلامات التجارية</span>
            <span className="mt-1 block text-xs leading-5 text-[var(--color-text-secondary)]">
              عند إيقافه لن تظهر صفحتك العامة، وتبقى بيانات حملاتك ومحفظتك خاصة دائماً.
            </span>
          </label>
        </div>

        <div className="flex flex-wrap items-center gap-3 border-t border-[var(--color-border)] pt-5 lg:col-span-2">
          <button
            type="submit"
            disabled={isLoading}
            className="btn-primary px-7 py-3 text-sm"
          >
            {isLoading ? "جاري الحفظ..." : "حفظ الملف المهني"}
          </button>
          <span className="text-xs font-medium text-[var(--color-text-muted)]">
            صور JPG أو PNG أو WebP، بحجم أقصى 5MB.
          </span>
        </div>
      </section>
    </form>
  );
}
