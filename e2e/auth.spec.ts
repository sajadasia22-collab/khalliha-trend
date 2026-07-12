import { expect, test } from "@playwright/test";
import { signJWT } from "../src/lib/auth/jwt";
import { prisma } from "../src/lib/prisma";
import { resolveAuthSecret } from "./helpers/auth-secret";

const testSecret = resolveAuthSecret();

// Visiting a dashboard page can trigger LedgerEngine.createWalletIfNotExist()
// as a side effect (both brand and creator dashboards read wallet balance),
// which creates real Wallet + FinancialAccount rows FK-referencing the user.
// A bare prisma.user.delete() fails on that FK and gets silently swallowed by
// a .catch(), leaving orphaned fixture rows behind for the next run. Clean up
// anything the dashboard may have created before deleting the user itself.
async function deleteUserAndFinancials(userId: string) {
  const wallets = await prisma.wallet.findMany({ where: { userId } });
  const accountIds = wallets.map((w) => w.financialAccountId);
  if (accountIds.length > 0) {
    await prisma.ledgerEntry.deleteMany({ where: { accountId: { in: accountIds } } });
  }
  await prisma.wallet.deleteMany({ where: { userId } });
  if (accountIds.length > 0) {
    await prisma.financialAccount.deleteMany({ where: { id: { in: accountIds } } });
  }
  await prisma.user.delete({ where: { id: userId } }).catch(() => {});
}

