import express from "express";
import {
    requestPayout,
    getMyPayouts,
    getMyPayout,
    cancelMyPayout,
    getMyPayoutStats,
    getAllPayouts,
    getPayoutById,
    processPayout,
    completePayout,
    failPayout,
    adminCancelPayout,
    flagPayout,
    reviewPayout,
    getPayoutStats
} from "../controllers/payout.controller.js";
import { authenticateUser } from "../middlewares/user.auth.middleware.js";
import { authenticateInstructor } from "../middlewares/instructor.auth.middleware.js";
import { verifyAdminToken } from "../middlewares/admin.auth.middleware.js";

const router = express.Router();

// ===== User Payout Routes (Protected) =====
router.post("/user/request", authenticateUser, requestPayout);
router.get("/user/my", authenticateUser, getMyPayouts);
router.get("/user/my/stats", authenticateUser, getMyPayoutStats);
router.get("/user/my/:payoutId", authenticateUser, getMyPayout);
router.post("/user/my/:payoutId/cancel", authenticateUser, cancelMyPayout);

// ===== Instructor Payout Routes (Protected) =====
router.post("/instructor/request", authenticateInstructor, requestPayout);
router.get("/instructor/my", authenticateInstructor, getMyPayouts);
router.get("/instructor/my/stats", authenticateInstructor, getMyPayoutStats);
router.get("/instructor/my/:payoutId", authenticateInstructor, getMyPayout);
router.post("/instructor/my/:payoutId/cancel", authenticateInstructor, cancelMyPayout);

// ===== Admin Payout Routes (Protected) =====
router.get("/admin/stats", verifyAdminToken, getPayoutStats);
router.get("/admin/all", verifyAdminToken, getAllPayouts);
router.get("/admin/:payoutId", verifyAdminToken, getPayoutById);
router.post("/admin/:payoutId/process", verifyAdminToken, processPayout);
router.post("/admin/:payoutId/complete", verifyAdminToken, completePayout);
router.post("/admin/:payoutId/fail", verifyAdminToken, failPayout);
router.post("/admin/:payoutId/cancel", verifyAdminToken, adminCancelPayout);
router.post("/admin/:payoutId/flag", verifyAdminToken, flagPayout);
router.post("/admin/:payoutId/review", verifyAdminToken, reviewPayout);

export default router;
