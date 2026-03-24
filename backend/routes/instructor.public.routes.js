import express from "express";
import {
  getAllInstructorsPublic,
  searchInstructorsPublic,
  getInstructorByIdPublic,
  getInstructorReviewsPublic
} from "../controllers/instructor.public.controller.js";

const router = express.Router();

// ===== Public Routes - No Authentication Required =====

// @route   GET /api/v1/public/instructors
// @desc    Get all instructors with filters and pagination
// @access  Public
router.get("/", getAllInstructorsPublic);

// @route   GET /api/v1/public/instructors/search
// @desc    Search instructors publicly
// @access  Public
router.get("/search", searchInstructorsPublic);

// @route   GET /api/v1/public/instructors/:id
// @desc    Get single instructor by ID
// @access  Public
router.get("/:id", getInstructorByIdPublic);

// @route   GET /api/v1/public/instructors/:id/reviews
// @desc    Get instructor reviews
// @access  Public
router.get("/:id/reviews", getInstructorReviewsPublic);

export default router;
