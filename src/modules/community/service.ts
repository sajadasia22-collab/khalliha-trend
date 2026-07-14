import type { Prisma } from "../../generated/prisma/client";
import {
  CommunityCommentStatus,
  CommunityPostStatus,
  CommunityReportStatus,
  NotificationType,
  UserRole,
  UserStatus,
} from "../../generated/prisma/enums";
import { deleteProfileImage, getProfileImagePath } from "../../lib/profile-image-storage";
import { prisma } from "../../lib/prisma";
import { NotificationService } from "../notifications/service";
import type {
  communityCommentSchema,
  communityFeedQuerySchema,
  communityPostSchema,
  communityReportReviewSchema,
  communityReportSchema,
  privacySettingsSchema,
} from "./schemas";
import type { z } from "zod";
import { getLinkPreview } from "./link-preview";

type FeedQuery = z.infer<typeof communityFeedQuerySchema>;
type PostInput = z.infer<typeof communityPostSchema>;
type CommentInput = z.infer<typeof communityCommentSchema>;
type ReportInput = z.infer<typeof communityReportSchema>;
type ReportReviewInput = z.infer<typeof communityReportReviewSchema>;
type PrivacyInput = z.infer<typeof privacySettingsSchema>;

function publicCreatorWhere(username: string): Prisma.CreatorProfileWhereInput {
  return {
    username: username.trim().toLocaleLowerCase("ar-IQ"),
    isProfilePublic: true,
    user: { status: UserStatus.ACTIVE },
  };
}

function validateOwnedCommunityImage(userId: string, imageUrl?: string | null) {
  if (!imageUrl) return;
  const path = getProfileImagePath(imageUrl);
  if (!path?.startsWith(`${userId}/community-`)) {
    throw new Error("COMMUNITY_IMAGE_NOT_OWNED");
  }
}

function postImageUrls(input: PostInput) {
  const values = input.imageUrls ?? (input.imageUrl ? [input.imageUrl] : []);
  return [...new Set(values)];
}

function postInclude(viewerId: string | null) {
  return {
    author: {
      select: {
        id: true,
        fullName: true,
        creatorProfile: { select: { username: true, avatarUrl: true } },
      },
    },
    images: { orderBy: { sortOrder: "asc" as const } },
    comments: {
      where: {
        status: CommunityCommentStatus.ACTIVE,
        ...(viewerId
          ? {
              author: {
                blocksReceived: { none: { blockerUserId: viewerId } },
                blocksInitiated: { none: { blockedUserId: viewerId } },
                mutesReceived: { none: { muterUserId: viewerId } },
              },
            }
          : {}),
      },
      orderBy: { createdAt: "desc" as const },
      take: 3,
      select: {
        id: true,
        body: true,
        createdAt: true,
        authorId: true,
        parentId: true,
        author: {
          select: {
            fullName: true,
            creatorProfile: { select: { username: true, avatarUrl: true } },
          },
        },
      },
    },
    likes: viewerId
      ? { where: { userId: viewerId }, select: { id: true }, take: 1 }
      : { where: { id: "__none__" }, select: { id: true }, take: 1 },
    saves: viewerId
      ? { where: { userId: viewerId }, select: { id: true }, take: 1 }
      : { where: { id: "__none__" }, select: { id: true }, take: 1 },
    shares: viewerId
      ? { where: { userId: viewerId }, select: { id: true }, take: 1 }
      : { where: { id: "__none__" }, select: { id: true }, take: 1 },
    _count: {
      select: {
        likes: true,
        shares: true,
        comments: { where: { status: CommunityCommentStatus.ACTIVE } },
      },
    },
  } satisfies Prisma.CommunityPostInclude;
}

