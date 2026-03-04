import express from "express";
import {
    getPublicVideoPackages,
    getVideoPackage,
    createVideoPackage,
    updateVideoPackage,
    deleteVideoPackage,
    addVideo,
    updateVideoStatus,
    incrementVideoViews,
    publishVideoPackage,
    unpublishVideoPackage,
    getSignedVideoUrl
} from "../controllers/videopackage.controller.js";
import { authenticateUser } from "../middlewares/user.auth.middleware.js";
import { authenticateInstructor } from "../middlewares/instructor.auth.middleware.js";

const router = express.Router();

// ===== Public Routes =====
router.get("/", getPublicVideoPackages);
router.get("/:id", getVideoPackage);

// ===== User Routes (Protected) =====
router.patch("/:id/views/:videoId", authenticateUser, incrementVideoViews);
router.get("/:id/signed-url/:videoId", authenticateUser, getSignedVideoUrl);

// ===== Instructor Routes (Protected) =====
router.post("/", authenticateInstructor, createVideoPackage);
router.put("/:id", authenticateInstructor, updateVideoPackage);
router.delete("/:id", authenticateInstructor, deleteVideoPackage);
router.post("/:id/videos", authenticateInstructor, addVideo);
router.put("/:id/videos/:videoId/status", authenticateInstructor, updateVideoStatus);
router.patch("/:id/publish", authenticateInstructor, publishVideoPackage);
router.patch("/:id/unpublish", authenticateInstructor, unpublishVideoPackage);

export default router;
