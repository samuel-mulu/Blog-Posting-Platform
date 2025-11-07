import * as ratingService from "../../src/services/ratingService";
import {
  cleanDatabase,
  disconnectDatabase,
  createTestUser,
  createTestBlog,
  createTestRating,
} from "../helpers/testHelpers";

describe("Rating Service - Unit Tests", () => {
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

  describe("rateBlog()", () => {
    test("should create a new rating", async () => {
      const rating = await ratingService.rateBlog(testUser.id, testBlog.id, 5);

      expect(rating).toBeDefined();
      expect(rating.userId).toBe(testUser.id);
      expect(rating.blogId).toBe(testBlog.id);
      expect(rating.ratingValue).toBe(5);
    });

    test("should update existing rating (upsert)", async () => {
      await ratingService.rateBlog(testUser.id, testBlog.id, 3);
      const updated = await ratingService.rateBlog(testUser.id, testBlog.id, 5);

      expect(updated.ratingValue).toBe(5);
    });

    test("should throw error for invalid rating value", async () => {
      await expect(
        ratingService.rateBlog(testUser.id, testBlog.id, 0)
      ).rejects.toThrow("Rating must be between 1 and 5");

      await expect(
        ratingService.rateBlog(testUser.id, testBlog.id, 6)
      ).rejects.toThrow("Rating must be between 1 and 5");
    });

    test("should throw error if blog not found", async () => {
      await expect(
        ratingService.rateBlog(testUser.id, 9999, 5)
      ).rejects.toThrow("Blog not found");
    });
  });

  describe("getUserRatingForBlog()", () => {
    test("should return user's rating", async () => {
      await createTestRating(testUser.id, testBlog.id, 4);

      const rating = await ratingService.getUserRatingForBlog(
        testUser.id,
        testBlog.id
      );

      expect(rating).toBeDefined();
      expect(rating?.ratingValue).toBe(4);
    });

    test("should return null if user hasn't rated", async () => {
      const rating = await ratingService.getUserRatingForBlog(
        testUser.id,
        testBlog.id
      );

      expect(rating).toBeNull();
    });
  });

  describe("getBlogRatings()", () => {
    test("should return all ratings with stats", async () => {
      const user2 = await createTestUser({
        username: "user2",
        email: "user2@example.com",
      });
      const user3 = await createTestUser({
        username: "user3",
        email: "user3@example.com",
      });

      await createTestRating(testUser.id, testBlog.id, 5);
      await createTestRating(user2.id, testBlog.id, 4);
      await createTestRating(user3.id, testBlog.id, 3);

      const result = await ratingService.getBlogRatings(testBlog.id);

      expect(result.ratings).toHaveLength(3);
      expect(result.stats.total).toBe(3);
      expect(result.stats.average).toBe(4.0);
      expect(result.stats.distribution.five).toBe(1);
      expect(result.stats.distribution.four).toBe(1);
      expect(result.stats.distribution.three).toBe(1);
    });

    test("should return empty array if no ratings", async () => {
      const result = await ratingService.getBlogRatings(testBlog.id);

      expect(result.ratings).toHaveLength(0);
      expect(result.stats.total).toBe(0);
      expect(result.stats.average).toBe(0);
    });
  });

  describe("deleteRating()", () => {
    test("should delete rating successfully", async () => {
      await createTestRating(testUser.id, testBlog.id, 5);

      const result = await ratingService.deleteRating(testUser.id, testBlog.id);

      expect(result.message).toBe("Rating deleted successfully");
    });

    test("should throw error if rating not found", async () => {
      await expect(
        ratingService.deleteRating(testUser.id, testBlog.id)
      ).rejects.toThrow("Rating not found");
    });
  });
});
