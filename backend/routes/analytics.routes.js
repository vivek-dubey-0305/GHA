import express from "express";
import {
    getInstructorOverview,
    getEnrollmentTrends,
    getCourseAnalytics,
    getRevenueTrends
} from "../controllers/analytics.controller.js";
import { authenticateInstructor } from "../middlewares/instructor.auth.middleware.js";

const router = express.Router();

router.use(authenticateInstructor);

router.get("/instructor/overview", getInstructorOverview);
router.get("/instructor/enrollments", getEnrollmentTrends);
router.get("/instructor/revenue", getRevenueTrends);
router.get("/instructor/course/:courseId", getCourseAnalytics);

export default router;
