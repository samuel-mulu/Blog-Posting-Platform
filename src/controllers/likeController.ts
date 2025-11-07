import { Response } from "express";
import { AuthRequest } from "../middlewares/authMiddleware";
import * as likeService from "../services/likeService";
import { notifyNewLike } from "../socket/events/notificationEvents";

/**
 * Toggle like on a blog (like/unlike)
 * POST /api/v1/blogs/:id/like
 * Authentication required
 */
export async function toggleLike(
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

    const result = await likeService.toggleLike(userId, blogId);

    // Emit real-time notification
    const io = req.app.get("io");
    if (io) {
      notifyNewLike(io, blogId, result);
    }

    res.json(result);
  } catch (err) {
    if (err instanceof Error && err.message === "Blog not found") {
      res.status(404).json({ error: "Blog not found" });
      return;
    }

    const message =
      err instanceof Error ? err.message : "Failed to toggle like";
    res.status(500).json({ error: message });
  }
}

/**
 * Get all users who liked a blog
 * GET /api/v1/blogs/:id/likes
 * Public endpoint
 */
export async function getBlogLikes(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const blogId = parseInt(req.params.id);

    if (isNaN(blogId)) {
      res.status(400).json({ error: "Invalid blog ID" });
      return;
    }

    const result = await likeService.getBlogLikes(blogId);

    res.json(result);
  } catch (err) {
    if (err instanceof Error && err.message === "Blog not found") {
      res.status(404).json({ error: "Blog not found" });
      return;
    }

    const message =
      err instanceof Error ? err.message : "Failed to fetch likes";
    res.status(500).json({ error: message });
  }
}

/**
 * Check if current user has liked a blog
 * GET /api/v1/blogs/:id/like/me
 * Authentication required
 */
export async function hasUserLikedBlog(
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

    const result = await likeService.hasUserLikedBlog(userId, blogId);

    res.json(result);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to check like status";
    res.status(500).json({ error: message });
  }
}

/**
 * Get all blogs liked by a user
 * GET /api/v1/users/:id/liked-blogs?page=1&limit=20
 * Public endpoint
 */
export async function getUserLikedBlogs(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const userId = parseInt(req.params.id);
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    if (isNaN(userId)) {
      res.status(400).json({ error: "Invalid user ID" });
      return;
    }

    if (page < 1 || limit < 1 || limit > 100) {
      res.status(400).json({ error: "Invalid pagination parameters" });
      return;
    }

    const result = await likeService.getUserLikedBlogs(userId, page, limit);

    res.json(result);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to fetch liked blogs";
    res.status(500).json({ error: message });
  }
}
