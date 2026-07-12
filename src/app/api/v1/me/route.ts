import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getAuthSecret, verifyJWT } from "../../../../lib/auth/jwt";
import { AuthService } from "../../../../modules/auth/service";

const COOKIE_NAME = "khalliha_trend_session";

export async function GET() {
  const requestId = `req_${Math.random().toString(36).substring(2, 11)}`;
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;

    if (!token) {
      return NextResponse.json(
        {
          error: {
            code: "UNAUTHENTICATED",
            message: "الرجاء تسجيل الدخول أولاً.",
            requestId,
          },
        },
        { status: 401 },
      );
    }

    const secret = getAuthSecret();
    const payload = (await verifyJWT(token, secret)) as {
      userId?: string;
      role?: string;
      status?: string;
      fullName?: string;
      brandName?: string;
      email?: string;
      phone?: string;
    } | null;

    if (!payload || !payload.userId) {
      return NextResponse.json(
        {
          error: {
            code: "UNAUTHENTICATED",
            message: "جلسة عمل غير صالحة أو منتهية الصلاحية.",
            requestId,
          },
        },
        { status: 401 },
      );
    }

    const user = await AuthService.findById(payload.userId);

    if (!user) {
      return NextResponse.json(
        {
          error: {
            code: "UNAUTHENTICATED",
            message: "المستخدم غير موجود.",
            requestId,
          },
        },
        { status: 401 },
      );
    }

    return NextResponse.json({
      status: "success",
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        role: user.role,
        status: user.status,
        creatorProfile: user.creatorProfile,
        brandMembers: user.brandMembers,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "حدث خطأ غير متوقع.";
    return NextResponse.json(
      {
        error: {
          code: "INTERNAL_ERROR",
          message,
          requestId,
        },
      },
      { status: 500 },
    );
  }
}
