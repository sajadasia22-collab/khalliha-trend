import { NextResponse } from "next/server";
import { AuthService } from "../../../../../modules/auth/service";
import { registerSchema } from "../../../../../modules/auth/schemas";
import { getAuthSecret, signJWT } from "../../../../../lib/auth/jwt";

const COOKIE_NAME = "khalliha_trend_session";

export async function POST(request: Request) {
  const requestId = `req_${Math.random().toString(36).substring(2, 11)}`;
  try {
    const body = await request.json();

    // Validate inputs
    const parsed = registerSchema.safeParse(body);
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

    // Register user
    const user = await AuthService.register(parsed.data);

    // Create session JWT
    const secret = getAuthSecret();
    const payload = {
      userId: user.id,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      role: user.role,
      status: user.status,
      brandName:
        parsed.data.role === "BRAND"
          ? parsed.data.brandName || `${user.fullName}'s Brand`
          : undefined,
      exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60, // 7 days
    };

    const token = await signJWT(payload, secret);

    const response = NextResponse.json({
      status: "success",
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        role: user.role,
        status: user.status,
      },
    });

    // Set cookie
    response.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60,
    });

    return response;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "فشل التسجيل. يرجى المحاولة مرة أخرى.";
    return NextResponse.json(
      {
        error: {
          code: "REGISTRATION_FAILED",
          message,
          requestId,
        },
      },
      { status: 400 },
    );
  }
}
