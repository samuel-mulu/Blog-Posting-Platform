import { PrismaClient } from "../generated/prisma";

const prisma = new PrismaClient();

/**
 * Create a comment on a blog
 * @param userId - ID of the user creating the comment
 * @param blogId - ID of the blog being commented on
 * @param content - Comment content
 * @returns Created comment
 */
export async function createComment(
  userId: number,
  blogId: number,
  content: string
) {
  // Check if blog exists
  const blog = await prisma.blog.findUnique({
    where: { id: blogId },
  });

  if (!blog) {
    throw new Error("Blog not found");
  }

  // Create comment
  const comment = await prisma.comment.create({
    data: {
      userId,
      blogId,
      content,
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

  return comment;
}

/**
 * Get all comments for a blog
 * @param blogId - ID of the blog
 * @param page - Page number
 * @param limit - Comments per page
 * @returns List of comments with pagination
 */
export async function getCommentsForBlog(
  blogId: number,
  page: number = 1,
  limit: number = 20
) {
  const skip = (page - 1) * limit;

  const [comments, total] = await Promise.all([
    prisma.comment.findMany({
      where: { blogId },
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
      },
      orderBy: {
        id: "desc", // Newest first
      },
    }),
    prisma.comment.count({
      where: { blogId },
    }),
  ]);

  return {
    comments,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/**
 * Get a single comment by ID
 * @param commentId - ID of the comment
 * @returns Comment details
 */
export async function getCommentById(commentId: number) {
  const comment = await prisma.comment.findUnique({
    where: { id: commentId },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          name: true,
        },
      },
      blog: {
        select: {
          id: true,
          title: true,
        },
      },
    },
  });

  if (!comment) {
    throw new Error("Comment not found");
  }

  return comment;
}

/**
 * Update a comment
 * @param commentId - ID of the comment to update
 * @param userId - ID of the user making the update
 * @param content - New comment content
 * @returns Updated comment
 */
export async function updateComment(
  commentId: number,
  userId: number,
  content: string
) {
  // Check if comment exists
  const existingComment = await prisma.comment.findUnique({
    where: { id: commentId },
  });

  if (!existingComment) {
    throw new Error("Comment not found");
  }

  // Authorization: Only comment author can edit
  if (existingComment.userId !== userId) {
    throw new Error("Unauthorized: You can only edit your own comments");
  }

  // Update comment
  const updatedComment = await prisma.comment.update({
    where: { id: commentId },
    data: { content },
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

  return updatedComment;
}

/**
 * Delete a comment
 * @param commentId - ID of the comment to delete
 * @param userId - ID of the user requesting deletion
 * @param userRole - Role of the user (Admin can delete any comment)
 */
export async function deleteComment(
  commentId: number,
  userId: number,
  userRole: string
) {
  // Check if comment exists
  const existingComment = await prisma.comment.findUnique({
    where: { id: commentId },
  });

  if (!existingComment) {
    throw new Error("Comment not found");
  }

  // Authorization: Comment author or Admin can delete
  if (existingComment.userId !== userId && userRole !== "Admin") {
    throw new Error("Unauthorized: You can only delete your own comments");
  }

  // Delete comment
  await prisma.comment.delete({
    where: { id: commentId },
  });

  return { message: "Comment deleted successfully" };
}

/**
 * Get all comments by a user
 * @param userId - ID of the user
 * @param page - Page number
 * @param limit - Comments per page
 * @returns User's comments with pagination
 */
export async function getUserComments(
  userId: number,
  page: number = 1,
  limit: number = 20
) {
  const skip = (page - 1) * limit;

  const [comments, total] = await Promise.all([
    prisma.comment.findMany({
      where: { userId },
      skip,
      take: limit,
      include: {
        blog: {
          select: {
            id: true,
            title: true,
          },
        },
      },
      orderBy: {
        id: "desc",
      },
    }),
    prisma.comment.count({
      where: { userId },
    }),
  ]);

  return {
    comments,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}
