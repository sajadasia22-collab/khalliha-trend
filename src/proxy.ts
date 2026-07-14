import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getAuthSecret, verifyJWT } from "./lib/auth/jwt";
import { RateLimiter } from "./lib/rate-limit";

const COOKIE_NAME = "khalliha_trend_session";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(COOKIE_NAME)?.value;

  const isApiRoute = pathname.startsWith("/api/");
  const secret = getAuthSecret();

  // Rate Limiting for sensitive endpoints
  if (isApiRoute) {
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0].trim() || "127.0.0.1";

    // Auth routes: login, register & reset-password
    if (
      pathname.startsWith("/api/v1/auth/login") ||
      pathname.startsWith("/api/v1/auth/register") ||
      pathname.startsWith("/api/v1/auth/reset-password") ||
      pathname.startsWith("/api/v1/auth/google")
    ) {
      const allowed = RateLimiter.isAllowed(`rate-limit:auth:${ip}`, 10, 60 * 1000); // 10 requests/min
      if (!allowed) {
        return NextResponse.json(
          {
            error: {
              code: "TOO_MANY_REQUESTS",
              message: "لقد تجاوزت حد الطلبات المسموح به. يرجى المحاولة بعد دقيقة.",
            },
          },
          { status: 429 },
        );
      }
    }

    // Forgot-password: stricter limit since it triggers an outbound email via Resend
    if (pathname.startsWith("/api/v1/auth/forgot-password")) {
      const allowed = RateLimiter.isAllowed(
        `rate-limit:forgot-password:${ip}`,
        5,
        60 * 1000,
      ); // 5 requests/min
      if (!allowed) {
        return NextResponse.json(
          {
            error: {
              code: "TOO_MANY_REQUESTS",
              message:
                "لقد تجاوزت حد طلبات إعادة تعيين كلمة المرور. يرجى المحاولة بعد دقيقة.",
            },
          },
          { status: 429 },
        );
      }
    }

    // Financial routes: payouts & deposits POST
    if (
      request.method === "POST" &&
      (pathname.startsWith("/api/v1/creator/payouts") ||
        pathname.startsWith("/api/v1/brand/deposits"))
    ) {
      const allowed = RateLimiter.isAllowed(`rate-limit:financial:${ip}`, 20, 60 * 1000); // 20 requests/min
      if (!allowed) {
        return NextResponse.json(
          {
            error: {
              code: "TOO_MANY_REQUESTS",
              message:
                "عمليات مالية متكررة جداً. يرجى الانتظار دقيقة قبل المحاولة مرة أخرى.",
            },
          },
          { status: 429 },
        );
      }
    }

    if (request.method !== "GET" && pathname.startsWith("/api/v1/community")) {
      const allowed = RateLimiter.isAllowed(`rate-limit:community:${ip}`, 120, 60 * 1000);
      if (!allowed) {
        return NextResponse.json(
          {
            error: {
              code: "TOO_MANY_REQUESTS",
              message: "تفاعلات كثيرة جداً. يرجى الانتظار دقيقة.",
            },
          },
          { status: 429 },
        );
      }
    }

    if (request.method !== "GET" && pathname.startsWith("/api/v1/conversations")) {
      const allowed = RateLimiter.isAllowed(`rate-limit:messaging:${ip}`, 60, 60 * 1000);
      if (!allowed) {
        return NextResponse.json(
          {
            error: {
              code: "TOO_MANY_REQUESTS",
              message: "رسائل كثيرة جداً. يرجى الانتظار دقيقة.",
            },
          },
          { status: 429 },
        );
      }
    }

    if (pathname.startsWith("/api/v1/account/export")) {
      const allowed = RateLimiter.isAllowed(`rate-limit:data-export:${ip}`, 5, 60 * 1000);
      if (!allowed) {
        return NextResponse.json(
          {
            error: {
              code: "TOO_MANY_REQUESTS",
              message: "طلبات تصدير كثيرة جداً. يرجى الانتظار دقيقة.",
            },
          },
          { status: 429 },
        );
      }
    }

    if (
      request.method === "POST" &&
      (pathname.startsWith("/api/v1/disputes") ||
        pathname.startsWith("/api/v1/admin/fraud-queue") ||
        pathname.includes("/fraud-signals"))
    ) {
      const allowed = RateLimiter.isAllowed(`rate-limit:casework:${ip}`, 30, 60 * 1000);
      if (!allowed) {
        return NextResponse.json(
          {
            error: {
              code: "TOO_MANY_REQUESTS",
              message: "طلبات متكررة جداً. يرجى الانتظار دقيقة قبل المحاولة مجدداً.",
            },
          },
          { status: 429 },
        );
      }
    }
  }

  // 1. Verify token if present
  let payload: { role?: string; userId?: string } | null = null;
  if (token) {
    payload = (await verifyJWT(token, secret)) as {
      role?: string;
      userId?: string;
    } | null;
  }

  // 2. Handle unauthorized requests
  const isProtectedPath =
    pathname.startsWith("/creator") ||
    pathname.startsWith("/brand") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/api/v1/creator") ||
    pathname.startsWith("/api/v1/brand") ||
    pathname.startsWith("/api/v1/admin") ||
    pathname.startsWith("/api/v1/social-accounts") ||
    pathname.startsWith("/api/v1/disputes") ||
    pathname.startsWith("/api/v1/conversations") ||
    pathname.startsWith("/api/v1/account");

  if (isProtectedPath) {
    if (!payload) {
      if (isApiRoute) {
        return NextResponse.json(
          {
            error: {
              code: "UNAUTHENTICATED",
              message: "الرجاء تسجيل الدخول أولاً.",
            },
          },
          { status: 401 },
        );
      } else {
        const loginUrl = new URL("/login", request.url);
        // Clean up invalid session cookie if it was present but verification failed
        const response = NextResponse.redirect(loginUrl);
        if (token) {
          response.cookies.delete(COOKIE_NAME);
        }
        return response;
      }
    }

    // Check Roles (RBAC)
    const role = payload.role;
    let isAuthorized = true;

    if (
      pathname.startsWith("/creator") ||
      pathname.startsWith("/api/v1/creator") ||
      pathname.startsWith("/api/v1/social-accounts")
    ) {
      isAuthorized = role === "CREATOR";
    } else if (pathname.startsWith("/brand") || pathname.startsWith("/api/v1/brand")) {
      isAuthorized = role === "BRAND";
    } else if (pathname.startsWith("/admin") || pathname.startsWith("/api/v1/admin")) {
      isAuthorized = role === "ADMIN" || role === "SUPER_ADMIN";
    }

    if (!isAuthorized) {
      if (isApiRoute) {
        return NextResponse.json(
          {
            error: {
              code: "FORBIDDEN",
              message: "غير مصرح لك بالوصول لهذا المورد.",
            },
          },
          { status: 403 },
        );
      } else {
        return NextResponse.redirect(new URL("/unauthorized", request.url));
      }
    }
  }

  // 3. Keep registration away from authenticated sessions. Login remains reachable so a
  // suspended/banned session can safely land there instead of entering a redirect loop,
  // and active users can deliberately switch accounts.
  const isAuthPage = pathname === "/register";
  if (isAuthPage && payload) {
    const role = payload.role;
    let dashboardPath = "/";

    if (role === "CREATOR") {
      dashboardPath = "/creator/dashboard";
    } else if (role === "BRAND") {
      dashboardPath = "/brand/dashboard";
    } else if (role === "ADMIN" || role === "SUPER_ADMIN") {
      dashboardPath = "/admin/dashboard";
    }

    return NextResponse.redirect(new URL(dashboardPath, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/creator/:path*",
    "/brand/:path*",
    "/admin/:path*",
    "/login",
    "/register",
    "/api/v1/creator/:path*",
    "/api/v1/brand/:path*",
    "/api/v1/admin/:path*",
    "/api/v1/social-accounts/:path*",
    "/api/v1/disputes/:path*",
    "/api/v1/conversations/:path*",
    "/api/v1/community/:path*",
    "/api/v1/account/:path*",
    "/api/v1/auth/:path*",
  ],
};
