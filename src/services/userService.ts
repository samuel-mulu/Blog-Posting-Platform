import { PrismaClient } from "../generated/prisma";

const prisma = new PrismaClient();

// Interface for updating user profile
export interface UpdateProfileDto {
  name?: string;
  bio?: string;
  username?: string;
  profilePicture?: string;
}

export async function getUserProfile(userId: number) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      username: true,
      email: true,
      name: true,
      bio: true,
      role: true,
      // Exclude password for security
      _count: {
        select: {
          blogs: true,
          comments: true,
          likes: true,
        },
      },
    },
  });

  if (!user) {
    throw new Error("User not found");
  }

  return user;
}

export async function getUserByUsername(username: string) {
  const user = await prisma.user.findUnique({
    where: { username },
    select: {
      id: true,
      username: true,
      name: true,
      bio: true,
      role: true,
      blogs: {
        select: {
          id: true,
          title: true,
          content: true,
          tagId: true,
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
        take: 10, // Latest 10 blogs
      },
      _count: {
        select: {
          blogs: true,
          comments: true,
          likes: true,
        },
      },
    },
  });

  if (!user) {
    throw new Error("User not found");
  }

  return user;
}

export async function updateUserProfile(
  userId: number,
  data: UpdateProfileDto
) {
  // Check if username is already taken (if updating username)
  if (data.username) {
    const existingUser = await prisma.user.findUnique({
      where: { username: data.username },
    });

    if (existingUser && existingUser.id !== userId) {
      throw new Error("Username already taken");
    }
  }

  // Update user profile
  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      name: data.name,
      bio: data.bio,
      username: data.username,
    },
    select: {
      id: true,
      username: true,
      email: true,
      name: true,
      bio: true,
      role: true,
    },
  });

  return updatedUser;
}

/**
 * Get all users (for admin or search)
 * @param page - Page number
 * @param limit - Users per page
 * @returns List of users with pagination
 */
export async function getAllUsers(page: number = 1, limit: number = 10) {
  const skip = (page - 1) * limit;

  const [users, total] = await Promise.all([
    prisma.user.findMany({
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
    prisma.user.count(),
  ]);

  return {
    users,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/**
 * Delete user account
 * @param userId - ID of the user to delete
 * @param requestingUserId - ID of user making the request
 * @param requestingUserRole - Role of user making the request
 */
export async function deleteUser(
  userId: number,
  requestingUserId: number,
  requestingUserRole: string
) {
  // Check if user exists
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new Error("User not found");
  }

  // Authorization: Can only delete own account or admin can delete any
  if (userId !== requestingUserId && requestingUserRole !== "Admin") {
    throw new Error("Unauthorized: You can only delete your own account");
  }

  // Delete user (this will cascade delete blogs, comments, etc. based on schema)
  await prisma.user.delete({
    where: { id: userId },
  });

  return { message: "User account deleted successfully" };
}
