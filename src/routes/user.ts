import express from "express";
import * as userController from "../controllers/userController";
import * as commentController from "../controllers/commentController";
import * as likeController from "../controllers/likeController";
import { authenticateJWT } from "../middlewares/authMiddleware";

const router = express.Router();

// Public routes - anyone can view user profiles
router.get("/", userController.getAllUsers); // Get all users
router.get("/:id", userController.getUserById); // Get user by ID
router.get("/:id/comments", commentController.getUserComments); // Get user's comments
router.get("/:id/liked-blogs", likeController.getUserLikedBlogs); // Get user's liked blogs
router.get("/username/:username", userController.getUserByUsername); // Get user by username

// Protected routes - require authentication
router.get("/me/profile", authenticateJWT, userController.getMyProfile); // Get own profile
router.put("/profile", authenticateJWT, userController.updateProfile); // Update own profile
router.delete("/:id", authenticateJWT, userController.deleteUser); // Delete user account

export default router;
