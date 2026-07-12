import { expect, test } from "@playwright/test";

// The service worker only self-registers in production builds
// (see ServiceWorkerRegister.tsx), so these tests register it manually
// against the dev server to exercise the actual sw.js logic.
async function registerAndWaitForControl(page: import("@playwright/test").Page) {
  await page.goto("/");
  await page.evaluate(async () => {
    await navigator.serviceWorker.register("/sw.js");
    await navigator.serviceWorker.ready;
  });
  await page.reload();
  await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller));
}

test("offline fallback serves the offline page for public routes", async ({
  page,
  context,
}) => {
  await registerAndWaitForControl(page);

  await context.setOffline(true);
  await page.goto("/campaigns", { waitUntil: "domcontentloaded" }).catch(() => {});
  await expect(
    page.getByRole("heading", { name: "لا يوجد اتصال بالإنترنت" }),
  ).toBeVisible();
  await context.setOffline(false);
});

test("protected dashboard routes are never served from the offline cache", async ({
  page,
  context,
}) => {
  await registerAndWaitForControl(page);

  await context.setOffline(true);
  await page
    .goto("/brand/dashboard", { waitUntil: "domcontentloaded" })
    .catch(() => null);
  // The service worker's fetch handler only intercepts an explicit public-path
  // allowlist, so a protected route must never resolve to our cached offline page.
  await expect(
    page.getByRole("heading", { name: "لا يوجد اتصال بالإنترنت" }),
  ).not.toBeVisible();
  await context.setOffline(false);
});
