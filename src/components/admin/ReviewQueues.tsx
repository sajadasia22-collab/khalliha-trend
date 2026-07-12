"use client";

import { useState } from "react";
import { platformLabels, formatBudget } from "../../lib/campaigns";
import { EmptyState } from "../ui/EmptyState";

type BrandVerificationItem = {
  id: string;
  requestedAt: string;
  brand: { id: string; name: string; slug: string; description: string | null };
};

type SocialAccountItem = {
  id: string;
  platform: keyof typeof platformLabels;
  handle: string;
  profileUrl: string;
  creatorProfile: { user: { fullName: string; email: string | null } };
};

type CampaignItem = {
  id: string;
  title: string;
  summary: string;
  currency: string;
  totalBudget: string;
  brand: { id: string; name: string; slug: string };
};

type SubmissionItem = {
  id: string;
  platform: keyof typeof platformLabels;
  postUrl: string;
  platformPostId: string;
  status: "SUBMITTED" | "UNDER_REVIEW" | "REVISION_REQUESTED" | "APPROVED" | "REJECTED";
  createdAt: string;
  creator: { fullName: string; email: string | null };
  campaign: { title: string };
};

type DepositItem = {
  id: string;
  amount: string;
  currency: "IQD" | "USD";
  referenceNumber: string | null;
  note: string | null;
  createdAt: string;
  user: { fullName: string; email: string | null };
};

type PayoutItem = {
  id: string;
  amount: string;
  currency: "IQD" | "USD";
  payoutMethod: string;
  recipientDetails: string;
  createdAt: string;
  user: { fullName: string; email: string | null };
};

function SectionHeader({ title, count }: { title: string; count: number }) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <h2 className="text-lg font-extrabold text-[var(--color-text)]">{title}</h2>
      {count > 0 && (
        <span className="rounded-[var(--radius-pill)] bg-[var(--color-surface-muted)] px-2.5 py-0.5 text-xs font-bold text-[var(--color-text-secondary)]">
          {count}
        </span>
      )}
    </div>
  );
}

const ITEM_CARD =
  "rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-sm)] transition-shadow duration-150 hover:shadow-[var(--shadow-md)]";

