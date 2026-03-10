import express from "express";
import {
    getMyNotifications,
    markAsRead,
    markAllAsRead,
    getUnreadCount,
    deleteNotification
} from "../controllers/notification.controller.js";
import { authenticateInstructor } from "../middlewares/instructor.auth.middleware.js";
import { authenticateUser } from "../middlewares/user.auth.middleware.js";

const router = express.Router();

// Instructor notification routes
router.get("/instructor/my", authenticateInstructor, getMyNotifications);
router.get("/instructor/unread-count", authenticateInstructor, getUnreadCount);
router.patch("/instructor/read-all", authenticateInstructor, markAllAsRead);
router.patch("/instructor/:id/read", authenticateInstructor, markAsRead);
router.delete("/instructor/:id", authenticateInstructor, deleteNotification);

// User notification routes
router.get("/user/my", authenticateUser, getMyNotifications);
router.get("/user/unread-count", authenticateUser, getUnreadCount);
router.patch("/user/read-all", authenticateUser, markAllAsRead);
router.patch("/user/:id/read", authenticateUser, markAsRead);
router.delete("/user/:id", authenticateUser, deleteNotification);

export default router;
