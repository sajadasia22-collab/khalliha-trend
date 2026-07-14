import { describe, expect, it } from "vitest";
import {
  communityFeedQuerySchema,
  communityPostSchema,
  communityReportSchema,
  privacySettingsSchema,
} from "./schemas";

describe("community schemas", () => {
  it("requires at least text, an image, or an external link", () => {
    expect(communityPostSchema.safeParse({}).success).toBe(false);
    expect(communityPostSchema.safeParse({ body: "فكرة مفيدة" }).success).toBe(true);
  });

  it("rejects non-http external links", () => {
    expect(
      communityPostSchema.safeParse({ linkUrl: "ftp://example.com/file" }).success,
    ).toBe(false);
  });

  it("accepts up to four post images", () => {
    const image = (index: number) => `https://cdn.example.com/image-${index}.png`;
    expect(
      communityPostSchema.safeParse({ imageUrls: [1, 2, 3, 4].map(image) }).success,
    ).toBe(true);
    expect(
      communityPostSchema.safeParse({ imageUrls: [1, 2, 3, 4, 5].map(image) }).success,
    ).toBe(false);
  });

  it("requires exactly one report target", () => {
    const base = { reason: "SPAM" as const };
    expect(communityReportSchema.safeParse(base).success).toBe(false);
    expect(
      communityReportSchema.safeParse({ ...base, postId: "cmri88bm90004v7opaumr1qo6" })
        .success,
    ).toBe(true);
    expect(
      communityReportSchema.safeParse({
        ...base,
        postId: "cmri88bm90004v7opaumr1qo6",
        commentId: "cmri88bm90004v7opaumr1qo7",
      }).success,
    ).toBe(false);
  });

  it("coerces safe feed pagination defaults", () => {
    expect(communityFeedQuerySchema.parse({})).toMatchObject({
      feed: "all",
      page: 1,
      pageSize: 12,
    });
  });

  it("accepts only supported message privacy modes", () => {
    expect(
      privacySettingsSchema.safeParse({ messagePermission: "CAMPAIGN_CONTACTS" }).success,
    ).toBe(true);
    expect(
      privacySettingsSchema.safeParse({ messagePermission: "EVERYONE" }).success,
    ).toBe(false);
  });
});
