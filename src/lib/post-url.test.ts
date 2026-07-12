import { describe, expect, it } from "vitest";
import { normalizePostUrl } from "./post-url";

describe("normalizePostUrl", () => {
  it("extracts a TikTok video id and normalizes the URL", () => {
    const result = normalizePostUrl(
      "https://www.tiktok.com/@someone/video/7123456789012345678?is_from_webapp=1",
    );
    expect(result).toEqual({
      platform: "TIKTOK",
      normalizedUrl: "https://www.tiktok.com/@someone/video/7123456789012345678",
      platformPostId: "7123456789012345678",
    });
  });

  it("extracts an Instagram reel shortcode", () => {
    const result = normalizePostUrl(
      "https://instagram.com/reel/Cabc123XYZ/?utm_source=x",
    );
    expect(result).toEqual({
      platform: "INSTAGRAM",
      normalizedUrl: "https://www.instagram.com/reel/Cabc123XYZ/",
      platformPostId: "Cabc123XYZ",
    });
  });

  it("extracts a YouTube video id from a watch URL", () => {
    const result = normalizePostUrl("https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=10s");
    expect(result).toEqual({
      platform: "YOUTUBE",
      normalizedUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      platformPostId: "dQw4w9WgXcQ",
    });
  });

  it("extracts a YouTube video id from a youtu.be short URL", () => {
    const result = normalizePostUrl("https://youtu.be/dQw4w9WgXcQ");
    expect(result?.platformPostId).toBe("dQw4w9WgXcQ");
    expect(result?.platform).toBe("YOUTUBE");
  });

  it("extracts a Facebook video id", () => {
    const result = normalizePostUrl(
      "https://www.facebook.com/SomePage/videos/1234567890123456/",
    );
    expect(result).toEqual({
      platform: "FACEBOOK",
      normalizedUrl: "https://www.facebook.com/watch/?v=1234567890123456",
      platformPostId: "1234567890123456",
    });
  });

  it("produces the same platformPostId regardless of tracking params or trailing slashes", () => {
    const a = normalizePostUrl("https://www.tiktok.com/@user/video/111222333?lang=en");
    const b = normalizePostUrl("https://tiktok.com/@user/video/111222333");
    expect(a?.platformPostId).toBe(b?.platformPostId);
    expect(a?.normalizedUrl).toBe(b?.normalizedUrl);
  });

  it("rejects unsupported domains", () => {
    expect(normalizePostUrl("https://example.com/video/123")).toBeNull();
  });

  it("rejects short links that require following a redirect", () => {
    expect(normalizePostUrl("https://vm.tiktok.com/ZMabcdefg/")).toBeNull();
    expect(normalizePostUrl("https://fb.watch/abc123/")).toBeNull();
  });

  it("rejects malformed URLs", () => {
    expect(normalizePostUrl("not a url")).toBeNull();
    expect(normalizePostUrl("")).toBeNull();
  });

  it("rejects non-http(s) protocols", () => {
    expect(normalizePostUrl("javascript:alert(1)")).toBeNull();
  });
});
