// تحقق ملفات أدلة النزاعات: النوع يُحدد من التوقيع الثنائي (magic bytes)
// وليس من امتداد الاسم أو ترويسة العميل — كلاهما قابل للتزوير.

export const MAX_ATTACHMENT_SIZE_BYTES = 2 * 1024 * 1024; // 2MB
export const MAX_ATTACHMENTS_PER_DISPUTE = 10;

export const ALLOWED_ATTACHMENT_MIME_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "application/pdf",
] as const;

export type AllowedAttachmentMimeType = (typeof ALLOWED_ATTACHMENT_MIME_TYPES)[number];

// يرجع نوع الملف الفعلي من توقيعه الثنائي، أو null إن لم يكن من الأنواع المسموحة.
export function sniffAttachmentMimeType(
  bytes: Uint8Array,
): AllowedAttachmentMimeType | null {
  if (bytes.length < 12) return null;

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  ) {
    return "image/png";
  }

  // JPEG: FF D8 FF
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return "image/jpeg";
  }

  // WebP: "RIFF" .... "WEBP"
  if (
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    return "image/webp";
  }

  // PDF: "%PDF"
  if (bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46) {
    return "application/pdf";
  }

  return null;
}

// اسم آمن للعرض والتنزيل: بلا مسارات، بطول محدود، وبلا محارف تحكم أو
// اقتباسات/فواصل منقوطة/شرطات عكسية تكسر ترويسة Content-Disposition.
export function sanitizeAttachmentFileName(rawName: string): string {
  const base = rawName.split(/[\\/]/).pop() ?? "attachment";
  const withoutControlChars = Array.from(base)
    .filter((char) => {
      const code = char.charCodeAt(0);
      return code >= 0x20 && code !== 0x7f;
    })
    .join("");
  const cleaned = withoutControlChars
    .replace(/["';\\]/g, "")
    .trim()
    .slice(0, 120);
  return cleaned.length > 0 ? cleaned : "attachment";
}
