import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../lib/prisma", () => ({
  prisma: {
    creatorProfile: { findUnique: vi.fn() },
    creatorPortfolioItem: {
      count: vi.fn(),
      create: vi.fn(),
      findMany: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

import { prisma } from "../../lib/prisma";
import { CreatorPortfolioService, MAX_PORTFOLIO_ITEMS } from "./portfolio-service";

function mock<T>(value: T): any {
  return value;
}

describe("CreatorPortfolioService", () => {
  beforeEach(() => vi.clearAllMocks());

  it("normalizes the post URL before creating an owned item", async () => {
    vi.mocked(prisma.creatorProfile.findUnique).mockResolvedValue(
      mock({ id: "profile-1" }),
    );
    vi.mocked(prisma.creatorPortfolioItem.count).mockResolvedValue(2);
    vi.mocked(prisma.creatorPortfolioItem.create).mockResolvedValue(
      mock({ id: "item-1" }),
    );

    await CreatorPortfolioService.createForUser("user-1", {
      title: "فيديو تقني",
      platform: "YOUTUBE",
      projectUrl: "https://youtu.be/video123?feature=share",
    });

    expect(prisma.creatorPortfolioItem.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        creatorProfileId: "profile-1",
        projectUrl: "https://www.youtube.com/watch?v=video123",
        sortOrder: 2,
      }),
    });
  });

  it("enforces the portfolio size limit", async () => {
    vi.mocked(prisma.creatorProfile.findUnique).mockResolvedValue(
      mock({ id: "profile-1" }),
    );
    vi.mocked(prisma.creatorPortfolioItem.count).mockResolvedValue(MAX_PORTFOLIO_ITEMS);

    await expect(
      CreatorPortfolioService.createForUser("user-1", {
        title: "فيديو تقني",
        platform: "YOUTUBE",
        projectUrl: "https://youtu.be/video123",
      }),
    ).rejects.toThrow("PORTFOLIO_LIMIT_REACHED");
    expect(prisma.creatorPortfolioItem.create).not.toHaveBeenCalled();
  });

  it("does not update another creator's item", async () => {
    vi.mocked(prisma.creatorPortfolioItem.findFirst).mockResolvedValue(null);

    await expect(
      CreatorPortfolioService.updateForUser("user-1", "foreign-item", {
        title: "عنوان جديد",
      }),
    ).rejects.toThrow("PORTFOLIO_ITEM_NOT_FOUND");
    expect(prisma.creatorPortfolioItem.update).not.toHaveBeenCalled();
  });

  it("rejects a reorder list containing a foreign item", async () => {
    vi.mocked(prisma.creatorProfile.findUnique).mockResolvedValue(
      mock({ id: "profile-1" }),
    );
    vi.mocked(prisma.creatorPortfolioItem.findMany).mockResolvedValue(
      mock([{ id: "one" }]),
    );

    await expect(
      CreatorPortfolioService.reorderForUser("user-1", ["one", "foreign"]),
    ).rejects.toThrow("PORTFOLIO_ITEM_NOT_FOUND");
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });
});
