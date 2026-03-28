import express from "express";
import {
    createSubmission,
    getMySubmissions,
    getSubmission,
    getAssignmentSubmissions,
    gradeSubmission,
    returnSubmission,
    reportSubmission,
    moderateSubmissionReport,
} from "../controllers/submission.controller.js";
import { authenticateUser } from "../middlewares/user.auth.middleware.js";
import { authenticateInstructor } from "../middlewares/instructor.auth.middleware.js";
import { verifyAdminToken } from "../middlewares/admin.auth.middleware.js";
import { assignmentSubmissionUpload, handleMulterError } from "../middlewares/multer.middleware.js";

const router = express.Router();

// ===== User Routes (Protected) =====
router.post("/assignment/:assignmentId", authenticateUser, assignmentSubmissionUpload.array("files", 50), handleMulterError, createSubmission);
router.post("/", authenticateUser, assignmentSubmissionUpload.array("files", 50), handleMulterError, createSubmission);
router.get("/my", authenticateUser, getMySubmissions);
router.get("/:id", authenticateUser, getSubmission);
router.get("/instructor/:id", authenticateInstructor, getSubmission);
router.get("/admin/:id", verifyAdminToken, getSubmission);

// ===== Instructor Routes (Protected) =====
router.get("/assignment/:assignmentId", authenticateInstructor, getAssignmentSubmissions);
router.patch("/:id/grade", authenticateInstructor, gradeSubmission);
router.patch("/:id/return", authenticateInstructor, returnSubmission);
router.patch("/:id/report", authenticateInstructor, assignmentSubmissionUpload.array("files", 10), handleMulterError, reportSubmission);

// ===== Admin Moderation Routes (Protected) =====
router.patch("/:id/moderate", verifyAdminToken, moderateSubmissionReport);

export default router;
