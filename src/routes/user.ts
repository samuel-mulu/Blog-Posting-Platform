import express from "express";
import * as userController from "../controllers/userController";
import * as commentController from "../controllers/commentController";
import * as likeController from "../controllers/likeController";
import * as followController from "../controllers/followController";
import { authenticateJWT } from "../middlewares/authMiddleware";

const router = express.Router();

// Public routes - anyone can view user profiles
router.get("/", userController.getAllUsers); // Get all users
router.get("/:id", userController.getUserById); // Get user by ID
router.get("/:id/comments", commentController.getUserComments); // Get user's comments
router.get("/:id/liked-blogs", likeController.getUserLikedBlogs); // Get user's liked blogs
router.get("/:id/followers", followController.getFollowers); // Get user's followers
router.get("/:id/following", followController.getFollowing); // Get users being followed
router.get("/:id/follow-stats", followController.getFollowStats); // Get follower/following counts
router.get("/username/:username", userController.getUserByUsername); // Get user by username

// Protected routes - require authentication
router.get("/me/profile", authenticateJWT, userController.getMyProfile); // Get own profile
router.put("/profile", authenticateJWT, userController.updateProfile); // Update own profile
router.delete("/:id", authenticateJWT, userController.deleteUser); // Delete user account

// Follow routes (protected)
router.post("/:id/follow", authenticateJWT, followController.toggleFollow); // Follow/Unfollow toggle
router.get(
  "/:id/follow/me",
  authenticateJWT,
  followController.checkIfFollowing
); // Check if following

export default router;
