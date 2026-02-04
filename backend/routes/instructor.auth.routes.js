import express from "express";
import { verifyInstructorToken } from "../middlewares/instructor.auth.middleware.js";
import { upload, handleMulterError } from "../middlewares/multer.middleware.js";
import {
    registerInstructor,
    loginInstructor,
    verifyOtp,
    logoutInstructor,
    resendOtp,
    getInstructorProfile,
    uploadProfilePictureInstructor,
    refreshAccessToken,
    forgotPassword,
    resetPassword,
    verifyResetToken
} from "../controllers/instructor.auth.controller.js";

const router = express.Router();

/**
 * Instructor Authentication Routes
 * OTP-based login flow with password reset
 * Profile picture management with Cloudinary
 */

// Public routes
router.post("/register", registerInstructor);
router.post("/login", loginInstructor);
router.post("/verify-otp", verifyOtp);
router.post("/resend-otp", resendOtp);
router.post("/refresh-token", refreshAccessToken);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.post("/verify-reset-token", verifyResetToken);

// Protected routes (requires authentication middleware)
router.post("/logout", verifyInstructorToken, logoutInstructor);
router.get("/profile", verifyInstructorToken, getInstructorProfile);
router.post(
    "/upload-profile-picture",
    verifyInstructorToken,
    upload.single("profilePicture"),
    uploadProfilePictureInstructor,
    handleMulterError
);

export default router;
