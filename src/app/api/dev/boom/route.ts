import { NextResponse } from "next/server";

// Dev-only: يرمي خطأ غير معالج عمداً لاختبار مراقبة الأخطاء (instrumentation
// وتنبيهات الـ webhook) محلياً. معطّل في الإنتاج مثل بقية مسارات /api/dev.
export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not available" }, { status: 404 });
  }
  throw new Error("boom: اختبار مراقبة أخطاء السيرفر");
}
