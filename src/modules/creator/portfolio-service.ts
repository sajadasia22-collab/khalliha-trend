import { prisma } from "../../lib/prisma";
import { normalizePostUrl } from "../../lib/post-url";
import type {
  CreatePortfolioItemInput,
  UpdatePortfolioItemInput,
} from "./portfolio-schemas";

export const MAX_PORTFOLIO_ITEMS = 12;

export class CreatorPortfolioService {
  static async getProfileForUser(userId: string) {
    return prisma.creatorProfile.findUnique({ where: { userId } });
  }

  static async listForUser(userId: string) {
    const profile = await this.getProfileForUser(userId);
    if (!profile) return [];
    return prisma.creatorPortfolioItem.findMany({
      where: { creatorProfileId: profile.id },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    });
  }

  static async createForUser(userId: string, input: CreatePortfolioItemInput) {
    const profile = await this.getProfileForUser(userId);
    if (!profile) throw new Error("CREATOR_PROFILE_NOT_FOUND");

    const itemCount = await prisma.creatorPortfolioItem.count({
      where: { creatorProfileId: profile.id },
    });
    if (itemCount >= MAX_PORTFOLIO_ITEMS) throw new Error("PORTFOLIO_LIMIT_REACHED");

    const normalized = normalizePostUrl(input.projectUrl);
    if (!normalized || normalized.platform !== input.platform) {
      throw new Error("INVALID_PORTFOLIO_URL");
    }

    try {
      return await prisma.creatorPortfolioItem.create({
        data: {
          creatorProfileId: profile.id,
          title: input.title,
          description: input.description,
          platform: input.platform,
          projectUrl: normalized.normalizedUrl,
          sortOrder: itemCount,
        },
      });
    } catch (error) {
      if (
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        error.code === "P2002"
      ) {
        throw new Error("PORTFOLIO_URL_EXISTS");
      }
      throw error;
    }
  }

  static async findOwnedItem(userId: string, itemId: string) {
    return prisma.creatorPortfolioItem.findFirst({
      where: { id: itemId, creatorProfile: { userId } },
    });
  }

  static async updateForUser(
    userId: string,
    itemId: string,
    input: UpdatePortfolioItemInput,
  ) {
    const item = await this.findOwnedItem(userId, itemId);
    if (!item) throw new Error("PORTFOLIO_ITEM_NOT_FOUND");
    return prisma.creatorPortfolioItem.update({ where: { id: item.id }, data: input });
  }

  static async updateThumbnailForUser(
    userId: string,
    itemId: string,
    thumbnailUrl: string,
  ) {
    const item = await this.findOwnedItem(userId, itemId);
    if (!item) throw new Error("PORTFOLIO_ITEM_NOT_FOUND");
    return prisma.creatorPortfolioItem.update({
      where: { id: item.id },
      data: { thumbnailUrl },
    });
  }

  static async reorderForUser(userId: string, itemIds: string[]) {
    const profile = await this.getProfileForUser(userId);
    if (!profile) throw new Error("CREATOR_PROFILE_NOT_FOUND");

    const ownedItems = await prisma.creatorPortfolioItem.findMany({
      where: { creatorProfileId: profile.id },
      select: { id: true },
    });
    const ownedIds = new Set(ownedItems.map((item) => item.id));
    if (
      ownedItems.length !== itemIds.length ||
      itemIds.some((itemId) => !ownedIds.has(itemId))
    ) {
      throw new Error("PORTFOLIO_ITEM_NOT_FOUND");
    }

    await prisma.$transaction(
      itemIds.map((id, sortOrder) =>
        prisma.creatorPortfolioItem.update({ where: { id }, data: { sortOrder } }),
      ),
    );
  }

  static async deleteForUser(userId: string, itemId: string) {
    const item = await this.findOwnedItem(userId, itemId);
    if (!item) throw new Error("PORTFOLIO_ITEM_NOT_FOUND");
    await prisma.creatorPortfolioItem.delete({ where: { id: item.id } });
    return item;
  }
}
