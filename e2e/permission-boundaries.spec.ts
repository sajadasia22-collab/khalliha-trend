import { expect, test } from "@playwright/test";
import { signJWT } from "../src/lib/auth/jwt";
import { resolveAuthSecret } from "./helpers/auth-secret";

const testSecret = resolveAuthSecret();
const COOKIE_NAME = "khalliha_trend_session";

// End-to-end permission-boundary checks. src/middleware.test.ts already unit
// tests the middleware() function directly; these instead go through the
// real Next.js request pipeline (actual HTTP status codes, cookie parsing,
// JSON error shape) for the highest-value cross-role denial paths.
async function tokenFor(role: "CREATOR" | "BRAND" | "ADMIN") {
  return signJWT(
    {
      userId: `perm-boundary-${role.toLowerCase()}`,
      fullName: "مستخدم اختبار الصلاحيات",
      email: null,
      role,
      status: "ACTIVE",
      exp: Math.floor(Date.now() / 1000) + 3600,
    },
    testSecret,
  );
}

test.describe("Cross-role permission boundaries", () => {
  test("unauthenticated request to an admin API returns 401 JSON, not a redirect", async ({
    request,
  }) => {
    const response = await request.get("/api/v1/admin/fraud-queue");
    expect(response.status()).toBe(401);
    const json = await response.json();
    expect(json.error.code).toBe("UNAUTHENTICATED");
  });

  test("a CREATOR token is rejected by an admin-only API with 403", async ({
    request,
  }) => {
    const token = await tokenFor("CREATOR");
    const response = await request.get("/api/v1/admin/fraud-queue", {
      headers: { cookie: `${COOKIE_NAME}=${token}` },
    });
    expect(response.status()).toBe(403);
    const json = await response.json();
    expect(json.error.code).toBe("FORBIDDEN");
  });

  test("a BRAND token is rejected by a creator-only API with 403", async ({
    request,
  }) => {
    const token = await tokenFor("BRAND");
    const response = await request.get("/api/v1/social-accounts", {
      headers: { cookie: `${COOKIE_NAME}=${token}` },
    });
    expect(response.status()).toBe(403);
  });

  test("a CREATOR token is rejected by a brand-only API with 403", async ({
    request,
  }) => {
    const token = await tokenFor("CREATOR");
    const response = await request.get("/api/v1/brand/campaigns", {
      headers: { cookie: `${COOKIE_NAME}=${token}` },
    });
    expect(response.status()).toBe(403);
  });

  test("a CREATOR browsing to /admin/dashboard is redirected to /unauthorized, not shown the page", async ({
    page,
    context,
  }) => {
    const token = await tokenFor("CREATOR");
    await context.addCookies([
      {
        name: COOKIE_NAME,
        value: token,
        domain: "127.0.0.1",
        path: "/",
      },
    ]);

    await page.goto("/admin/dashboard");
    await expect(page).toHaveURL(/\/unauthorized/);
  });

  test("an ADMIN token is granted access to the admin dashboard", async ({
    page,
    context,
  }) => {
    test.skip(
      !process.env.DATABASE_URL,
      "requires a live database for the server component",
    );
    const token = await tokenFor("ADMIN");
    await context.addCookies([
      {
        name: COOKIE_NAME,
        value: token,
        domain: "127.0.0.1",
        path: "/",
      },
    ]);

    await page.goto("/admin/dashboard");
    await expect(page).toHaveURL(/\/admin\/dashboard/);
  });
});
