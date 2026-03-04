import express from "express";
import {
    getMyProfile,
    updateMyProfile,
    deleteMyProfilePicture,
    updatePreferences,
    getDashboard,
    getMyCourses,
    getMyStudents,
    getMyLiveClasses,
    getMyVideoPackages,
    getMyMaterials,
    getMyAssignments,
    getPendingSubmissions,
    deactivateAccount
} from "../controllers/instructor.controller.js";
import { authenticateInstructor } from "../middlewares/instructor.auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = express.Router();

// Apply instructor authentication to all routes
router.use(authenticateInstructor);

// ===== Profile =====
router.get("/profile", getMyProfile);
router.put("/profile", upload.single("profilePicture"), updateMyProfile);
router.delete("/profile/picture", deleteMyProfilePicture);
router.put("/preferences", updatePreferences);

// ===== Dashboard =====
router.get("/dashboard", getDashboard);

// ===== Courses =====
router.get("/courses", getMyCourses);

// ===== Students =====
router.get("/students", getMyStudents);

// ===== Live Classes =====
router.get("/live-classes", getMyLiveClasses);

// ===== Video Packages =====
router.get("/video-packages", getMyVideoPackages);

// ===== Materials =====
router.get("/materials", getMyMaterials);

// ===== Assignments =====
router.get("/assignments", getMyAssignments);
router.get("/submissions/pending", getPendingSubmissions);

// ===== Account =====
router.patch("/deactivate", deactivateAccount);

export default router;
