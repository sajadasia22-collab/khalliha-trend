import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getAuthSecret, verifyJWT } from "./lib/auth/jwt";

const COOKIE_NAME = "khalliha_trend_session";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(COOKIE_NAME)?.value;

  const isApiRoute = pathname.startsWith("/api/");
  const secret = getAuthSecret();

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

  // 3. Prevent logged-in users from visiting login/register pages
  const isAuthPage = pathname === "/login" || pathname === "/register";
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
    "/api/v1/account/:path*",
  ],
};
