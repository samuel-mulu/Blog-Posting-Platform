import * as authService from "../../src/services/authService";
import { PrismaClient } from "../../src/generated/prisma";
import bcrypt from "bcrypt";
import {
  cleanDatabase,
  disconnectDatabase,
  createTestUser,
} from "../helpers/testHelpers";

const prisma = new PrismaClient();

describe("Auth Service - Unit Tests", () => {
  beforeEach(async () => {
    await cleanDatabase();
  });

  afterAll(async () => {
    await disconnectDatabase();
  });

  describe("registerUser()", () => {
    test("should register a new user successfully", async () => {
      const userData = {
        username: "newuser",
        email: "new@example.com",
        password: "password123",
        name: "New User",
      };

      const user = await authService.registerUser(userData);

      expect(user).toBeDefined();
      expect(user.id).toBeDefined();
      expect(user.username).toBe("newuser");
      expect(user.email).toBe("new@example.com");
      expect(user.name).toBe("New User");
      expect(user.password).not.toBe("password123");
    });

    test("should hash password before saving", async () => {
      const userData = {
        username: "testuser",
        email: "test@example.com",
        password: "password123",
        name: "Test User",
      };

      const user = await authService.registerUser(userData);
      const isPasswordHashed = await bcrypt.compare(
        "password123",
        user.password
      );

      expect(isPasswordHashed).toBe(true);
      expect(user.password).not.toBe("password123");
    });

    test("should throw error if email already exists", async () => {
      const userData = {
        username: "testuser",
        email: "test@example.com",
        password: "password123",
        name: "Test User",
      };

      await authService.registerUser(userData);

      const duplicateUser = {
        username: "testuser2",
        email: "test@example.com",
        password: "password123",
        name: "Test User 2",
      };

      await expect(authService.registerUser(duplicateUser)).rejects.toThrow(
        "Email already in use"
      );
    });

    test("should create user with default role 'User'", async () => {
      const userData = {
        username: "testuser",
        email: "test@example.com",
        password: "password123",
        name: "Test User",
      };

      const user = await authService.registerUser(userData);

      expect(user.role).toBe("User");
    });
  });

  describe("loginUser()", () => {
    test("should login with valid credentials", async () => {
      await createTestUser({
        email: "test@example.com",
        password: "password123",
      });

      const result = await authService.loginUser(
        "test@example.com",
        "password123"
      );

      expect(result).toBeDefined();
      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
      expect(result.user).toBeDefined();
      expect(result.user.email).toBe("test@example.com");
    });

    test("should throw error for invalid email", async () => {
      await expect(
        authService.loginUser("notexist@example.com", "password123")
      ).rejects.toThrow("Invalid credentials");
    });

    test("should throw error for wrong password", async () => {
      await createTestUser({
        email: "test@example.com",
        password: "password123",
      });

      await expect(
        authService.loginUser("test@example.com", "wrongpassword")
      ).rejects.toThrow("Invalid credentials");
    });

    test("should return access token and refresh token", async () => {
      await createTestUser({
        email: "test@example.com",
        password: "password123",
      });

      const result = await authService.loginUser(
        "test@example.com",
        "password123"
      );

      expect(result.accessToken.split(".").length).toBe(3);
      expect(result.refreshToken.split(".").length).toBe(3);
      expect(result.accessToken).not.toBe(result.refreshToken);
    });
  });

  describe("refreshAccessToken()", () => {
    test("should generate new access token from valid refresh token", async () => {
      const user = await createTestUser({
        email: "test@example.com",
        password: "password123",
      });

      const loginResult = await authService.loginUser(
        "test@example.com",
        "password123"
      );
      const newAccessToken = await authService.refreshAccessToken(
        loginResult.refreshToken
      );

      expect(newAccessToken).toBeDefined();
      expect(typeof newAccessToken).toBe("string");
      expect(newAccessToken.split(".").length).toBe(3);
    });

    test("should throw error for invalid refresh token", async () => {
      const invalidToken = "invalid.token.here";

      await expect(
        authService.refreshAccessToken(invalidToken)
      ).rejects.toThrow("Invalid refresh token");
    });

    test("should throw error if refresh token secret not set", async () => {
      const originalSecret = process.env.REFRESH_TOKEN_SECRET;
      delete process.env.REFRESH_TOKEN_SECRET;

      const user = await createTestUser({
        email: "test@example.com",
        password: "password123",
      });

      const loginResult = await authService.loginUser(
        "test@example.com",
        "password123"
      );

      await expect(
        authService.refreshAccessToken(loginResult.refreshToken)
      ).rejects.toThrow();

      process.env.REFRESH_TOKEN_SECRET = originalSecret;
    });
  });
});
