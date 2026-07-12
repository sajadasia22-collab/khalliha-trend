import { describe, expect, it } from "vitest";
import { normalizeIraqiPhone } from "./phone";

describe("normalizeIraqiPhone", () => {
  it("normalizes every accepted input format to the same E.164 value", () => {
    const expected = "+9647701234567";
    expect(normalizeIraqiPhone("07701234567")).toBe(expected);
    expect(normalizeIraqiPhone("7701234567")).toBe(expected);
    expect(normalizeIraqiPhone("9647701234567")).toBe(expected);
    expect(normalizeIraqiPhone("+9647701234567")).toBe(expected);
  });

  it("trims surrounding whitespace before validating", () => {
    expect(normalizeIraqiPhone("  07701234567  ")).toBe("+9647701234567");
  });

  it("returns null for numbers that are not valid Iraqi mobile numbers", () => {
    expect(normalizeIraqiPhone("12345")).toBeNull();
    expect(normalizeIraqiPhone("0870123456")).toBeNull();
    expect(normalizeIraqiPhone("not-a-number")).toBeNull();
  });
});
