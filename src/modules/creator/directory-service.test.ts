import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../lib/prisma", () => {
  const creatorProfile = { findMany: vi.fn(), count: vi.fn() };
  const mockPrisma = {
    creatorProfile,
    $transaction: vi.fn(
      async (
        callback: (transaction: {
          creatorProfile: typeof creatorProfile;
        }) => Promise<unknown>,
      ) => callback({ creatorProfile }),
    ),
  };
  return { prisma: mockPrisma };
});

import { prisma } from "../../lib/prisma";
import { CreatorDirectoryService } from "./directory-service";

describe("CreatorDirectoryService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(prisma.creatorProfile.findMany).mockResolvedValue([]);
    vi.mocked(prisma.creatorProfile.count).mockResolvedValue(0);
  });

  it("always limits results to active public profiles with usernames", async () => {
    await CreatorDirectoryService.list({ page: 1, pageSize: 12 });

    expect(prisma.creatorProfile.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          isProfilePublic: true,
          username: { not: null },
          user: { status: "ACTIVE" },
        }),
      }),
    );
  });

  it("applies category, verified platform and pagination filters", async () => {
    await CreatorDirectoryService.list({
      category: "TECH",
      platform: "YOUTUBE",
      page: 2,
      pageSize: 12,
    });

    expect(prisma.creatorProfile.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          contentCategories: { has: "TECH" },
          socialAccounts: {
            some: { platform: "YOUTUBE", status: "VERIFIED" },
          },
        }),
        skip: 12,
        take: 12,
      }),
    );
  });
});
