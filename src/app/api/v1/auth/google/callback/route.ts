import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../../../lib/prisma";
import { getAuthSecret, signJWT } from "../../../../../../lib/auth/jwt";
import {
  decodeGoogleOAuthContext,
  getGoogleOAuthClient,
  GOOGLE_OAUTH_CONTEXT_COOKIE,
  GOOGLE_OAUTH_STATE_COOKIE,
} from "../../../../../../lib/auth/google";
import { AuthService } from "../../../../../../modules/auth/service";
import { AuditLogService } from "../../../../../../modules/audit-log/service";

const SESSION_COOKIE = "khalliha_trend_session";

function redirectWithError(
  request: NextRequest,
  target: "/login" | "/register",
  code: string,
) {
  const url = new URL(target, request.url);
  url.searchParams.set("googleError", code);
  const response = NextResponse.redirect(url);
  response.cookies.delete(GOOGLE_OAUTH_STATE_COOKIE);
  response.cookies.delete(GOOGLE_OAUTH_CONTEXT_COOKIE);
  return response;
}

function dashboardPath(role: string) {
  if (role === "CREATOR") return "/creator/dashboard";
  if (role === "BRAND") return "/brand/dashboard";
  if (role === "ADMIN" || role === "SUPER_ADMIN") return "/admin/dashboard";
  return "/";
}

export async function GET(request: NextRequest) {
  const context = decodeGoogleOAuthContext(
    request.cookies.get(GOOGLE_OAUTH_CONTEXT_COOKIE)?.value,
  );
  const target = context?.intent === "register" ? "/register" : "/login";
  const state = request.nextUrl.searchParams.get("state");
  const storedState = request.cookies.get(GOOGLE_OAUTH_STATE_COOKIE)?.value;
  const code = request.nextUrl.searchParams.get("code");

  if (request.nextUrl.searchParams.get("error")) {
    return redirectWithError(request, target, "access_denied");
  }
  if (!context || !state || !storedState || state !== storedState || !code) {
    return redirectWithError(request, target, "invalid_state");
  }

  try {
    const { client, clientId, redirectUri } = getGoogleOAuthClient(
      request.nextUrl.origin,
    );
    const { tokens } = await client.getToken({
      code,
      codeVerifier: context.codeVerifier,
      redirect_uri: redirectUri,
    });
    if (!tokens.id_token) {
      return redirectWithError(request, target, "missing_identity");
    }

    const ticket = await client.verifyIdToken({
      idToken: tokens.id_token,
      audience: clientId,
    });
    const profile = ticket.getPayload();
    if (
      !profile?.sub ||
      !profile.email ||
      !profile.email_verified ||
      profile.nonce !== context.nonce
    ) {
      return redirectWithError(request, target, "unverified_email");
    }

    const result = await AuthService.authenticateWithGoogle({
      intent: context.intent,
      email: profile.email.toLowerCase(),
      fullName: (profile.name?.trim() || profile.email.split("@")[0]).slice(0, 100),
      role: context.role,
      brandName: context.brandName,
    });
    const user = result.user;

    let brandName: string | undefined;
    if (user.role === "BRAND") {
      const membership = await prisma.brandMember.findFirst({
        where: { userId: user.id },
        include: { brand: true },
      });
      brandName = membership?.brand.name;
    }

    const token = await signJWT(
      {
        userId: user.id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        role: user.role,
        status: user.status,
        brandName,
        exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60,
      },
      getAuthSecret(),
    );

    const response = NextResponse.redirect(
      new URL(dashboardPath(user.role), request.url),
    );
    response.cookies.delete(GOOGLE_OAUTH_STATE_COOKIE);
    response.cookies.delete(GOOGLE_OAUTH_CONTEXT_COOKIE);
    response.cookies.set(SESSION_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60,
    });

    await AuditLogService.log({
      actorId: user.id,
      actorEmail: user.email ?? undefined,
      action: result.created ? "USER_REGISTER_GOOGLE" : "USER_LOGIN_GOOGLE",
      targetType: "User",
      targetId: user.id,
      ipAddress: request.headers.get("x-forwarded-for") || undefined,
      userAgent: request.headers.get("user-agent") || undefined,
      after: { provider: "google", role: user.role },
    });

    return response;
  } catch (error) {
    console.error("Google OAuth callback failed:", error);
    const code =
      error instanceof Error && error.message === "GOOGLE_ACCOUNT_NOT_FOUND"
        ? "account_not_found"
        : error instanceof Error && error.message === "ACCOUNT_BLOCKED"
          ? "account_blocked"
          : "callback_failed";
    return redirectWithError(request, target, code);
  }
}
