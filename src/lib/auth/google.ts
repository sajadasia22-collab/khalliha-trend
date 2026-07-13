import { OAuth2Client } from "google-auth-library";
import { UserRole } from "../../generated/prisma/enums";

export const GOOGLE_OAUTH_STATE_COOKIE = "khalliha_google_oauth_state";
export const GOOGLE_OAUTH_CONTEXT_COOKIE = "khalliha_google_oauth_context";
export const GOOGLE_OAUTH_MAX_AGE_SECONDS = 10 * 60;

export type GoogleOAuthIntent = "login" | "register";

export type GoogleOAuthContext = {
  intent: GoogleOAuthIntent;
  role?: "CREATOR" | "BRAND";
  brandName?: string;
  nonce: string;
  codeVerifier: string;
};

export function getGoogleOAuthClient(requestOrigin: string) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("Google OAuth is not configured.");
  }

  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || requestOrigin).replace(/\/$/, "");
  const redirectUri = `${appUrl}/api/v1/auth/google/callback`;

  return {
    clientId,
    redirectUri,
    client: new OAuth2Client(clientId, clientSecret, redirectUri),
  };
}

export function encodeGoogleOAuthContext(context: GoogleOAuthContext): string {
  return Buffer.from(JSON.stringify(context), "utf8").toString("base64url");
}

export function decodeGoogleOAuthContext(value?: string): GoogleOAuthContext | null {
  if (!value) return null;

  try {
    const parsed = JSON.parse(
      Buffer.from(value, "base64url").toString("utf8"),
    ) as Partial<GoogleOAuthContext>;
    if (
      (parsed.intent !== "login" && parsed.intent !== "register") ||
      typeof parsed.nonce !== "string" ||
      typeof parsed.codeVerifier !== "string"
    ) {
      return null;
    }
    if (
      parsed.role !== undefined &&
      parsed.role !== UserRole.CREATOR &&
      parsed.role !== UserRole.BRAND
    ) {
      return null;
    }

    return parsed as GoogleOAuthContext;
  } catch {
    return null;
  }
}

export function googleOAuthCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: GOOGLE_OAUTH_MAX_AGE_SECONDS,
  };
}
