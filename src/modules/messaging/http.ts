import { errorResponse } from "../../lib/api/response";

const errors: Record<string, { status: number; message: string }> = {
  MESSAGING_ROLE_NOT_ALLOWED: {
    status: 403,
    message: "المراسلة متاحة للتجار وصناع المحتوى فقط.",
  },
  CONVERSATION_NOT_FOUND: { status: 404, message: "المحادثة غير موجودة." },
  CAMPAIGN_CONTACT_NOT_FOUND: {
    status: 404,
    message: "جهة الاتصال غير مرتبطة بهذه الحملة.",
  },
  MESSAGE_PERMISSION_DENIED: {
    status: 403,
    message: "إعدادات الخصوصية لا تسمح ببدء هذه المحادثة.",
  },
  CONVERSATION_BLOCKED: {
    status: 403,
    message: "لا يمكن إرسال رسائل بسبب الحظر بين الحسابين.",
  },
  MESSAGE_NOT_FOUND: { status: 404, message: "الرسالة غير موجودة." },
  CANNOT_REPORT_OWN_MESSAGE: { status: 400, message: "لا يمكنك الإبلاغ عن رسالتك." },
  REPORT_ALREADY_OPEN: {
    status: 409,
    message: "يوجد بلاغ مفتوح مسبقاً على هذه الرسالة.",
  },
  CONVERSATION_REPORT_NOT_OPEN: {
    status: 409,
    message: "البلاغ غير موجود أو تمت مراجعته.",
  },
};

export function messagingErrorResponse(error: unknown, requestId: string) {
  const code = error instanceof Error ? error.message : "";
  const known = errors[code];
  if (known) return errorResponse(code, known.message, known.status, { requestId });
  return errorResponse("MESSAGING_OPERATION_FAILED", "تعذّر تنفيذ عملية المراسلة.", 500, {
    requestId,
  });
}
