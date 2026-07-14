import type { Prisma } from "../../generated/prisma/client";
import { SocialAccountStatus, UserStatus } from "../../generated/prisma/enums";
import { prisma } from "../../lib/prisma";
import type { CreatorDirectoryQuery } from "./directory-schemas";

export class CreatorDirectoryService {
  static async list(input: CreatorDirectoryQuery) {
    const where: Prisma.CreatorProfileWhereInput = {
      isProfilePublic: true,
      username: { not: null },
      user: { status: UserStatus.ACTIVE },
      ...(input.category ? { contentCategories: { has: input.category } } : {}),
      ...(input.language ? { languages: { has: input.language } } : {}),
      ...(input.governorate
        ? { governorate: { contains: input.governorate, mode: "insensitive" } }
        : {}),
      ...(input.platform
        ? {
            socialAccounts: {
              some: {
                platform: input.platform,
                status: SocialAccountStatus.VERIFIED,
              },
            },
          }
        : {}),
      ...(input.search
        ? {
            OR: [
              { username: { contains: input.search, mode: "insensitive" } },
              { user: { fullName: { contains: input.search, mode: "insensitive" } } },
            ],
          }
        : {}),
    };

    // These are independent read queries. Running the relation-heavy lookup
    // inside one interactive pg transaction makes Prisma execute nested reads
    // concurrently on a single client (deprecated in pg 8, removed in pg 9).
    const [items, total] = await Promise.all([
      prisma.creatorProfile.findMany({
        where,
        select: {
          id: true,
          username: true,
          bio: true,
          avatarUrl: true,
          coverUrl: true,
          governorate: true,
          country: true,
          contentCategories: true,
          languages: true,
          trustScore: true,
          user: { select: { fullName: true } },
          socialAccounts: {
            where: { status: SocialAccountStatus.VERIFIED },
            select: { id: true, platform: true, handle: true, profileUrl: true },
            orderBy: { createdAt: "desc" },
          },
          portfolioItems: {
            select: { id: true, thumbnailUrl: true, title: true },
            orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
            take: 3,
          },
        },
        orderBy: [{ trustScore: "desc" }, { updatedAt: "desc" }],
        skip: (input.page - 1) * input.pageSize,
        take: input.pageSize,
      }),
      prisma.creatorProfile.count({ where }),
    ]);

    return {
      items,
      pagination: {
        page: input.page,
        pageSize: input.pageSize,
        total,
        pageCount: Math.ceil(total / input.pageSize),
      },
    };
  }
}
