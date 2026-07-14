import type { Instrumentation } from "next";
import { buildErrorRecord, reportRequestError } from "./lib/error-alert";

// يلتقط أخطاء السيرفر غير المعالجة (صفحات، API routes، proxy) في الإنتاج والتطوير.
// راجع docs/DEPLOYMENT.md قسم المراقبة لطريقة تفعيل تنبيهات الـ webhook.
export const onRequestError: Instrumentation.onRequestError = async (
  error,
  request,
  context,
) => {
  await reportRequestError(
    buildErrorRecord(
      error,
      { path: request.path, method: request.method },
      { routeType: context.routeType, routePath: context.routePath },
    ),
  );
};