export function ReviewQueues({
  initialBrandVerifications,
  initialSocialAccounts,
  initialCampaigns,
  initialSubmissions,
  initialDeposits,
  initialPayouts,
}: {
  initialBrandVerifications: BrandVerificationItem[];
  initialSocialAccounts: SocialAccountItem[];
  initialCampaigns: CampaignItem[];
  initialSubmissions: SubmissionItem[];
  initialDeposits: DepositItem[];
  initialPayouts: PayoutItem[];
}) {
  const [brandVerifications, setBrandVerifications] = useState(initialBrandVerifications);
  const [socialAccounts, setSocialAccounts] = useState(initialSocialAccounts);
  const [campaigns, setCampaigns] = useState(initialCampaigns);
  const [submissions, setSubmissions] = useState(initialSubmissions);
  const [deposits, setDeposits] = useState(initialDeposits);
  const [payouts, setPayouts] = useState(initialPayouts);

  // Metrics overlay modal state
  const [selectedSubmissionForMetrics, setSelectedSubmissionForMetrics] =
    useState<SubmissionItem | null>(null);
  const [observedViews, setObservedViews] = useState("");
  const [qualifiedViews, setQualifiedViews] = useState("");
  const [metricsNote, setMetricsNote] = useState("");
  const [submittingMetrics, setSubmittingMetrics] = useState(false);

  const reviewBrand = async (id: string, decision: "APPROVED" | "REJECTED") => {
    const note =
      decision === "REJECTED"
        ? (window.prompt("سبب الرفض (اختياري):") ?? undefined)
        : undefined;
    const response = await fetch(`/api/v1/admin/brand-verifications/${id}/review`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ decision, note }),
    });
    if (response.ok) {
      setBrandVerifications((current) => current.filter((item) => item.id !== id));
    }
  };

  const reviewSocialAccount = async (id: string, decision: "VERIFIED" | "REJECTED") => {
    const rejectionReason =
      decision === "REJECTED"
        ? (window.prompt("سبب الرفض (اختياري):") ?? undefined)
        : undefined;
    const response = await fetch(`/api/v1/admin/social-accounts/${id}/review`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ decision, rejectionReason }),
    });
    if (response.ok) {
      setSocialAccounts((current) => current.filter((item) => item.id !== id));
    }
  };

  const reviewCampaign = async (
    id: string,
    decision: "APPROVE" | "REQUEST_CHANGES" | "REJECT",
  ) => {
    const note =
      decision !== "APPROVE"
        ? (window.prompt("ملاحظة للتاجر (اختياري):") ?? undefined)
        : undefined;
    const response = await fetch(`/api/v1/admin/campaigns/${id}/review`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ decision, note }),
    });
    if (response.ok) {
      setCampaigns((current) => current.filter((item) => item.id !== id));
    }
  };

  const reviewSubmission = async (
    id: string,
    decision: "APPROVE" | "REJECT" | "REQUEST_REVISION",
  ) => {
    const note =
      decision !== "APPROVE"
        ? (window.prompt(
            decision === "REJECT"
              ? "سبب الرفض (إلزامي):"
              : "ملاحظات التعديل المطلوبة (إلزامية):",
          ) ?? undefined)
        : undefined;

    if (decision !== "APPROVE" && !note) {
      alert("يجب إدخال ملاحظة أو سبب لإكمال هذا الإجراء.");
      return;
    }

    const response = await fetch(`/api/v1/admin/submissions/${id}/review`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ decision, note }),
    });

    if (response.ok) {
      if (decision === "APPROVE") {
        setSubmissions((current) =>
          current.map((item) =>
            item.id === id ? { ...item, status: "APPROVED" } : item,
          ),
        );
      } else {
        setSubmissions((current) => current.filter((item) => item.id !== id));
      }
    } else {
      const data = await response.json();
      alert(data.error?.message || "فشلت عملية المراجعة.");
    }
  };

  const reviewDeposit = async (id: string, decision: "APPROVE" | "REJECT") => {
    const note =
      decision === "REJECT"
        ? (window.prompt("سبب الرفض (إلزامي):") ?? undefined)
        : undefined;
    if (decision === "REJECT" && !note) {
      alert("يجب كتابة سبب الرفض المالي.");
      return;
    }

    const response = await fetch(`/api/v1/admin/financial`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "DEPOSIT", id, decision, note }),
    });

    if (response.ok) {
      alert("تم معالجة الإيداع بنجاح!");
      setDeposits((current) => current.filter((item) => item.id !== id));
    } else {
      const data = await response.json();
      alert(data.error?.message || "فشلت معالجة الإيداع.");
    }
  };

  const reviewPayout = async (id: string, decision: "APPROVE" | "REJECT") => {
    const note =
      decision === "REJECT"
        ? (window.prompt("سبب الرفض (إلزامي):") ?? undefined)
        : undefined;
    if (decision === "REJECT" && !note) {
      alert("يجب كتابة سبب الرفض المالي.");
      return;
    }

    const referenceNumber =
      decision === "APPROVE"
        ? (window.prompt("رقم التحويل / مرجع المعاملة لزين كاش أو فاست باي (اختياري):") ??
          undefined)
        : undefined;

    const response = await fetch(`/api/v1/admin/financial`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "PAYOUT", id, decision, referenceNumber, note }),
    });

    if (response.ok) {
      alert("تم معالجة طلب السحب والتحويل بنجاح!");
      setPayouts((current) => current.filter((item) => item.id !== id));
    } else {
      const data = await response.json();
      alert(data.error?.message || "فشلت معالجة طلب السحب.");
    }
  };

  const submitMetrics = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubmissionForMetrics) return;

    const obsVal = parseInt(observedViews, 10);
    const qualVal = parseInt(qualifiedViews, 10);

    if (isNaN(obsVal) || isNaN(qualVal) || obsVal < 0 || qualVal < 0) {
      alert("الرجاء إدخال أرقام صحيحة وموجبة للمشاهدات");
      return;
    }

    if (qualVal > obsVal) {
      alert("المشاهدات المؤهلة لا يمكن أن تتجاوز المشاهدات الكلية");
      return;
    }

    if (qualVal < obsVal && !metricsNote.trim()) {
      alert("الرجاء إدخال سبب استبعاد بعض المشاهدات في الملاحظات");
      return;
    }

    setSubmittingMetrics(true);
    try {
      const response = await fetch(
        `/api/v1/admin/submissions/${selectedSubmissionForMetrics.id}/metrics`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            observedViews: obsVal,
            qualifiedViews: qualVal,
            note: metricsNote.trim() || undefined,
          }),
        },
      );

      if (response.ok) {
        alert("تم تسجيل الإحصائيات واحتساب الأرباح بنجاح!");
        setSelectedSubmissionForMetrics(null);
        setObservedViews("");
        setQualifiedViews("");
        setMetricsNote("");
      } else {
        const data = await response.json();
        alert(data.error?.message || "فشلت عملية حفظ الإحصائيات.");
      }
    } catch {
      alert("حدث خطأ في الشبكة");
    } finally {
      setSubmittingMetrics(false);
    }
  };

  return (
    <div className="space-y-10">
      <div>
        <SectionHeader
          title="طلبات توثيق العلامات التجارية"
          count={brandVerifications.length}
        />
        {brandVerifications.length === 0 ? (
          <EmptyState message="لا توجد طلبات توثيق قيد المراجعة." />
        ) : (
          <div className="space-y-3">
            {brandVerifications.map((item) => (
              <div
                key={item.id}
                className={`flex items-center justify-between p-4 ${ITEM_CARD}`}
              >
                <div>
                  <p className="font-bold text-[var(--color-text)]">{item.brand.name}</p>
                  <p className="mt-1 text-xs text-[var(--color-text-secondary)]">
                    {item.brand.description || "لا يوجد وصف"}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => reviewBrand(item.id, "APPROVED")}
                    className="btn-primary px-4 py-2 text-xs"
                  >
                    توثيق
                  </button>
                  <button
                    type="button"
                    onClick={() => reviewBrand(item.id, "REJECTED")}
                    className="btn-secondary px-4 py-2 text-xs"
                  >
                    رفض
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <SectionHeader
          title="حسابات اجتماعية قيد المراجعة"
          count={socialAccounts.length}
        />
        {socialAccounts.length === 0 ? (
          <EmptyState message="لا توجد حسابات اجتماعية قيد المراجعة." />
        ) : (
          <div className="space-y-3">
            {socialAccounts.map((item) => (
              <div
                key={item.id}
                className={`flex items-center justify-between p-4 ${ITEM_CARD}`}
              >
                <div>
                  <p className="font-bold text-[var(--color-text)]">
                    {platformLabels[item.platform]} · @{item.handle}
                  </p>
                  <p className="mt-1 text-xs text-[var(--color-text-secondary)]">
                    {item.creatorProfile.user.fullName} — {item.profileUrl}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => reviewSocialAccount(item.id, "VERIFIED")}
                    className="btn-primary px-4 py-2 text-xs"
                  >
                    توثيق
                  </button>
                  <button
                    type="button"
                    onClick={() => reviewSocialAccount(item.id, "REJECTED")}
                    className="btn-secondary px-4 py-2 text-xs"
                  >
                    رفض
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <SectionHeader title="حملات قيد المراجعة" count={campaigns.length} />
        {campaigns.length === 0 ? (
          <EmptyState message="لا توجد حملات قيد المراجعة." />
        ) : (
          <div className="space-y-3">
            {campaigns.map((item) => (
              <div key={item.id} className={`p-4 ${ITEM_CARD}`}>
                <div>
                  <p className="font-bold text-[var(--color-text)]">{item.title}</p>
                  <p className="mt-1 text-xs text-[var(--color-text-secondary)]">
                    {item.brand.name} ·{" "}
                    {formatBudget(BigInt(item.totalBudget), item.currency)}
                  </p>
                  <p className="mt-2 text-xs leading-relaxed text-[var(--color-text-secondary)]">
                    {item.summary}
                  </p>
                </div>
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={() => reviewCampaign(item.id, "APPROVE")}
                    className="btn-primary px-4 py-2 text-xs"
                  >
                    اعتماد
                  </button>
                  <button
                    type="button"
                    onClick={() => reviewCampaign(item.id, "REQUEST_CHANGES")}
                    className="btn-secondary px-4 py-2 text-xs"
                  >
                    طلب تعديلات
                  </button>
                  <button
                    type="button"
                    onClick={() => reviewCampaign(item.id, "REJECT")}
                    className="btn-secondary px-4 py-2 text-xs"
                  >
                    رفض
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-6">
        <SectionHeader
          title="منشورات صناع المحتوى بانتظار المراجعة والتدقيق"
          count={submissions.filter((s) => s.status !== "APPROVED").length}
        />
        {submissions.filter((s) => s.status !== "APPROVED").length === 0 ? (
          <EmptyState message="لا توجد منشورات بانتظار المراجعة حالياً." />
        ) : (
          <div className="space-y-4">
            {submissions
              .filter((s) => s.status !== "APPROVED")
              .map((item) => (
                <div key={item.id} className={`space-y-3 p-5 ${ITEM_CARD}`}>
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div>
                      <p className="text-xs font-bold text-[var(--color-text-secondary)]">
                        الحملة: {item.campaign.title}
                      </p>
                      <p className="mt-1 text-xs font-medium text-[var(--color-text-secondary)]">
                        صانع المحتوى: {item.creator.fullName} (
                        {item.creator.email || "بدون بريد"})
                      </p>
                    </div>
                    <span className="rounded-[var(--radius-pill)] bg-[var(--mist-100)] border border-[var(--mist-400)] px-2.5 py-0.5 text-xs font-bold text-[var(--forest-500)]">
                      {platformLabels[item.platform]} · معرّف: {item.platformPostId}
                    </span>
                  </div>

                  <div>
                    <a
                      href={item.postUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-bold text-[var(--color-text)] hover:underline break-all"
                    >
                      {item.postUrl}
                    </a>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => reviewSubmission(item.id, "APPROVE")}
                      className="btn-primary px-4 py-2 text-xs"
                    >
                      اعتماد القبول
                    </button>
                    <button
                      type="button"
                      onClick={() => reviewSubmission(item.id, "REQUEST_REVISION")}
                      className="btn-secondary px-4 py-2 text-xs"
                    >
                      طلب تعديل
                    </button>
                    <button
                      type="button"
                      onClick={() => reviewSubmission(item.id, "REJECT")}
                      className="btn-secondary px-4 py-2 text-xs"
                    >
                      رفض المنشور
                    </button>
                  </div>

                  <div className="text-[10px] text-[var(--color-text-secondary)]">
                    تاريخ التقديم: {new Date(item.createdAt).toLocaleString("ar-IQ")}
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>

      <div className="border-t border-[var(--color-border)] pt-8">
        <SectionHeader
          title="منشورات معتمدة - بانتظار الإحصائيات والأرباح"
          count={submissions.filter((s) => s.status === "APPROVED").length}
        />
        {submissions.filter((s) => s.status === "APPROVED").length === 0 ? (
          <EmptyState message="لا توجد منشورات معتمدة حالياً." />
        ) : (
          <div className="space-y-4">
            {submissions
              .filter((s) => s.status === "APPROVED")
              .map((item) => (
                <div key={item.id} className={`space-y-3 p-5 ${ITEM_CARD}`}>
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div>
                      <p className="text-xs font-bold text-[var(--color-text-secondary)]">
                        الحملة: {item.campaign.title}
                      </p>
                      <p className="mt-1 text-xs font-medium text-[var(--color-text-secondary)]">
                        صانع المحتوى: {item.creator.fullName}
                      </p>
                    </div>
                    <span className="rounded-[var(--radius-pill)] bg-[var(--color-brand)] border border-[var(--color-brand-active)] px-2.5 py-0.5 text-xs font-bold text-[var(--color-text-on-brand)]">
                      معتمد · {platformLabels[item.platform]}
                    </span>
                  </div>

                  <div>
                    <a
                      href={item.postUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-bold text-[var(--color-text)] hover:underline break-all"
                    >
                      {item.postUrl}
                    </a>
                  </div>

                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => setSelectedSubmissionForMetrics(item)}
                      className="btn-primary px-4 py-2 text-xs"
                    >
                      سجّل الإحصائيات والأرباح
                    </button>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* Metrics Logging Modal */}
      {selectedSubmissionForMetrics && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[rgba(6,38,25,0.7)] backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-2xl space-y-4 text-right dir-rtl">
            <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-3">
              <h3 className="text-lg font-extrabold text-[var(--color-text)]">
                تسجيل إحصائيات المشاهدات
              </h3>
              <button
                type="button"
                onClick={() => setSelectedSubmissionForMetrics(null)}
                className="text-[var(--color-text-secondary)] hover:text-[var(--color-text)] font-bold text-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={submitMetrics} className="space-y-4">
              <div>
                <p className="text-xs font-bold text-[var(--color-text-secondary)] mb-1">
                  الحملة
                </p>
                <p className="text-sm font-extrabold text-[var(--color-text)]">
                  {selectedSubmissionForMetrics.campaign.title}
                </p>
              </div>

              <div>
                <p className="text-xs font-bold text-[var(--color-text-secondary)] mb-1">
                  صانع المحتوى
                </p>
                <p className="text-sm font-extrabold text-[var(--color-text)]">
                  {selectedSubmissionForMetrics.creator.fullName}
                </p>
              </div>

              <div>
                <label
                  htmlFor="metrics-observed-views"
                  className="block text-xs font-bold text-[var(--color-text-secondary)] mb-1"
                >
                  المشاهدات الكلية المرصودة (Observed Views)
                </label>
                <input
                  id="metrics-observed-views"
                  type="number"
                  required
                  value={observedViews}
                  onChange={(e) => setObservedViews(e.target.value)}
                  className="w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-text)] focus:border-[var(--color-brand)] focus:outline-none"
                  placeholder="مثال: 12500"
                />
              </div>

              <div>
                <label
                  htmlFor="metrics-qualified-views"
                  className="block text-xs font-bold text-[var(--color-text-secondary)] mb-1"
                >
                  المشاهدات المؤهلة للأرباح (Qualified Views)
                </label>
                <input
                  id="metrics-qualified-views"
                  type="number"
                  required
                  value={qualifiedViews}
                  onChange={(e) => setQualifiedViews(e.target.value)}
                  className="w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-text)] focus:border-[var(--color-brand)] focus:outline-none"
                  placeholder="مثال: 12000"
                />
              </div>

              <div>
                <label
                  htmlFor="metrics-note"
                  className="block text-xs font-bold text-[var(--color-text-secondary)] mb-1"
                >
                  سبب استبعاد المشاهدات / ملاحظات التدقيق
                </label>
                <textarea
                  id="metrics-note"
                  value={metricsNote}
                  onChange={(e) => setMetricsNote(e.target.value)}
                  className="w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-text)] focus:border-[var(--color-brand)] focus:outline-none"
                  placeholder="إلزامي فقط في حال كانت المشاهدات المؤهلة أقل من الكلية المرصودة..."
                  rows={3}
                />
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  type="submit"
                  disabled={submittingMetrics}
                  className="btn-primary w-full py-2.5 text-sm font-bold disabled:opacity-50"
                >
                  {submittingMetrics ? "جاري الحفظ والاحتساب..." : "حفظ واحتساب الأرباح"}
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedSubmissionForMetrics(null)}
                  className="btn-secondary w-full py-2.5 text-sm font-bold"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Deposits Management Section */}
      <div className="border-t border-[var(--color-border)] pt-8">
        <SectionHeader
          title="طلبات شحن الأرصدة (الودائع) المعلقة"
          count={deposits.length}
        />
        {deposits.length === 0 ? (
          <EmptyState message="لا توجد طلبات إيداع معلقة حالياً." />
        ) : (
          <div className="space-y-4">
            {deposits.map((item) => (
              <div key={item.id} className={`space-y-3 p-5 ${ITEM_CARD}`}>
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <p className="text-xs font-bold text-[var(--color-text-secondary)]">
                      التاجر: {item.user.fullName} ({item.user.email || "بدون بريد"})
                    </p>
                  </div>
                  <span className="rounded-[var(--radius-pill)] bg-[var(--trend-100)] border border-[var(--color-brand)] px-2.5 py-0.5 text-xs font-bold text-[var(--forest-700)]">
                    إيداع ·{" "}
                    {item.currency === "IQD"
                      ? `${parseInt(item.amount, 10).toLocaleString("ar-IQ")} د.ع`
                      : `$${(parseInt(item.amount, 10) / 100).toLocaleString("en-US", { minimumFractionDigits: 2 })}`}
                  </span>
                </div>

                <div className="text-sm font-medium text-[var(--color-text)] space-y-1">
                  <p>
                    رقم المرجع المقدم:{" "}
                    <span className="font-mono">{item.referenceNumber || "لا يوجد"}</span>
                  </p>
                  {item.note && <p>ملاحظة التاجر: {item.note}</p>}
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => reviewDeposit(item.id, "APPROVE")}
                    className="btn-primary px-4 py-2 text-xs"
                  >
                    اعتماد الشحن
                  </button>
                  <button
                    type="button"
                    onClick={() => reviewDeposit(item.id, "REJECT")}
                    className="btn-secondary px-4 py-2 text-xs"
                  >
                    رفض الطلب
                  </button>
                </div>

                <div className="text-[10px] text-[var(--color-text-secondary)]">
                  تاريخ تقديم الطلب: {new Date(item.createdAt).toLocaleString("ar-IQ")}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Payouts Management Section */}
      <div className="border-t border-[var(--color-border)] pt-8">
        <SectionHeader title="طلبات سحب الأرباح المعلقة" count={payouts.length} />
        {payouts.length === 0 ? (
          <EmptyState message="لا توجد طلبات سحب معلقة حالياً." />
        ) : (
          <div className="space-y-4">
            {payouts.map((item) => (
              <div key={item.id} className={`space-y-3 p-5 ${ITEM_CARD}`}>
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <p className="text-xs font-bold text-[var(--color-text-secondary)]">
                      صانع المحتوى: {item.user.fullName} ({item.user.email || "بدون بريد"}
                      )
                    </p>
                  </div>
                  <span className="rounded-[var(--radius-pill)] bg-[var(--mist-100)] border border-[var(--mist-400)] px-2.5 py-0.5 text-xs font-bold text-[var(--forest-500)]">
                    سحب ·{" "}
                    {item.currency === "IQD"
                      ? `${parseInt(item.amount, 10).toLocaleString("ar-IQ")} د.ع`
                      : `$${(parseInt(item.amount, 10) / 100).toLocaleString("en-US", { minimumFractionDigits: 2 })}`}
                  </span>
                </div>

                <div className="text-sm font-medium text-[var(--color-text)] space-y-1">
                  <p>
                    وسيلة السحب المطلوبة:{" "}
                    <span className="font-bold">
                      {item.payoutMethod === "ZainCash"
                        ? "زين كاش"
                        : item.payoutMethod === "FastPay"
                          ? "فاست باي"
                          : "تحويل مصرفي"}
                    </span>
                  </p>
                  <p>
                    حساب المستلم:{" "}
                    <span className="font-mono font-bold">{item.recipientDetails}</span>
                  </p>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => reviewPayout(item.id, "APPROVE")}
                    className="btn-primary px-4 py-2 text-xs"
                  >
                    اعتماد التحويل المالي
                  </button>
                  <button
                    type="button"
                    onClick={() => reviewPayout(item.id, "REJECT")}
                    className="btn-secondary px-4 py-2 text-xs"
                  >
                    رفض طلب السحب
                  </button>
                </div>

                <div className="text-[10px] text-[var(--color-text-secondary)]">
                  تاريخ تقديم الطلب: {new Date(item.createdAt).toLocaleString("ar-IQ")}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
