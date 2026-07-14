import { NextResponse } from "next/server";
import { errorResponse, newRequestId } from "../../../../../lib/api/response";
import { requireApiUser } from "../../../../../lib/auth/api-user";
import { AccountService } from "../../../../../modules/account/service";
import { changePasswordSchema } from "../../../../../modules/account/schemas";

export async function POST(request: Request) {
  const requestId = newRequestId();
  const auth = await requireApiUser(requestId);
  if (!auth.ok) return auth.response;

  const body = await request.json().catch(() => null);
  const parsed = changePasswordSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse("VALIDATION_ERROR", "المدخلات غير صالحة", 400, {
      requestId,
      details: parsed.error.flatten().fieldErrors,
    });
  }

  try {
    await AccountService.changePassword(
      auth.user.id,
      parsed.data.currentPassword,
      parsed.data.newPassword,
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "فشل تغيير كلمة المرور.";
    return errorResponse("CHANGE_PASSWORD_FAILED", message, 400, { requestId });
  }

  return NextResponse.json({ data: { success: true } });
}
