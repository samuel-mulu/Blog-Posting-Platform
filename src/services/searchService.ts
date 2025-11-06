import { PrismaClient } from "../generated/prisma";

const prisma = new PrismaClient();

/**
 * Search blogs by title, content, or tags
 * @param query - Search query
 * @param page - Page number
 * @param limit - Results per page
 * @returns Matching blogs with pagination
 */
export async function searchBlogs(
  query: string,
  page: number = 1,
  limit: number = 10
) {
  const skip = (page - 1) * limit;

  // Build search filter
  const searchFilter = {
    OR: [
      {
        title: {
          contains: query,
          mode: "insensitive" as const,
        },
      },
      {
        content: {
          contains: query,
          mode: "insensitive" as const,
        },
      },
    ],
  };

  const [blogs, total] = await Promise.all([
    prisma.blog.findMany({
      where: searchFilter,
      skip,
      take: limit,
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
            ratings: true,
          },
        },
      },
      orderBy: {
        id: "desc", // Newest first
      },
    }),
    prisma.blog.count({
      where: searchFilter,
    }),
  ]);

  return {
    blogs,
    query,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/**
 * Search blogs by tag ID
 * @param tagId - Tag ID to filter
 * @param page - Page number
 * @param limit - Results per page
 * @returns Blogs with the specified tag
 */
export async function searchBlogsByTag(
  tagId: number,
  page: number = 1,
  limit: number = 10
) {
  const skip = (page - 1) * limit;

  const [blogs, total] = await Promise.all([
    prisma.blog.findMany({
      where: { tagId },
      skip,
      take: limit,
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
      orderBy: {
        id: "desc",
      },
    }),
    prisma.blog.count({
      where: { tagId },
    }),
  ]);

  return {
    blogs,
    tagId,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/**
 * Search users by name or username
 * @param query - Search query
 * @param page - Page number
 * @param limit - Results per page
 * @returns Matching users with pagination
 */
export async function searchUsers(
  query: string,
  page: number = 1,
  limit: number = 10
) {
  const skip = (page - 1) * limit;

  // Build search filter
  const searchFilter = {
    OR: [
      {
        username: {
          contains: query,
          mode: "insensitive" as const,
        },
      },
      {
        name: {
          contains: query,
          mode: "insensitive" as const,
        },
      },
      {
        email: {
          contains: query,
          mode: "insensitive" as const,
        },
      },
    ],
  };

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where: searchFilter,
      skip,
      take: limit,
      select: {
        id: true,
        username: true,
        name: true,
        bio: true,
        role: true,
        _count: {
          select: {
            blogs: true,
            comments: true,
          },
        },
      },
      orderBy: {
        id: "desc",
      },
    }),
    prisma.user.count({
      where: searchFilter,
    }),
  ]);

  return {
    users,
    query,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/**
 * Combined search for both blogs and users
 * @param query - Search query
 * @returns Both blog and user results
 */
export async function searchAll(query: string) {
  const [blogs, users] = await Promise.all([
    searchBlogs(query, 1, 5), // Top 5 blogs
    searchUsers(query, 1, 5), // Top 5 users
  ]);

  return {
    query,
    blogs: blogs.blogs,
    users: users.users,
    totalResults: blogs.pagination.total + users.pagination.total,
  };
}
