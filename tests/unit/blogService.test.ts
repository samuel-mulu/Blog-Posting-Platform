import * as blogService from "../../src/services/blogService";
import {
  cleanDatabase,
  disconnectDatabase,
  createTestUser,
  createTestBlog,
  createTestBlogs,
} from "../helpers/testHelpers";

describe("Blog Service - Unit Tests", () => {
  let testUser: any;

  beforeEach(async () => {
    await cleanDatabase();
    testUser = await createTestUser();
  });

  afterAll(async () => {
    await disconnectDatabase();
  });

  describe("createBlog()", () => {
    test("should create a blog successfully", async () => {
      const blogData = {
        title: "Test Blog",
        content: "This is test content",
        tagId: 1,
      };

      const blog = await blogService.createBlog(testUser.id, blogData);

      expect(blog).toBeDefined();
      expect(blog.id).toBeDefined();
      expect(blog.title).toBe("Test Blog");
      expect(blog.content).toBe("This is test content");
      expect(blog.tagId).toBe(1);
      expect(blog.userId).toBe(testUser.id);
      expect(blog.user).toBeDefined();
      expect(blog.user.username).toBe(testUser.username);
    });

    test("should create blog with optional tagId", async () => {
      const blog = await blogService.createBlog(testUser.id, {
        title: "No Tag Blog",
        content: "Content without tag",
      });

      expect(blog.tagId).toBeNull();
    });
  });

  describe("getAllBlogs()", () => {
    test("should return all blogs with pagination", async () => {
      await createTestBlogs(testUser.id, 3);

      const result = await blogService.getAllBlogs(1, 10);

      expect(result.blogs).toHaveLength(3);
      expect(result.pagination.total).toBe(3);
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.limit).toBe(10);
      expect(result.pagination.totalPages).toBe(1);
    });

    test("should paginate correctly", async () => {
      await createTestBlogs(testUser.id, 15);

      const page1 = await blogService.getAllBlogs(1, 5);
      const page2 = await blogService.getAllBlogs(2, 5);

      expect(page1.blogs).toHaveLength(5);
      expect(page2.blogs).toHaveLength(5);
      expect(page1.pagination.totalPages).toBe(3);
      expect(page1.blogs[0].id).not.toBe(page2.blogs[0].id);
    });

    test("should include user information", async () => {
      await createTestBlog(testUser.id);

      const result = await blogService.getAllBlogs(1, 10);

      expect(result.blogs[0].user).toBeDefined();
      expect(result.blogs[0].user.id).toBe(testUser.id);
      expect(result.blogs[0].user.username).toBe(testUser.username);
    });

    test("should include comment and like counts", async () => {
      await createTestBlog(testUser.id);

      const result = await blogService.getAllBlogs(1, 10);

      expect(result.blogs[0]._count).toBeDefined();
      expect(result.blogs[0]._count.comments).toBe(0);
      expect(result.blogs[0]._count.likes).toBe(0);
    });
  });

  describe("getBlogById()", () => {
    test("should return blog by ID", async () => {
      const createdBlog = await createTestBlog(testUser.id, {
        title: "Specific Blog",
        content: "Specific content",
      });

      const blog = await blogService.getBlogById(createdBlog.id);

      expect(blog).toBeDefined();
      expect(blog.id).toBe(createdBlog.id);
      expect(blog.title).toBe("Specific Blog");
    });

    test("should throw error for non-existent blog", async () => {
      await expect(blogService.getBlogById(9999)).rejects.toThrow(
        "Blog not found"
      );
    });

    test("should include average rating", async () => {
      const blog = await createTestBlog(testUser.id);

      const result = await blogService.getBlogById(blog.id);

      expect(result.averageRating).toBeDefined();
      expect(result.averageRating).toBe(0);
    });
  });

  describe("updateBlog()", () => {
    test("should update blog successfully by owner", async () => {
      const blog = await createTestBlog(testUser.id);

      const updated = await blogService.updateBlog(blog.id, testUser.id, {
        title: "Updated Title",
        content: "Updated Content",
      });

      expect(updated.title).toBe("Updated Title");
      expect(updated.content).toBe("Updated Content");
    });

    test("should throw error if blog not found", async () => {
      await expect(
        blogService.updateBlog(9999, testUser.id, { title: "New" })
      ).rejects.toThrow("Blog not found");
    });

    test("should throw error if user is not owner", async () => {
      const blog = await createTestBlog(testUser.id);
      const otherUser = await createTestUser({
        username: "otheruser",
        email: "other@example.com",
      });

      await expect(
        blogService.updateBlog(blog.id, otherUser.id, { title: "Hacked" })
      ).rejects.toThrow("Unauthorized: You can only update your own blogs");
    });
  });

  describe("deleteBlog()", () => {
    test("should delete blog successfully by owner", async () => {
      const blog = await createTestBlog(testUser.id);

      const result = await blogService.deleteBlog(blog.id, testUser.id, "User");

      expect(result.message).toBe("Blog deleted successfully");
    });

    test("should allow admin to delete any blog", async () => {
      const blog = await createTestBlog(testUser.id);
      const admin = await createTestUser({
        username: "admin",
        email: "admin@example.com",
        role: "Admin",
      });

      const result = await blogService.deleteBlog(blog.id, admin.id, "Admin");

      expect(result.message).toBe("Blog deleted successfully");
    });

    test("should throw error if non-owner tries to delete", async () => {
      const blog = await createTestBlog(testUser.id);
      const otherUser = await createTestUser({
        username: "other",
        email: "other@example.com",
      });

      await expect(
        blogService.deleteBlog(blog.id, otherUser.id, "User")
      ).rejects.toThrow("Unauthorized: You can only delete your own blogs");
    });

    test("should throw error if blog not found", async () => {
      await expect(
        blogService.deleteBlog(9999, testUser.id, "User")
      ).rejects.toThrow("Blog not found");
    });
  });
});
