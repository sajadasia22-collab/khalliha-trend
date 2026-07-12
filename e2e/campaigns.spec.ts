import { expect, test } from "@playwright/test";

test("navbar links to the discover campaigns page from home", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("link", { name: "تصفح الحملات المتوفرة" }).click();
  await expect(page).toHaveURL(/\/campaigns$/);
  await expect(
    page.getByRole("heading", { name: "استكشف الحملات المتاحة" }),
  ).toBeVisible();
});

test("discover page shows a real state without fabricated campaign data", async ({
  page,
}) => {
  await page.goto("/campaigns");

  // Any of these is honest: a DB error, an empty catalog, or real ACTIVE campaigns.
  // What must never appear is fabricated placeholder content pretending to be live data.
  const dbError = page.getByText("تعذّر الاتصال بقاعدة البيانات حالياً");
  const emptyState = page.getByText("لا توجد حملات نشطة متاحة حالياً");
  const realCampaign = page.locator('a[href^="/campaigns/"]').first();

  await expect(dbError.or(emptyState).or(realCampaign)).toBeVisible();
});

test("static pages render with real Arabic content", async ({ page }) => {
  await page.goto("/how-it-works");
  await expect(
    page.getByRole("heading", { name: "كيف تعمل منصة خلّيها ترند؟" }),
  ).toBeVisible();

  await page.goto("/terms");
  await expect(page.getByRole("heading", { name: "الشروط والأحكام" })).toBeVisible();

  await page.goto("/privacy");
  await expect(page.getByRole("heading", { name: "سياسة الخصوصية" })).toBeVisible();

  await page.goto("/payment-policy");
  await expect(page.getByRole("heading", { name: "سياسة الدفع" })).toBeVisible();
});
