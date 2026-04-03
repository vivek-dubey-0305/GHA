import express from "express";
import { authenticateUser } from "../middlewares/user.auth.middleware.js";
import {
    getLeaderboard,
    getLeaderboardFilterCourses,
    getLeaderboardSummary,
} from "../controllers/leaderboard.controller.js";

const router = express.Router();

router.get("/", authenticateUser, getLeaderboard);
router.get("/summary", authenticateUser, getLeaderboardSummary);
router.get("/filters/courses", authenticateUser, getLeaderboardFilterCourses);

export default router;
