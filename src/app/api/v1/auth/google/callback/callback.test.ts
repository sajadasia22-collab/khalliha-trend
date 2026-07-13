import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const { getTokenMock, verifyIdTokenMock, googleAuthServiceMock, auditLogMock } =
  vi.hoisted(() => ({
    getTokenMock: vi.fn(),
    verifyIdTokenMock: vi.fn(),
    googleAuthServiceMock: vi.fn(),
    auditLogMock: vi.fn(),
  }));

vi.mock("google-auth-library", () => ({
  OAuth2Client: vi.fn().mockImplementation(function OAuth2Client() {
    return {
      getToken: getTokenMock,
      verifyIdToken: verifyIdTokenMock,
    };
  }),
}));

vi.mock("../../../../../../lib/prisma", () => ({
  prisma: { brandMember: { findFirst: vi.fn() } },
}));

vi.mock("../../../../../../modules/auth/service", () => ({
  AuthService: { authenticateWithGoogle: googleAuthServiceMock },
}));

vi.mock("../../../../../../modules/audit-log/service", () => ({
  AuditLogService: { log: auditLogMock },
}));

import { GET as finishGoogleOAuth } from "./route";
import {
  encodeGoogleOAuthContext,
  GOOGLE_OAUTH_CONTEXT_COOKIE,
  GOOGLE_OAUTH_STATE_COOKIE,
} from "../../../../../../lib/auth/google";

describe("Google OAuth callback", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("GOOGLE_CLIENT_ID", "client-id.apps.googleusercontent.com");
    vi.stubEnv("GOOGLE_CLIENT_SECRET", "client-secret");
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "http://localhost:3000");
    vi.stubEnv("AUTH_SECRET", "test-google-auth-secret-that-is-long-enough");
    getTokenMock.mockResolvedValue({ tokens: { id_token: "google-id-token" } });
    verifyIdTokenMock.mockResolvedValue({
      getPayload: () => ({
        sub: "google-user-1",
        email: "USER@GMAIL.COM",
        email_verified: true,
        name: "مستخدم Google",
        nonce: "nonce-1",
      }),
    });
    googleAuthServiceMock.mockResolvedValue({
      created: false,
      user: {
        id: "user-1",
        fullName: "مستخدم Google",
        email: "user@gmail.com",
        phone: null,
        role: "CREATOR",
        status: "ACTIVE",
      },
    });
  });

  afterEach(() => vi.unstubAllEnvs());

  it("verifies Google identity, creates the local session and redirects by role", async () => {
    const context = encodeGoogleOAuthContext({
      intent: "login",
      nonce: "nonce-1",
      codeVerifier: "verifier-1",
    });
    const request = new NextRequest(
      "http://localhost/api/v1/auth/google/callback?code=code-1&state=state-1",
      {
        headers: {
          cookie: `${GOOGLE_OAUTH_STATE_COOKIE}=state-1; ${GOOGLE_OAUTH_CONTEXT_COOKIE}=${context}`,
        },
      },
    );

    const response = await finishGoogleOAuth(request);

    expect(getTokenMock).toHaveBeenCalledWith(
      expect.objectContaining({ code: "code-1", codeVerifier: "verifier-1" }),
    );
    expect(verifyIdTokenMock).toHaveBeenCalledWith({
      idToken: "google-id-token",
      audience: "client-id.apps.googleusercontent.com",
    });
    expect(googleAuthServiceMock).toHaveBeenCalledWith({
      intent: "login",
      email: "user@gmail.com",
      fullName: "مستخدم Google",
      role: undefined,
      brandName: undefined,
    });
    expect(response.headers.get("location")).toBe("http://localhost/creator/dashboard");
    expect(response.headers.get("set-cookie")).toContain("khalliha_trend_session=");
    expect(auditLogMock).toHaveBeenCalledWith(
      expect.objectContaining({ action: "USER_LOGIN_GOOGLE", actorId: "user-1" }),
    );
  });

  it("rejects an ID token whose nonce does not match", async () => {
    verifyIdTokenMock.mockResolvedValue({
      getPayload: () => ({
        sub: "google-user-1",
        email: "user@gmail.com",
        email_verified: true,
        name: "مستخدم Google",
        nonce: "wrong-nonce",
      }),
    });
    const context = encodeGoogleOAuthContext({
      intent: "login",
      nonce: "expected-nonce",
      codeVerifier: "verifier-1",
    });
    const request = new NextRequest(
      "http://localhost/api/v1/auth/google/callback?code=code-1&state=state-1",
      {
        headers: {
          cookie: `${GOOGLE_OAUTH_STATE_COOKIE}=state-1; ${GOOGLE_OAUTH_CONTEXT_COOKIE}=${context}`,
        },
      },
    );

    const response = await finishGoogleOAuth(request);
    expect(response.headers.get("location")).toContain(
      "/login?googleError=unverified_email",
    );
    expect(googleAuthServiceMock).not.toHaveBeenCalled();
  });
});
