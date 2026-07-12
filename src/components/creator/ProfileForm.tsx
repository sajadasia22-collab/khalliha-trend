"use client";

import { useState } from "react";

type Props = {
  initialBio: string;
  initialCountry: string;
  initialGovernorate: string;
};

export function ProfileForm({ initialBio, initialCountry, initialGovernorate }: Props) {
  const [bio, setBio] = useState(initialBio);
  const [country, setCountry] = useState(initialCountry);
  const [governorate, setGovernorate] = useState(initialGovernorate);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    setMessage(null);

    try {
      const response = await fetch("/api/v1/creator/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bio, country, governorate }),
      });
      const data = await response.json();

      if (!response.ok) {
        setMessage({ type: "error", text: data.error?.message || "فشل حفظ التغييرات." });
        return;
      }

      setMessage({ type: "success", text: "تم حفظ الملف الشخصي بنجاح." });
    } catch {
      setMessage({ type: "error", text: "حدث خطأ في الاتصال بالسيرفر." });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {message && (
        <div
          className={`scale-in rounded-[var(--radius-sm)] border p-4 text-sm font-semibold ${
            message.type === "success"
              ? "border-transparent bg-[rgba(214,246,29,0.15)] text-[var(--forest-800)]"
              : "border-[var(--color-border)] bg-[rgba(6,38,25,0.05)] text-[var(--forest-800)]"
          }`}
          role={message.type === "error" ? "alert" : undefined}
        >
          {message.text}
        </div>
      )}

      <div>
        <label htmlFor="bio" className="mb-2 block text-sm font-bold">
          نبذة عنك
        </label>
        <textarea
          id="bio"
          value={bio}
          onChange={(event) => setBio(event.target.value)}
          rows={4}
          maxLength={500}
          className="w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-[var(--color-text)] focus:border-[var(--color-brand)] focus:outline-none focus:ring-4 focus:ring-[rgba(214,246,29,0.18)]"
          disabled={isLoading}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="country" className="mb-2 block text-sm font-bold">
            رمز الدولة
          </label>
          <input
            id="country"
            value={country}
            onChange={(event) => setCountry(event.target.value.toUpperCase())}
            maxLength={2}
            className="min-h-[48px] w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 text-[var(--color-text)] focus:border-[var(--color-brand)] focus:outline-none focus:ring-4 focus:ring-[rgba(214,246,29,0.18)]"
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
            className="min-h-[48px] w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 text-[var(--color-text)] focus:border-[var(--color-brand)] focus:outline-none focus:ring-4 focus:ring-[rgba(214,246,29,0.18)]"
            disabled={isLoading}
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="btn-primary px-6 py-3 text-sm"
      >
        {isLoading ? "جاري الحفظ..." : "حفظ التغييرات"}
      </button>
    </form>
  );
}
