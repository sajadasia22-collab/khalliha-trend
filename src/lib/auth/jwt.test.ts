import { afterEach, describe, expect, it, vi } from "vitest";
import { DEV_ONLY_FALLBACK_SECRET, getAuthSecret, signJWT, verifyJWT } from "./jwt";

describe("JWT Utility", () => {
  const secret = "super-secret-key-123456789-longer-key";
  const payload = { userId: "user-123", role: "CREATOR" };

  it("should sign and verify a token successfully", async () => {
    const token = await signJWT(payload, secret);
    expect(token).toBeDefined();
    expect(token.split(".").length).toBe(3);

    const verified = await verifyJWT(token, secret);
    expect(verified).toBeDefined();
    expect(verified?.userId).toBe("user-123");
    expect(verified?.role).toBe("CREATOR");
  });

  it("should fail verification with wrong secret", async () => {
    const token = await signJWT(payload, secret);
    const verified = await verifyJWT(token, "wrong-secret-key-123456789-longer-key");
    expect(verified).toBeNull();
  });

  it("should fail verification with expired token", async () => {
    const expiredPayload = {
      ...payload,
      exp: Math.floor(Date.now() / 1000) - 10, // 10 seconds ago
    };
    const token = await signJWT(expiredPayload, secret);
    const verified = await verifyJWT(token, secret);
    expect(verified).toBeNull();
  });

  it("should handle invalid tokens gracefully", async () => {
    const verified = await verifyJWT("invalid.token.here", secret);
    expect(verified).toBeNull();
  });
});

describe("getAuthSecret", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns AUTH_SECRET when configured", () => {
    vi.stubEnv("AUTH_SECRET", "a-real-configured-secret-value");
    expect(getAuthSecret()).toBe("a-real-configured-secret-value");
  });

  it("falls back to the dev-only secret outside production", () => {
    vi.stubEnv("AUTH_SECRET", "");
    vi.stubEnv("NODE_ENV", "development");
    expect(getAuthSecret()).toBe(DEV_ONLY_FALLBACK_SECRET);
  });

  it("throws instead of using the known fallback secret in production", () => {
    vi.stubEnv("AUTH_SECRET", "");
    vi.stubEnv("NODE_ENV", "production");
    expect(() => getAuthSecret()).toThrow(/AUTH_SECRET is required/);
  });
});
