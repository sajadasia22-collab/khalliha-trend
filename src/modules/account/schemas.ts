import { z } from "zod";
import { NotificationType } from "../../generated/prisma/enums";

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "كلمة المرور الحالية مطلوبة"),
  newPassword: z.string().min(8, "كلمة المرور الجديدة يجب أن تكون 8 أحرف على الأقل"),
});
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

export const updateNotificationPreferencesSchema = z.object({
  preferences: z
    .array(
      z.object({
        type: z.nativeEnum(NotificationType),
        enabled: z.boolean(),
      }),
    )
    .min(1, "لا توجد تفضيلات لحفظها"),
});
export type UpdateNotificationPreferencesInput = z.infer<
  typeof updateNotificationPreferencesSchema
>;
