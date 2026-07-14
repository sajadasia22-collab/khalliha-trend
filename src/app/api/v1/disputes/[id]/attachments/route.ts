import { NextResponse } from "next/server";
import { errorResponse, newRequestId } from "../../../../../../lib/api/response";
import { getCurrentUser } from "../../../../../../lib/auth/session";
import { DisputeService } from "../../../../../../modules/disputes/service";
import { MAX_ATTACHMENT_SIZE_BYTES } from "../../../../../../lib/uploads";

// رفع دليل (صورة/PDF) على نزاع عبر multipart/form-data بحقل "file".
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const requestId = newRequestId();
  const user = await getCurrentUser();
  if (!user) {
    return errorResponse("UNAUTHENTICATED", "الرجاء تسجيل الدخول أولاً.", 401, {
      requestId,
    });
  }

  let file: File | null = null;
  try {
    const formData = await request.formData();
    const entry = formData.get("file");
    file = entry instanceof File ? entry : null;
  } catch {
    file = null;
  }
  if (!file) {
    return errorResponse("VALIDATION_ERROR", "أرفق ملفاً في الحقل file.", 400, {
      requestId,
    });
  }
  // فحص مبكر قبل قراءة الملف بالذاكرة؛ التحقق النهائي داخل الخدمة.
  if (file.size > MAX_ATTACHMENT_SIZE_BYTES) {
    return errorResponse("VALIDATION_ERROR", "حجم الملف يتجاوز الحد الأقصى (2MB).", 400, {
      requestId,
    });
  }

  try {
    const { id } = await params;
    const data = new Uint8Array(await file.arrayBuffer());
    const attachment = await DisputeService.addAttachment(user.id, id, {
      fileName: file.name,
      data,
    });
    return NextResponse.json({ data: attachment });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "فشل رفع المرفق.";
    return errorResponse("BAD_REQUEST", message, 400, { requestId });
  }
}
