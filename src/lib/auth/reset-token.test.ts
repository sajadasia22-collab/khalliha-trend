import { describe, expect, it } from "vitest";
import { generateResetToken, hashResetToken } from "./reset-token";

describe("Reset Token Utility", () => {
  it("generates high-entropy, unique tokens", () => {
    const a = generateResetToken();
    const b = generateResetToken();

    expect(a).toMatch(/^[0-9a-f]{64}$/);
    expect(b).toMatch(/^[0-9a-f]{64}$/);
    expect(a).not.toBe(b);
  });

  it("hashes deterministically so the same token always maps to the same hash", () => {
    const token = generateResetToken();
    expect(hashResetToken(token)).toBe(hashResetToken(token));
  });

  it("produces different hashes for different tokens", () => {
    const a = generateResetToken();
    const b = generateResetToken();
    expect(hashResetToken(a)).not.toBe(hashResetToken(b));
  });
});
