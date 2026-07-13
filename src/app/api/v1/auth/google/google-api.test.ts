import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { GET as startGoogleOAuth } from "./route";
import { GET as finishGoogleOAuth } from "./callback/route";
import {
  decodeGoogleOAuthContext,
  GOOGLE_OAUTH_CONTEXT_COOKIE,
  GOOGLE_OAUTH_STATE_COOKIE,
} from "../../../../../lib/auth/google";

describe("Google OAuth routes", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("rejects Google registration until role and legal consent are present", async () => {
    const response = await startGoogleOAuth(
      new NextRequest("http://localhost/api/v1/auth/google?intent=register&role=CREATOR"),
    );

    expect(response.headers.get("location")).toContain(
      "/register?googleError=consent_required",
    );
  });

  it("starts authorization-code flow with state, nonce and PKCE cookies", async () => {
    vi.stubEnv("GOOGLE_CLIENT_ID", "client-id.apps.googleusercontent.com");
    vi.stubEnv("GOOGLE_CLIENT_SECRET", "client-secret");
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "http://localhost:3000");

    const response = await startGoogleOAuth(
      new NextRequest("http://localhost/api/v1/auth/google?intent=login"),
    );

    const location = new URL(response.headers.get("location")!);
    expect(location.origin).toBe("https://accounts.google.com");
    expect(location.searchParams.get("response_type")).toBe("code");
    expect(location.searchParams.get("scope")).toContain("openid");
    expect(location.searchParams.get("state")).toBeTruthy();
    expect(location.searchParams.get("nonce")).toBeTruthy();
    expect(location.searchParams.get("code_challenge_method")).toBe("S256");

    const stateCookie = response.cookies.get(GOOGLE_OAUTH_STATE_COOKIE)?.value;
    const context = decodeGoogleOAuthContext(
      response.cookies.get(GOOGLE_OAUTH_CONTEXT_COOKIE)?.value,
    );
    expect(stateCookie).toBe(location.searchParams.get("state"));
    expect(context).toMatchObject({ intent: "login" });
    expect(context?.nonce).toBe(location.searchParams.get("nonce"));
    expect(context?.codeVerifier).toBeTruthy();
  });

  it("rejects a callback whose state does not match the cookie", async () => {
    const request = new NextRequest(
      "http://localhost/api/v1/auth/google/callback?code=code-1&state=attacker-state",
      {
        headers: {
          cookie: `${GOOGLE_OAUTH_STATE_COOKIE}=real-state`,
        },
      },
    );

    const response = await finishGoogleOAuth(request);
    expect(response.headers.get("location")).toContain(
      "/login?googleError=invalid_state",
    );
  });
});
