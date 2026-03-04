import express from "express";
import {
    getPublicCourses,
    getCourseDetails,
    getCourseReviews,
    createCourse,
    updateCourse,
    deleteCourse,
    togglePublishCourse,
    getCourseStats
} from "../controllers/course.controller.js";
import { authenticateInstructor } from "../middlewares/instructor.auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = express.Router();

// ===== Public Routes =====
router.get("/", getPublicCourses);
router.get("/:id", getCourseDetails);
router.get("/:id/reviews", getCourseReviews);

// ===== Instructor Routes (Protected) =====
router.post("/", authenticateInstructor, upload.single("thumbnail"), createCourse);
router.put("/:id", authenticateInstructor, upload.single("thumbnail"), updateCourse);
router.delete("/:id", authenticateInstructor, deleteCourse);
router.patch("/:id/publish", authenticateInstructor, togglePublishCourse);
router.get("/:id/stats", authenticateInstructor, getCourseStats);

export default router;
