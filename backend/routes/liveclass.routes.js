import express from "express";
import {
    getUpcomingClasses,
    getLiveClass,
    createLiveClass,
    updateLiveClass,
    deleteLiveClass,
    startLiveClass,
    endLiveClass,
    registerForClass,
    markAttendance,
    getRtmpCredentials,
    getRecordingStatus
} from "../controllers/liveclass.controller.js";
import { authenticateUser } from "../middlewares/user.auth.middleware.js";
import { authenticateInstructor } from "../middlewares/instructor.auth.middleware.js";

const router = express.Router();

// ===== Public Routes =====
router.get("/upcoming", getUpcomingClasses);
router.get("/:id", getLiveClass);

// ===== User Routes (Protected) =====
router.post("/:id/register", authenticateUser, registerForClass);

// ===== Instructor Routes (Protected) =====
router.post("/", authenticateInstructor, createLiveClass);
router.put("/:id", authenticateInstructor, updateLiveClass);
router.delete("/:id", authenticateInstructor, deleteLiveClass);
router.patch("/:id/start", authenticateInstructor, startLiveClass);
router.patch("/:id/end", authenticateInstructor, endLiveClass);
router.post("/:id/attendance", authenticateInstructor, markAttendance);
router.get("/:id/rtmp", authenticateInstructor, getRtmpCredentials);
router.get("/:id/recording-status", authenticateInstructor, getRecordingStatus);

export default router;
