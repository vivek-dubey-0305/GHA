import express from "express";
import { verifyAdminToken } from "../middlewares/admin.auth.middleware.js";
import {
    loginAdmin,
    verifyOtp,
    logoutAdmin,
    resendOtp,
    getAdminProfile,
    refreshAccessToken,
    forgotPassword,
    resetPassword,
    verifyResetToken
} from "../controllers/admin.auth.controller.js";

const router = express.Router();

/**
 * Admin Authentication Routes
 * OTP-based login flow with password reset
 */

// Public routes
router.post("/login", loginAdmin);
router.post("/verify-otp", verifyOtp);
router.post("/resend-otp", resendOtp);
router.post("/refresh-token", refreshAccessToken);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.post("/verify-reset-token", verifyResetToken);

// Protected routes (requires authentication middleware)
router.post("/logout", verifyAdminToken, logoutAdmin);
router.get("/profile", verifyAdminToken, getAdminProfile);

export default router;
