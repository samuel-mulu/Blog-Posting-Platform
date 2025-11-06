import express from "express";
import * as blogController from "../controllers/blogController";
import { authenticateJWT } from "../middlewares/authMiddleware";

const router = express.Router();

// Public routes - anyone can read blogs
router.get("/", blogController.getAllBlogs); // Get all blogs
router.get("/:id", blogController.getBlogById); // Get single blog by ID

// Protected routes - require authentication
router.post("/", authenticateJWT, blogController.createBlog); // Create new blog
router.put("/:id", authenticateJWT, blogController.updateBlog); // Update blog
router.delete("/:id", authenticateJWT, blogController.deleteBlog); // Delete blog

export default router;
