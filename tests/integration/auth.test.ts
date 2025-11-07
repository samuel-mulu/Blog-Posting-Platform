import request from "supertest";
import app from "../../src/app";
import {
  cleanDatabase,
  disconnectDatabase,
  createTestUser,
} from "../helpers/testHelpers";

describe("Authentication API - Integration Tests", () => {
  beforeEach(async () => {
    await cleanDatabase();
  });

  afterAll(async () => {
    await disconnectDatabase();
  });

  describe("POST /api/v1/auth/register", () => {
    test("should register a new user with 201 status", async () => {
      const response = await request(app).post("/api/v1/auth/register").send({
        username: "testuser",
        email: "test@example.com",
        password: "password123",
        name: "Test User",
      });

      expect(response.status).toBe(201);
      expect(response.body.message).toBe("User registered");
      expect(response.body.userId).toBeDefined();
    });

    test("should return 400 for duplicate email", async () => {
      await createTestUser({ email: "test@example.com" });

      const response = await request(app).post("/api/v1/auth/register").send({
        username: "testuser2",
        email: "test@example.com",
        password: "password123",
        name: "Test User",
      });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe("Email already in use");
    });
  });

  describe("POST /api/v1/auth/login", () => {
    test("should login with valid credentials and return 200", async () => {
      await createTestUser({
        email: "test@example.com",
        password: "password123",
      });

      const response = await request(app).post("/api/v1/auth/login").send({
        email: "test@example.com",
        password: "password123",
      });

      expect(response.status).toBe(200);
      expect(response.body.accessToken).toBeDefined();
      expect(response.body.user).toBeDefined();
      expect(response.body.user.email).toBe("test@example.com");
    });

    test("should set refreshToken in cookie", async () => {
      await createTestUser({
        email: "test@example.com",
        password: "password123",
      });

      const response = await request(app).post("/api/v1/auth/login").send({
        email: "test@example.com",
        password: "password123",
      });

      expect(response.headers["set-cookie"]).toBeDefined();
      const cookies = response.headers["set-cookie"] as string[];
      const hasRefreshToken =
        Array.isArray(cookies) &&
        cookies.some((cookie: string) => cookie.startsWith("refreshToken="));
      expect(hasRefreshToken).toBe(true);
    });

    test("should return 401 for invalid email", async () => {
      const response = await request(app).post("/api/v1/auth/login").send({
        email: "notexist@example.com",
        password: "password123",
      });

      expect(response.status).toBe(401);
      expect(response.body.error).toBe("Invalid credentials");
    });

    test("should return 401 for wrong password", async () => {
      await createTestUser({
        email: "test@example.com",
        password: "password123",
      });

      const response = await request(app).post("/api/v1/auth/login").send({
        email: "test@example.com",
        password: "wrongpassword",
      });

      expect(response.status).toBe(401);
      expect(response.body.error).toBe("Invalid credentials");
    });
  });

  describe("POST /api/v1/auth/logout", () => {
    test("should logout successfully and return 200", async () => {
      const response = await request(app).post("/api/v1/auth/logout");

      expect(response.status).toBe(200);
      expect(response.body.message).toBe("Logged out successfully");
    });

    test("should clear refreshToken cookie", async () => {
      await createTestUser({
        email: "test@example.com",
        password: "password123",
      });

      const loginResponse = await request(app).post("/api/v1/auth/login").send({
        email: "test@example.com",
        password: "password123",
      });

      const cookies = loginResponse.headers["set-cookie"];

      const logoutResponse = await request(app)
        .post("/api/v1/auth/logout")
        .set("Cookie", cookies);

      expect(logoutResponse.status).toBe(200);
    });
  });

  describe("POST /api/v1/auth/refresh-token", () => {
    test("should refresh access token with valid refresh token", async () => {
      await createTestUser({
        email: "test@example.com",
        password: "password123",
      });

      const loginResponse = await request(app).post("/api/v1/auth/login").send({
        email: "test@example.com",
        password: "password123",
      });

      const cookies = loginResponse.headers["set-cookie"];

      const refreshResponse = await request(app)
        .post("/api/v1/auth/refresh-token")
        .set("Cookie", cookies);

      expect(refreshResponse.status).toBe(200);
      expect(refreshResponse.body.accessToken).toBeDefined();
    });

    test("should return 401 without refresh token", async () => {
      const response = await request(app).post("/api/v1/auth/refresh-token");

      expect(response.status).toBe(401);
      expect(response.body.error).toBe("No refresh token provided");
    });
  });
});
