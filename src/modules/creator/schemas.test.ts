import { describe, expect, it } from "vitest";
import { updateCreatorProfileSchema } from "./schemas";

describe("updateCreatorProfileSchema", () => {
  it("accepts and normalizes an Arabic or Latin username", () => {
    const latin = updateCreatorProfileSchema.parse({ username: "  Sajad_Studio " });
    const arabic = updateCreatorProfileSchema.parse({ username: "سجاد_آسيا" });

    expect(latin.username).toBe("sajad_studio");
    expect(arabic.username).toBe("سجاد_آسيا");
  });

  it("rejects reserved usernames and punctuation", () => {
    expect(updateCreatorProfileSchema.safeParse({ username: "admin" }).success).toBe(
      false,
    );
    expect(
      updateCreatorProfileSchema.safeParse({ username: "sajad.studio" }).success,
    ).toBe(false);
  });

  it("deduplicates languages and limits profile categories", () => {
    const parsed = updateCreatorProfileSchema.parse({
      languages: ["العربية", "العربية", "English"],
      contentCategories: ["TECH", "GAMING"],
    });

    expect(parsed.languages).toEqual(["العربية", "English"]);
    expect(parsed.contentCategories).toEqual(["TECH", "GAMING"]);
    expect(
      updateCreatorProfileSchema.safeParse({
        contentCategories: ["TECH", "GAMING", "FOOD", "FASHION", "BEAUTY", "PRODUCT"],
      }).success,
    ).toBe(false);
  });
});
