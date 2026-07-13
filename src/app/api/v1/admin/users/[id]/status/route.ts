import { NextResponse } from "next/server";
import { z } from "zod";
import { UserStatus } from "../../../../../../../generated/prisma/enums";
import { errorResponse, newRequestId } from "../../../../../../../lib/api/response";
import { getCurrentUser } from "../../../../../../../lib/auth/session";
import { AdminUsersService } from "../../../../../../../modules/admin-users/service";

const schema = z.object({
  status: z.enum([UserStatus.ACTIVE, UserStatus.SUSPENDED, UserStatus.BANNED]),
  reason: z.string().trim().min(3).max(500),
});

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const requestId = newRequestId();
  const actor = await getCurrentUser();
  if (!actor) {
    return errorResponse("UNAUTHENTICATED", "الرجاء تسجيل الدخول أولاً.", 401, {
      requestId,
    });
  }
  if (actor.role !== "ADMIN" && actor.role !== "SUPER_ADMIN") {
    return errorResponse("FORBIDDEN", "هذا الإجراء متاح للإدارة فقط.", 403, {
      requestId,
    });
  }

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return errorResponse("VALIDATION_ERROR", "الحالة والسبب مطلوبان.", 400, {
      requestId,
      details: parsed.error.flatten().fieldErrors,
    });
  }

  try {
    const { id } = await context.params;
    const user = await AdminUsersService.updateStatus({
      actor,
      targetId: id,
      ...parsed.data,
      ipAddress: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim(),
      userAgent: request.headers.get("user-agent") ?? undefined,
    });
    return NextResponse.json({ data: user });
  } catch (error) {
    const code = error instanceof Error ? error.message : "UPDATE_FAILED";
    const messages: Record<string, [string, number]> = {
      USER_NOT_FOUND: ["المستخدم غير موجود.", 404],
      CANNOT_MANAGE_SELF: ["لا يمكنك تغيير حالة حسابك الإداري.", 400],
      CANNOT_MANAGE_SUPER_ADMIN: ["لا يمكن تغيير حالة مدير النظام من هنا.", 403],
      SUPER_ADMIN_REQUIRED: ["هذا الإجراء يتطلب مدير النظام.", 403],
    };
    const [message, status] = messages[code] ?? ["تعذّر تحديث حالة المستخدم.", 500];
    return errorResponse(code, message, status, { requestId });
  }
}
