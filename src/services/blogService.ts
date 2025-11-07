import { PrismaClient } from "../generated/prisma";

const prisma = new PrismaClient();

// Interface for creating a blog
export interface CreateBlogDto {
  title: string;
  content: string;
  tagId?: number;
}

// Interface for updating a blog
export interface UpdateBlogDto {
  title?: string;
  content?: string;
  tagId?: number;
}

export async function createBlog(userId: number, data: CreateBlogDto) {
  const blog = await prisma.blog.create({
    data: {
      title: data.title,
      content: data.content,
      tagId: data.tagId,
      userId: userId,
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

  return blog;
}

/**
 * Get all blogs with pagination
 * @param page - Page number (default 1)
 * @param limit - Number of blogs per page (default 10)
 * @returns Array of blogs with user information
 */
export async function getAllBlogs(page: number = 1, limit: number = 10) {
  const skip = (page - 1) * limit;

  const [blogs, total] = await Promise.all([
    prisma.blog.findMany({
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
        id: "desc", // Newest first
      },
    }),
    prisma.blog.count(), // Total number of blogs
  ]);

  return {
    blogs,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getBlogById(blogId: number) {
  const blog = await prisma.blog.findUnique({
    where: { id: blogId },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          name: true,
          bio: true,
        },
      },
      comments: {
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
      },
      likes: {
        select: {
          userId: true,
        },
      },
      ratings: {
        select: {
          ratingValue: true,
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
  });

  if (!blog) {
    throw new Error("Blog not found");
  }

  // Calculate average rating
  const avgRating =
    blog.ratings.length > 0
      ? blog.ratings.reduce((sum, r) => sum + r.ratingValue, 0) /
        blog.ratings.length
      : 0;

  return {
    ...blog,
    averageRating: Math.round(avgRating * 10) / 10, // Round to 1 decimal place
  };
}

export async function updateBlog(
  blogId: number,
  userId: number,
  data: UpdateBlogDto
) {
  // Check if blog exists and belongs to the user
  const existingBlog = await prisma.blog.findUnique({
    where: { id: blogId },
  });

  if (!existingBlog) {
    throw new Error("Blog not found");
  }

  if (existingBlog.userId !== userId) {
    throw new Error("Unauthorized: You can only update your own blogs");
  }

  // Update the blog
  const updatedBlog = await prisma.blog.update({
    where: { id: blogId },
    data: {
      title: data.title,
      content: data.content,
      tagId: data.tagId,
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

  return updatedBlog;
}

export async function deleteBlog(
  blogId: number,
  userId: number,
  userRole: string
) {
  // Check if blog exists
  const existingBlog = await prisma.blog.findUnique({
    where: { id: blogId },
  });

  if (!existingBlog) {
    throw new Error("Blog not found");
  }

  // Check authorization: user owns the blog OR user is admin
  if (existingBlog.userId !== userId && userRole !== "Admin") {
    throw new Error("Unauthorized: You can only delete your own blogs");
  }

  // Delete the blog
  await prisma.blog.delete({
    where: { id: blogId },
  });

  return { message: "Blog deleted successfully" };
}
