import express from "express";
import { authenticateUser } from "../middlewares/user.auth.middleware.js";
import {
    getMyStreak,
    markMyStreakActivity,
} from "../controllers/streak.controller.js";

const router = express.Router();

router.get("/me", authenticateUser, getMyStreak);
router.post("/mark-activity", authenticateUser, markMyStreakActivity);

export default router;
