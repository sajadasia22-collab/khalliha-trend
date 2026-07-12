export class RateLimiter {
  private static cache = new Map<string, number[]>();

  /**
   * Checks if a request is allowed under the rate limit configuration.
   * Uses a Sliding Window Counter algorithm in memory.
   *
   * @param key Unique identifier for the rate limit client (e.g., `${ip}:${path}`)
   * @param limit Maximum number of requests allowed within the window
   * @param windowMs Time window in milliseconds
   * @returns boolean true if the request is allowed, false if rate limited
   */
  static isAllowed(key: string, limit: number, windowMs: number): boolean {
    const now = Date.now();
    const timestamps = this.cache.get(key) || [];

    // Filter out timestamps that fall outside the active window
    const activeTimestamps = timestamps.filter((timestamp) => now - timestamp < windowMs);

    if (activeTimestamps.length >= limit) {
      // Still update cache with filtered timestamps to free up memory
      this.cache.set(key, activeTimestamps);
      return false;
    }

    // Add current request timestamp
    activeTimestamps.push(now);
    this.cache.set(key, activeTimestamps);
    return true;
  }

  /**
   * Resets rate limit counters. Useful for testing or clearing bans.
   */
  static reset(key?: string) {
    if (key) {
      this.cache.delete(key);
    } else {
      this.cache.clear();
    }
  }
}
