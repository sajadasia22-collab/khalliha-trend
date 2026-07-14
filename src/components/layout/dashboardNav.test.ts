import { readdirSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { navByRole } from "./dashboardNav";

function appPageRoutes() {
  const appRoot = path.resolve(process.cwd(), "src/app");
  return new Set(
    readdirSync(appRoot, { recursive: true, encoding: "utf8" })
      .filter((file) => file.endsWith("/page.tsx") || file === "page.tsx")
      .map((file) => {
        const withoutGroups = file.replace(/(^|\/)\([^/]+\)/g, "");
        const route = withoutGroups.replace(/\/?page\.tsx$/, "");
        return route ? `/${route}`.replace(/\/+/g, "/") : "/";
      }),
  );
}

describe("dashboard navigation links", () => {
  it("points every role menu item to a real App Router page", () => {
    const routes = appPageRoutes();
    for (const [role, items] of Object.entries(navByRole)) {
      for (const item of items) {
        expect(routes.has(item.href), `${role}: missing page for ${item.href}`).toBe(
          true,
        );
      }
    }
  });
});
