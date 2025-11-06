import express from "express";
import * as blogController from "../controllers/blogController";
import * as ratingController from "../controllers/ratingController";
import * as commentController from "../controllers/commentController";
import * as likeController from "../controllers/likeController";
import { authenticateJWT } from "../middlewares/authMiddleware";

const router = express.Router();

// Public routes - anyone can read
router.get("/", blogController.getAllBlogs); // Get all blogs
router.get("/:id", blogController.getBlogById); // Get single blog by ID
router.get("/:id/ratings", ratingController.getBlogRatings); // Get all ratings for a blog
router.get("/:id/comments", commentController.getCommentsForBlog); // Get all comments for a blog
router.get("/:id/likes", likeController.getBlogLikes); // Get all likes for a blog

// Protected routes - require authentication
router.post("/", authenticateJWT, blogController.createBlog); // Create new blog
router.put("/:id", authenticateJWT, blogController.updateBlog); // Update blog
router.delete("/:id", authenticateJWT, blogController.deleteBlog); // Delete blog

// Rating routes (protected)
router.post("/:id/rating", authenticateJWT, ratingController.rateBlog); // Rate a blog (1-5)
router.get("/:id/rating/me", authenticateJWT, ratingController.getMyRating); // Get my rating
router.delete("/:id/rating", authenticateJWT, ratingController.deleteRating); // Delete my rating

// Comment routes
router.post("/:id/comments", authenticateJWT, commentController.createComment); // Create comment (protected)

// Like routes
router.post("/:id/like", authenticateJWT, likeController.toggleLike); // Like/unlike blog (toggle)
router.get("/:id/like/me", authenticateJWT, likeController.hasUserLikedBlog); // Check if user liked blog

export default router;
