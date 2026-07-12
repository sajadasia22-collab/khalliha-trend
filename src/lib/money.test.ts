import { describe, expect, it } from "vitest";
import { calculatePayableReward } from "./money";

describe("calculatePayableReward", () => {
  it("calculates rewards from the new qualified-view delta only", () => {
    expect(
      calculatePayableReward({
        qualifiedViews: 2500n,
        previousPaidQualifiedViews: 1000n,
        cpmMinorUnits: 4000n,
        remainingSubmissionCap: 100_000n,
        remainingCampaignBudget: 100_000n,
      }),
    ).toBe(6000n);
  });

  it("caps rewards by submission cap", () => {
    expect(
      calculatePayableReward({
        qualifiedViews: 10_000n,
        previousPaidQualifiedViews: 0n,
        cpmMinorUnits: 5000n,
        remainingSubmissionCap: 20_000n,
        remainingCampaignBudget: 100_000n,
      }),
    ).toBe(20_000n);
  });

  it("caps rewards by remaining campaign budget", () => {
    expect(
      calculatePayableReward({
        qualifiedViews: 10_000n,
        previousPaidQualifiedViews: 0n,
        cpmMinorUnits: 5000n,
        remainingSubmissionCap: 100_000n,
        remainingCampaignBudget: 12_000n,
      }),
    ).toBe(12_000n);
  });
});
