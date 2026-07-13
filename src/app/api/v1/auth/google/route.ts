import { CodeChallengeMethod } from "google-auth-library";
import { NextRequest, NextResponse } from "next/server";
import { UserRole } from "../../../../../generated/prisma/enums";
import {
  encodeGoogleOAuthContext,
  getGoogleOAuthClient,
  GOOGLE_OAUTH_CONTEXT_COOKIE,
  GOOGLE_OAUTH_STATE_COOKIE,
  googleOAuthCookieOptions,
  type GoogleOAuthIntent,
} from "../../../../../lib/auth/google";

function errorRedirect(
  request: NextRequest,
  target: "/login" | "/register",
  code: string,
) {
  const url = new URL(target, request.url);
  url.searchParams.set("googleError", code);
  return NextResponse.redirect(url);
}

export async function GET(request: NextRequest) {
  const intent = request.nextUrl.searchParams.get("intent") as GoogleOAuthIntent | null;
  if (intent !== "login" && intent !== "register") {
    return errorRedirect(request, "/login", "invalid_request");
  }

  const role = request.nextUrl.searchParams.get("role");
  const brandName = request.nextUrl.searchParams.get("brandName")?.trim();
  const target = intent === "register" ? "/register" : "/login";

  if (intent === "register" && role !== UserRole.CREATOR && role !== UserRole.BRAND) {
    return errorRedirect(request, target, "role_required");
  }
  if (
    intent === "register" &&
    role === UserRole.BRAND &&
    (!brandName || brandName.length < 2 || brandName.length > 100)
  ) {
    return errorRedirect(request, target, "brand_name_required");
  }
  if (
    intent === "register" &&
    (request.nextUrl.searchParams.get("acceptTerms") !== "true" ||
      request.nextUrl.searchParams.get("confirmAge") !== "true")
  ) {
    return errorRedirect(request, target, "consent_required");
  }

  try {
    const { client } = getGoogleOAuthClient(request.nextUrl.origin);
    const state = crypto.randomUUID();
    const nonce = crypto.randomUUID();
    const { codeVerifier, codeChallenge } = await client.generateCodeVerifierAsync();
    const authUrl = client.generateAuthUrl({
      access_type: "online",
      scope: ["openid", "email", "profile"],
      state,
      nonce,
      prompt: "select_account",
      code_challenge: codeChallenge,
      code_challenge_method: CodeChallengeMethod.S256,
    });

    const response = NextResponse.redirect(authUrl);
    const cookieOptions = googleOAuthCookieOptions();
    response.cookies.set(GOOGLE_OAUTH_STATE_COOKIE, state, cookieOptions);
    response.cookies.set(
      GOOGLE_OAUTH_CONTEXT_COOKIE,
      encodeGoogleOAuthContext({
        intent,
        role: role === UserRole.CREATOR || role === UserRole.BRAND ? role : undefined,
        brandName: role === UserRole.BRAND ? brandName : undefined,
        nonce,
        codeVerifier,
      }),
      cookieOptions,
    );
    return response;
  } catch (error) {
    console.error("Failed to start Google OAuth:", error);
    return errorRedirect(request, target, "not_configured");
  }
}
