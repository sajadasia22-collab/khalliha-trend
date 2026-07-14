import { describe, expect, it } from "vitest";
import { creatorDirectoryQuerySchema } from "./directory-schemas";

describe("creatorDirectoryQuerySchema", () => {
  it("coerces pagination and accepts supported filters", () => {
    const result = creatorDirectoryQuerySchema.parse({
      search: "سجاد",
      category: "TECH",
      platform: "YOUTUBE",
      page: "2",
      pageSize: "12",
    });
    expect(result.page).toBe(2);
    expect(result.category).toBe("TECH");
  });

  it("rejects unknown categories and excessive page sizes", () => {
    expect(
      creatorDirectoryQuerySchema.safeParse({ category: "UNKNOWN", pageSize: 100 })
        .success,
    ).toBe(false);
  });
});
