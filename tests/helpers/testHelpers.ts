import { PrismaClient } from "../../src/generated/prisma";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const prisma = new PrismaClient();

/**
 * Database Helper Functions
 */

/**
 * Clean all test data from database
 * Call this before/after each test to ensure isolation
 */
export async function cleanDatabase() {
  // Delete in correct order (respect foreign keys)
  await prisma.blogRating.deleteMany();
  await prisma.like.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.blog.deleteMany();
  await prisma.user.deleteMany();

  // If Follow model exists, add it here:
  // await prisma.follow.deleteMany();
}

/**
 * Disconnect Prisma client
 * Call this in afterAll() to close database connections
 */
export async function disconnectDatabase() {
  await prisma.$disconnect();
}

/**
 * User Helper Functions
 */

/**
 * Create a test user in the database
 */
export async function createTestUser(overrides?: {
  username?: string;
  email?: string;
  password?: string;
  name?: string;
  role?: string;
}) {
  const hashedPassword = await bcrypt.hash(
    overrides?.password || "password123",
    10
  );

  return await prisma.user.create({
    data: {
      username: overrides?.username || "testuser",
      email: overrides?.email || "test@example.com",
      password: hashedPassword,
      name: overrides?.name || "Test User",
      role: overrides?.role || "User",
    },
  });
}

/**
 * Create multiple test users
 */
export async function createTestUsers(count: number) {
  const users: any[] = [];
  for (let i = 1; i <= count; i++) {
    const user = await createTestUser({
      username: `testuser${i}`,
      email: `test${i}@example.com`,
      name: `Test User ${i}`,
    });
    users.push(user);
  }
  return users;
}

/**
 * Create an admin user
 */
export async function createAdminUser() {
  return await createTestUser({
    username: "admin",
    email: "admin@example.com",
    name: "Admin User",
    role: "Admin",
  });
}

/**
 * JWT Helper Functions
 */

/**
 * Generate access token for testing
 */
export function generateAccessToken(userId: number, role: string = "User") {
  return jwt.sign({ userId, role }, process.env.ACCESS_TOKEN_SECRET!, {
    expiresIn: "15m",
  });
}

/**
 * Generate refresh token for testing
 */
export function generateRefreshToken(userId: number, role: string = "User") {
  return jwt.sign({ userId, role }, process.env.REFRESH_TOKEN_SECRET!, {
    expiresIn: "7d",
  });
}

/**
 * Blog Helper Functions
 */

/**
 * Create a test blog
 */
export async function createTestBlog(
  userId: number,
  overrides?: {
    title?: string;
    content?: string;
    tagId?: number;
  }
) {
  return await prisma.blog.create({
    data: {
      userId,
      title: overrides?.title || "Test Blog Title",
      content: overrides?.content || "Test blog content",
      tagId: overrides?.tagId || 1,
    },
  });
}

/**
 * Create multiple test blogs
 */
export async function createTestBlogs(userId: number, count: number) {
  const blogs: any[] = [];
  for (let i = 1; i <= count; i++) {
    const blog = await createTestBlog(userId, {
      title: `Test Blog ${i}`,
      content: `This is test blog content number ${i}`,
    });
    blogs.push(blog);
  }
  return blogs;
}

/**
 * Comment Helper Functions
 */

/**
 * Create a test comment
 */
export async function createTestComment(
  userId: number,
  blogId: number,
  content?: string
) {
  return await prisma.comment.create({
    data: {
      userId,
      blogId,
      content: content || "Test comment",
    },
  });
}

/**
 * Rating Helper Functions
 */

/**
 * Create a test rating
 */
export async function createTestRating(
  userId: number,
  blogId: number,
  ratingValue: number = 5
) {
  return await prisma.blogRating.create({
    data: {
      userId,
      blogId,
      ratingValue,
    },
  });
}

/**
 * Like Helper Functions
 */

/**
 * Create a test like
 */
export async function createTestLike(userId: number, blogId: number) {
  return await prisma.like.create({
    data: {
      userId,
      blogId,
    },
  });
}

/**
 * Assertion Helpers
 */

/**
 * Check if error has specific message
 */
export function expectErrorMessage(error: any, message: string) {
  expect(error).toBeDefined();
  expect(error.message).toBe(message);
}

/**
 * Check if response has specific status code
 */
export function expectStatusCode(response: any, statusCode: number) {
  expect(response.status).toBe(statusCode);
}

/**
 * Delay Helper (for testing async operations)
 */
export function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
