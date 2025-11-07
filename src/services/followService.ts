import { PrismaClient } from "../generated/prisma";

const prisma = new PrismaClient();

/**
 * Toggle follow (follow if not following, unfollow if already following)
 * Same pattern as Like/Unlike!
 */
export async function toggleFollow(followerId: number, followingId: number) {
  // Can't follow yourself
  if (followerId === followingId) {
    throw new Error("You cannot follow yourself");
  }

  // Check if user exists
  const userToFollow = await prisma.user.findUnique({
    where: { id: followingId },
  });

  if (!userToFollow) {
    throw new Error("User not found");
  }

  // Check if already following
  const existingFollow = await prisma.follow.findUnique({
    where: {
      followerId_followingId: {
        followerId,
        followingId,
      },
    },
  });

  if (existingFollow) {
    // UNFOLLOW - Delete the follow
    await prisma.follow.delete({
      where: {
        followerId_followingId: {
          followerId,
          followingId,
        },
      },
    });

    return {
      following: false,
      message: "Unfollowed successfully",
    };
  } else {
    // FOLLOW - Create new follow
    await prisma.follow.create({
      data: {
        followerId,
        followingId,
      },
    });

    return {
      following: true,
      message: "Followed successfully",
    };
  }
}

/**
 * Get user's followers
 */
export async function getFollowers(
  userId: number,
  page: number = 1,
  limit: number = 20
) {
  const skip = (page - 1) * limit;

  const [followers, total] = await Promise.all([
    prisma.follow.findMany({
      where: { followingId: userId }, // People who follow this user
      skip,
      take: limit,
      include: {
        follower: {
          select: {
            id: true,
            username: true,
            name: true,
            bio: true,
            _count: {
              select: {
                blogs: true,
                followers: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    }),
    prisma.follow.count({
      where: { followingId: userId },
    }),
  ]);

  return {
    followers: followers.map((f) => f.follower),
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/**
 * Get users that a user is following
 */
export async function getFollowing(
  userId: number,
  page: number = 1,
  limit: number = 20
) {
  const skip = (page - 1) * limit;

  const [following, total] = await Promise.all([
    prisma.follow.findMany({
      where: { followerId: userId }, // Users this person follows
      skip,
      take: limit,
      include: {
        following: {
          select: {
            id: true,
            username: true,
            name: true,
            bio: true,
            _count: {
              select: {
                blogs: true,
                followers: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    }),
    prisma.follow.count({
      where: { followerId: userId },
    }),
  ]);

  return {
    following: following.map((f) => f.following),
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/**
 * Check if user is following another user
 */
export async function isFollowing(followerId: number, followingId: number) {
  const follow = await prisma.follow.findUnique({
    where: {
      followerId_followingId: {
        followerId,
        followingId,
      },
    },
  });

  return {
    following: !!follow,
  };
}

/**
 * Get follower and following counts
 */
export async function getFollowStats(userId: number) {
  const [followerCount, followingCount] = await Promise.all([
    prisma.follow.count({
      where: { followingId: userId }, // Followers
    }),
    prisma.follow.count({
      where: { followerId: userId }, // Following
    }),
  ]);

  return {
    followers: followerCount,
    following: followingCount,
  };
}
