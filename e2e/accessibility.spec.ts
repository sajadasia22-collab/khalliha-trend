import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const PAGES_TO_SCAN = ["/", "/campaigns", "/login"];

for (const path of PAGES_TO_SCAN) {
  test(`accessibility: ${path} has no critical axe violations`, async ({ page }) => {
    // Entrance animations (fade-in-up) briefly render text at partial opacity;
    // scanning mid-fade reports false-positive contrast failures. Real motion-
    // sensitive users hit this same reduced-motion path (globals.css honors it
    // by zeroing animation-duration), so this is also the realistic scan state.
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto(path);
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa"])
      .analyze();
    expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
  });
}

test("skip-to-content link is reachable and focusable via keyboard", async ({ page }) => {
  await page.goto("/");
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "تخطي إلى المحتوى" })).toBeFocused();
});

test("login shows an alert-role error banner on failed submit", async ({ page }) => {
  await page.route("**/api/v1/auth/login", async (route) => {
    await route.fulfill({
      status: 401,
      contentType: "application/json",
      body: JSON.stringify({ error: { message: "بيانات الدخول غير صحيحة." } }),
    });
  });

  await page.goto("/login");
  await page.fill("#email", "nonexistent@example.com");
  await page.fill("#password", "wrongpassword123");
  await page.getByRole("button", { name: "تسجيل الدخول" }).click();

  const alertBanner = page
    .getByRole("alert")
    .filter({ hasText: "بيانات الدخول غير صحيحة" });
  await expect(alertBanner).toBeVisible();
});

test("auth credentials start visually from the right without breaking LTR values", async ({
  page,
}) => {
  const cases = [
    { path: "/login", selectors: ["#email", "#password"] },
    { path: "/register", selectors: ["#email", "#password"] },
    { path: "/forgot-password", selectors: ["#identifier"] },
  ];

  for (const { path, selectors } of cases) {
    await page.goto(path);
    for (const selector of selectors) {
      const input = page.locator(selector);
      await expect(input).toHaveAttribute("dir", "ltr");
      await expect(input).toHaveCSS("text-align", "right");
    }
  }

  await page.goto("/login");
  await expect(page.locator("#email")).toHaveCSS("padding-right", "44px");
});
