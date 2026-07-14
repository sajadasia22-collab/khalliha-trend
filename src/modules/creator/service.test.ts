import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../lib/prisma", () => ({
  prisma: {
    creatorProfile: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
    },
  },
}));

import { prisma } from "../../lib/prisma";
import { CreatorProfileService } from "./service";

function mock<T>(value: T): any {
  return value;
}

describe("CreatorProfileService", () => {
  beforeEach(() => vi.clearAllMocks());

  it("maps the database unique constraint to a stable username error", async () => {
    vi.mocked(prisma.creatorProfile.update).mockRejectedValue(
      Object.assign(new Error("Unique constraint"), { code: "P2002" }),
    );

    await expect(
      CreatorProfileService.updateByUserId("user-1", { username: "sajad" }),
    ).rejects.toThrow("USERNAME_TAKEN");
  });

  it("only loads active public profiles by normalized username", async () => {
    vi.mocked(prisma.creatorProfile.findFirst).mockResolvedValue(mock(null));

    await CreatorProfileService.getPublicByUsername("SAJAD");

    expect(prisma.creatorProfile.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          username: "sajad",
          isProfilePublic: true,
          user: { status: "ACTIVE" },
        }),
      }),
    );
  });
});
