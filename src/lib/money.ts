export type RewardInput = {
  qualifiedViews: bigint;
  previousPaidQualifiedViews: bigint;
  cpmMinorUnits: bigint;
  remainingSubmissionCap: bigint;
  remainingCampaignBudget: bigint;
};

export function calculatePayableReward(input: RewardInput): bigint {
  const newQualifiedViews = input.qualifiedViews - input.previousPaidQualifiedViews;

  if (newQualifiedViews <= 0n) {
    return 0n;
  }

  const grossReward = (newQualifiedViews * input.cpmMinorUnits) / 1000n;

  return minBigInt(
    grossReward,
    input.remainingSubmissionCap,
    input.remainingCampaignBudget,
  );
}

function minBigInt(first: bigint, ...rest: bigint[]) {
  return rest.reduce((current, value) => (value < current ? value : current), first);
}
