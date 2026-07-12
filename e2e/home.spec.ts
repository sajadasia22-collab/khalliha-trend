import { expect, test } from "@playwright/test";

test("home page renders the Arabic product entry point", async ({ page }) => {
  await page.goto("/");

  await expect(page).toHaveTitle(/خلّيها ترند/);
  await expect(
    page.getByRole("heading", { name: "سوّي المحتوى، انشره، واربح من المشاهدات" }),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: "ابدأ كصانع محتوى" })).toBeVisible();
  await expect(page.getByRole("link", { name: "أنشئ حملة" })).toBeVisible();
});

test("health endpoints return service status", async ({ request }) => {
  const health = await request.get("/api/v1/health");
  await expect(health).toBeOK();
  await expect(await health.json()).toMatchObject({
    status: "ok",
    service: "khalliha-trend",
  });

  const readiness = await request.get("/api/v1/readiness");
  await expect(readiness).toBeOK();
  await expect(await readiness.json()).toMatchObject({
    ok: true,
    checks: {
      env: true,
    },
  });
});
