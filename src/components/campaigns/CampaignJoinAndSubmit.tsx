"use client";

import { useState } from "react";

type Platform = "TIKTOK" | "INSTAGRAM" | "FACEBOOK" | "YOUTUBE";

const platformLabels: Record<Platform, string> = {
  TIKTOK: "تيك توك",
  INSTAGRAM: "إنستغرام",
  FACEBOOK: "فيسبوك",
  YOUTUBE: "يوتيوب",
};

const statusLabels: Record<string, string> = {
  SUBMITTED: "مرسل للتدقيق",
  UNDER_REVIEW: "قيد المراجعة",
  REVISION_REQUESTED: "ملاحظات وتعديل مطلوب",
  APPROVED: "تمت الموافقة ✓",
  REJECTED: "مرفوض ✗",
};

type SocialAccount = {
  id: string;
  platform: Platform;
  handle: string;
  profileUrl: string;
};

type Submission = {
  id: string;
  platform: Platform;
  postUrl: string;
  platformPostId: string;
  status: string;
  rejectionReason: string | null;
  reviewNote: string | null;
  createdAt: string;
  socialAccount?: {
    handle: string;
  };
};

type Props = {
  campaignId: string;
  minTrustScore: number;
  creatorTrustScore: number;
  rates: Array<{ platform: Platform }>;
  isInitiallyJoined: boolean;
  verifiedSocialAccounts: SocialAccount[];
  initialSubmissions: Submission[];
};

