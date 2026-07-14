import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../lib/prisma", () => ({
  prisma: {
    creatorProfile: { findFirst: vi.fn() },
    userBlock: { findFirst: vi.fn() },
    user: { findUnique: vi.fn() },
    userFollow: {
      count: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      deleteMany: vi.fn(),
      findMany: vi.fn(),
    },
  },
}));

vi.mock("../notifications/service", () => ({
  NotificationService: { notify: vi.fn().mockResolvedValue(null) },
}));

import { prisma } from "../../lib/prisma";
import { FollowService } from "./service";

function mock<T>(value: T): any {
  return value;
}

describe("FollowService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(prisma.userFollow.count).mockResolvedValue(0);
    vi.mocked(prisma.userFollow.findUnique).mockResolvedValue(null);
  });

  it("rejects following a missing or private creator", async () => {
    vi.mocked(prisma.creatorProfile.findFirst).mockResolvedValue(null);

    await expect(FollowService.followByUsername("viewer-1", "hidden")).rejects.toThrow(
      "FOLLOW_TARGET_NOT_FOUND",
    );
    expect(prisma.userFollow.create).not.toHaveBeenCalled();
  });

  it("rejects following your own profile", async () => {
    vi.mocked(prisma.creatorProfile.findFirst).mockResolvedValue(
      mock({ userId: "viewer-1", username: "sajad" }),
    );

    await expect(FollowService.followByUsername("viewer-1", "sajad")).rejects.toThrow(
      "CANNOT_FOLLOW_SELF",
    );
    expect(prisma.userFollow.create).not.toHaveBeenCalled();
  });

  it("creates an idempotent follow using the authenticated user as owner", async () => {
    vi.mocked(prisma.creatorProfile.findFirst).mockResolvedValue(
      mock({ userId: "creator-1", username: "creator" }),
    );
    vi.mocked(prisma.userFollow.create).mockResolvedValue(mock({ id: "follow-1" }));
    vi.mocked(prisma.userFollow.findUnique)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(mock({ id: "follow-1" }));
    vi.mocked(prisma.user.findUnique).mockResolvedValue(mock({ fullName: "متابع" }));
    vi.mocked(prisma.userFollow.count).mockResolvedValueOnce(4).mockResolvedValueOnce(2);

    const result = await FollowService.followByUsername("viewer-1", "Creator");

    expect(prisma.creatorProfile.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ username: "creator" }),
      }),
    );
    expect(prisma.userFollow.create).toHaveBeenCalledWith({
      data: { followerUserId: "viewer-1", followedUserId: "creator-1" },
    });
    expect(result).toEqual({
      followersCount: 4,
      followingCount: 2,
      isFollowing: true,
      isOwnProfile: false,
    });
  });

  it("only removes the authenticated user's follow relation", async () => {
    vi.mocked(prisma.creatorProfile.findFirst).mockResolvedValue(
      mock({ userId: "creator-1", username: "creator" }),
    );
    vi.mocked(prisma.userFollow.deleteMany).mockResolvedValue(mock({ count: 1 }));

    await FollowService.unfollowByUsername("viewer-1", "creator");

    expect(prisma.userFollow.deleteMany).toHaveBeenCalledWith({
      where: { followerUserId: "viewer-1", followedUserId: "creator-1" },
    });
  });
});
