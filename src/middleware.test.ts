import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { middleware } from "./middleware";
import { DEV_ONLY_FALLBACK_SECRET, signJWT } from "./lib/auth/jwt";

const SECRET = DEV_ONLY_FALLBACK_SECRET;
const COOKIE_NAME = "khalliha_trend_session";

async function tokenFor(role: string): Promise<string> {
  return signJWT(
    {
      userId: "user-1",
      role,
      status: "ACTIVE",
      exp: Math.floor(Date.now() / 1000) + 60 * 60,
    },
    SECRET,
  );
}

function requestTo(path: string, token?: string): NextRequest {
  const url = `http://localhost:3000${path}`;
  const headers: Record<string, string> = {};
  if (token) {
    headers.cookie = `${COOKIE_NAME}=${token}`;
  }
  return new NextRequest(url, { headers });
}

describe("middleware route protection", () => {
  it("redirects unauthenticated page requests to /login", async () => {
    const response = await middleware(requestTo("/creator/dashboard"));
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("http://localhost:3000/login");
  });

  it("returns 401 JSON for unauthenticated API requests", async () => {
    const response = await middleware(requestTo("/api/v1/admin/users"));
    expect(response.status).toBe(401);
    const json = await response.json();
    expect(json.error.code).toBe("UNAUTHENTICATED");
  });

  it("redirects a wrong-role page request to /unauthorized", async () => {
    const token = await tokenFor("CREATOR");
    const response = await middleware(requestTo("/admin/dashboard", token));
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("http://localhost:3000/unauthorized");
  });

  it("returns 403 JSON for a wrong-role API request", async () => {
    const token = await tokenFor("BRAND");
    const response = await middleware(requestTo("/api/v1/creator/profile", token));
    expect(response.status).toBe(403);
    const json = await response.json();
    expect(json.error.code).toBe("FORBIDDEN");
  });

  it("allows a correctly-scoped request through", async () => {
    const token = await tokenFor("CREATOR");
    const response = await middleware(requestTo("/creator/dashboard", token));
    expect(response.status).toBe(200);
    expect(response.headers.get("location")).toBeNull();
  });

  it("allows ADMIN and SUPER_ADMIN into /admin", async () => {
    for (const role of ["ADMIN", "SUPER_ADMIN"]) {
      const token = await tokenFor(role);
      const response = await middleware(requestTo("/admin/dashboard", token));
      expect(response.status).toBe(200);
    }
  });

  it("gates /api/v1/social-accounts to CREATOR only", async () => {
    const unauth = await middleware(requestTo("/api/v1/social-accounts"));
    expect(unauth.status).toBe(401);

    const brandToken = await tokenFor("BRAND");
    const forbidden = await middleware(requestTo("/api/v1/social-accounts", brandToken));
    expect(forbidden.status).toBe(403);

    const creatorToken = await tokenFor("CREATOR");
    const allowed = await middleware(requestTo("/api/v1/social-accounts", creatorToken));
    expect(allowed.status).toBe(200);
  });

  it("redirects an authenticated user away from /login to their dashboard", async () => {
    const token = await tokenFor("BRAND");
    const response = await middleware(requestTo("/login", token));
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "http://localhost:3000/brand/dashboard",
    );
  });
});
