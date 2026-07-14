import { errorResponse, newRequestId } from "../../../../../../../lib/api/response";
import { getCurrentUser } from "../../../../../../../lib/auth/session";
import { DisputeService } from "../../../../../../../modules/disputes/service";

// تنزيل/عرض دليل نزاع — متاح لأطراف النزاع والمدراء فقط.
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string; attachmentId: string }> },
) {
  const requestId = newRequestId();
  const user = await getCurrentUser();
  if (!user) {
    return errorResponse("UNAUTHENTICATED", "الرجاء تسجيل الدخول أولاً.", 401, {
      requestId,
    });
  }

  try {
    const { id, attachmentId } = await params;
    const attachment = await DisputeService.getAttachment(user.id, id, attachmentId);
    const body = new Uint8Array(attachment.data);
    // ترويسات HTTP لا تقبل غير Latin-1، والأسماء العربية شائعة هنا —
    // لذلك fallback بالـ ASCII + الاسم الفعلي بترميز RFC 5987 (filename*).
    const asciiFallback =
      attachment.fileName.replace(/[^\x20-\x7e]/g, "_").trim() || "attachment";
    const encodedFileName = encodeURIComponent(attachment.fileName);
    return new Response(body, {
      headers: {
        "Content-Type": attachment.mimeType,
        "Content-Length": String(attachment.sizeBytes),
        // inline: الصور وPDF تُعرض في المتصفح مباشرة؛ الاسم منظف مسبقاً عند الحفظ.
        "Content-Disposition": `inline; filename="${asciiFallback}"; filename*=UTF-8''${encodedFileName}`,
        "X-Content-Type-Options": "nosniff",
        "Cache-Control": "private, max-age=300",
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "فشل جلب المرفق.";
    return errorResponse("BAD_REQUEST", message, 400, { requestId });
  }
}
