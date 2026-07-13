import { describe, expect, it } from "vitest";
import { LedgerDirection } from "../../generated/prisma/enums";
import { calculateGrowth, calculateLedgerBalance } from "./service";

describe("admin analytics calculations", () => {
  it("calculates period-over-period growth without dividing by zero", () => {
    expect(calculateGrowth(15, 10)).toBe(50);
    expect(calculateGrowth(5, 10)).toBe(-50);
    expect(calculateGrowth(3, 0)).toBe(100);
    expect(calculateGrowth(0, 0)).toBe(0);
  });

  it("calculates actual platform revenue as credits minus reversals", () => {
    expect(
      calculateLedgerBalance([
        { direction: LedgerDirection.CREDIT, amount: 25_000n },
        { direction: LedgerDirection.CREDIT, amount: 10_000n },
        { direction: LedgerDirection.DEBIT, amount: 5_000n },
      ]),
    ).toBe(30_000n);
  });
});
