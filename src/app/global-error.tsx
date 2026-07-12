"use client";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="ar" dir="rtl">
      <body>
        <main
          style={{
            display: "flex",
            minHeight: "100vh",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "1rem",
            padding: "1.5rem",
            textAlign: "center",
            background: "#E7EDE9",
            color: "#062619",
          }}
        >
          <h1 style={{ fontSize: "1.5rem", fontWeight: 800 }}>حدث خطأ غير متوقع</h1>
          <p style={{ maxWidth: "28rem", fontSize: "0.875rem", fontWeight: 500 }}>
            نعتذر، حدث خطأ في تحميل الصفحة. حاول إعادة المحاولة أو العودة لاحقاً.
          </p>
          <button
            type="button"
            onClick={() => reset()}
            style={{
              borderRadius: "0.5rem",
              background: "#D6F61D",
              color: "#062619",
              fontWeight: 700,
              fontSize: "0.875rem",
              padding: "0.6rem 1.25rem",
              border: "none",
              cursor: "pointer",
            }}
          >
            إعادة المحاولة
          </button>
        </main>
      </body>
    </html>
  );
}
