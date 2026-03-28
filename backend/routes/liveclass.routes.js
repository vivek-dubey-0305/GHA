//liveclass.routes.js
import express from "express";
import {
    // Public
    getUpcomingClasses,
    // Instructor
    getMyLiveClasses,
    getAvailableInstructors,
    getStreamCredentials,
    getObsConfig,
    getLiveClass,
    createLiveClassByInstructor,
    createInstantSession,
    updateLiveClass,
    deleteLiveClassByInstructor,
    startLiveClass,
    endLiveClass,
    getRtmpCredentials,
    getRecordingStatus,
    joinAsInstructor,
    checkStreamStatus,
    checkInstructorConnection,
    getEnrolledStudents,
    requestAdminCall,
    testSignedPlayback,
    // User (Student)
    getMyLiveClassesForUser,
    joinLiveClass,
    leaveLiveClass,
    setLiveClassReminder,
    // Chat & Interactions
    sendChatMessage,
    getChatHistory,
    raiseHand,
    lowerHand,
    pinMessage,
    toggleChat,
    getParticipants,
    getParticipantsForUser,
    // Admin
    getAllLiveClassesAdmin,
    getLiveClassAdmin,
    createLiveClassByAdmin,
    updateLiveClassByAdmin,
    deleteLiveClassByAdmin,
    endLiveClassByAdmin,
    cancelLiveClassByAdmin,
    joinAsAdmin,
    getLiveClassStats,
    // Shared
    markAttendance,
} from "../controllers/liveclass.controller.js";
import { authenticateUser } from "../middlewares/user.auth.middleware.js";
import { authenticateInstructor } from "../middlewares/instructor.auth.middleware.js";
import { verifyAdminToken } from "../middlewares/admin.auth.middleware.js";

const router = express.Router();

// ══════════════════════════════════════
// PUBLIC ROUTES
// ══════════════════════════════════════
router.get("/upcoming", getUpcomingClasses);

// ══════════════════════════════════════
// INSTRUCTOR ROUTES
// ══════════════════════════════════════
router.get("/my", authenticateInstructor, getMyLiveClasses);
router.get("/available-instructors", authenticateInstructor, getAvailableInstructors);
router.get("/stream-credentials", authenticateInstructor, getStreamCredentials);
router.get("/obs-config", authenticateInstructor, getObsConfig);
router.get("/check-connection", authenticateInstructor, checkInstructorConnection);
router.get("/enrolled-students/:courseId", authenticateInstructor, getEnrolledStudents);
router.post("/", authenticateInstructor, createLiveClassByInstructor);
router.post("/instant", authenticateInstructor, createInstantSession);
router.post("/request-admin-call", authenticateInstructor, requestAdminCall);
router.put("/:id", authenticateInstructor, updateLiveClass);
router.delete("/:id", authenticateInstructor, deleteLiveClassByInstructor);
router.patch("/:id/start", authenticateInstructor, startLiveClass);
router.patch("/:id/end", authenticateInstructor, endLiveClass);
router.get("/:id/rtmp", authenticateInstructor, getRtmpCredentials);
router.get("/:id/recording", authenticateInstructor, getRecordingStatus);
router.get("/:id/stream-status", authenticateInstructor, checkStreamStatus);
router.get("/:id/test-playback", authenticateInstructor, testSignedPlayback);
router.post("/:id/join-instructor", authenticateInstructor, joinAsInstructor);
router.get("/:id/participants", authenticateInstructor, getParticipants);
router.post("/:id/attendance", authenticateInstructor, markAttendance);
router.patch("/:id/toggle-chat", authenticateInstructor, toggleChat);
router.patch("/:id/lower-hand/:userId", authenticateInstructor, lowerHand);
router.post("/:id/pin-message", authenticateInstructor, pinMessage);
// Chat & interaction routes for instructors (same controllers support multi-role)
router.post("/:id/chat-instructor", authenticateInstructor, sendChatMessage);
router.get("/:id/chat-instructor", authenticateInstructor, getChatHistory);
router.post("/:id/raise-hand-instructor", authenticateInstructor, raiseHand);

// ══════════════════════════════════════
// USER (STUDENT) ROUTES
// ══════════════════════════════════════
router.get("/my-user", authenticateUser, getMyLiveClassesForUser);
router.post("/:id/join", authenticateUser, joinLiveClass);
router.post("/:id/leave", authenticateUser, leaveLiveClass);
router.post("/:id/reminders", authenticateUser, setLiveClassReminder);
router.get("/:id/participants-user", authenticateUser, getParticipantsForUser);

// ══════════════════════════════════════
// CHAT & INTERACTION (Multi-role)
// ══════════════════════════════════════
// Chat routes accept user, instructor, or admin tokens
router.post("/:id/chat", authenticateUser, sendChatMessage);
router.get("/:id/chat", authenticateUser, getChatHistory);
router.post("/:id/raise-hand", authenticateUser, raiseHand);

// ══════════════════════════════════════
// ADMIN ROUTES
// ══════════════════════════════════════
router.get("/admin/stats", verifyAdminToken, getLiveClassStats);
router.get("/admin/all", verifyAdminToken, getAllLiveClassesAdmin);
router.get("/admin/:id", verifyAdminToken, getLiveClassAdmin);
router.post("/admin", verifyAdminToken, createLiveClassByAdmin);
router.put("/admin/:id", verifyAdminToken, updateLiveClassByAdmin);
router.delete("/admin/:id", verifyAdminToken, deleteLiveClassByAdmin);
router.patch("/admin/:id/end", verifyAdminToken, endLiveClassByAdmin);
router.patch("/admin/:id/cancel", verifyAdminToken, cancelLiveClassByAdmin);
router.post("/admin/:id/join", verifyAdminToken, joinAsAdmin);
router.post("/admin/:id/attendance", verifyAdminToken, markAttendance);
router.get("/admin/:id/participants", verifyAdminToken, getParticipants);
router.patch("/admin/:id/lower-hand/:userId", verifyAdminToken, lowerHand);

// ══════════════════════════════════════
// DETAIL ROUTE (last — catches /:id)
// ══════════════════════════════════════
router.get("/:id", authenticateUser, getLiveClass);

export default router;
