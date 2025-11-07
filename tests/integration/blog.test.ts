import request from "supertest";
import app from "../../src/app";
import {
  cleanDatabase,
  disconnectDatabase,
  createTestUser,
  createTestBlog,
} from "../helpers/testHelpers";
import { loginAndGetToken } from "../helpers/apiHelpers";

describe("Blog API - Integration Tests", () => {
  let testUser: any;
  let accessToken: string;

  beforeEach(async () => {
    await cleanDatabase();
    testUser = await createTestUser({
      email: "test@example.com",
      password: "password123",
    });
    accessToken = await loginAndGetToken("test@example.com", "password123");
  });

  afterAll(async () => {
    await disconnectDatabase();
  });

  describe("POST /api/v1/blogs", () => {
    test("should create blog with valid token and return 201", async () => {
      const response = await request(app)
        .post("/api/v1/blogs")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          title: "Test Blog",
          content: "Test content",
          tagId: 1,
        });

      expect(response.status).toBe(201);
      expect(response.body.message).toBe("Blog created successfully");
      expect(response.body.blog).toBeDefined();
      expect(response.body.blog.title).toBe("Test Blog");
      expect(response.body.blog.userId).toBe(testUser.id);
    });

    test("should return 401 without token", async () => {
      const response = await request(app).post("/api/v1/blogs").send({
        title: "Test Blog",
        content: "Test content",
      });

      expect(response.status).toBe(401);
      expect(response.body.error).toBe("No token provided");
    });

    test("should return 400 for missing title", async () => {
      const response = await request(app)
        .post("/api/v1/blogs")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          content: "Test content",
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe("Title and content are required");
    });

    test("should return 403 for invalid token", async () => {
      const response = await request(app)
        .post("/api/v1/blogs")
        .set("Authorization", "Bearer invalid.token.here")
        .send({
          title: "Test Blog",
          content: "Test content",
        });

      expect(response.status).toBe(403);
      expect(response.body.error).toBe("Invalid token");
    });
  });

  describe("GET /api/v1/blogs", () => {
    test("should get all blogs without authentication", async () => {
      await createTestBlog(testUser.id);

      const response = await request(app).get("/api/v1/blogs");

      expect(response.status).toBe(200);
      expect(response.body.blogs).toBeDefined();
      expect(response.body.pagination).toBeDefined();
    });

    test("should paginate blogs correctly", async () => {
      for (let i = 0; i < 5; i++) {
        await createTestBlog(testUser.id);
      }

      const response = await request(app).get("/api/v1/blogs?page=1&limit=2");

      expect(response.status).toBe(200);
      expect(response.body.blogs).toHaveLength(2);
      expect(response.body.pagination.total).toBe(5);
      expect(response.body.pagination.totalPages).toBe(3);
    });
  });

  describe("GET /api/v1/blogs/:id", () => {
    test("should get blog by ID without authentication", async () => {
      const blog = await createTestBlog(testUser.id);

      const response = await request(app).get(`/api/v1/blogs/${blog.id}`);

      expect(response.status).toBe(200);
      expect(response.body.blog).toBeDefined();
      expect(response.body.blog.id).toBe(blog.id);
      expect(response.body.blog.averageRating).toBeDefined();
    });

    test("should return 404 for non-existent blog", async () => {
      const response = await request(app).get("/api/v1/blogs/9999");

      expect(response.status).toBe(404);
      expect(response.body.error).toBe("Blog not found");
    });

    test("should return 400 for invalid ID", async () => {
      const response = await request(app).get("/api/v1/blogs/invalid");

      expect(response.status).toBe(400);
      expect(response.body.error).toBe("Invalid blog ID");
    });
  });

  describe("PUT /api/v1/blogs/:id", () => {
    test("should update own blog successfully", async () => {
      const blog = await createTestBlog(testUser.id);

      const response = await request(app)
        .put(`/api/v1/blogs/${blog.id}`)
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          title: "Updated Title",
          content: "Updated Content",
        });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe("Blog updated successfully");
      expect(response.body.blog.title).toBe("Updated Title");
    });

    test("should return 403 when trying to update someone else's blog", async () => {
      const otherUser = await createTestUser({
        username: "other",
        email: "other@example.com",
      });
      const blog = await createTestBlog(otherUser.id);

      const response = await request(app)
        .put(`/api/v1/blogs/${blog.id}`)
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          title: "Hacked Title",
        });

      expect(response.status).toBe(403);
      expect(response.body.error).toContain("Unauthorized");
    });
  });

  describe("DELETE /api/v1/blogs/:id", () => {
    test("should delete own blog successfully", async () => {
      const blog = await createTestBlog(testUser.id);

      const response = await request(app)
        .delete(`/api/v1/blogs/${blog.id}`)
        .set("Authorization", `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe("Blog deleted successfully");
    });

    test("should allow admin to delete any blog", async () => {
      const admin = await createTestUser({
        username: "admin",
        email: "admin@example.com",
        password: "admin123",
        role: "Admin",
      });
      const adminToken = await loginAndGetToken(
        "admin@example.com",
        "admin123"
      );
      const blog = await createTestBlog(testUser.id);

      const response = await request(app)
        .delete(`/api/v1/blogs/${blog.id}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe("Blog deleted successfully");
    });

    test("should return 403 when non-owner tries to delete", async () => {
      const otherUser = await createTestUser({
        username: "other",
        email: "other@example.com",
      });
      const blog = await createTestBlog(otherUser.id);

      const response = await request(app)
        .delete(`/api/v1/blogs/${blog.id}`)
        .set("Authorization", `Bearer ${accessToken}`);

      expect(response.status).toBe(403);
      expect(response.body.error).toContain("Unauthorized");
    });
  });
});
