import { Response } from "express";
import { AuthRequest } from "../middlewares/authMiddleware";
import * as blogService from "../services/blogService";

export async function createBlog(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const { title, content, tagId } = req.body;

    // Validate required fields
    if (!title || !content) {
      res.status(400).json({ error: "Title and content are required" });
      return;
    }

    // Get user ID from authenticated request
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const blog = await blogService.createBlog(userId, {
      title,
      content,
      tagId: tagId ? parseInt(tagId) : undefined,
    });

    res.status(201).json({
      message: "Blog created successfully",
      blog,
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to create blog";
    res.status(500).json({ error: message });
  }
}

/**
 * Get all blogs with pagination
 * GET /api/v1/blogs?page=1&limit=10
 * Public endpoint
 */
export async function getAllBlogs(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    // Validate pagination parameters
    if (page < 1 || limit < 1 || limit > 100) {
      res.status(400).json({ error: "Invalid pagination parameters" });
      return;
    }

    const result = await blogService.getAllBlogs(page, limit);

    res.json(result);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to fetch blogs";
    res.status(500).json({ error: message });
  }
}

/**
 * Get a single blog by ID
 * GET /api/v1/blogs/:id
 * Public endpoint
 */
export async function getBlogById(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const blogId = parseInt(req.params.id);

    if (isNaN(blogId)) {
      res.status(400).json({ error: "Invalid blog ID" });
      return;
    }

    const blog = await blogService.getBlogById(blogId);

    res.json({ blog });
  } catch (err) {
    if (err instanceof Error && err.message === "Blog not found") {
      res.status(404).json({ error: "Blog not found" });
      return;
    }

    const message = err instanceof Error ? err.message : "Failed to fetch blog";
    res.status(500).json({ error: message });
  }
}

/**
 * Update a blog post
 * PUT /api/v1/blogs/:id
 * Authentication required - Only blog author can update
 */
export async function updateBlog(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const blogId = parseInt(req.params.id);
    const { title, content, tagId } = req.body;

    if (isNaN(blogId)) {
      res.status(400).json({ error: "Invalid blog ID" });
      return;
    }

    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const updatedBlog = await blogService.updateBlog(blogId, userId, {
      title,
      content,
      tagId: tagId ? parseInt(tagId) : undefined,
    });

    res.json({
      message: "Blog updated successfully",
      blog: updatedBlog,
    });
  } catch (err) {
    if (err instanceof Error) {
      if (err.message === "Blog not found") {
        res.status(404).json({ error: "Blog not found" });
        return;
      }
      if (err.message.includes("Unauthorized")) {
        res.status(403).json({ error: err.message });
        return;
      }
    }

    const message =
      err instanceof Error ? err.message : "Failed to update blog";
    res.status(500).json({ error: message });
  }
}

/**
 * Delete a blog post
 * DELETE /api/v1/blogs/:id
 * Authentication required - Only blog author or admin can delete
 */
export async function deleteBlog(
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
    const userRole = req.user?.role || "User";

    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    await blogService.deleteBlog(blogId, userId, userRole);

    res.json({ message: "Blog deleted successfully" });
  } catch (err) {
    if (err instanceof Error) {
      if (err.message === "Blog not found") {
        res.status(404).json({ error: "Blog not found" });
        return;
      }
      if (err.message.includes("Unauthorized")) {
        res.status(403).json({ error: err.message });
        return;
      }
    }

    const message =
      err instanceof Error ? err.message : "Failed to delete blog";
    res.status(500).json({ error: message });
  }
}
