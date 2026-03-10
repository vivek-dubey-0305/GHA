import express from "express";
import {
    // User CRUD
    getAllUsers, getUserById, createUser, updateUser, deleteUser, deleteUserProfilePicture,
    // Instructor CRUD
    getAllInstructors, getInstructorById, createInstructor, updateInstructor, deleteInstructor, deleteInstructorProfilePicture,
    // Course Operations
    getAllCourses, getDraftCourses, getFullCourse, createFullCourse, updateFullCourse, deleteFullCourse, saveDraftCourse,
    // Module CRUD
    getAllModules, getModuleById, createModule, updateModule, deleteModule,
    // Lesson CRUD
    getAllLessons, getLessonById, createLesson, updateLesson, deleteLesson,
    // Enrollment CRUD
    getAllEnrollments, getEnrollmentById, createEnrollment, updateEnrollment, deleteEnrollment,
    // Payment CRUD
    getAllPayments, getPaymentById, updatePayment, deletePayment, adminProcessRefund, getPaymentStats,
    // Review CRUD
    getAllReviews, getReviewById, updateReview, deleteReview,
    // Assignment CRUD
    getAllAssignments, getAssignmentById, createAssignment, updateAssignment, deleteAssignment,
    // Submission CRUD
    getAllSubmissions, getSubmissionById, updateSubmission, deleteSubmission,
    // Certificate CRUD
    getAllCertificates, getCertificateById, createCertificate, updateCertificate, deleteCertificate, revokeCertificate,
    // Live Class CRUD
    getAllLiveClasses, getLiveClassById, updateLiveClass, deleteLiveClass,
    // Video Package CRUD
    getAllVideoPackages, getVideoPackageById, updateVideoPackage, deleteVideoPackage,
    // Material CRUD
    getAllMaterials, getMaterialById, updateMaterial, deleteMaterial,
    // Progress CRUD
    getAllProgress, updateProgress, deleteProgress,
    // Dashboard
    getDashboard
} from "../controllers/admin.controller.js";
import { verifyAdminToken } from "../middlewares/admin.auth.middleware.js";
import { upload, courseMediaUpload } from "../middlewares/multer.middleware.js";

const router = express.Router();

// Apply admin authentication to all routes
router.use(verifyAdminToken);

// ===== Dashboard =====
router.get("/dashboard", getDashboard);

// ===== User CRUD =====
router.get("/users", getAllUsers);
router.get("/users/:id", getUserById);
router.post("/users", upload.single("profilePicture"), createUser);
router.put("/users/:id", upload.single("profilePicture"), updateUser);
router.delete("/users/:id", deleteUser);
router.delete("/users/:id/profile-picture", deleteUserProfilePicture);

// ===== Instructor CRUD =====
router.get("/instructors", getAllInstructors);
router.get("/instructors/:id", getInstructorById);
router.post("/instructors", upload.single("profilePicture"), createInstructor);
router.put("/instructors/:id", upload.single("profilePicture"), updateInstructor);
router.delete("/instructors/:id", deleteInstructor);
router.delete("/instructors/:id/profile-picture", deleteInstructorProfilePicture);

// ===== Course Operations =====
router.get("/courses/drafts", getDraftCourses);
router.get("/courses", getAllCourses);
router.get("/courses/:id/full", getFullCourse);
router.post("/courses/full", courseMediaUpload.any(), createFullCourse);
router.put("/courses/:id/full", courseMediaUpload.any(), updateFullCourse);
router.put("/courses/:id/save-draft", courseMediaUpload.any(), saveDraftCourse);
router.delete("/courses/:id/full", deleteFullCourse);

// ===== Module CRUD =====
router.get("/modules", getAllModules);
router.get("/modules/:id", getModuleById);
router.post("/modules", upload.single("thumbnail"), createModule);
router.put("/modules/:id", upload.single("thumbnail"), updateModule);
router.delete("/modules/:id", deleteModule);

// ===== Lesson CRUD =====
router.get("/lessons", getAllLessons);
router.get("/lessons/:id", getLessonById);
router.post("/lessons", upload.single("thumbnail"), createLesson);
router.put("/lessons/:id", upload.single("thumbnail"), updateLesson);
router.delete("/lessons/:id", deleteLesson);

// ===== Enrollment CRUD =====
router.get("/enrollments", getAllEnrollments);
router.get("/enrollments/:id", getEnrollmentById);
router.post("/enrollments", createEnrollment);
router.put("/enrollments/:id", updateEnrollment);
router.delete("/enrollments/:id", deleteEnrollment);

// ===== Payment CRUD =====
router.get("/payments/stats", getPaymentStats);
router.get("/payments", getAllPayments);
router.get("/payments/:id", getPaymentById);
router.put("/payments/:id", updatePayment);
router.delete("/payments/:id", deletePayment);
router.post("/payments/:id/refund", adminProcessRefund);

// ===== Review CRUD =====
router.get("/reviews", getAllReviews);
router.get("/reviews/:id", getReviewById);
router.put("/reviews/:id", updateReview);
router.delete("/reviews/:id", deleteReview);

// ===== Assignment CRUD =====
router.get("/assignments", getAllAssignments);
router.get("/assignments/:id", getAssignmentById);
router.post("/assignments", upload.single("thumbnail"), createAssignment);
router.put("/assignments/:id", upload.single("thumbnail"), updateAssignment);
router.delete("/assignments/:id", deleteAssignment);

// ===== Submission CRUD =====
router.get("/submissions", getAllSubmissions);
router.get("/submissions/:id", getSubmissionById);
router.put("/submissions/:id", updateSubmission);
router.delete("/submissions/:id", deleteSubmission);

// ===== Certificate CRUD =====
router.get("/certificates", getAllCertificates);
router.get("/certificates/:id", getCertificateById);
router.post("/certificates", createCertificate);
router.put("/certificates/:id", updateCertificate);
router.delete("/certificates/:id", deleteCertificate);
router.patch("/certificates/:id/revoke", revokeCertificate);

// ===== Live Class CRUD =====
router.get("/live-classes", getAllLiveClasses);
router.get("/live-classes/:id", getLiveClassById);
router.put("/live-classes/:id", updateLiveClass);
router.delete("/live-classes/:id", deleteLiveClass);

// ===== Video Package CRUD =====
router.get("/video-packages", getAllVideoPackages);
router.get("/video-packages/:id", getVideoPackageById);
router.put("/video-packages/:id", updateVideoPackage);
router.delete("/video-packages/:id", deleteVideoPackage);

// ===== Material CRUD =====
router.get("/materials", getAllMaterials);
router.get("/materials/:id", getMaterialById);
router.put("/materials/:id", updateMaterial);
router.delete("/materials/:id", deleteMaterial);

// ===== Progress CRUD =====
router.get("/progress", getAllProgress);
router.put("/progress/:id", updateProgress);
router.delete("/progress/:id", deleteProgress);

export default router;
