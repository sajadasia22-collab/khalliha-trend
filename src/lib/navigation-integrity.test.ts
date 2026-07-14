import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const appRoot = path.resolve(process.cwd(), "src/app");
const srcRoot = path.resolve(process.cwd(), "src");

function sourceFiles(root: string) {
  return readdirSync(root, { recursive: true, encoding: "utf8" })
    .filter((file) => file.endsWith(".ts") || file.endsWith(".tsx"))
    .map((file) => path.join(root, file));
}

function pageRoutes() {
  return readdirSync(appRoot, { recursive: true, encoding: "utf8" })
    .filter((file) => file.endsWith("/page.tsx") || file === "page.tsx")
    .map((file) => {
      const withoutGroups = file.replace(/(^|\/)\([^/]+\)/g, "");
      const route = withoutGroups.replace(/\/?page\.tsx$/, "");
      return route ? `/${route}`.replace(/\/+/g, "/") : "/";
    });
}

function routeMatches(target: string, route: string) {
  const pattern = route
    .replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    .replace(/\\\[\\\[\\\.\\\.\\\.[^\]]+\\\]\\\]/g, ".+")
    .replace(/\\\[[^\]]+\\\]/g, "[^/]+");
  return new RegExp(`^${pattern}$`).test(target);
}

describe("navigation integrity", () => {
  it("keeps literal internal navigation targets connected to real pages", () => {
    const routes = pageRoutes();
    const broken: string[] = [];
    const navigationPattern =
      /(?:href=|router\.(?:push|replace)\(|redirect\()\s*["'](\/[^"'#?]*)/g;

    for (const file of sourceFiles(srcRoot)) {
      const source = readFileSync(file, "utf8");
      for (const match of source.matchAll(navigationPattern)) {
        const target = match[1].replace(/\/$/, "") || "/";
        if (!routes.some((route) => routeMatches(target, route))) {
          broken.push(`${path.relative(process.cwd(), file)} → ${target}`);
        }
      }
    }

    expect(broken, `Broken internal navigation:\n${broken.join("\n")}`).toEqual([]);
  });

  it("does not reintroduce placeholder links, browser prompts, or fake uploads", () => {
    const violations: string[] = [];
    for (const file of sourceFiles(path.join(srcRoot, "components"))) {
      const source = readFileSync(file, "utf8");
      if (/href=["']#["']/.test(source)) violations.push(`${file}: placeholder href`);
      if (/window\.prompt\s*\(/.test(source)) violations.push(`${file}: window.prompt`);
      if (/assets\.khallihatrend\.com\/brand-uploads/.test(source)) {
        violations.push(`${file}: simulated campaign upload`);
      }
    }

    expect(violations).toEqual([]);
  });
});
