import { afterEach, describe, expect, it, vi } from "vitest";
import {
  decodeGoogleOAuthContext,
  encodeGoogleOAuthContext,
  getGoogleOAuthClient,
} from "./google";

describe("Google OAuth helpers", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("round-trips the short-lived OAuth context", () => {
    const context = {
      intent: "register" as const,
      role: "BRAND" as const,
      brandName: "متجر بغداد",
      nonce: "nonce-1",
      codeVerifier: "verifier-1",
    };

    expect(decodeGoogleOAuthContext(encodeGoogleOAuthContext(context))).toEqual(context);
  });

  it("rejects malformed or unsupported context", () => {
    expect(decodeGoogleOAuthContext("not-base64-json")).toBeNull();
    expect(
      decodeGoogleOAuthContext(
        Buffer.from(
          JSON.stringify({ intent: "delete", nonce: "n", codeVerifier: "v" }),
        ).toString("base64url"),
      ),
    ).toBeNull();
  });

  it("requires server-side Google credentials", () => {
    vi.stubEnv("GOOGLE_CLIENT_ID", "");
    vi.stubEnv("GOOGLE_CLIENT_SECRET", "");
    expect(() => getGoogleOAuthClient("http://localhost:3000")).toThrow(
      "Google OAuth is not configured",
    );
  });

  it("uses the configured public app URL for the callback", () => {
    vi.stubEnv("GOOGLE_CLIENT_ID", "client-id");
    vi.stubEnv("GOOGLE_CLIENT_SECRET", "client-secret");
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://khalliha-trend.vercel.app/");

    const { redirectUri } = getGoogleOAuthClient("http://localhost:3000");
    expect(redirectUri).toBe(
      "https://khalliha-trend.vercel.app/api/v1/auth/google/callback",
    );
  });
});
