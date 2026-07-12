import { describe, expect, it } from "vitest";
import { calculateEarningForDelta } from "./earnings-engine";

describe("Earnings Engine", () => {
  it("should return 0 if views have not increased", () => {
    const result = calculateEarningForDelta({
      cpmMinorUnits: 15000n, // 15,000 IQD per 1000 views (15 IQD per view)
      maximumReward: 1000000n, // 1,000,000 IQD cap
      remainingBudget: 5000000n, // 5,000,000 IQD campaign budget
      currentQualifiedViews: 5000n,
      lastQualifiedViews: 5000n,
      alreadyAccruedEarning: 0n,
    });

    expect(result).toBe(0n);
  });

  it("should calculate correct earnings for views delta", () => {
    const result = calculateEarningForDelta({
      cpmMinorUnits: 15000n, // 15,000 minor units
      maximumReward: 1000000n,
      remainingBudget: 5000000n,
      currentQualifiedViews: 12000n, // delta = 7000 views
      lastQualifiedViews: 5000n,
      alreadyAccruedEarning: 75000n, // 5000 views * 15 = 75000
    });

    // 7000 views * 15 = 105,000
    expect(result).toBe(105000n);
  });

  it("should cap earnings if reward exceeds maximum reward cap per video", () => {
    const result = calculateEarningForDelta({
      cpmMinorUnits: 20000n, // 20 IQD per view
      maximumReward: 100000n, // cap is 100,000 IQD
      remainingBudget: 5000000n,
      currentQualifiedViews: 6000n, // delta = 6000 views. Gross = 120,000 IQD
      lastQualifiedViews: 0n,
      alreadyAccruedEarning: 0n,
    });

    // Gross is 120,000 but cap is 100,000, so should return 100,000
    expect(result).toBe(100000n);
  });

  it("should cap earnings if remaining video cap is less than calculated delta", () => {
    const result = calculateEarningForDelta({
      cpmMinorUnits: 10000n, // 10 IQD per view
      maximumReward: 100000n, // cap is 100,000 IQD
      remainingBudget: 5000000n,
      currentQualifiedViews: 12000n, // delta = 4000 views. Gross = 40,000 IQD
      lastQualifiedViews: 8000n,
      alreadyAccruedEarning: 80000n, // 80,000 already earned, remaining cap is 20,000
    });

    // Gross is 40,000 but remaining cap is 20,000, so should return 20,000
    expect(result).toBe(20000n);
  });

  it("should cap earnings if remaining campaign budget is lower than calculated earnings", () => {
    const result = calculateEarningForDelta({
      cpmMinorUnits: 10000n, // 10 IQD per view
      maximumReward: 500000n,
      remainingBudget: 15000n, // Only 15,000 IQD left in campaign budget
      currentQualifiedViews: 5000n, // delta = 5000 views. Gross = 50,000 IQD
      lastQualifiedViews: 0n,
      alreadyAccruedEarning: 0n,
    });

    // Gross is 50,000 but remaining campaign budget is 15,000, so should return 15,000
    expect(result).toBe(15000n);
  });

  it("should handle division remainder truncation correctly", () => {
    const result = calculateEarningForDelta({
      cpmMinorUnits: 1500n, // 1.5 IQD per view
      maximumReward: 100000n,
      remainingBudget: 500000n,
      currentQualifiedViews: 1n, // delta = 1 view. Gross = 1.5 IQD. BigInt division truncates 1500 / 1000 = 1
      lastQualifiedViews: 0n,
      alreadyAccruedEarning: 0n,
    });

    expect(result).toBe(1n);
  });
});
