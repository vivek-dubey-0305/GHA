import express from "express";
import {
    getLessons,
    getLesson,
    createLesson,
    updateLesson,
    deleteLesson,
    reorderLessons
} from "../controllers/lesson.controller.js";
import { authenticateInstructor } from "../middlewares/instructor.auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = express.Router();

// ===== Public Routes =====
router.get("/module/:moduleId", getLessons);
router.get("/:id", getLesson);

// ===== Instructor Routes (Protected) =====
router.post("/", authenticateInstructor, upload.single("thumbnail"), createLesson);
router.put("/:id", authenticateInstructor, upload.single("thumbnail"), updateLesson);
router.delete("/:id", authenticateInstructor, deleteLesson);
router.put("/module/:moduleId/reorder", authenticateInstructor, reorderLessons);

export default router;
