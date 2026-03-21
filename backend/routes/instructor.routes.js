import express from "express";
import {
    getMyProfile,
    updateMyProfile,
    deleteMyProfilePicture,
    deleteMyBannerImage,
    updatePreferences,
    updateProfessionalInfo,
    addSpecializationHandler,
    updateSpecializationHandler,
    removeSpecializationHandler,
    addSkillHandler,
    removeSkillHandler,
    addWorkExperienceHandler,
    removeWorkExperienceHandler,
    addQualificationHandler,
    removeQualificationHandler,
    addAchievementHandler,
    removeAchievementHandler,
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

// ===== PROFILE MANAGEMENT =====
router.get("/profile", getMyProfile);
router.put("/profile", upload.single("profilePicture"), updateMyProfile);
router.delete("/profile-picture", deleteMyProfilePicture);
router.delete("/banner-image", deleteMyBannerImage);
router.put("/preferences", updatePreferences);

// ===== PROFESSIONAL PROFILE =====
router.put("/professional-info", updateProfessionalInfo);

// ===== SPECIALIZATIONS =====
router.post("/specializations", addSpecializationHandler);
router.put("/specializations/:id", updateSpecializationHandler);
router.delete("/specializations/:id", removeSpecializationHandler);

// ===== SKILLS =====
router.post("/skills", addSkillHandler);
router.delete("/skills/:id", removeSkillHandler);

// ===== WORK EXPERIENCE =====
router.post("/work-experience", addWorkExperienceHandler);
router.delete("/work-experience/:id", removeWorkExperienceHandler);

// ===== QUALIFICATIONS =====
router.post("/qualifications", addQualificationHandler);
router.delete("/qualifications/:id", removeQualificationHandler);

// ===== ACHIEVEMENTS =====
router.post("/achievements", addAchievementHandler);
router.delete("/achievements/:id", removeAchievementHandler);

// ===== DASHBOARD =====
router.get("/dashboard", getDashboard);

// ===== COURSES =====
router.get("/courses", getMyCourses);

// ===== STUDENTS =====
router.get("/students", getMyStudents);

// ===== LIVE CLASSES =====
router.get("/live-classes", getMyLiveClasses);

// ===== VIDEO PACKAGES =====
router.get("/video-packages", getMyVideoPackages);

// ===== MATERIALS =====
router.get("/materials", getMyMaterials);

// ===== ASSIGNMENTS =====
router.get("/assignments", getMyAssignments);
router.get("/submissions/pending", getPendingSubmissions);

// ===== ACCOUNT =====
router.patch("/deactivate", deactivateAccount);

export default router;
