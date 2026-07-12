import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "./password";

describe("Password Hashing Utility", () => {
  it("should hash and verify passwords successfully", () => {
    const password = "my-secure-password";
    const hashed = hashPassword(password);
    expect(hashed).toBeDefined();
    expect(hashed).not.toBe(password);
    expect(hashed.split(":").length).toBe(2);

    const isMatch = verifyPassword(password, hashed);
    expect(isMatch).toBe(true);

    const isWrongMatch = verifyPassword("wrong-password", hashed);
    expect(isWrongMatch).toBe(false);
  });

  it("should handle malformed stored strings gracefully", () => {
    expect(verifyPassword("password", "malformed_string_without_colon")).toBe(false);
    expect(verifyPassword("password", "")).toBe(false);
  });
});
