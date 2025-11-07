/**
 * Example Test File
 * This verifies the test setup is working correctly
 */

import {
  cleanDatabase,
  disconnectDatabase,
  createTestUser,
} from "./helpers/testHelpers";

describe("Test Setup Verification", () => {
  // Clean database before each test
  beforeEach(async () => {
    await cleanDatabase();
  });

  // Close database connection after all tests
  afterAll(async () => {
    await disconnectDatabase();
  });

  /**
   * Basic Jest Test
   */
  test("should pass basic assertion", () => {
    expect(1 + 1).toBe(2);
    expect(true).toBeTruthy();
    expect("hello").toBe("hello");
  });

  /**
   * Async Test
   */
  test("should handle async operations", async () => {
    const promise = Promise.resolve("success");
    await expect(promise).resolves.toBe("success");
  });

  /**
   * Database Test
   */
  test("should create a test user in database", async () => {
    const user = await createTestUser({
      username: "testuser",
      email: "test@example.com",
      name: "Test User",
    });

    expect(user).toBeDefined();
    expect(user.id).toBeDefined();
    expect(user.username).toBe("testuser");
    expect(user.email).toBe("test@example.com");
    expect(user.name).toBe("Test User");
    expect(user.role).toBe("User");
  });

  /**
   * Environment Variables Test
   */
  test("should have test environment variables set", () => {
    expect(process.env.NODE_ENV).toBe("test");
    expect(process.env.ACCESS_TOKEN_SECRET).toBeDefined();
    expect(process.env.REFRESH_TOKEN_SECRET).toBeDefined();
    expect(process.env.DATABASE_URL).toBeDefined();
  });
});
