import express from "express";
import { verifyUserToken } from "../middlewares/user.auth.middleware.js";
import { upload, handleMulterError } from "../middlewares/multer.middleware.js";
import {
    registerUser,
    loginUser,
    verifyOtp,
    logoutUser,
    resendOtp,
    getUserProfile,
    uploadProfilePictureUser,
    refreshAccessToken,
    forgotPassword,
    resetPassword,
    verifyResetToken
} from "../controllers/user.auth.controller.js";

const router = express.Router();

/**
 * User (Student) Authentication Routes
 * OTP-based login flow with password reset
 * Profile picture management with Cloudinary
 */

// Public routes
router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/verify-otp", verifyOtp);
router.post("/resend-otp", resendOtp);
router.post("/refresh-token", refreshAccessToken);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.post("/verify-reset-token", verifyResetToken);

// Protected routes (requires authentication middleware)
router.post("/logout", verifyUserToken, logoutUser);
router.get("/profile", verifyUserToken, getUserProfile);
router.post(
    "/upload-profile-picture",
    verifyUserToken,
    upload.single("profilePicture"),
    uploadProfilePictureUser,
    handleMulterError
);

export default router;
