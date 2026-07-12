import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  FraudReviewStatus,
  FraudRiskLevel,
  FraudSignalKind,
  TrustScoreEventReason,
} from "../../generated/prisma/enums";

vi.mock("../../lib/prisma", () => {
  const mockPrisma = {
    submission: {
      findUnique: vi.fn(),
    },
    fraudSignal: {
      create: vi.fn(),
      findMany: vi.fn(),
      findFirst: vi.fn(),
    },
    fraudAssessment: {
      upsert: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    creatorProfile: {
      update: vi.fn(),
    },
    trustScoreEvent: {
      create: vi.fn(),
    },
    $transaction: vi.fn((cb) => cb(mockPrisma)),
  };
  return { prisma: mockPrisma };
});

import { prisma } from "../../lib/prisma";
import { FraudService } from "./service";

describe("FraudService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates manual signal and recalculates assessment", async () => {
    vi.mocked(prisma.submission.findUnique).mockResolvedValue({ id: "sub-1" } as any);
    vi.mocked(prisma.fraudSignal.findMany).mockResolvedValue([
      { scoreImpact: 40 },
      { scoreImpact: 35 },
    ] as any);
    vi.mocked(prisma.fraudAssessment.upsert).mockResolvedValue({
      id: "assessment-1",
      fraudScore: 75,
      riskLevel: FraudRiskLevel.HIGH,
    } as any);

    const result = await FraudService.addManualSignal(
      "admin-1",
      "sub-1",
      FraudSignalKind.MANUAL_ADMIN_FLAG,
      40,
      "نشاط غير طبيعي",
    );

    expect(result.fraudScore).toBe(75);
    expect(prisma.fraudSignal.create).toHaveBeenCalledWith({
      data: {
        submissionId: "sub-1",
        kind: FraudSignalKind.MANUAL_ADMIN_FLAG,
        scoreImpact: 40,
        note: "نشاط غير طبيعي",
        createdByUserId: "admin-1",
      },
    });
  });

  it("confirms assessment and lowers creator trust score", async () => {
    vi.mocked(prisma.fraudAssessment.findUnique).mockResolvedValue({
      id: "assessment-1",
      submission: {
        socialAccount: {
          creatorProfile: {
            id: "creator-profile-1",
            userId: "creator-user",
            trustScore: 50,
          },
        },
      },
    } as any);
    vi.mocked(prisma.fraudAssessment.update).mockResolvedValue({
      id: "assessment-1",
      status: FraudReviewStatus.CONFIRMED,
    } as any);

    await FraudService.resolveAssessment("admin-1", "assessment-1", "CONFIRM", "تأكيد");

    expect(prisma.creatorProfile.update).toHaveBeenCalledWith({
      where: { id: "creator-profile-1" },
      data: { trustScore: 40 },
    });
    expect(prisma.trustScoreEvent.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        delta: -10,
        reason: TrustScoreEventReason.FRAUD_CONFIRMED,
      }),
    });
  });
});
