import { expect, test } from "@playwright/test";
import { navByRole } from "../src/components/layout/dashboardNav";

for (const account of [
  { role: "CREATOR", settings: "/creator/settings" },
  { role: "BRAND", settings: "/brand/settings" },
  { role: "ADMIN", settings: "/admin/settings" },
] as const) {
  test(`mobile ${account.role.toLowerCase()} dashboard keeps four primary destinations and moves the rest under More`, async ({
    page,
  }) => {
    test.skip(!process.env.DATABASE_URL, "requires the local/CI PostgreSQL database");
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`/api/dev/quick-login?role=${account.role}`);
    await page.goto(account.settings);

    const primaryNav = page.getByRole("navigation", {
      name: "التنقل الأساسي داخل اللوحة",
    });
    await expect(primaryNav).toBeVisible();
    await expect(primaryNav.getByRole("link")).toHaveCount(4);
    await expect(primaryNav.getByRole("button", { name: "المزيد" })).toBeVisible();

    const noHorizontalOverflow = await page.evaluate(
      () =>
        document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1,
    );
    expect(noHorizontalOverflow).toBe(true);

    // Next's local-only dev toolbar occupies the bottom-left corner where the RTL
    // "More" tab sits; force bypasses that test-environment overlay. It is absent
    // from production builds.
    await primaryNav
      .getByRole("button", { name: "المزيد" })
      .evaluate((button: HTMLButtonElement) => button.click());
    const moreDialog = page.getByRole("dialog", { name: "كل الأقسام" });
    await expect(moreDialog).toBeVisible();
    await expect(moreDialog.getByRole("link", { name: /الإعدادات/ })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(moreDialog).toBeHidden();
  });
}

for (const account of [
  { role: "CREATOR", navRole: "creator" },
  { role: "BRAND", navRole: "brand" },
  { role: "ADMIN", navRole: "admin" },
] as const) {
  test(`all ${account.navRole} menu destinations load without mobile overflow`, async ({
    page,
  }) => {
    test.skip(!process.env.DATABASE_URL, "requires the local/CI PostgreSQL database");
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`/api/dev/quick-login?role=${account.role}`);

    for (const item of navByRole[account.navRole]) {
      const response = await page.goto(item.href);
      expect(response?.status(), item.href).toBeLessThan(400);
      await expect(page.locator("body")).toBeVisible();
      const noHorizontalOverflow = await page.evaluate(
        () =>
          document.documentElement.scrollWidth <=
          document.documentElement.clientWidth + 1,
      );
      expect(noHorizontalOverflow, `horizontal overflow on ${item.href}`).toBe(true);
    }
  });
}

test("mobile settings use a category screen and a focused detail screen", async ({
  page,
}) => {
  test.skip(!process.env.DATABASE_URL, "requires the local/CI PostgreSQL database");
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/api/dev/quick-login?role=CREATOR");
  await page.goto("/creator/settings");

  await expect(page.getByPlaceholder("ابحث في الإعدادات")).toBeVisible();
  await page.getByRole("button", { name: /المظهر وسهولة الاستخدام/ }).click();
  await expect(
    page.getByRole("heading", { name: "المظهر وسهولة الاستخدام" }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "كل الإعدادات" })).toBeVisible();

  await page.getByRole("button", { name: "كل الإعدادات" }).click();
  await expect(page.getByPlaceholder("ابحث في الإعدادات")).toBeVisible();
});

test("account owner can export a private copy of their data", async ({ request }) => {
  test.skip(!process.env.DATABASE_URL, "requires the local/CI PostgreSQL database");
  const login = await request.get("/api/dev/quick-login?role=CREATOR");
  expect(login.ok()).toBe(true);

  const response = await request.get("/api/v1/account/export");
  const responseText = await response.text();
  expect(response.ok(), `${response.status()}: ${responseText}`).toBe(true);
  expect(response.headers()["cache-control"]).toContain("no-store");
  expect(response.headers()["content-disposition"]).toContain("attachment");
  const data = JSON.parse(responseText);
  expect(data.account.email).toBe("dev-creator@khalliha-trend.local");
  expect(data.exportedAt).toBeTruthy();
});
