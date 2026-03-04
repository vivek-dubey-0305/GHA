import express from "express";
import {
    getCourseMaterials,
    getMaterial,
    createMaterial,
    updateMaterial,
    deleteMaterial,
    publishMaterial,
    archiveMaterial,
    downloadMaterial,
    viewMaterial,
    searchMaterials
} from "../controllers/material.controller.js";
import { authenticateUser } from "../middlewares/user.auth.middleware.js";
import { authenticateInstructor } from "../middlewares/instructor.auth.middleware.js";

const router = express.Router();

// ===== Public/Authenticated Routes =====
router.get("/search", searchMaterials);
router.get("/course/:courseId", getCourseMaterials);
router.get("/:id", getMaterial);

// ===== User Routes (Protected) =====
router.patch("/:id/download", authenticateUser, downloadMaterial);
router.patch("/:id/view", authenticateUser, viewMaterial);

// ===== Instructor Routes (Protected) =====
router.post("/", authenticateInstructor, createMaterial);
router.put("/:id", authenticateInstructor, updateMaterial);
router.delete("/:id", authenticateInstructor, deleteMaterial);
router.patch("/:id/publish", authenticateInstructor, publishMaterial);
router.patch("/:id/archive", authenticateInstructor, archiveMaterial);

export default router;
