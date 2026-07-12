import { describe, expect, it, beforeEach, vi } from "vitest";
import { RateLimiter } from "./rate-limit";

describe("RateLimiter", () => {
  beforeEach(() => {
    RateLimiter.reset();
    vi.useFakeTimers();
  });

  it("allows requests under the limit", () => {
    const key = "test-client-1";

    // Limit: 3 requests per 10 seconds (10000ms)
    expect(RateLimiter.isAllowed(key, 3, 10000)).toBe(true);
    expect(RateLimiter.isAllowed(key, 3, 10000)).toBe(true);
    expect(RateLimiter.isAllowed(key, 3, 10000)).toBe(true);
  });

  it("blocks requests that exceed the limit", () => {
    const key = "test-client-2";

    expect(RateLimiter.isAllowed(key, 2, 10000)).toBe(true);
    expect(RateLimiter.isAllowed(key, 2, 10000)).toBe(true);
    expect(RateLimiter.isAllowed(key, 2, 10000)).toBe(false); // Exceeded
  });

  it("allows requests again after the time window passes", () => {
    const key = "test-client-3";

    expect(RateLimiter.isAllowed(key, 2, 10000)).toBe(true);
    expect(RateLimiter.isAllowed(key, 2, 10000)).toBe(true);
    expect(RateLimiter.isAllowed(key, 2, 10000)).toBe(false); // Blocked

    // Advance time by 11 seconds (outside window)
    vi.advanceTimersByTime(11000);

    expect(RateLimiter.isAllowed(key, 2, 10000)).toBe(true); // Allowed again
  });

  it("handles multiple separate keys independently", () => {
    const keyA = "client-a";
    const keyB = "client-b";

    expect(RateLimiter.isAllowed(keyA, 1, 10000)).toBe(true);
    expect(RateLimiter.isAllowed(keyB, 1, 10000)).toBe(true);

    expect(RateLimiter.isAllowed(keyA, 1, 10000)).toBe(false);
    expect(RateLimiter.isAllowed(keyB, 1, 10000)).toBe(false);
  });

  it("resets correctly", () => {
    const key = "test-client-reset";

    expect(RateLimiter.isAllowed(key, 1, 10000)).toBe(true);
    expect(RateLimiter.isAllowed(key, 1, 10000)).toBe(false);

    RateLimiter.reset(key);

    expect(RateLimiter.isAllowed(key, 1, 10000)).toBe(true); // Allowed after reset
  });
});
