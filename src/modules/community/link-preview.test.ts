import { describe, expect, it } from "vitest";
import { assertSafeExternalUrl } from "./link-preview";

describe("community link preview safety", () => {
  it("rejects localhost and private network targets", async () => {
    await expect(assertSafeExternalUrl("http://localhost/admin")).rejects.toThrow(
      "UNSAFE_COMMUNITY_LINK",
    );
    await expect(assertSafeExternalUrl("http://127.0.0.1/private")).rejects.toThrow(
      "UNSAFE_COMMUNITY_LINK",
    );
    await expect(assertSafeExternalUrl("http://192.168.1.10/private")).rejects.toThrow(
      "UNSAFE_COMMUNITY_LINK",
    );
  });

  it("rejects credentials and unusual ports", async () => {
    await expect(
      assertSafeExternalUrl("https://user:password@example.com"),
    ).rejects.toThrow("UNSAFE_COMMUNITY_LINK");
    await expect(assertSafeExternalUrl("https://example.com:8080")).rejects.toThrow(
      "UNSAFE_COMMUNITY_LINK",
    );
  });
});
