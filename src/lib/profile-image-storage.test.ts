import { describe, expect, it } from "vitest";
import { detectProfileImageMime, getProfileImagePath } from "./profile-image-storage";

describe("profile image validation", () => {
  it("detects JPEG, PNG and WebP by their bytes", () => {
    expect(detectProfileImageMime(Uint8Array.from([0xff, 0xd8, 0xff, 0x00]))).toBe(
      "image/jpeg",
    );
    expect(
      detectProfileImageMime(
        Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
      ),
    ).toBe("image/png");
    expect(
      detectProfileImageMime(
        Uint8Array.from([0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50]),
      ),
    ).toBe("image/webp");
  });

  it("rejects content whose bytes are not a supported image", () => {
    expect(detectProfileImageMime(new TextEncoder().encode("<svg></svg>"))).toBeNull();
  });

  it("extracts only paths owned by the profile image bucket", () => {
    expect(
      getProfileImagePath(
        "https://project.supabase.co/storage/v1/object/public/profile-images/user/avatar.jpg",
      ),
    ).toBe("user/avatar.jpg");
    expect(getProfileImagePath("https://example.com/avatar.jpg")).toBeNull();
  });
});
