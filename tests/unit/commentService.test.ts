import * as commentService from "../../src/services/commentService";
import {
  cleanDatabase,
  disconnectDatabase,
  createTestUser,
  createTestBlog,
  createTestComment,
} from "../helpers/testHelpers";

describe("Comment Service - Unit Tests", () => {
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

  describe("createComment()", () => {
    test("should create a comment successfully", async () => {
      const comment = await commentService.createComment(
        testUser.id,
        testBlog.id,
        "Great blog post!"
      );

      expect(comment).toBeDefined();
      expect(comment.content).toBe("Great blog post!");
      expect(comment.userId).toBe(testUser.id);
      expect(comment.blogId).toBe(testBlog.id);
      expect(comment.user).toBeDefined();
    });

    test("should throw error if blog not found", async () => {
      await expect(
        commentService.createComment(testUser.id, 9999, "Comment")
      ).rejects.toThrow("Blog not found");
    });
  });

  describe("getCommentsForBlog()", () => {
    test("should return all comments for a blog", async () => {
      await createTestComment(testUser.id, testBlog.id, "Comment 1");
      await createTestComment(testUser.id, testBlog.id, "Comment 2");

      const result = await commentService.getCommentsForBlog(
        testBlog.id,
        1,
        10
      );

      expect(result.comments).toHaveLength(2);
      expect(result.pagination.total).toBe(2);
    });

    test("should paginate comments correctly", async () => {
      for (let i = 1; i <= 5; i++) {
        await createTestComment(testUser.id, testBlog.id, `Comment ${i}`);
      }

      const page1 = await commentService.getCommentsForBlog(testBlog.id, 1, 2);
      const page2 = await commentService.getCommentsForBlog(testBlog.id, 2, 2);

      expect(page1.comments).toHaveLength(2);
      expect(page2.comments).toHaveLength(2);
      expect(page1.pagination.totalPages).toBe(3);
    });
  });

  describe("updateComment()", () => {
    test("should update comment by owner", async () => {
      const comment = await createTestComment(
        testUser.id,
        testBlog.id,
        "Original"
      );

      const updated = await commentService.updateComment(
        comment.id,
        testUser.id,
        "Updated content"
      );

      expect(updated.content).toBe("Updated content");
    });

    test("should throw error if comment not found", async () => {
      await expect(
        commentService.updateComment(9999, testUser.id, "New")
      ).rejects.toThrow("Comment not found");
    });

    test("should throw error if user is not owner", async () => {
      const comment = await createTestComment(
        testUser.id,
        testBlog.id,
        "Original"
      );
      const otherUser = await createTestUser({
        username: "other",
        email: "other@example.com",
      });

      await expect(
        commentService.updateComment(comment.id, otherUser.id, "Hacked")
      ).rejects.toThrow("Unauthorized: You can only edit your own comments");
    });
  });

  describe("deleteComment()", () => {
    test("should delete comment by owner", async () => {
      const comment = await createTestComment(testUser.id, testBlog.id, "Test");

      const result = await commentService.deleteComment(
        comment.id,
        testUser.id,
        "User"
      );

      expect(result.message).toBe("Comment deleted successfully");
    });

    test("should allow admin to delete any comment", async () => {
      const comment = await createTestComment(testUser.id, testBlog.id, "Test");
      const admin = await createTestUser({
        username: "admin",
        email: "admin@example.com",
        role: "Admin",
      });

      const result = await commentService.deleteComment(
        comment.id,
        admin.id,
        "Admin"
      );

      expect(result.message).toBe("Comment deleted successfully");
    });

    test("should throw error if non-owner tries to delete", async () => {
      const comment = await createTestComment(testUser.id, testBlog.id, "Test");
      const otherUser = await createTestUser({
        username: "other",
        email: "other@example.com",
      });

      await expect(
        commentService.deleteComment(comment.id, otherUser.id, "User")
      ).rejects.toThrow("Unauthorized: You can only delete your own comments");
    });
  });
});
