import { z } from "zod";
import { UserRole } from "../../generated/prisma/enums";
import { IRAQ_PHONE_REGEX, normalizeIraqiPhone } from "../../lib/phone";

export { UserRole };

export const loginSchema = z.object({
  identifier: z.string().trim().min(1, "البريد الإلكتروني أو الهاتف مطلوب"),
  password: z.string().min(6, "كلمة المرور يجب أن تكون 6 أحرف على الأقل"),
});

export const registerSchema = z
  .object({
    fullName: z
      .string()
      .trim()
      .min(2, "الاسم الكامل يجب أن يكون حرفين على الأقل")
      .max(100, "الاسم طويل جداً"),
    email: z
      .string()
      .trim()
      .email("بريد إلكتروني غير صالح")
      .optional()
      .or(z.literal("").transform(() => undefined)),
    phone: z
      .string()
      .trim()
      .regex(IRAQ_PHONE_REGEX, "رقم هاتف عراقي غير صالح")
      .transform((value) => normalizeIraqiPhone(value) ?? value)
      .optional()
      .or(z.literal("").transform(() => undefined)),
    password: z.string().min(6, "كلمة المرور يجب أن تكون 6 أحرف على الأقل"),
    role: z.enum([UserRole.CREATOR, UserRole.BRAND], {
      message: "يجب اختيار دور صانع محتوى أو علامة تجارية",
    }),
    acceptTerms: z.boolean().refine((val) => val === true, {
      message: "يجب الموافقة على الشروط والأحكام",
    }),
    confirmAge: z.boolean().refine((val) => val === true, {
      message: "يجب تأكيد أن عمرك 18 سنة أو أكثر",
    }),
    brandName: z.string().trim().min(2, "اسم العلامة التجارية مطلوب").optional(),
  })
  .refine((data) => data.email || data.phone, {
    message: "يجب إدخال البريد الإلكتروني أو رقم الهاتف",
    path: ["email"],
  })
  .refine(
    (data) =>
      data.role !== UserRole.BRAND || (data.brandName && data.brandName.length >= 2),
    {
      message: "اسم العلامة التجارية مطلوب عند التسجيل كتاجر",
      path: ["brandName"],
    },
  );

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
