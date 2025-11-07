import request from "supertest";
import app from "../../src/app";
import {
  cleanDatabase,
  disconnectDatabase,
  createTestUser,
  createTestBlog,
} from "../helpers/testHelpers";
import { loginAndGetToken } from "../helpers/apiHelpers";

describe("Like API - Integration Tests", () => {
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

  describe("POST /api/v1/blogs/:id/like", () => {
    test("should like blog successfully (toggle to true)", async () => {
      const response = await request(app)
        .post(`/api/v1/blogs/${testBlog.id}/like`)
        .set("Authorization", `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.liked).toBe(true);
      expect(response.body.message).toBe("Blog liked successfully");
    });

    test("should unlike blog (toggle to false)", async () => {
      await request(app)
        .post(`/api/v1/blogs/${testBlog.id}/like`)
        .set("Authorization", `Bearer ${accessToken}`);

      const response = await request(app)
        .post(`/api/v1/blogs/${testBlog.id}/like`)
        .set("Authorization", `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.liked).toBe(false);
      expect(response.body.message).toBe("Blog unliked successfully");
    });

    test("should toggle like multiple times", async () => {
      const like1 = await request(app)
        .post(`/api/v1/blogs/${testBlog.id}/like`)
        .set("Authorization", `Bearer ${accessToken}`);
      expect(like1.body.liked).toBe(true);

      const unlike = await request(app)
        .post(`/api/v1/blogs/${testBlog.id}/like`)
        .set("Authorization", `Bearer ${accessToken}`);
      expect(unlike.body.liked).toBe(false);

      const like2 = await request(app)
        .post(`/api/v1/blogs/${testBlog.id}/like`)
        .set("Authorization", `Bearer ${accessToken}`);
      expect(like2.body.liked).toBe(true);
    });

    test("should return 401 without token", async () => {
      const response = await request(app).post(
        `/api/v1/blogs/${testBlog.id}/like`
      );

      expect(response.status).toBe(401);
    });
  });

  describe("GET /api/v1/blogs/:id/likes", () => {
    test("should get all likes without authentication", async () => {
      await request(app)
        .post(`/api/v1/blogs/${testBlog.id}/like`)
        .set("Authorization", `Bearer ${accessToken}`);

      const response = await request(app).get(
        `/api/v1/blogs/${testBlog.id}/likes`
      );

      expect(response.status).toBe(200);
      expect(response.body.likes).toHaveLength(1);
      expect(response.body.total).toBe(1);
    });
  });

  describe("GET /api/v1/blogs/:id/like/me", () => {
    test("should return true if user liked blog", async () => {
      await request(app)
        .post(`/api/v1/blogs/${testBlog.id}/like`)
        .set("Authorization", `Bearer ${accessToken}`);

      const response = await request(app)
        .get(`/api/v1/blogs/${testBlog.id}/like/me`)
        .set("Authorization", `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.liked).toBe(true);
    });

    test("should return false if user hasn't liked blog", async () => {
      const response = await request(app)
        .get(`/api/v1/blogs/${testBlog.id}/like/me`)
        .set("Authorization", `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.liked).toBe(false);
    });
  });
});
