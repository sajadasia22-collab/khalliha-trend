import { NextResponse } from "next/server";
import { AuthService } from "../../../../../modules/auth/service";
import { forgotPasswordSchema } from "../../../../../modules/auth/schemas";

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

  const parsed = forgotPasswordSchema.safeParse(body);
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
    await AuthService.requestPasswordReset(parsed.data);
  } catch (error) {
    // Never let a delivery/service failure leak whether the account exists.
    console.error("Password reset request failed:", error);
  }

  return NextResponse.json({
    status: "success",
    message: "إذا كان هذا البريد أو الرقم مسجلاً لدينا، فسيتم إرسال رابط إعادة التعيين إليه.",
  });
}
