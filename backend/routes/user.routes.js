import express from "express";
import {
    getMyProfile,
    updateMyProfile,
    deleteMyProfilePicture,
    updatePreferences,
    getMyEnrollments,
    getEnrollmentDetails,
    getMyProgress,
    getCourseProgress,
    updateLessonProgress,
    getLearningStats,
    getMyReviews,
    getMyCertificates,
    deactivateAccount
} from "../controllers/user.controller.js";
import { authenticateUser } from "../middlewares/user.auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = express.Router();

// Apply user authentication to all routes
router.use(authenticateUser);

// ===== Profile =====
router.get("/profile", getMyProfile);
router.put("/profile", upload.single("profilePicture"), updateMyProfile);
router.delete("/profile/picture", deleteMyProfilePicture);
router.put("/preferences", updatePreferences);

// ===== Enrollments =====
router.get("/enrollments", getMyEnrollments);
router.get("/enrollments/:enrollmentId", getEnrollmentDetails);

// ===== Progress =====
router.get("/progress", getMyProgress);
router.get("/progress/stats", getLearningStats);
router.get("/progress/course/:courseId", getCourseProgress);
router.post("/progress/lesson/:lessonId", updateLessonProgress);

// ===== Reviews =====
router.get("/reviews", getMyReviews);

// ===== Certificates =====
router.get("/certificates", getMyCertificates);

// ===== Account =====
router.patch("/deactivate", deactivateAccount);

export default router;