export function CampaignJoinAndSubmit({
  campaignId,
  minTrustScore,
  creatorTrustScore,
  rates,
  isInitiallyJoined,
  verifiedSocialAccounts,
  initialSubmissions,
}: Props) {
  const [isJoined, setIsJoined] = useState(isInitiallyJoined);
  const [submissions, setSubmissions] = useState<Submission[]>(initialSubmissions);
  const [selectedAccountId, setSelectedAccountId] = useState(
    verifiedSocialAccounts[0]?.id || "",
  );
  const [postUrl, setPostUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Eligibility Checks
  const hasMinTrustScore = creatorTrustScore >= minTrustScore;
  const campaignPlatforms = rates.map((r) => r.platform);
  const hasCompatibleAccount = verifiedSocialAccounts.some((acc) =>
    campaignPlatforms.includes(acc.platform),
  );
  const isEligible = hasMinTrustScore && hasCompatibleAccount;

  const handleJoin = async () => {
    setIsJoining(true);
    setMessage(null);

    try {
      const response = await fetch(`/api/v1/creator/campaigns/${campaignId}/join`, {
        method: "POST",
      });
      const data = await response.json();

      if (!response.ok) {
        setMessage({
          type: "error",
          text: data.error?.message || "فشل الانضمام للحملة.",
        });
        return;
      }

      setIsJoined(true);
      setMessage({
        type: "success",
        text: "تم الانضمام للحملة بنجاح! يمكنك الآن مشاركة منشوراتك.",
      });
    } catch {
      setMessage({ type: "error", text: "حدث خطأ أثناء الاتصال بالسيرفر." });
    } finally {
      setIsJoining(false);
    }
  };

  const handleSubmitPost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAccountId) {
      setMessage({ type: "error", text: "الرجاء اختيار الحساب الاجتماعي المستخدم." });
      return;
    }
    if (!postUrl) {
      setMessage({ type: "error", text: "الرجاء إدخال رابط منشور الفيديو." });
      return;
    }

    setIsSubmitting(true);
    setMessage(null);

    try {
      const response = await fetch(
        `/api/v1/creator/campaigns/${campaignId}/submissions`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            socialAccountId: selectedAccountId,
            postUrl,
          }),
        },
      );
      const data = await response.json();

      if (!response.ok) {
        setMessage({
          type: "error",
          text: data.error?.message || "فشل إرسال رابط المنشور.",
        });
        return;
      }

      setPostUrl("");
      setSubmissions((prev) => [data.data, ...prev]);
      setMessage({ type: "success", text: "تم إرسال المنشور للمراجعة بنجاح." });
    } catch {
      setMessage({ type: "error", text: "حدث خطأ أثناء الاتصال بالسيرفر." });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper styling for submission status badges
  const getBadgeStyle = (status: string) => {
    switch (status) {
      case "APPROVED":
        return {
          backgroundColor: "var(--trend-100)",
          color: "var(--forest-800)",
          border: "1px solid var(--trend-300)",
        };
      case "REJECTED":
        return {
          backgroundColor: "rgba(6,38,25,0.05)",
          color: "var(--forest-800)",
          border: "1px solid var(--forest-300)",
        };
      case "REVISION_REQUESTED":
        return {
          backgroundColor: "var(--trend-50)",
          color: "var(--trend-800)",
          border: "1px solid var(--trend-400)",
        };
      default:
        return {
          backgroundColor: "var(--mist-100)",
          color: "var(--forest-500)",
          border: "1px solid var(--mist-400)",
        };
    }
  };

  return (
    <div className="mt-10 space-y-8 dir-rtl">
      {message && (
        <div
          className={`rounded-[var(--radius-sm)] p-4 text-sm font-bold ${
            message.type === "success"
              ? "bg-[rgba(214,246,29,0.15)] text-[var(--forest-800)]"
              : "border-r-4 border-[var(--color-brand-active)] bg-[rgba(6,38,25,0.05)] text-[var(--forest-800)]"
          }`}
        >
          {message.text}
        </div>
      )}

      {!isJoined ? (
        <div className="card border border-[var(--color-border)] bg-[var(--color-surface)] p-8">
          <h3 className="text-xl font-extrabold text-[var(--color-text)]">
            التحقق من الأهلية والانضمام للحملة
          </h3>
          <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
            للانضمام للحملة ومشاركة أرباحها، يجب استيفاء الشروط التالية:
          </p>

          <ul className="mt-5 space-y-3 text-sm">
            <li className="flex items-center gap-2">
              <span
                className={`flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold ${
                  hasMinTrustScore
                    ? "bg-[var(--trend-400)] text-[var(--forest-800)]"
                    : "bg-[var(--mist-400)]"
                }`}
              >
                {hasMinTrustScore ? "✓" : "✗"}
              </span>
              <span>
                مستوى ثقتك الحالي <strong>{creatorTrustScore}</strong> (الحد الأدنى
                المطلوب للحملة هو <strong>{minTrustScore}</strong>)
              </span>
            </li>
            <li className="flex items-center gap-2">
              <span
                className={`flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold ${
                  hasCompatibleAccount
                    ? "bg-[var(--trend-400)] text-[var(--forest-800)]"
                    : "bg-[var(--mist-400)]"
                }`}
              >
                {hasCompatibleAccount ? "✓" : "✗"}
              </span>
              <span>
                امتلاك حساب اجتماعي موثق ومتوافق مع منصات الحملة المتاحة (
                {rates.map((r) => platformLabels[r.platform]).join("، ")})
              </span>
            </li>
          </ul>

          <div className="mt-8">
            {isEligible ? (
              <button
                type="button"
                onClick={handleJoin}
                disabled={isJoining}
                className="btn-primary w-full sm:w-auto px-8"
              >
                {isJoining ? "جاري الانضمام..." : "انضمام للحملة الآن"}
              </button>
            ) : (
              <div className="rounded-[var(--radius-sm)] bg-[var(--color-surface-muted)] p-4 text-xs font-medium text-[var(--color-text-secondary)]">
                عذراً، لا تستوفي حالياً شروط الأهلية المطلوبة للانضمام لهذه الحملة.
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Join Badge */}
          <div className="flex items-center gap-3 rounded-[var(--radius-md)] bg-[rgba(214,246,29,0.12)] border border-[var(--trend-300)] p-4">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--trend-400)] text-xs font-extrabold text-[var(--forest-800)]">
              ✓
            </span>
            <div>
              <p className="text-sm font-extrabold text-[var(--color-text)]">
                لقد انضممت بنجاح لهذه الحملة
              </p>
              <p className="text-xs text-[var(--color-text-secondary)]">
                أنت مؤهل الآن لمشاركة روابط منشوراتك والحصول على الأرباح وفق شروط الحملة.
              </p>
            </div>
          </div>

          {/* Submission Form */}
          <div className="card border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
            <h3 className="text-lg font-extrabold text-[var(--color-text)] mb-4">
              إرسال رابط منشور جديد
            </h3>

            <form onSubmit={handleSubmitPost} className="space-y-5">
              <div>
                <label
                  htmlFor="socialAccount"
                  className="mb-2 block text-sm font-bold text-[var(--color-text)]"
                >
                  الحساب الاجتماعي المستخدم
                </label>
                <div className="select-field-wrap">
                  <select
                    id="socialAccount"
                    value={selectedAccountId}
                    onChange={(e) => setSelectedAccountId(e.target.value)}
                    className="select-field"
                    disabled={isSubmitting}
                  >
                    <option value="">-- اختر حساباً موثقاً --</option>
                    {verifiedSocialAccounts
                      .filter((acc) => campaignPlatforms.includes(acc.platform))
                      .map((acc) => (
                        <option key={acc.id} value={acc.id}>
                          {platformLabels[acc.platform]} ( @{acc.handle} )
                        </option>
                      ))}
                  </select>
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    aria-hidden="true"
                    className="select-field-chevron"
                  >
                    <path
                      d="M4 6l4 4 4-4"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              </div>

              <div>
                <label
                  htmlFor="postUrl"
                  className="mb-2 block text-sm font-bold text-[var(--color-text)]"
                >
                  رابط المنشور (فيديو المنشور)
                </label>
                <input
                  id="postUrl"
                  type="url"
                  placeholder="https://www.tiktok.com/@username/video/123456789"
                  value={postUrl}
                  onChange={(e) => setPostUrl(e.target.value)}
                  className="min-h-[48px] w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 text-[var(--color-text)] focus:border-[var(--color-brand)] focus:outline-none"
                  disabled={isSubmitting}
                />
                <p className="mt-1 text-xs text-[var(--color-text-secondary)]">
                  تأكد من مطابقة رابط المنشور لنوع المنصة والـ Platform Post ID بشكل كامل.
                </p>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-primary w-full sm:w-auto px-6"
              >
                {isSubmitting ? "جاري إرسال المنشور..." : "إرسال المنشور للمراجعة"}
              </button>
            </form>
          </div>

          {/* Submissions List */}
          <div>
            <h3 className="text-lg font-extrabold text-[var(--color-text)] mb-4">
              المنشورات المرسلة السابقة ({submissions.length})
            </h3>
            {submissions.length === 0 ? (
              <p className="text-sm text-[var(--color-text-secondary)]">
                لا توجد منشورات مرسلة حالياً لهذه الحملة.
              </p>
            ) : (
              <div className="space-y-4">
                {submissions.map((sub) => (
                  <div
                    key={sub.id}
                    className="card border border-[var(--color-border)] bg-[var(--color-surface)] p-5 space-y-3"
                  >
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div>
                        <span className="text-xs font-bold text-[var(--color-text-secondary)]">
                          {platformLabels[sub.platform]} · المعرّف: {sub.platformPostId}
                        </span>
                        {sub.socialAccount && (
                          <span className="mr-2 text-xs font-medium text-[var(--color-text-secondary)]">
                            ( الحساب: @{sub.socialAccount.handle} )
                          </span>
                        )}
                      </div>
                      <span
                        className="rounded-[var(--radius-pill)] px-3 py-1 text-xs font-bold"
                        style={getBadgeStyle(sub.status)}
                      >
                        {statusLabels[sub.status] || sub.status}
                      </span>
                    </div>

                    <div>
                      <a
                        href={sub.postUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-bold text-[var(--color-text)] hover:underline break-all"
                      >
                        {sub.postUrl}
                      </a>
                    </div>

                    {(sub.rejectionReason || sub.reviewNote) && (
                      <div className="rounded-[var(--radius-sm)] bg-[rgba(6,38,25,0.03)] border-r-4 border-[var(--color-text-muted)] p-3 text-xs">
                        {sub.rejectionReason && (
                          <p className="font-bold text-[var(--color-text)]">
                            سبب الرفض:{" "}
                            <span className="font-semibold">{sub.rejectionReason}</span>
                          </p>
                        )}
                        {sub.reviewNote && (
                          <p className="mt-1 text-[var(--color-text-secondary)]">
                            ملاحظة المراجع: {sub.reviewNote}
                          </p>
                        )}
                      </div>
                    )}

                    <div className="text-[10px] text-[var(--color-text-secondary)]">
                      تاريخ التقديم: {new Date(sub.createdAt).toLocaleString("ar-IQ")}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
