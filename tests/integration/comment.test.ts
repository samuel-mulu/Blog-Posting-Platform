import request from "supertest";
import app from "../../src/app";
import {
  cleanDatabase,
  disconnectDatabase,
  createTestUser,
  createTestBlog,
  createTestComment,
} from "../helpers/testHelpers";
import { loginAndGetToken } from "../helpers/apiHelpers";

describe("Comment API - Integration Tests", () => {
  let testUser: any;
  let testBlog: any;
  let accessToken: string;

  beforeEach(async () => {
    await cleanDatabase();
    testUser = await createTestUser({
      email: "test@example.com",
      password: "password123",
    });
    testBlog = await createTestBlog(testUser.id);
    accessToken = await loginAndGetToken("test@example.com", "password123");
  });

  afterAll(async () => {
    await disconnectDatabase();
  });

  describe("POST /api/v1/blogs/:id/comments", () => {
    test("should create comment with authentication", async () => {
      const response = await request(app)
        .post(`/api/v1/blogs/${testBlog.id}/comments`)
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          content: "Great blog post!",
        });

      expect(response.status).toBe(201);
      expect(response.body.message).toBe("Comment created successfully");
      expect(response.body.comment.content).toBe("Great blog post!");
      expect(response.body.comment.userId).toBe(testUser.id);
    });

    test("should return 401 without token", async () => {
      const response = await request(app)
        .post(`/api/v1/blogs/${testBlog.id}/comments`)
        .send({
          content: "Comment",
        });

      expect(response.status).toBe(401);
    });

    test("should return 404 for non-existent blog", async () => {
      const response = await request(app)
        .post("/api/v1/blogs/9999/comments")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          content: "Comment",
        });

      expect(response.status).toBe(404);
      expect(response.body.error).toBe("Blog not found");
    });
  });

  describe("GET /api/v1/blogs/:id/comments", () => {
    test("should get all comments without authentication", async () => {
      await createTestComment(testUser.id, testBlog.id, "Comment 1");
      await createTestComment(testUser.id, testBlog.id, "Comment 2");

      const response = await request(app).get(
        `/api/v1/blogs/${testBlog.id}/comments`
      );

      expect(response.status).toBe(200);
      expect(response.body.comments).toHaveLength(2);
      expect(response.body.pagination).toBeDefined();
    });
  });

  describe("PUT /api/v1/comments/:id", () => {
    test("should update own comment", async () => {
      const comment = await createTestComment(
        testUser.id,
        testBlog.id,
        "Original"
      );

      const response = await request(app)
        .put(`/api/v1/comments/${comment.id}`)
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          content: "Updated content",
        });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe("Comment updated successfully");
      expect(response.body.comment.content).toBe("Updated content");
    });

    test("should return 403 when updating someone else's comment", async () => {
      const otherUser = await createTestUser({
        username: "other",
        email: "other@example.com",
      });
      const comment = await createTestComment(
        otherUser.id,
        testBlog.id,
        "Test"
      );

      const response = await request(app)
        .put(`/api/v1/comments/${comment.id}`)
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          content: "Hacked",
        });

      expect(response.status).toBe(403);
    });
  });

  describe("DELETE /api/v1/comments/:id", () => {
    test("should delete own comment", async () => {
      const comment = await createTestComment(testUser.id, testBlog.id, "Test");

      const response = await request(app)
        .delete(`/api/v1/comments/${comment.id}`)
        .set("Authorization", `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe("Comment deleted successfully");
    });

    test("should allow admin to delete any comment", async () => {
      const comment = await createTestComment(testUser.id, testBlog.id, "Test");
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

      const response = await request(app)
        .delete(`/api/v1/comments/${comment.id}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
    });
  });
});
