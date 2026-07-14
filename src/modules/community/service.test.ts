import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../lib/prisma", () => ({
  prisma: {
    creatorProfile: { findFirst: vi.fn() },
    communityPost: {
      create: vi.fn(),
      findFirst: vi.fn(),
      updateMany: vi.fn(),
    },
    communityLike: {
      findUnique: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
  },
}));

vi.mock("../notifications/service", () => ({
  NotificationService: { notify: vi.fn().mockResolvedValue(null) },
}));

import { prisma } from "../../lib/prisma";
import { CommunityService } from "./service";

function mock<T>(value: T): any {
  return value;
}

describe("CommunityService", () => {
  beforeEach(() => vi.clearAllMocks());

  it("allows only creators to publish", async () => {
    await expect(
      CommunityService.createPost("brand-1", mock("BRAND"), { body: "إعلان" }),
    ).rejects.toThrow("COMMUNITY_CREATOR_ONLY");
    expect(prisma.communityPost.create).not.toHaveBeenCalled();
  });

  it("requires a public creator profile before publishing", async () => {
    vi.mocked(prisma.creatorProfile.findFirst).mockResolvedValue(null);
    await expect(
      CommunityService.createPost("creator-1", mock("CREATOR"), { body: "فكرة" }),
    ).rejects.toThrow("PUBLIC_CREATOR_PROFILE_REQUIRED");
  });

  it("does not delete a post owned by another user", async () => {
    vi.mocked(prisma.communityPost.findFirst).mockResolvedValue(null);
    await expect(CommunityService.deletePost("user-1", "post-1")).rejects.toThrow(
      "COMMUNITY_POST_NOT_FOUND",
    );
    expect(prisma.communityPost.updateMany).not.toHaveBeenCalled();
  });

  it("creates one like using the authenticated user and returns the database count", async () => {
    vi.mocked(prisma.communityPost.findFirst).mockResolvedValue(
      mock({ id: "post-1", authorId: "author-1" }),
    );
    vi.mocked(prisma.communityLike.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.communityLike.create).mockResolvedValue(mock({ id: "like-1" }));
    vi.mocked(prisma.communityLike.count).mockResolvedValue(3);

    await expect(CommunityService.toggleLike("user-1", "post-1")).resolves.toEqual({
      active: true,
      count: 3,
    });
    expect(prisma.communityLike.create).toHaveBeenCalledWith({
      data: { postId: "post-1", userId: "user-1" },
    });
  });
});
