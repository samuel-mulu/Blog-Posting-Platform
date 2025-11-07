import * as likeService from "../../src/services/likeService";
import {
  cleanDatabase,
  disconnectDatabase,
  createTestUser,
  createTestBlog,
  createTestLike,
} from "../helpers/testHelpers";

describe("Like Service - Unit Tests", () => {
  let testUser: any;
  let testBlog: any;

  beforeEach(async () => {
    await cleanDatabase();
    testUser = await createTestUser();
    testBlog = await createTestBlog(testUser.id);
  });

  afterAll(async () => {
    await disconnectDatabase();
  });

  describe("toggleLike()", () => {
    test("should like a blog (create like)", async () => {
      const result = await likeService.toggleLike(testUser.id, testBlog.id);

      expect(result.liked).toBe(true);
      expect(result.message).toBe("Blog liked successfully");
    });

    test("should unlike a blog (delete like)", async () => {
      await createTestLike(testUser.id, testBlog.id);

      const result = await likeService.toggleLike(testUser.id, testBlog.id);

      expect(result.liked).toBe(false);
      expect(result.message).toBe("Blog unliked successfully");
    });

    test("should toggle like multiple times", async () => {
      const like1 = await likeService.toggleLike(testUser.id, testBlog.id);
      expect(like1.liked).toBe(true);

      const unlike = await likeService.toggleLike(testUser.id, testBlog.id);
      expect(unlike.liked).toBe(false);

      const like2 = await likeService.toggleLike(testUser.id, testBlog.id);
      expect(like2.liked).toBe(true);
    });

    test("should throw error if blog not found", async () => {
      await expect(likeService.toggleLike(testUser.id, 9999)).rejects.toThrow(
        "Blog not found"
      );
    });
  });

  describe("getBlogLikes()", () => {
    test("should return all likes for a blog", async () => {
      const user2 = await createTestUser({
        username: "user2",
        email: "user2@example.com",
      });
      const user3 = await createTestUser({
        username: "user3",
        email: "user3@example.com",
      });

      await createTestLike(testUser.id, testBlog.id);
      await createTestLike(user2.id, testBlog.id);
      await createTestLike(user3.id, testBlog.id);

      const result = await likeService.getBlogLikes(testBlog.id);

      expect(result.likes).toHaveLength(3);
      expect(result.total).toBe(3);
    });

    test("should return empty array if no likes", async () => {
      const result = await likeService.getBlogLikes(testBlog.id);

      expect(result.likes).toHaveLength(0);
      expect(result.total).toBe(0);
    });

    test("should throw error if blog not found", async () => {
      await expect(likeService.getBlogLikes(9999)).rejects.toThrow(
        "Blog not found"
      );
    });
  });

  describe("hasUserLikedBlog()", () => {
    test("should return true if user liked blog", async () => {
      await createTestLike(testUser.id, testBlog.id);

      const result = await likeService.hasUserLikedBlog(
        testUser.id,
        testBlog.id
      );

      expect(result.liked).toBe(true);
    });

    test("should return false if user hasn't liked blog", async () => {
      const result = await likeService.hasUserLikedBlog(
        testUser.id,
        testBlog.id
      );

      expect(result.liked).toBe(false);
    });
  });

  describe("getUserLikedBlogs()", () => {
    test("should return all blogs liked by user", async () => {
      const blog1 = await createTestBlog(testUser.id, { title: "Blog 1" });
      const blog2 = await createTestBlog(testUser.id, { title: "Blog 2" });

      await createTestLike(testUser.id, blog1.id);
      await createTestLike(testUser.id, blog2.id);

      const result = await likeService.getUserLikedBlogs(testUser.id, 1, 10);

      expect(result.blogs).toHaveLength(2);
      expect(result.pagination.total).toBe(2);
    });

    test("should paginate liked blogs", async () => {
      for (let i = 0; i < 5; i++) {
        const blog = await createTestBlog(testUser.id);
        await createTestLike(testUser.id, blog.id);
      }

      const page1 = await likeService.getUserLikedBlogs(testUser.id, 1, 2);
      const page2 = await likeService.getUserLikedBlogs(testUser.id, 2, 2);

      expect(page1.blogs).toHaveLength(2);
      expect(page2.blogs).toHaveLength(2);
      expect(page1.pagination.totalPages).toBe(3);
    });
  });
});
