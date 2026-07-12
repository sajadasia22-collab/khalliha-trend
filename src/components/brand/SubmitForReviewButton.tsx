"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function SubmitForReviewButton({ campaignId }: { campaignId: string }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    setIsLoading(true);
    setError("");
    try {
      const response = await fetch(
        `/api/v1/brand/campaigns/${campaignId}/submit-review`,
        {
          method: "POST",
        },
      );
      const data = await response.json();
      if (!response.ok) {
        setError(data.error?.message || "فشل إرسال الحملة للمراجعة.");
        return;
      }
      router.refresh();
    } catch {
      setError("حدث خطأ في الاتصال بالسيرفر.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      {error && (
        <p className="mb-3 text-sm font-semibold text-[var(--forest-800)]">{error}</p>
      )}
      <button
        type="button"
        onClick={handleSubmit}
        disabled={isLoading}
        className="btn-primary px-6 py-3 text-sm"
      >
        {isLoading ? "جاري الإرسال..." : "إرسال للمراجعة"}
      </button>
    </div>
  );
}
