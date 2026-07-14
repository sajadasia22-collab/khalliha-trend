// تنبيهات أخطاء الإنتاج: سجل JSON منظم (يُقرأ من Vercel Logs) + webhook اختياري.
// الحمولة تتضمن الحقلين text وcontent معاً لتعمل مع Slack وDiscord دون إعداد إضافي.

const ALERT_TIMEOUT_MS = 5_000;
const THROTTLE_WINDOW_MS = 60_000;

// كبح بسيط في الذاكرة: تنبيه واحد لكل رسالة خطأ خلال النافذة الزمنية،
// حتى لا يغرق الـ webhook عند تكرار نفس الخطأ في موجة طلبات.
const lastAlertAt = new Map<string, number>();

export type RequestErrorRecord = {
  message: string;
  stack?: string;
  path: string;
  method: string;
  routeType: string;
  routePath: string;
};

export function buildErrorRecord(
  error: unknown,
  request: { path: string; method: string },
  context: { routeType: string; routePath: string },
): RequestErrorRecord {
  const err = error instanceof Error ? error : new Error(String(error));
  return {
    message: err.message,
    stack: err.stack?.split("\n").slice(0, 8).join("\n"),
    path: request.path,
    method: request.method,
    routeType: context.routeType,
    routePath: context.routePath,
  };
}

export function shouldSendAlert(
  message: string,
  now = Date.now(),
  throttleWindowMs = THROTTLE_WINDOW_MS,
): boolean {
  const last = lastAlertAt.get(message);
  if (last !== undefined && now - last < throttleWindowMs) {
    return false;
  }
  lastAlertAt.set(message, now);
  return true;
}

export async function reportRequestError(record: RequestErrorRecord): Promise<void> {
  // سجل منظم بمفتاح ثابت يسهل البحث عنه في Vercel Logs.
  console.error(
    JSON.stringify({
      source: "khalliha:server-error",
      at: new Date().toISOString(),
      ...record,
    }),
  );

  const webhookUrl = process.env.ERROR_ALERT_WEBHOOK_URL;
  if (!webhookUrl || !shouldSendAlert(record.message)) {
    return;
  }

  const summary = [
    "🚨 خطأ سيرفر — خلّيها ترند",
    `المسار: ${record.method} ${record.path}`,
    `النوع: ${record.routeType} (${record.routePath})`,
    `الرسالة: ${record.message}`,
  ].join("\n");

  try {
    await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: summary, content: summary }),
      signal: AbortSignal.timeout(ALERT_TIMEOUT_MS),
    });
  } catch {
    // فشل التنبيه يجب ألا يكسر معالجة الطلب أو يسبب حلقة أخطاء.
  }
}
