import { errorResponse } from "../../lib/api/response";

const knownErrors: Record<string, { code: string; message: string; status: number }> = {
  COMMUNITY_CREATOR_ONLY: {
    code: "COMMUNITY_CREATOR_ONLY",
    message: "النشر متاح لصناع المحتوى فقط حالياً.",
    status: 403,
  },
  PUBLIC_CREATOR_PROFILE_REQUIRED: {
    code: "PUBLIC_CREATOR_PROFILE_REQUIRED",
    message: "أكمل ملفك العام قبل النشر في المجتمع.",
    status: 400,
  },
  COMMUNITY_IMAGE_NOT_OWNED: {
    code: "COMMUNITY_IMAGE_NOT_OWNED",
    message: "صورة المنشور غير صالحة.",
    status: 400,
  },
  COMMUNITY_POST_NOT_FOUND: {
    code: "COMMUNITY_POST_NOT_FOUND",
    message: "المنشور غير موجود.",
    status: 404,
  },
  COMMUNITY_COMMENT_NOT_FOUND: {
    code: "COMMUNITY_COMMENT_NOT_FOUND",
    message: "التعليق غير موجود.",
    status: 404,
  },
  COMMUNITY_REPORT_TARGET_NOT_FOUND: {
    code: "COMMUNITY_REPORT_TARGET_NOT_FOUND",
    message: "المحتوى المُبلّغ عنه غير موجود.",
    status: 404,
  },
  CANNOT_REPORT_SELF: {
    code: "CANNOT_REPORT_SELF",
    message: "لا يمكنك الإبلاغ عن محتواك.",
    status: 400,
  },
  COMMUNITY_USER_NOT_FOUND: {
    code: "COMMUNITY_USER_NOT_FOUND",
    message: "المستخدم غير موجود.",
    status: 404,
  },
  CANNOT_BLOCK_SELF: {
    code: "CANNOT_BLOCK_SELF",
    message: "لا يمكنك حظر حسابك.",
    status: 400,
  },
  CANNOT_MUTE_SELF: {
    code: "CANNOT_MUTE_SELF",
    message: "لا يمكنك كتم حسابك.",
    status: 400,
  },
  COMMUNITY_REPORT_NOT_OPEN: {
    code: "COMMUNITY_REPORT_NOT_OPEN",
    message: "البلاغ غير موجود أو تمت مراجعته.",
    status: 409,
  },
};

export function communityErrorResponse(error: unknown, requestId: string) {
  const key = error instanceof Error ? error.message : "";
  const known = knownErrors[key];
  if (known) return errorResponse(known.code, known.message, known.status, { requestId });
  return errorResponse("COMMUNITY_OPERATION_FAILED", "تعذّر تنفيذ العملية.", 500, {
    requestId,
  });
}
