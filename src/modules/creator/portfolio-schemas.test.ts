import { describe, expect, it } from "vitest";
import { createPortfolioItemSchema, reorderPortfolioSchema } from "./portfolio-schemas";

describe("creator portfolio schemas", () => {
  it("accepts a direct supported post URL that matches the selected platform", () => {
    const result = createPortfolioItemSchema.safeParse({
      title: "تجربة منتج تقني",
      description: "مراجعة مختصرة وواضحة.",
      platform: "INSTAGRAM",
      projectUrl: "https://www.instagram.com/reel/ABC_123/",
    });
    expect(result.success).toBe(true);
  });

  it("rejects unsupported URLs and platform mismatches", () => {
    expect(
      createPortfolioItemSchema.safeParse({
        title: "عمل تجريبي",
        platform: "TIKTOK",
        projectUrl: "https://example.com/post/1",
      }).success,
    ).toBe(false);
    expect(
      createPortfolioItemSchema.safeParse({
        title: "عمل تجريبي",
        platform: "YOUTUBE",
        projectUrl: "https://www.instagram.com/reel/ABC_123/",
      }).success,
    ).toBe(false);
  });

  it("rejects duplicate IDs in a reorder request", () => {
    expect(reorderPortfolioSchema.safeParse({ itemIds: ["one", "one"] }).success).toBe(
      false,
    );
  });
});