test.describe("Authentication and Route Protection E2E", () => {
  test.beforeEach(({ page }) => {
    // Log browser console messages to the test output
    page.on("console", (msg) => {
      console.log(`[Browser Console] ${msg.type()}: ${msg.text()}`);
    });

    // Automatically accept any dialogs (like alerts) so they don't block the test
    page.on("dialog", async (dialog) => {
      console.log(`[Browser Dialog] ${dialog.type()}: ${dialog.message()}`);
      await dialog.accept();
    });
  });

  test("unauthenticated user is redirected from dashboard to login", async ({ page }) => {
    // Go to creator dashboard without session
    await page.goto("/creator/dashboard");

    // Should be redirected to /login
    await expect(page).toHaveURL(/\/login/);
    await expect(
      page.getByRole("heading", { name: "تسجيل الدخول إلى حسابك" }),
    ).toBeVisible();
  });

  test("successful creator signup redirects to creator dashboard and logout works", async ({
    page,
  }) => {
    // The dashboard is a server component that loads the user via Prisma;
    // mocking the register/me network calls cannot substitute for a real database.
    test.skip(
      !process.env.DATABASE_URL,
      "requires a live database so the server-rendered dashboard can load the real user",
    );

    const userId = "user-creator-e2e";

    // The mocked register response below only fakes the network call and sets
    // a signed cookie — it never inserts a row. The dashboard is a real server
    // component that looks the user up in Postgres, so the fixture must exist
    // there too, or getCurrentUser() resolves to null and the page redirects.
    await prisma.user.create({
      data: {
        id: userId,
        fullName: "أحمد صانع المحتوى",
        email: "creator-e2e@example.com",
        role: "CREATOR",
        status: "ACTIVE",
      },
    });

    try {
      // Generate a valid signed JWT using the test secret
      const token = await signJWT(
        {
          userId,
          fullName: "أحمد صانع المحتوى",
          email: "creator-e2e@example.com",
          role: "CREATOR",
          status: "ACTIVE",
          exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour
        },
        testSecret,
      );

      // Mock the register endpoint
      await page.route("**/api/v1/auth/register", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            status: "success",
            user: {
              id: userId,
              fullName: "أحمد صانع المحتوى",
              email: "creator-e2e@example.com",
              role: "CREATOR",
              status: "ACTIVE",
            },
          }),
          headers: {
            "Set-Cookie": `khalliha_trend_session=${token}; Path=/; HttpOnly; SameSite=Lax`,
          },
        });
      });

      // Mock the me endpoint
      await page.route("**/api/v1/me", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            status: "success",
            user: {
              id: userId,
              fullName: "أحمد صانع المحتوى",
              email: "creator-e2e@example.com",
              role: "CREATOR",
              status: "ACTIVE",
            },
          }),
        });
      });

      // Mock the logout endpoint and manually clear cookies in browser context
      await page.route("**/api/v1/auth/logout", async (route) => {
        await page.context().clearCookies(); // Crucial: clear cookies in the Playwright browser jar
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ status: "success" }),
        });
      });

      // Go to register page
      await page.goto("/register");

      // Fill the registration form
      await page.fill("#fullName", "أحمد صانع المحتوى");
      await page.fill("#email", "creator-e2e@example.com");
      await page.fill("#password", "password123");

      // Check checkboxes
      await page.check("input[type='checkbox'] >> nth=0"); // confirmAge
      await page.check("input[type='checkbox'] >> nth=1"); // acceptTerms

      // Submit
      await page.click("button[type='submit']");

      // Wait for redirect to creator dashboard
      await expect(page).toHaveURL(/\/creator\/dashboard/);
      await expect(page.getByText("أهلاً بك، أحمد صانع المحتوى 👋")).toBeVisible();

      // Click logout
      await page.click("button:has-text('تسجيل الخروج')");

      // Redirected to login
      await expect(page).toHaveURL(/\/login/, { timeout: 10000 });
    } finally {
      await deleteUserAndFinancials(userId);
    }
  });

  test("successful brand signup redirects to brand dashboard", async ({ page }) => {
    test.skip(
      !process.env.DATABASE_URL,
      "requires a live database so the server-rendered dashboard can load the real user",
    );

    const userId = "user-brand-e2e";

    // Same real-database requirement as the creator test above: the brand
    // dashboard reads user.brandMembers[0].brand.name from Prisma, not from
    // the mocked /api/v1/me response.
    const brand = await prisma.brandProfile.create({
      data: { name: "شركة دجلة للتجارة", slug: `dijla-e2e-${Date.now()}` },
    });
    await prisma.user.create({
      data: {
        id: userId,
        fullName: "سارة التاجرة",
        email: "brand-e2e@example.com",
        role: "BRAND",
        status: "ACTIVE",
      },
    });
    await prisma.brandMember.create({
      data: { userId, brandId: brand.id, role: "OWNER" },
    });

    try {
      // Generate a valid signed JWT for BRAND
      const token = await signJWT(
        {
          userId,
          fullName: "سارة التاجرة",
          email: "brand-e2e@example.com",
          role: "BRAND",
          status: "ACTIVE",
          brandName: "شركة دجلة للتجارة",
          exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour
        },
        testSecret,
      );

      // Mock the register endpoint for BRAND
      await page.route("**/api/v1/auth/register", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            status: "success",
            user: {
              id: userId,
              fullName: "سارة التاجرة",
              email: "brand-e2e@example.com",
              role: "BRAND",
              status: "ACTIVE",
            },
          }),
          headers: {
            "Set-Cookie": `khalliha_trend_session=${token}; Path=/; HttpOnly; SameSite=Lax`,
          },
        });
      });

      // Mock the me endpoint for BRAND
      await page.route("**/api/v1/me", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            status: "success",
            user: {
              id: userId,
              fullName: "سارة التاجرة",
              email: "brand-e2e@example.com",
              role: "BRAND",
              status: "ACTIVE",
              brandMembers: [
                {
                  brand: {
                    name: "شركة دجلة للتجارة",
                  },
                },
              ],
            },
          }),
        });
      });

      // Go to register page
      await page.goto("/register");

      // Fill form
      await page.fill("#fullName", "سارة التاجرة");
      await page.fill("#email", "brand-e2e@example.com");
      await page.fill("#password", "password123");

      // Select Brand role
      await page.click("text=علامة تجارية / تاجر");

      // Fill Brand Name
      await page.fill("#brandName", "شركة دجلة للتجارة");

      // Check checkboxes
      await page.check("input[type='checkbox'] >> nth=0");
      await page.check("input[type='checkbox'] >> nth=1");

      // Submit
      await page.click("button[type='submit']");

      // Wait for redirect to brand dashboard
      await expect(page).toHaveURL(/\/brand\/dashboard/);
      await expect(page.getByText("العلامة التجارية: شركة دجلة للتجارة")).toBeVisible();
    } finally {
      await prisma.brandMember.deleteMany({ where: { userId } }).catch(() => {});
      await deleteUserAndFinancials(userId);
      await prisma.brandProfile.delete({ where: { id: brand.id } }).catch(() => {});
    }
  });
});
