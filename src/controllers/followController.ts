import { Response } from "express";
import { AuthRequest } from "../middlewares/authMiddleware";
import * as followService from "../services/followService";

/**
 * Toggle follow/unfollow a user
 * POST /api/v1/users/:id/follow
 * Authentication required
 */
export async function toggleFollow(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const userToFollowId = parseInt(req.params.id);

    if (isNaN(userToFollowId)) {
      res.status(400).json({ error: "Invalid user ID" });
      return;
    }

    const followerId = req.user?.userId;
    if (!followerId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const result = await followService.toggleFollow(followerId, userToFollowId);

    res.json(result);
  } catch (err) {
    if (err instanceof Error) {
      if (err.message === "User not found") {
        res.status(404).json({ error: "User not found" });
        return;
      }
      if (err.message === "You cannot follow yourself") {
        res.status(400).json({ error: err.message });
        return;
      }
    }

    const message =
      err instanceof Error ? err.message : "Failed to toggle follow";
    res.status(500).json({ error: message });
  }
}

/**
 * Get user's followers
 * GET /api/v1/users/:id/followers?page=1&limit=20
 * Public endpoint
 */
export async function getFollowers(
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

    const result = await followService.getFollowers(userId, page, limit);

    res.json(result);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to fetch followers";
    res.status(500).json({ error: message });
  }
}

/**
 * Get users that a user is following
 * GET /api/v1/users/:id/following?page=1&limit=20
 * Public endpoint
 */
export async function getFollowing(
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

    const result = await followService.getFollowing(userId, page, limit);

    res.json(result);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to fetch following";
    res.status(500).json({ error: message });
  }
}

/**
 * Check if current user is following another user
 * GET /api/v1/users/:id/follow/me
 * Authentication required
 */
export async function checkIfFollowing(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const userId = parseInt(req.params.id);

    if (isNaN(userId)) {
      res.status(400).json({ error: "Invalid user ID" });
      return;
    }

    const followerId = req.user?.userId;
    if (!followerId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const result = await followService.isFollowing(followerId, userId);

    res.json(result);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to check follow status";
    res.status(500).json({ error: message });
  }
}

/**
 * Get follow stats for a user
 * GET /api/v1/users/:id/follow-stats
 * Public endpoint
 */
export async function getFollowStats(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const userId = parseInt(req.params.id);

    if (isNaN(userId)) {
      res.status(400).json({ error: "Invalid user ID" });
      return;
    }

    const stats = await followService.getFollowStats(userId);

    res.json(stats);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to fetch follow stats";
    res.status(500).json({ error: message });
  }
}
