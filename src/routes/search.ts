import express from "express";
import * as searchController from "../controllers/searchController";

const router = express.Router();

// All search routes are public
router.get("/", searchController.searchAll); // Search both blogs and users
router.get("/blogs", searchController.searchBlogs); // Search blogs only
router.get("/blogs/tag/:tagId", searchController.searchBlogsByTag); // Search blogs by tag
router.get("/users", searchController.searchUsers); // Search users only

export default router;
