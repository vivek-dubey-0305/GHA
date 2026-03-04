import express from "express";
import {
    getModules,
    getModule,
    createModule,
    updateModule,
    deleteModule,
    reorderModules
} from "../controllers/module.controller.js";
import { authenticateInstructor } from "../middlewares/instructor.auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = express.Router();

// ===== Public Routes =====
router.get("/course/:courseId", getModules);
router.get("/:id", getModule);

// ===== Instructor Routes (Protected) =====
router.post("/", authenticateInstructor, upload.single("thumbnail"), createModule);
router.put("/:id", authenticateInstructor, upload.single("thumbnail"), updateModule);
router.delete("/:id", authenticateInstructor, deleteModule);
router.put("/course/:courseId/reorder", authenticateInstructor, reorderModules);

export default router;
