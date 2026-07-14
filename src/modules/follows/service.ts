import { NotificationType, UserStatus } from "../../generated/prisma/enums";
import { prisma } from "../../lib/prisma";
import { NotificationService } from "../notifications/service";

function normalizeUsername(username: string) {
  return username.trim().toLocaleLowerCase("ar-IQ");
}

export class FollowService {
  private static async findPublicCreator(username: string) {
    return prisma.creatorProfile.findFirst({
      where: {
        username: normalizeUsername(username),
        isProfilePublic: true,
        user: { status: UserStatus.ACTIVE },
      },
      select: { userId: true, username: true },
    });
  }

  static async getState(viewerUserId: string | null, targetUserId: string) {
    const [followersCount, followingCount, existingFollow] = await Promise.all([
      prisma.userFollow.count({ where: { followedUserId: targetUserId } }),
      prisma.userFollow.count({ where: { followerUserId: targetUserId } }),
      viewerUserId && viewerUserId !== targetUserId
        ? prisma.userFollow.findUnique({
            where: {
              followerUserId_followedUserId: {
                followerUserId: viewerUserId,
                followedUserId: targetUserId,
              },
            },
            select: { id: true },
          })
        : Promise.resolve(null),
    ]);

    return {
      followersCount,
      followingCount,
      isFollowing: Boolean(existingFollow),
      isOwnProfile: viewerUserId === targetUserId,
    };
  }

  static async followByUsername(followerUserId: string, username: string) {
    const target = await this.findPublicCreator(username);
    if (!target) throw new Error("FOLLOW_TARGET_NOT_FOUND");
    if (target.userId === followerUserId) throw new Error("CANNOT_FOLLOW_SELF");

    const blocked = await prisma.userBlock.findFirst({
      where: {
        OR: [
          { blockerUserId: followerUserId, blockedUserId: target.userId },
          { blockerUserId: target.userId, blockedUserId: followerUserId },
        ],
      },
      select: { id: true },
    });
    if (blocked) throw new Error("FOLLOW_TARGET_NOT_FOUND");

    const existing = await prisma.userFollow.findUnique({
      where: {
        followerUserId_followedUserId: {
          followerUserId,
          followedUserId: target.userId,
        },
      },
      select: { id: true },
    });
    if (!existing) {
      let created = false;
      try {
        await prisma.userFollow.create({
          data: { followerUserId, followedUserId: target.userId },
        });
        created = true;
      } catch (error) {
        if (!(
          typeof error === "object" &&
          error !== null &&
          "code" in error &&
          error.code === "P2002"
        )) {
          throw error;
        }
      }
      if (created) {
        const follower = await prisma.user.findUnique({
          where: { id: followerUserId },
          select: { fullName: true },
        });
        await NotificationService.notify(
          target.userId,
          NotificationType.FOLLOW_RECEIVED,
          "متابع جديد",
          `${follower?.fullName ?? "مستخدم"} بدأ بمتابعتك.`,
          target.username ? `/creators/${target.username}` : "/creators",
        ).catch(() => null);
      }
    }

    return this.getState(followerUserId, target.userId);
  }

  static async unfollowByUsername(followerUserId: string, username: string) {
    const target = await this.findPublicCreator(username);
    if (!target) throw new Error("FOLLOW_TARGET_NOT_FOUND");
    if (target.userId === followerUserId) throw new Error("CANNOT_FOLLOW_SELF");

    await prisma.userFollow.deleteMany({
      where: { followerUserId, followedUserId: target.userId },
    });

    return this.getState(followerUserId, target.userId);
  }

  static async listFollowing(userId: string) {
    const follows = await prisma.userFollow.findMany({
      where: {
        followerUserId: userId,
        followed: {
          status: UserStatus.ACTIVE,
          creatorProfile: {
            is: { isProfilePublic: true, username: { not: null } },
          },
        },
      },
      select: {
        id: true,
        createdAt: true,
        followed: {
          select: {
            fullName: true,
            creatorProfile: {
              select: {
                username: true,
                avatarUrl: true,
                bio: true,
                contentCategories: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return follows.flatMap((follow) => {
      const profile = follow.followed.creatorProfile;
      if (!profile?.username) return [];
      return [
        {
          followId: follow.id,
          followedAt: follow.createdAt,
          fullName: follow.followed.fullName,
          username: profile.username,
          avatarUrl: profile.avatarUrl,
          bio: profile.bio,
          contentCategories: profile.contentCategories,
        },
      ];
    });
  }
}
