import { PrismaClient } from "../generated/prisma";

const prisma = new PrismaClient();

/**
 * Create or update a rating for a blog
 * User can only rate a blog once (upsert operation)
 * @param userId - ID of the user rating
 * @param blogId - ID of the blog being rated
 * @param ratingValue - Rating value (1-5)
 * @returns Created or updated rating
 */
export async function rateBlog(
  userId: number,
  blogId: number,
  ratingValue: number
) {
  // Validate rating value (1-5)
  if (ratingValue < 1 || ratingValue > 5) {
    throw new Error("Rating must be between 1 and 5");
  }

  // Check if blog exists
  const blog = await prisma.blog.findUnique({
    where: { id: blogId },
  });

  if (!blog) {
    throw new Error("Blog not found");
  }

  // Upsert: Create new rating or update existing one
  const rating = await prisma.blogRating.upsert({
    where: {
      userId_blogId: {
        userId,
        blogId,
      },
    },
    update: {
      ratingValue,
    },
    create: {
      userId,
      blogId,
      ratingValue,
    },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          name: true,
        },
      },
    },
  });

  return rating;
}

/**
 * Get a user's rating for a specific blog
 * @param userId - ID of the user
 * @param blogId - ID of the blog
 * @returns User's rating or null if not rated
 */
export async function getUserRatingForBlog(userId: number, blogId: number) {
  const rating = await prisma.blogRating.findUnique({
    where: {
      userId_blogId: {
        userId,
        blogId,
      },
    },
  });

  return rating;
}

/**
 * Get all ratings for a blog with average
 * @param blogId - ID of the blog
 * @returns Ratings list and average rating
 */
export async function getBlogRatings(blogId: number) {
  // Check if blog exists
  const blog = await prisma.blog.findUnique({
    where: { id: blogId },
  });

  if (!blog) {
    throw new Error("Blog not found");
  }

  // Get all ratings
  const ratings = await prisma.blogRating.findMany({
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

  // Calculate average rating
  const totalRatings = ratings.length;
  const averageRating =
    totalRatings > 0
      ? ratings.reduce((sum, r) => sum + r.ratingValue, 0) / totalRatings
      : 0;

  return {
    ratings,
    stats: {
      total: totalRatings,
      average: Math.round(averageRating * 10) / 10, // Round to 1 decimal
      distribution: {
        five: ratings.filter((r) => r.ratingValue === 5).length,
        four: ratings.filter((r) => r.ratingValue === 4).length,
        three: ratings.filter((r) => r.ratingValue === 3).length,
        two: ratings.filter((r) => r.ratingValue === 2).length,
        one: ratings.filter((r) => r.ratingValue === 1).length,
      },
    },
  };
}

/**
 * Delete a rating
 * @param userId - ID of the user
 * @param blogId - ID of the blog
 */
export async function deleteRating(userId: number, blogId: number) {
  const rating = await prisma.blogRating.findUnique({
    where: {
      userId_blogId: {
        userId,
        blogId,
      },
    },
  });

  if (!rating) {
    throw new Error("Rating not found");
  }

  await prisma.blogRating.delete({
    where: {
      userId_blogId: {
        userId,
        blogId,
      },
    },
  });

  return { message: "Rating deleted successfully" };
}
