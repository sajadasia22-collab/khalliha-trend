import { NextResponse } from "next/server";
import { AuthService } from "../../../../../modules/auth/service";
import { resetPasswordSchema } from "../../../../../modules/auth/schemas";

export async function POST(request: Request) {
  const requestId = `req_${Math.random().toString(36).substring(2, 11)}`;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      {
        error: {
          code: "VALIDATION_ERROR",
          message: "المدخلات غير صالحة",
          requestId,
        },
      },
      { status: 400 },
    );
  }

  const parsed = resetPasswordSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: {
          code: "VALIDATION_ERROR",
          message: "المدخلات غير صالحة",
          requestId,
          details: parsed.error.flatten().fieldErrors,
        },
      },
      { status: 400 },
    );
  }

  try {
    await AuthService.resetPassword(parsed.data);
    // Deliberately no session cookie is set here — the user must log in again
    // with the new password, since a reset link may be opened on a device
    // that isn't the account owner's regular one.
    return NextResponse.json({ status: "success" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "فشل إعادة تعيين كلمة المرور.";
    return NextResponse.json(
      {
        error: {
          code: "RESET_FAILED",
          message,
          requestId,
        },
      },
      { status: 400 },
    );
  }
}