export class CommunityService {
  static async listPosts(viewerId: string | null, input: FeedQuery) {
    const where: Prisma.CommunityPostWhereInput = {
      status: CommunityPostStatus.ACTIVE,
      author: {
        status: UserStatus.ACTIVE,
        creatorProfile: { is: { isProfilePublic: true, username: { not: null } } },
        ...(viewerId
          ? {
              blocksReceived: { none: { blockerUserId: viewerId } },
              blocksInitiated: { none: { blockedUserId: viewerId } },
              mutesReceived: { none: { muterUserId: viewerId } },
              ...(input.feed === "following"
                ? { followers: { some: { followerUserId: viewerId } } }
                : {}),
            }
          : {}),
      },
      ...(viewerId && input.feed === "saved"
        ? { saves: { some: { userId: viewerId } } }
        : {}),
      ...(input.search
        ? {
            OR: [
              { body: { contains: input.search, mode: "insensitive" } },
              { author: { fullName: { contains: input.search, mode: "insensitive" } } },
              {
                author: {
                  creatorProfile: {
                    is: { username: { contains: input.search, mode: "insensitive" } },
                  },
                },
              },
            ],
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      prisma.communityPost.findMany({
        where,
        include: postInclude(viewerId),
        orderBy: { createdAt: "desc" },
        skip: (input.page - 1) * input.pageSize,
        take: input.pageSize,
      }),
      prisma.communityPost.count({ where }),
    ]);

    return {
      items: items.map((item) => ({
        ...item,
        isLiked: item.likes.length > 0,
        isSaved: item.saves.length > 0,
        isShared: item.shares.length > 0,
        likes: undefined,
        saves: undefined,
        shares: undefined,
      })),
      pagination: {
        page: input.page,
        pageSize: input.pageSize,
        total,
        pageCount: Math.ceil(total / input.pageSize),
      },
    };
  }

  static async getPost(viewerId: string | null, postId: string) {
    await this.requireVisiblePost(postId, viewerId);
    const item = await prisma.communityPost.findFirst({
      where: { id: postId, status: CommunityPostStatus.ACTIVE },
      include: postInclude(viewerId),
    });
    if (!item) throw new Error("COMMUNITY_POST_NOT_FOUND");
    return {
      ...item,
      isLiked: item.likes.length > 0,
      isSaved: item.saves.length > 0,
      isShared: item.shares.length > 0,
      likes: undefined,
      saves: undefined,
      shares: undefined,
    };
  }

  static async createPost(userId: string, role: UserRole, input: PostInput) {
    if (role !== UserRole.CREATOR) throw new Error("COMMUNITY_CREATOR_ONLY");
    const profile = await prisma.creatorProfile.findFirst({
      where: { userId, isProfilePublic: true, username: { not: null } },
      select: { id: true },
    });
    if (!profile) throw new Error("PUBLIC_CREATOR_PROFILE_REQUIRED");
    const imageUrls = postImageUrls(input);
    imageUrls.forEach((url) => validateOwnedCommunityImage(userId, url));
    const preview = input.linkUrl
      ? await getLinkPreview(input.linkUrl)
      : { title: null, description: null, imageUrl: null };

    return prisma.communityPost.create({
      data: {
        authorId: userId,
        body: input.body || null,
        imageUrl: imageUrls[0] || null,
        linkUrl: input.linkUrl || null,
        linkTitle: preview.title,
        linkDescription: preview.description,
        linkImageUrl: preview.imageUrl,
        images: {
          create: imageUrls.map((url, sortOrder) => ({ url, sortOrder })),
        },
      },
      include: postInclude(userId),
    });
  }

  static async updatePost(userId: string, postId: string, input: PostInput) {
    const post = await prisma.communityPost.findFirst({
      where: { id: postId, authorId: userId, status: CommunityPostStatus.ACTIVE },
      select: { id: true, imageUrl: true, images: { select: { url: true } } },
    });
    if (!post) throw new Error("COMMUNITY_POST_NOT_FOUND");
    const imageUrls = postImageUrls(input);
    imageUrls.forEach((url) => validateOwnedCommunityImage(userId, url));
    const preview = input.linkUrl
      ? await getLinkPreview(input.linkUrl)
      : { title: null, description: null, imageUrl: null };
    const updated = await prisma.communityPost.update({
      where: { id: postId },
      data: {
        body: input.body || null,
        imageUrl: imageUrls[0] || null,
        linkUrl: input.linkUrl || null,
        linkTitle: preview.title,
        linkDescription: preview.description,
        linkImageUrl: preview.imageUrl,
        images: {
          deleteMany: {},
          create: imageUrls.map((url, sortOrder) => ({ url, sortOrder })),
        },
      },
      include: postInclude(userId),
    });
    const previousUrls = post.images.length
      ? post.images.map((image) => image.url)
      : post.imageUrl
        ? [post.imageUrl]
        : [];
    for (const previousUrl of previousUrls.filter((url) => !imageUrls.includes(url))) {
      const previousPath = getProfileImagePath(previousUrl);
      if (previousPath) await deleteProfileImage(previousPath).catch(() => null);
    }
    return updated;
  }

  static async deletePost(userId: string, postId: string) {
    const post = await prisma.communityPost.findFirst({
      where: { id: postId, authorId: userId, status: CommunityPostStatus.ACTIVE },
      select: { imageUrl: true, images: { select: { url: true } } },
    });
    if (!post) throw new Error("COMMUNITY_POST_NOT_FOUND");
    const result = await prisma.communityPost.updateMany({
      where: { id: postId, authorId: userId, status: CommunityPostStatus.ACTIVE },
      data: { status: CommunityPostStatus.REMOVED },
    });
    if (!result.count) throw new Error("COMMUNITY_POST_NOT_FOUND");
    const imageUrls = post.images.length
      ? post.images.map((image) => image.url)
      : post.imageUrl
        ? [post.imageUrl]
        : [];
    for (const url of imageUrls) {
      const imagePath = getProfileImagePath(url);
      if (imagePath) await deleteProfileImage(imagePath).catch(() => null);
    }
    return { id: postId };
  }

  private static async requireVisiblePost(
    postId: string,
    viewerId: string | null = null,
  ) {
    const post = await prisma.communityPost.findFirst({
      where: {
        id: postId,
        status: CommunityPostStatus.ACTIVE,
        ...(viewerId
          ? {
              author: {
                blocksReceived: { none: { blockerUserId: viewerId } },
                blocksInitiated: { none: { blockedUserId: viewerId } },
              },
            }
          : {}),
      },
      select: { id: true, authorId: true },
    });
    if (!post) throw new Error("COMMUNITY_POST_NOT_FOUND");
    return post;
  }

  static async toggleLike(userId: string, postId: string) {
    const post = await this.requireVisiblePost(postId, userId);
    const existing = await prisma.communityLike.findUnique({
      where: { postId_userId: { postId, userId } },
    });
    if (existing) await prisma.communityLike.delete({ where: { id: existing.id } });
    else {
      await prisma.communityLike.create({ data: { postId, userId } });
      if (post.authorId !== userId) {
        await NotificationService.notify(
          post.authorId,
          NotificationType.COMMUNITY_ACTIVITY,
          "إعجاب جديد",
          "أعجب مستخدم بمنشورك في المجتمع.",
          `/community/posts/${postId}`,
        ).catch(() => null);
      }
    }
    const count = await prisma.communityLike.count({ where: { postId } });
    return { active: !existing, count };
  }

  static async toggleSave(userId: string, postId: string) {
    await this.requireVisiblePost(postId, userId);
    const existing = await prisma.communitySave.findUnique({
      where: { postId_userId: { postId, userId } },
    });
    if (existing) await prisma.communitySave.delete({ where: { id: existing.id } });
    else await prisma.communitySave.create({ data: { postId, userId } });
    return { active: !existing };
  }

  static async recordShare(userId: string, postId: string) {
    await this.requireVisiblePost(postId, userId);
    await prisma.communityShare.upsert({
      where: { postId_userId: { postId, userId } },
      update: {},
      create: { postId, userId },
    });
    const count = await prisma.communityShare.count({ where: { postId } });
    return { active: true, count };
  }

  static async listComments(postId: string, viewerId: string | null = null) {
    await this.requireVisiblePost(postId, viewerId);
    return prisma.communityComment.findMany({
      where: {
        postId,
        status: CommunityCommentStatus.ACTIVE,
        ...(viewerId
          ? {
              author: {
                blocksReceived: { none: { blockerUserId: viewerId } },
                blocksInitiated: { none: { blockedUserId: viewerId } },
                mutesReceived: { none: { muterUserId: viewerId } },
              },
            }
          : {}),
      },
      select: {
        id: true,
        body: true,
        authorId: true,
        parentId: true,
        createdAt: true,
        author: {
          select: {
            fullName: true,
            creatorProfile: { select: { username: true, avatarUrl: true } },
          },
        },
      },
      orderBy: { createdAt: "asc" },
      take: 100,
    });
  }

  static async createComment(userId: string, postId: string, input: CommentInput) {
    const post = await this.requireVisiblePost(postId, userId);
    if (input.parentId) {
      const parent = await prisma.communityComment.findFirst({
        where: {
          id: input.parentId,
          postId,
          parentId: null,
          status: CommunityCommentStatus.ACTIVE,
        },
        select: { id: true },
      });
      if (!parent) throw new Error("COMMUNITY_COMMENT_PARENT_INVALID");
    }
    const comment = await prisma.communityComment.create({
      data: {
        postId,
        authorId: userId,
        parentId: input.parentId || null,
        body: input.body,
      },
      select: {
        id: true,
        body: true,
        authorId: true,
        parentId: true,
        createdAt: true,
        author: {
          select: {
            fullName: true,
            creatorProfile: { select: { username: true, avatarUrl: true } },
          },
        },
      },
    });
    if (post.authorId !== userId) {
      await NotificationService.notify(
        post.authorId,
        NotificationType.COMMUNITY_ACTIVITY,
        "تعليق جديد",
        "أضاف مستخدم تعليقاً على منشورك.",
        `/community/posts/${postId}`,
      ).catch(() => null);
    }
    return comment;
  }

  static async deleteComment(userId: string, commentId: string, isAdmin = false) {
    const result = await prisma.communityComment.updateMany({
      where: {
        id: commentId,
        status: CommunityCommentStatus.ACTIVE,
        ...(isAdmin ? {} : { authorId: userId }),
      },
      data: { status: CommunityCommentStatus.REMOVED },
    });
    if (!result.count) throw new Error("COMMUNITY_COMMENT_NOT_FOUND");
    return { id: commentId };
  }

  static async createReport(userId: string, input: ReportInput) {
    const target = input.postId
      ? await prisma.communityPost.findFirst({
          where: { id: input.postId, status: CommunityPostStatus.ACTIVE },
          select: { authorId: true },
        })
      : await prisma.communityComment.findFirst({
          where: { id: input.commentId, status: CommunityCommentStatus.ACTIVE },
          select: { authorId: true },
        });
    if (!target) throw new Error("COMMUNITY_REPORT_TARGET_NOT_FOUND");
    if (target.authorId === userId) throw new Error("CANNOT_REPORT_SELF");

    return prisma.communityReport.create({
      data: {
        reporterId: userId,
        postId: input.postId ?? null,
        commentId: input.commentId ?? null,
        reason: input.reason,
        details: input.details || null,
      },
    });
  }

  static async listReports() {
    return prisma.communityReport.findMany({
      include: {
        reporter: { select: { id: true, fullName: true, email: true } },
        post: {
          select: {
            id: true,
            body: true,
            imageUrl: true,
            author: { select: { id: true, fullName: true } },
          },
        },
        comment: {
          select: {
            id: true,
            body: true,
            author: { select: { id: true, fullName: true } },
          },
        },
        reviewer: { select: { id: true, fullName: true } },
      },
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
      take: 200,
    });
  }

  static async reviewReport(
    reviewerId: string,
    reportId: string,
    input: ReportReviewInput,
  ) {
    return prisma.$transaction(async (tx) => {
      const report = await tx.communityReport.findUnique({ where: { id: reportId } });
      if (!report || report.status !== CommunityReportStatus.OPEN) {
        throw new Error("COMMUNITY_REPORT_NOT_OPEN");
      }
      if (input.status === CommunityReportStatus.ACTIONED) {
        if (report.postId) {
          await tx.communityPost.update({
            where: { id: report.postId },
            data: { status: CommunityPostStatus.REMOVED },
          });
        } else if (report.commentId) {
          await tx.communityComment.update({
            where: { id: report.commentId },
            data: { status: CommunityCommentStatus.REMOVED },
          });
        }
      }
      return tx.communityReport.update({
        where: { id: reportId },
        data: {
          status: input.status,
          reviewNote: input.reviewNote,
          reviewedById: reviewerId,
          reviewedAt: new Date(),
        },
      });
    });
  }

  static async setBlock(userId: string, username: string, active: boolean) {
    const target = await prisma.creatorProfile.findFirst({
      where: publicCreatorWhere(username),
      select: { userId: true },
    });
    if (!target) throw new Error("COMMUNITY_USER_NOT_FOUND");
    if (target.userId === userId) throw new Error("CANNOT_BLOCK_SELF");
    if (!active) {
      await prisma.userBlock.deleteMany({
        where: { blockerUserId: userId, blockedUserId: target.userId },
      });
      return { active: false };
    }
    await prisma.$transaction([
      prisma.userBlock.upsert({
        where: {
          blockerUserId_blockedUserId: {
            blockerUserId: userId,
            blockedUserId: target.userId,
          },
        },
        update: {},
        create: { blockerUserId: userId, blockedUserId: target.userId },
      }),
      prisma.userFollow.deleteMany({
        where: {
          OR: [
            { followerUserId: userId, followedUserId: target.userId },
            { followerUserId: target.userId, followedUserId: userId },
          ],
        },
      }),
    ]);
    return { active: true };
  }

  static async setMute(userId: string, username: string, active: boolean) {
    const target = await prisma.creatorProfile.findFirst({
      where: publicCreatorWhere(username),
      select: { userId: true },
    });
    if (!target) throw new Error("COMMUNITY_USER_NOT_FOUND");
    if (target.userId === userId) throw new Error("CANNOT_MUTE_SELF");
    if (!active) {
      await prisma.userMute.deleteMany({
        where: { muterUserId: userId, mutedUserId: target.userId },
      });
      return { active: false };
    }
    await prisma.userMute.upsert({
      where: {
        muterUserId_mutedUserId: { muterUserId: userId, mutedUserId: target.userId },
      },
      update: {},
      create: { muterUserId: userId, mutedUserId: target.userId },
    });
    return { active: true };
  }

  static async suggestions(userId: string, limit = 5) {
    return prisma.creatorProfile.findMany({
      where: {
        isProfilePublic: true,
        username: { not: null },
        userId: { not: userId },
        user: {
          status: UserStatus.ACTIVE,
          followers: { none: { followerUserId: userId } },
          blocksReceived: { none: { blockerUserId: userId } },
          blocksInitiated: { none: { blockedUserId: userId } },
          mutesReceived: { none: { muterUserId: userId } },
        },
      },
      select: {
        username: true,
        avatarUrl: true,
        bio: true,
        trustScore: true,
        user: { select: { fullName: true } },
      },
      orderBy: [{ trustScore: "desc" }, { updatedAt: "desc" }],
      take: limit,
    });
  }

  static async getPrivacy(userId: string) {
    return prisma.userPrivacySettings.upsert({
      where: { userId },
      update: {},
      create: { userId },
    });
  }

  static async updatePrivacy(userId: string, input: PrivacyInput) {
    return prisma.userPrivacySettings.upsert({
      where: { userId },
      update: input,
      create: { userId, ...input },
    });
  }

  static async listRelationships(userId: string) {
    const [blocks, mutes] = await Promise.all([
      prisma.userBlock.findMany({
        where: { blockerUserId: userId },
        select: {
          id: true,
          blocked: {
            select: {
              fullName: true,
              creatorProfile: { select: { username: true, avatarUrl: true } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.userMute.findMany({
        where: { muterUserId: userId },
        select: {
          id: true,
          muted: {
            select: {
              fullName: true,
              creatorProfile: { select: { username: true, avatarUrl: true } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
    ]);
    return {
      blocks: blocks.flatMap((item) =>
        item.blocked.creatorProfile?.username
          ? [
              {
                id: item.id,
                fullName: item.blocked.fullName,
                ...item.blocked.creatorProfile,
              },
            ]
          : [],
      ),
      mutes: mutes.flatMap((item) =>
        item.muted.creatorProfile?.username
          ? [
              {
                id: item.id,
                fullName: item.muted.fullName,
                ...item.muted.creatorProfile,
              },
            ]
          : [],
      ),
    };
  }
}
