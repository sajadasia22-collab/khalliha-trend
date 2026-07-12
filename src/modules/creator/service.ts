import { prisma } from "../../lib/prisma";
import type { UpdateCreatorProfileInput } from "./schemas";

export class CreatorProfileService {
  static async getByUserId(userId: string) {
    return prisma.creatorProfile.findUnique({
      where: { userId },
      include: { socialAccounts: { orderBy: { createdAt: "desc" } } },
    });
  }

  static async updateByUserId(userId: string, input: UpdateCreatorProfileInput) {
    return prisma.creatorProfile.update({
      where: { userId },
      data: input,
      include: { socialAccounts: { orderBy: { createdAt: "desc" } } },
    });
  }
}
