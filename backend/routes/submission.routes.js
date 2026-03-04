import express from "express";
import {
    createSubmission,
    getMySubmissions,
    getSubmission,
    getAssignmentSubmissions,
    gradeSubmission,
    returnSubmission
} from "../controllers/submission.controller.js";
import { authenticateUser } from "../middlewares/user.auth.middleware.js";
import { authenticateInstructor } from "../middlewares/instructor.auth.middleware.js";

const router = express.Router();

// ===== User Routes (Protected) =====
router.post("/", authenticateUser, createSubmission);
router.get("/my", authenticateUser, getMySubmissions);
router.get("/:id", authenticateUser, getSubmission);

// ===== Instructor Routes (Protected) =====
router.get("/assignment/:assignmentId", authenticateInstructor, getAssignmentSubmissions);
router.patch("/:id/grade", authenticateInstructor, gradeSubmission);
router.patch("/:id/return", authenticateInstructor, returnSubmission);

export default router;
