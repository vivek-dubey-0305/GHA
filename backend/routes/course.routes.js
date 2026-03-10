import express from "express";
import {
    getPublicCourses,
    getCourseDetails,
    getCourseReviews,
    getFullCourse,
    createFullCourse,
    updateFullCourse,
    deleteFullCourse,
    togglePublishCourse,
    getCourseStats
} from "../controllers/course.controller.js";
import { authenticateInstructor } from "../middlewares/instructor.auth.middleware.js";
import { upload, courseMediaUpload } from "../middlewares/multer.middleware.js";

const router = express.Router();

// ===== Public Routes =====
router.get("/", getPublicCourses);
router.get("/:id", getCourseDetails);
router.get("/:id/reviews", getCourseReviews);

// ===== Instructor Routes (Protected) =====
router.get("/:id/full", authenticateInstructor, getFullCourse);
router.post("/full", authenticateInstructor, courseMediaUpload.any(), createFullCourse);
router.put("/:id/full", authenticateInstructor, courseMediaUpload.any(), updateFullCourse);
router.delete("/:id/full", authenticateInstructor, deleteFullCourse);
router.patch("/:id/publish", authenticateInstructor, togglePublishCourse);
router.get("/:id/stats", authenticateInstructor, getCourseStats);

export default router;
