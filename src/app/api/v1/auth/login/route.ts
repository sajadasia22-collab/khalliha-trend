import { NextResponse } from "next/server";
import { AuthService } from "../../../../../modules/auth/service";
import { loginSchema } from "../../../../../modules/auth/schemas";
import { getAuthSecret, signJWT } from "../../../../../lib/auth/jwt";
import { prisma } from "../../../../../lib/prisma";
import { AuditLogService } from "../../../../../modules/audit-log/service";

const COOKIE_NAME = "khalliha_trend_session";

export async function POST(request: Request) {
  const requestId = `req_${Math.random().toString(36).substring(2, 11)}`;
  let loginIdentifier: string | undefined = undefined;
  try {
    const body = await request.json();
    loginIdentifier = body?.identifier;

    // Validate inputs
    const parsed = loginSchema.safeParse(body);
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

    const user = await AuthService.login(parsed.data);

    // Create session JWT
    const secret = getAuthSecret();
    // Get brand member name if role is BRAND
    let brandName: string | undefined = undefined;
    if (user.role === "BRAND") {
      const member = await prisma.brandMember.findFirst({
        where: { userId: user.id },
        include: { brand: true },
      });
      brandName = member?.brand.name;
    }

    const payload = {
      userId: user.id,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      role: user.role,
      status: user.status,
      brandName,
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

    await AuditLogService.log({
      actorId: user.id,
      actorEmail: user.email ?? undefined,
      action: "USER_LOGIN_SUCCESS",
      targetType: "User",
      targetId: user.id,
      ipAddress: request.headers.get("x-forwarded-for") || undefined,
      userAgent: request.headers.get("user-agent") || undefined,
    });

    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "بيانات الاعتماد غير صالحة.";

    await AuditLogService.log({
      actorEmail: loginIdentifier || undefined,
      action: "USER_LOGIN_FAILURE",
      targetType: "User",
      ipAddress: request.headers.get("x-forwarded-for") || undefined,
      userAgent: request.headers.get("user-agent") || undefined,
      before: { error: message },
    });

    return NextResponse.json(
      {
        error: {
          code: "UNAUTHENTICATED",
          message,
          requestId,
        },
      },
      { status: 401 },
    );
  }
}
