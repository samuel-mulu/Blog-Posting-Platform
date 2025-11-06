import { PrismaClient } from "../generated/prisma";

const prisma = new PrismaClient();

/**
 * Toggle like on a blog (like if not liked, unlike if already liked)
 * @param userId - ID of the user
 * @param blogId - ID of the blog
 * @returns Like status and message
 */
export async function toggleLike(userId: number, blogId: number) {
  // Check if blog exists
  const blog = await prisma.blog.findUnique({
    where: { id: blogId },
  });

  if (!blog) {
    throw new Error("Blog not found");
  }

  // Check if user has already liked the blog
  const existingLike = await prisma.like.findUnique({
    where: {
      userId_blogId: {
        userId,
        blogId,
      },
    },
  });

  if (existingLike) {
    // Unlike: Delete the like
    await prisma.like.delete({
      where: {
        userId_blogId: {
          userId,
          blogId,
        },
      },
    });

    return {
      liked: false,
      message: "Blog unliked successfully",
    };
  } else {
    // Like: Create new like
    await prisma.like.create({
      data: {
        userId,
        blogId,
      },
    });

    return {
      liked: true,
      message: "Blog liked successfully",
    };
  }
}

/**
 * Get all users who liked a blog
 * @param blogId - ID of the blog
 * @returns List of users who liked the blog
 */
export async function getBlogLikes(blogId: number) {
  // Check if blog exists
  const blog = await prisma.blog.findUnique({
    where: { id: blogId },
  });

  if (!blog) {
    throw new Error("Blog not found");
  }

  const likes = await prisma.like.findMany({
    where: { blogId },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          name: true,
        },
      },
    },
    orderBy: {
      id: "desc",
    },
  });

  return {
    likes,
    total: likes.length,
  };
}

/**
 * Check if a user has liked a blog
 * @param userId - ID of the user
 * @param blogId - ID of the blog
 * @returns Boolean indicating if user liked the blog
 */
export async function hasUserLikedBlog(userId: number, blogId: number) {
  const like = await prisma.like.findUnique({
    where: {
      userId_blogId: {
        userId,
        blogId,
      },
    },
  });

  return {
    liked: !!like,
  };
}

/**
 * Get all blogs liked by a user
 * @param userId - ID of the user
 * @param page - Page number
 * @param limit - Likes per page
 * @returns User's liked blogs with pagination
 */
export async function getUserLikedBlogs(
  userId: number,
  page: number = 1,
  limit: number = 20
) {
  const skip = (page - 1) * limit;

  const [likes, total] = await Promise.all([
    prisma.like.findMany({
      where: { userId },
      skip,
      take: limit,
      include: {
        blog: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                name: true,
              },
            },
            _count: {
              select: {
                comments: true,
                likes: true,
              },
            },
          },
        },
      },
      orderBy: {
        id: "desc",
      },
    }),
    prisma.like.count({
      where: { userId },
    }),
  ]);

  return {
    blogs: likes.map((like) => like.blog),
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}
