import { Response } from "express";
import { AuthRequest } from "../middlewares/authMiddleware";
import * as commentService from "../services/commentService";

/**
 * Create a comment on a blog
 * POST /api/v1/blogs/:id/comments
 * Authentication required
 */
export async function createComment(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const blogId = parseInt(req.params.id);
    const { content } = req.body;

    if (isNaN(blogId)) {
      res.status(400).json({ error: "Invalid blog ID" });
      return;
    }

    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    // Validate content
    if (!content || content.trim().length === 0) {
      res.status(400).json({ error: "Comment content is required" });
      return;
    }

    const comment = await commentService.createComment(userId, blogId, content);

    res.status(201).json({
      message: "Comment created successfully",
      comment,
    });
  } catch (err) {
    if (err instanceof Error && err.message === "Blog not found") {
      res.status(404).json({ error: "Blog not found" });
      return;
    }

    const message =
      err instanceof Error ? err.message : "Failed to create comment";
    res.status(500).json({ error: message });
  }
}

/**
 * Get all comments for a blog
 * GET /api/v1/blogs/:id/comments?page=1&limit=20
 * Public endpoint
 */
export async function getCommentsForBlog(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const blogId = parseInt(req.params.id);
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    if (isNaN(blogId)) {
      res.status(400).json({ error: "Invalid blog ID" });
      return;
    }

    if (page < 1 || limit < 1 || limit > 100) {
      res.status(400).json({ error: "Invalid pagination parameters" });
      return;
    }

    const result = await commentService.getCommentsForBlog(blogId, page, limit);

    res.json(result);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to fetch comments";
    res.status(500).json({ error: message });
  }
}

export async function getCommentById(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const commentId = parseInt(req.params.id);

    if (isNaN(commentId)) {
      res.status(400).json({ error: "Invalid comment ID" });
      return;
    }

    const comment = await commentService.getCommentById(commentId);

    res.json({ comment });
  } catch (err) {
    if (err instanceof Error && err.message === "Comment not found") {
      res.status(404).json({ error: "Comment not found" });
      return;
    }

    const message =
      err instanceof Error ? err.message : "Failed to fetch comment";
    res.status(500).json({ error: message });
  }
}

/**
 * Update a comment
 * PUT /api/v1/comments/:id
 * Authentication required - Only comment author can edit
 */
export async function updateComment(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const commentId = parseInt(req.params.id);
    const { content } = req.body;

    if (isNaN(commentId)) {
      res.status(400).json({ error: "Invalid comment ID" });
      return;
    }

    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    // Validate content
    if (!content || content.trim().length === 0) {
      res.status(400).json({ error: "Comment content is required" });
      return;
    }

    const updatedComment = await commentService.updateComment(
      commentId,
      userId,
      content
    );

    res.json({
      message: "Comment updated successfully",
      comment: updatedComment,
    });
  } catch (err) {
    if (err instanceof Error) {
      if (err.message === "Comment not found") {
        res.status(404).json({ error: "Comment not found" });
        return;
      }
      if (err.message.includes("Unauthorized")) {
        res.status(403).json({ error: err.message });
        return;
      }
    }

    const message =
      err instanceof Error ? err.message : "Failed to update comment";
    res.status(500).json({ error: message });
  }
}

export async function deleteComment(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const commentId = parseInt(req.params.id);

    if (isNaN(commentId)) {
      res.status(400).json({ error: "Invalid comment ID" });
      return;
    }

    const userId = req.user?.userId;
    const userRole = req.user?.role || "User";

    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    await commentService.deleteComment(commentId, userId, userRole);

    res.json({ message: "Comment deleted successfully" });
  } catch (err) {
    if (err instanceof Error) {
      if (err.message === "Comment not found") {
        res.status(404).json({ error: "Comment not found" });
        return;
      }
      if (err.message.includes("Unauthorized")) {
        res.status(403).json({ error: err.message });
        return;
      }
    }

    const message =
      err instanceof Error ? err.message : "Failed to delete comment";
    res.status(500).json({ error: message });
  }
}

export async function getUserComments(
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

    const result = await commentService.getUserComments(userId, page, limit);

    res.json(result);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to fetch user comments";
    res.status(500).json({ error: message });
  }
}
