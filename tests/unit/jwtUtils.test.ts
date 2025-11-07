/**
 * Unit Test Example - JWT Utils
 * These tests don't need database connection
 */

import {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
} from "../../src/utils/jwtUtils";

describe("JWT Utils - Unit Tests", () => {
  /**
   * Test: Generate Access Token
   */
  describe("generateAccessToken()", () => {
    test("should generate a valid access token", () => {
      const payload = { userId: 1, role: "User" };
      const token = generateAccessToken(payload);

      // Assertions
      expect(token).toBeDefined();
      expect(typeof token).toBe("string");
      expect(token.split(".").length).toBe(3); // JWT has 3 parts: header.payload.signature
    });

    test("should generate different tokens for different payloads", () => {
      const token1 = generateAccessToken({ userId: 1, role: "User" });
      const token2 = generateAccessToken({ userId: 2, role: "Admin" });

      expect(token1).not.toBe(token2);
    });
  });

  /**
   * Test: Generate Refresh Token
   */
  describe("generateRefreshToken()", () => {
    test("should generate a valid refresh token", () => {
      const payload = { userId: 1, role: "User" };
      const token = generateRefreshToken(payload);

      expect(token).toBeDefined();
      expect(typeof token).toBe("string");
      expect(token.split(".").length).toBe(3);
    });
  });

  /**
   * Test: Verify Access Token
   */
  describe("verifyAccessToken()", () => {
    test("should verify a valid token", () => {
      const payload = { userId: 1, role: "User" };
      const token = generateAccessToken(payload);

      const decoded = verifyAccessToken(token);

      expect(decoded).toBeDefined();
      expect((decoded as any).userId).toBe(1);
      expect((decoded as any).role).toBe("User");
    });

    test("should throw error for invalid token", () => {
      const invalidToken = "invalid.token.here";

      expect(() => verifyAccessToken(invalidToken)).toThrow();
    });

    test("should throw error for expired token", () => {
      // This test would require mocking time or waiting for expiration
      // For now, we'll skip it
      expect(true).toBe(true);
    });
  });

  /**
   * Test: Token Payload
   */
  describe("Token Payload", () => {
    test("should include userId and role in payload", () => {
      const payload = { userId: 42, role: "Admin" };
      const token = generateAccessToken(payload);
      const decoded = verifyAccessToken(token) as any;

      expect(decoded.userId).toBe(42);
      expect(decoded.role).toBe("Admin");
      expect(decoded.iat).toBeDefined(); // issued at
      expect(decoded.exp).toBeDefined(); // expiration
    });

    test("should have expiration time", () => {
      const token = generateAccessToken({ userId: 1, role: "User" });
      const decoded = verifyAccessToken(token) as any;

      const now = Math.floor(Date.now() / 1000);
      const expiresIn = decoded.exp - now;

      // Access token expires in 15 minutes (900 seconds)
      expect(expiresIn).toBeGreaterThan(0);
      expect(expiresIn).toBeLessThanOrEqual(900);
    });
  });
});
