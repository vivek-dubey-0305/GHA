import express from "express";
import { globalSearch } from "../controllers/search.controller.js";

const router = express.Router();

// @route   GET /api/v1/search
// @desc    Centralized global search for courses/instructors
// @access  Public
router.get("/", globalSearch);

export default router;
