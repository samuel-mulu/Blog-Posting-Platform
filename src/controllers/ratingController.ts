import { Response } from "express";
import { AuthRequest } from "../middlewares/authMiddleware";
import * as ratingService from "../services/ratingService";

/**
 * Rate a blog (create or update rating)
 * POST /api/v1/blogs/:id/rating
 * Authentication required
 */
export async function rateBlog(req: AuthRequest, res: Response): Promise<void> {
  try {
    const blogId = parseInt(req.params.id);
    const { ratingValue } = req.body;

    if (isNaN(blogId)) {
      res.status(400).json({ error: "Invalid blog ID" });
      return;
    }

    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    // Validate rating value
    if (!ratingValue || typeof ratingValue !== "number") {
      res.status(400).json({ error: "Rating value is required (1-5)" });
      return;
    }

    const rating = await ratingService.rateBlog(userId, blogId, ratingValue);

    res.status(201).json({
      message: "Blog rated successfully",
      rating,
    });
  } catch (err) {
    if (err instanceof Error) {
      if (err.message === "Blog not found") {
        res.status(404).json({ error: "Blog not found" });
        return;
      }
      if (err.message.includes("Rating must be between")) {
        res.status(400).json({ error: err.message });
        return;
      }
    }

    const message = err instanceof Error ? err.message : "Failed to rate blog";
    res.status(500).json({ error: message });
  }
}

/**
 * Get user's rating for a blog
 * GET /api/v1/blogs/:id/rating/me
 * Authentication required
 */
export async function getMyRating(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const blogId = parseInt(req.params.id);

    if (isNaN(blogId)) {
      res.status(400).json({ error: "Invalid blog ID" });
      return;
    }

    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const rating = await ratingService.getUserRatingForBlog(userId, blogId);

    if (!rating) {
      res.json({ rating: null, message: "You haven't rated this blog yet" });
      return;
    }

    res.json({ rating });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to fetch rating";
    res.status(500).json({ error: message });
  }
}

/**
 * Get all ratings for a blog
 * GET /api/v1/blogs/:id/ratings
 * Public endpoint
 */
export async function getBlogRatings(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const blogId = parseInt(req.params.id);

    if (isNaN(blogId)) {
      res.status(400).json({ error: "Invalid blog ID" });
      return;
    }

    const result = await ratingService.getBlogRatings(blogId);

    res.json(result);
  } catch (err) {
    if (err instanceof Error && err.message === "Blog not found") {
      res.status(404).json({ error: "Blog not found" });
      return;
    }

    const message =
      err instanceof Error ? err.message : "Failed to fetch ratings";
    res.status(500).json({ error: message });
  }
}

/**
 * Delete user's rating
 * DELETE /api/v1/blogs/:id/rating
 * Authentication required
 */
export async function deleteRating(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const blogId = parseInt(req.params.id);

    if (isNaN(blogId)) {
      res.status(400).json({ error: "Invalid blog ID" });
      return;
    }

    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    await ratingService.deleteRating(userId, blogId);

    res.json({ message: "Rating deleted successfully" });
  } catch (err) {
    if (err instanceof Error && err.message === "Rating not found") {
      res.status(404).json({ error: "Rating not found" });
      return;
    }

    const message =
      err instanceof Error ? err.message : "Failed to delete rating";
    res.status(500).json({ error: message });
  }
}
