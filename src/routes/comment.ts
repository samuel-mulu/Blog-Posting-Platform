import express from "express";
import * as commentController from "../controllers/commentController";
import { authenticateJWT } from "../middlewares/authMiddleware";

const router = express.Router();

// Public routes
router.get("/:id", commentController.getCommentById); // Get single comment by ID

// Protected routes - require authentication
router.put("/:id", authenticateJWT, commentController.updateComment); // Update comment (author only)
router.delete("/:id", authenticateJWT, commentController.deleteComment); // Delete comment (author/admin)

export default router;
