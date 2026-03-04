import express from "express";
import {
    getCourseProgress,
    getLessonProgress,
    updateLessonProgress,
    markLessonComplete,
    getMyLearningStats,
    getCourseStudentProgress
} from "../controllers/progress.controller.js";
import { authenticateUser } from "../middlewares/user.auth.middleware.js";
import { authenticateInstructor } from "../middlewares/instructor.auth.middleware.js";

const router = express.Router();

// ===== User Routes (Protected) =====
router.get("/course/:courseId", authenticateUser, getCourseProgress);
router.get("/lesson/:lessonId", authenticateUser, getLessonProgress);
router.post("/lesson/:lessonId", authenticateUser, updateLessonProgress);
router.patch("/lesson/:lessonId/complete", authenticateUser, markLessonComplete);
router.get("/stats", authenticateUser, getMyLearningStats);

// ===== Instructor Routes (Protected) =====
router.get("/instructor/course/:courseId", authenticateInstructor, getCourseStudentProgress);

export default router;
