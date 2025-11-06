import { Response, Request } from "express";
import { AuthRequest } from "../middlewares/authMiddleware";
import * as userService from "../services/userService";

export async function getMyProfile(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const user = await userService.getUserProfile(userId);

    res.json({ user });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to fetch profile";
    res.status(500).json({ error: message });
  }
}

/**
 * Get user profile by ID
 * GET /api/v1/users/:id
 */
export async function getUserById(req: Request, res: Response): Promise<void> {
  try {
    const userId = parseInt(req.params.id);

    if (isNaN(userId)) {
      res.status(400).json({ error: "Invalid user ID" });
      return;
    }

    const user = await userService.getUserProfile(userId);

    res.json({ user });
  } catch (err) {
    if (err instanceof Error && err.message === "User not found") {
      res.status(404).json({ error: "User not found" });
      return;
    }

    const message = err instanceof Error ? err.message : "Failed to fetch user";
    res.status(500).json({ error: message });
  }
}

/**
 * Get user profile by username
 * GET /api/v1/users/username/:username
 */
export async function getUserByUsername(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { username } = req.params;

    const user = await userService.getUserByUsername(username);

    res.json({ user });
  } catch (err) {
    if (err instanceof Error && err.message === "User not found") {
      res.status(404).json({ error: "User not found" });
      return;
    }

    const message = err instanceof Error ? err.message : "Failed to fetch user";
    res.status(500).json({ error: message });
  }
}

/**
 * Update user profile
 * PUT /api/v1/users/profile
 */
export async function updateProfile(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const { name, bio, username } = req.body;

    // Validate at least one field is provided
    if (!name && !bio && !username) {
      res.status(400).json({
        error: "At least one field (name, bio, username) must be provided",
      });
      return;
    }

    const updatedUser = await userService.updateUserProfile(userId, {
      name,
      bio,
      username,
    });

    res.json({
      message: "Profile updated successfully",
      user: updatedUser,
    });
  } catch (err) {
    if (err instanceof Error && err.message === "Username already taken") {
      res.status(400).json({ error: "Username already taken" });
      return;
    }

    const message =
      err instanceof Error ? err.message : "Failed to update profile";
    res.status(500).json({ error: message });
  }
}

/**
 * Get all users (with pagination)
 * GET /api/v1/users?page=1&limit=10
 */
export async function getAllUsers(req: Request, res: Response): Promise<void> {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    // Validate pagination
    if (page < 1 || limit < 1 || limit > 100) {
      res.status(400).json({ error: "Invalid pagination parameters" });
      return;
    }

    const result = await userService.getAllUsers(page, limit);

    res.json(result);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to fetch users";
    res.status(500).json({ error: message });
  }
}

/**
 * Delete user account
 * DELETE /api/v1/users/:id
 */
export async function deleteUser(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const userIdToDelete = parseInt(req.params.id);

    if (isNaN(userIdToDelete)) {
      res.status(400).json({ error: "Invalid user ID" });
      return;
    }

    const requestingUserId = req.user?.userId;
    const requestingUserRole = req.user?.role || "User";

    if (!requestingUserId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    await userService.deleteUser(
      userIdToDelete,
      requestingUserId,
      requestingUserRole
    );

    res.json({ message: "User account deleted successfully" });
  } catch (err) {
    if (err instanceof Error) {
      if (err.message === "User not found") {
        res.status(404).json({ error: "User not found" });
        return;
      }
      if (err.message.includes("Unauthorized")) {
        res.status(403).json({ error: err.message });
        return;
      }
    }

    const message =
      err instanceof Error ? err.message : "Failed to delete user";
    res.status(500).json({ error: message });
  }
}
