//enrollment.routes.js
import express from "express";
import {
    enrollInCourse,
    checkEnrollment,
    getCourseEnrollments,
    requestRefund,
    getEnrollmentById
} from "../controllers/enrollment.controller.js";
import { authenticateUser } from "../middlewares/user.auth.middleware.js";
import { authenticateInstructor } from "../middlewares/instructor.auth.middleware.js";

const router = express.Router();

// ===== User Routes (Protected) =====
router.post("/", authenticateUser, enrollInCourse);
router.get("/check/:courseId", authenticateUser, checkEnrollment);
router.get("/:id", authenticateUser, getEnrollmentById);
router.post("/:id/refund", authenticateUser, requestRefund);

// ===== Instructor Routes (Protected) =====
router.get("/course/:courseId", authenticateInstructor, getCourseEnrollments);

export default router;
