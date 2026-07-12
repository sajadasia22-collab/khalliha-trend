import { z } from "zod";
import { DisputeReason } from "../../generated/prisma/enums";

export const createDisputeSchema = z.object({
  submissionId: z.string().min(1, "معرّف الإرسال مطلوب"),
  reason: z.nativeEnum(DisputeReason, { message: "سبب النزاع غير صالح" }),
  title: z.string().trim().min(3, "عنوان النزاع قصير جداً").max(120),
  description: z.string().trim().min(10, "وصف النزاع قصير جداً").max(2000),
});

export const createDisputeMessageSchema = z.object({
  body: z.string().trim().min(2, "نص الرسالة قصير جداً").max(2000),
});

export const resolveDisputeSchema = z.object({
  decision: z.enum(["CREATOR", "BRAND", "PARTIAL", "CLOSE"], {
    message: "قرار النزاع غير صالح",
  }),
  resolutionNote: z.string().trim().min(5, "ملاحظة القرار مطلوبة").max(2000),
});

export type CreateDisputeInput = z.infer<typeof createDisputeSchema>;
