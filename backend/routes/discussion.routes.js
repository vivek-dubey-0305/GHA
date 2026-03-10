import express from "express";
import {
    createDiscussion,
    getCourseDiscussions,
    getDiscussion,
    addReply,
    toggleResolve,
    togglePin,
    getInstructorDiscussions
} from "../controllers/discussion.controller.js";
import { authenticateInstructor } from "../middlewares/instructor.auth.middleware.js";
import { authenticateUser } from "../middlewares/user.auth.middleware.js";

const router = express.Router();

// Instructor-only routes
router.get("/instructor/my", authenticateInstructor, getInstructorDiscussions);
router.patch("/instructor/:id/resolve", authenticateInstructor, toggleResolve);
router.patch("/instructor/:id/pin", authenticateInstructor, togglePin);

// Routes that work for both User and Instructor
// Instructor creates discussion
router.post("/instructor", authenticateInstructor, createDiscussion);
router.post("/instructor/:id/replies", authenticateInstructor, addReply);

// User creates discussion
router.post("/", authenticateUser, createDiscussion);
router.post("/:id/replies", authenticateUser, addReply);

// Shared read routes (instructor access)
router.get("/course/:courseId/instructor", authenticateInstructor, getCourseDiscussions);
router.get("/:id/instructor", authenticateInstructor, getDiscussion);

// Shared read routes (user access)
router.get("/course/:courseId", authenticateUser, getCourseDiscussions);
router.get("/:id", authenticateUser, getDiscussion);

export default router;
