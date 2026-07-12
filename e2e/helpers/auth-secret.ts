import { readFileSync } from "node:fs";
import { DEV_ONLY_FALLBACK_SECRET } from "../../src/lib/auth/jwt";

// The Next.js dev server (spawned separately by playwright's webServer) loads
// .env itself and signs/verifies with its AUTH_SECRET if one is set. This
// Playwright test process does not inherit that — resolve the same value here
// so forged tokens are signed with whatever secret the live server actually
// verifies against, mirroring getAuthSecret()'s own fallback exactly.
// Order: a real process env var (e.g. set directly by CI) wins first, then a
// local .env file (dev machines), then the shared dev-only fallback secret.
export function resolveAuthSecret(): string {
  if (process.env.AUTH_SECRET) {
    return process.env.AUTH_SECRET;
  }
  try {
    const contents = readFileSync(new URL("../../.env", import.meta.url), "utf-8");
    const match = contents.match(/^AUTH_SECRET=(.*)$/m);
    const value = match?.[1]?.trim().replace(/^["']|["']$/g, "");
    if (value) return value;
  } catch {
    // .env not present — fall through to the dev fallback secret.
  }
  return DEV_ONLY_FALLBACK_SECRET;
}
