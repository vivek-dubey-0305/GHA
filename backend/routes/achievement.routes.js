import express from "express";
import { authenticateUser } from "../middlewares/user.auth.middleware.js";
import { getMyAchievements } from "../controllers/achievement.controller.js";

const router = express.Router();

router.get("/me", authenticateUser, getMyAchievements);

export default router;
