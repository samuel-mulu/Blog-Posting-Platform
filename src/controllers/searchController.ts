import { Request, Response } from "express";
import * as searchService from "../services/searchService";

export async function searchBlogs(req: Request, res: Response): Promise<void> {
  try {
    const query = req.query.q as string;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    if (!query || query.trim().length === 0) {
      res.status(400).json({ error: "Search query is required" });
      return;
    }

    if (page < 1 || limit < 1 || limit > 100) {
      res.status(400).json({ error: "Invalid pagination parameters" });
      return;
    }

    const result = await searchService.searchBlogs(query.trim(), page, limit);

    res.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Search failed";
    res.status(500).json({ error: message });
  }
}

export async function searchBlogsByTag(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const tagId = parseInt(req.params.tagId);
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    if (isNaN(tagId)) {
      res.status(400).json({ error: "Invalid tag ID" });
      return;
    }

    if (page < 1 || limit < 1 || limit > 100) {
      res.status(400).json({ error: "Invalid pagination parameters" });
      return;
    }

    const result = await searchService.searchBlogsByTag(tagId, page, limit);

    res.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Search failed";
    res.status(500).json({ error: message });
  }
}

export async function searchUsers(req: Request, res: Response): Promise<void> {
  try {
    const query = req.query.q as string;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    if (!query || query.trim().length === 0) {
      res.status(400).json({ error: "Search query is required" });
      return;
    }

    if (page < 1 || limit < 1 || limit > 100) {
      res.status(400).json({ error: "Invalid pagination parameters" });
      return;
    }

    const result = await searchService.searchUsers(query.trim(), page, limit);

    res.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Search failed";
    res.status(500).json({ error: message });
  }
}

export async function searchAll(req: Request, res: Response): Promise<void> {
  try {
    const query = req.query.q as string;

    if (!query || query.trim().length === 0) {
      res.status(400).json({ error: "Search query is required" });
      return;
    }

    const result = await searchService.searchAll(query.trim());

    res.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Search failed";
    res.status(500).json({ error: message });
  }
}
