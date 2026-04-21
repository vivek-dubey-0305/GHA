import express from "express";
import {
    createAnnouncement,
    getMyAnnouncements,
    updateAnnouncement,
    deleteAnnouncement,
    getCourseAnnouncements,
    getUserAnnouncements,
    getUserAnnouncementUnreadCount,
    markAnnouncementRead,
    markAllUserAnnouncementsRead,
} from "../controllers/announcement.controller.js";
import { authenticateInstructor } from "../middlewares/instructor.auth.middleware.js";
import { authenticateUser } from "../middlewares/user.auth.middleware.js";

const router = express.Router();

// Instructor routes
router.post("/", authenticateInstructor, createAnnouncement);
router.get("/instructor/my", authenticateInstructor, getMyAnnouncements);
router.put("/instructor/my/:id", authenticateInstructor, updateAnnouncement);
router.delete("/instructor/my/:id", authenticateInstructor, deleteAnnouncement);

// User routes (view course announcements)
router.get("/user/my", authenticateUser, getUserAnnouncements);
router.get("/user/unread-count", authenticateUser, getUserAnnouncementUnreadCount);
router.patch("/user/read-all", authenticateUser, markAllUserAnnouncementsRead);
router.patch("/user/:id/read", authenticateUser, markAnnouncementRead);
router.get("/course/:courseId", authenticateUser, getCourseAnnouncements);

export default router;
