import { describe, expect, it } from "vitest";
import { createSocialAccountSchema } from "./schemas";

describe("createSocialAccountSchema", () => {
  it("accepts a handle without an @ prefix", () => {
    const result = createSocialAccountSchema.safeParse({
      platform: "TIKTOK",
      handle: "sara_demo",
      profileUrl: "https://tiktok.com/@sara_demo",
    });
    expect(result.success).toBe(true);
  });

  it("accepts a handle typed with a leading @, matching how the service normalizes it", () => {
    const result = createSocialAccountSchema.safeParse({
      platform: "TIKTOK",
      handle: "@sara_demo",
      profileUrl: "https://tiktok.com/@sara_demo",
    });
    expect(result.success).toBe(true);
  });

  it("rejects a handle with disallowed characters", () => {
    const result = createSocialAccountSchema.safeParse({
      platform: "TIKTOK",
      handle: "sara demo!",
      profileUrl: "https://tiktok.com/@sara_demo",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a non-URL profile link", () => {
    const result = createSocialAccountSchema.safeParse({
      platform: "TIKTOK",
      handle: "sara_demo",
      profileUrl: "not-a-url",
    });
    expect(result.success).toBe(false);
  });
});
