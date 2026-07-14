import { prisma } from "../../lib/prisma";
import { CampaignStatus, UserStatus } from "../../generated/prisma/enums";
import type { UpdateCreatorProfileInput } from "./schemas";

export class CreatorProfileService {
  static async getByUserId(userId: string) {
    return prisma.creatorProfile.findUnique({
      where: { userId },
      include: {
        socialAccounts: { orderBy: { createdAt: "desc" } },
        portfolioItems: {
          orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
        },
      },
    });
  }

  static async updateByUserId(userId: string, input: UpdateCreatorProfileInput) {
    try {
      return await prisma.creatorProfile.update({
        where: { userId },
        data: input,
        include: { socialAccounts: { orderBy: { createdAt: "desc" } } },
      });
    } catch (error) {
      if (
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        error.code === "P2002"
      ) {
        throw new Error("USERNAME_TAKEN");
      }
      throw error;
    }
  }

  static async updateImageByUserId(
    userId: string,
    kind: "avatar" | "cover",
    imageUrl: string,
  ) {
    return prisma.creatorProfile.update({
      where: { userId },
      data: kind === "avatar" ? { avatarUrl: imageUrl } : { coverUrl: imageUrl },
    });
  }

  static async getPublicByUsername(username: string) {
    return prisma.creatorProfile.findFirst({
      where: {
        username: username.toLocaleLowerCase("ar-IQ"),
        isProfilePublic: true,
        user: { status: UserStatus.ACTIVE },
      },
      include: {
        user: { select: { id: true, fullName: true, createdAt: true } },
        socialAccounts: {
          where: { status: "VERIFIED" },
          orderBy: { createdAt: "desc" },
        },
        portfolioItems: {
          orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
          take: 12,
        },
        memberships: {
          where: {
            campaign: {
              status: { in: [CampaignStatus.ACTIVE, CampaignStatus.COMPLETED] },
            },
          },
          select: {
            campaign: {
              select: { id: true, title: true, status: true, category: true },
            },
          },
          orderBy: { createdAt: "desc" },
          take: 6,
        },
      },
    });
  }
}
