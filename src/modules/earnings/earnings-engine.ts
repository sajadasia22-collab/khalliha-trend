export type EarningsCalculationInput = {
  cpmMinorUnits: bigint;
  maximumReward: bigint;
  remainingBudget: bigint;
  currentQualifiedViews: bigint;
  lastQualifiedViews: bigint;
  alreadyAccruedEarning: bigint;
};

/**
 * Calculates the payable earning increment for a new views snapshot delta,
 * enforcing the post reward cap and the campaign's remaining budget.
 */
export function calculateEarningForDelta({
  cpmMinorUnits,
  maximumReward,
  remainingBudget,
  currentQualifiedViews,
  lastQualifiedViews,
  alreadyAccruedEarning,
}: EarningsCalculationInput): bigint {
  if (currentQualifiedViews <= lastQualifiedViews) {
    return 0n;
  }

  const viewsDelta = currentQualifiedViews - lastQualifiedViews;

  // Gross reward for this delta: (views * CPM) / 1000
  const grossDeltaReward = (viewsDelta * cpmMinorUnits) / 1000n;

  // Enforce submission reward cap
  const remainingSubmissionCap = maximumReward - alreadyAccruedEarning;
  const newEarningAllowedByCap =
    remainingSubmissionCap > 0n ? remainingSubmissionCap : 0n;
  const cappedReward =
    grossDeltaReward < newEarningAllowedByCap ? grossDeltaReward : newEarningAllowedByCap;

  // Enforce campaign remaining budget
  const payableReward = cappedReward < remainingBudget ? cappedReward : remainingBudget;

  return payableReward;
}
