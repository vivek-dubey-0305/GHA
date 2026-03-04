import express from "express";
import {
    getAssignments,
    getAssignment,
    createAssignment,
    updateAssignment,
    deleteAssignment
} from "../controllers/assignment.controller.js";
import { authenticateInstructor } from "../middlewares/instructor.auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = express.Router();

// ===== Public/Enrolled User Routes =====
router.get("/course/:courseId", getAssignments);
router.get("/:id", getAssignment);

// ===== Instructor Routes (Protected) =====
router.post("/", authenticateInstructor, upload.single("thumbnail"), createAssignment);
router.put("/:id", authenticateInstructor, upload.single("thumbnail"), updateAssignment);
router.delete("/:id", authenticateInstructor, deleteAssignment);

export default router;
