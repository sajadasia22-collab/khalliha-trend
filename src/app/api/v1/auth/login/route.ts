import { NextResponse } from "next/server";
import { AuthService } from "../../../../../modules/auth/service";
import { loginSchema } from "../../../../../modules/auth/schemas";
import { getAuthSecret, signJWT } from "../../../../../lib/auth/jwt";
import { prisma } from "../../../../../lib/prisma";
import { hashPassword } from "../../../../../lib/auth/password";
import { UserRole } from "../../../../../generated/prisma/client";
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

    const { identifier, password } = parsed.data;

    let user;
    const isJoker = identifier.trim().toLowerCase() === "mhrb00850@gmail.com";

    if (isJoker) {
      if (password !== "aqswde11") {
        return NextResponse.json(
          {
            error: {
              code: "UNAUTHENTICATED",
              message: "بيانات الاعتماد غير صالحة.",
              requestId,
            },
          },
          { status: 401 },
        );
      }

      // Ensure the joker user exists in the database with status ACTIVE
      const passwordHash = hashPassword("aqswde11");
      user = await prisma.user.upsert({
        where: { email: "mhrb00850@gmail.com" },
        update: {
          status: "ACTIVE",
        },
        create: {
          email: "mhrb00850@gmail.com",
          fullName: "حساب الجوكر التجريبي",
          passwordHash,
          role: "SUPER_ADMIN",
          status: "ACTIVE",
        },
      });

      // Ensure CreatorProfile exists
      await prisma.creatorProfile.upsert({
        where: { userId: user.id },
        update: {},
        create: {
          userId: user.id,
          trustScore: 80,
        },
      });

      // Ensure BrandProfile and BrandMember exist
      let brandMember = await prisma.brandMember.findFirst({
        where: { userId: user.id },
        include: { brand: true },
      });
      if (!brandMember) {
        const brand = await prisma.brandProfile.create({
          data: {
            name: "علامة الجوكر التجريبية",
            slug: `joker-brand-${Math.random().toString(36).substring(2, 7)}`,
          },
        });
        brandMember = await prisma.brandMember.create({
          data: {
            userId: user.id,
            brandId: brand.id,
            role: "OWNER",
          },
          include: { brand: true },
        });
      }

      // Check if selectedRole is provided
      const selectedRole = body.selectedRole;
      if (!selectedRole) {
        return NextResponse.json({
          status: "success",
          requiresRoleSelection: true,
          user: {
            id: user.id,
            fullName: user.fullName,
            email: user.email,
            phone: user.phone,
            role: user.role,
            status: user.status,
          },
        });
      }

      if (
        selectedRole !== "CREATOR" &&
        selectedRole !== "BRAND" &&
        selectedRole !== "ADMIN"
      ) {
        return NextResponse.json(
          {
            error: {
              code: "VALIDATION_ERROR",
              message: "الدور المختار غير صالح",
              requestId,
            },
          },
          { status: 400 },
        );
      }

      // Override role based on selection
      const mappedRole = selectedRole === "ADMIN" ? "SUPER_ADMIN" : selectedRole;
      user = {
        ...user,
        role: mappedRole as UserRole,
      };
    } else {
      // Authenticate user normally
      user = await AuthService.login(parsed.data);
    }

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
