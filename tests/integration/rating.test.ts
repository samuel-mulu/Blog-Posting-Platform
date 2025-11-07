import request from "supertest";
import app from "../../src/app";
import {
  cleanDatabase,
  disconnectDatabase,
  createTestUser,
  createTestBlog,
} from "../helpers/testHelpers";
import { loginAndGetToken } from "../helpers/apiHelpers";

describe("Rating API - Integration Tests", () => {
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

  describe("POST /api/v1/blogs/:id/rating", () => {
    test("should rate blog successfully", async () => {
      const response = await request(app)
        .post(`/api/v1/blogs/${testBlog.id}/rating`)
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          ratingValue: 5,
        });

      expect(response.status).toBe(201);
      expect(response.body.message).toBe("Blog rated successfully");
      expect(response.body.rating.ratingValue).toBe(5);
    });

    test("should update existing rating (upsert)", async () => {
      await request(app)
        .post(`/api/v1/blogs/${testBlog.id}/rating`)
        .set("Authorization", `Bearer ${accessToken}`)
        .send({ ratingValue: 3 });

      const response = await request(app)
        .post(`/api/v1/blogs/${testBlog.id}/rating`)
        .set("Authorization", `Bearer ${accessToken}`)
        .send({ ratingValue: 5 });

      expect(response.status).toBe(201);
      expect(response.body.rating.ratingValue).toBe(5);
    });

    test("should return 400 for invalid rating value", async () => {
      const response = await request(app)
        .post(`/api/v1/blogs/${testBlog.id}/rating`)
        .set("Authorization", `Bearer ${accessToken}`)
        .send({ ratingValue: 10 });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain("between 1 and 5");
    });

    test("should return 401 without token", async () => {
      const response = await request(app)
        .post(`/api/v1/blogs/${testBlog.id}/rating`)
        .send({ ratingValue: 5 });

      expect(response.status).toBe(401);
    });
  });

  describe("GET /api/v1/blogs/:id/ratings", () => {
    test("should get all ratings without authentication", async () => {
      await request(app)
        .post(`/api/v1/blogs/${testBlog.id}/rating`)
        .set("Authorization", `Bearer ${accessToken}`)
        .send({ ratingValue: 5 });

      const response = await request(app).get(
        `/api/v1/blogs/${testBlog.id}/ratings`
      );

      expect(response.status).toBe(200);
      expect(response.body.ratings).toHaveLength(1);
      expect(response.body.stats.average).toBe(5);
      expect(response.body.stats.distribution).toBeDefined();
    });
  });

  describe("GET /api/v1/blogs/:id/rating/me", () => {
    test("should get user's rating", async () => {
      await request(app)
        .post(`/api/v1/blogs/${testBlog.id}/rating`)
        .set("Authorization", `Bearer ${accessToken}`)
        .send({ ratingValue: 4 });

      const response = await request(app)
        .get(`/api/v1/blogs/${testBlog.id}/rating/me`)
        .set("Authorization", `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.rating.ratingValue).toBe(4);
    });
  });
});
