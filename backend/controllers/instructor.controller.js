import { Instructor } from "../models/instructor.model.js";
import { Course } from "../models/course.model.js";
import { LiveClass } from "../models/liveclass.model.js";
import { VideoPackage } from "../models/videopackage.model.js";
import { Material } from "../models/material.model.js";
import { Enrollment } from "../models/enrollment.model.js";
import { Review } from "../models/review.model.js";
import { Assignment } from "../models/assignment.model.js";
import { Submission } from "../models/submission.model.js";
import { asyncHandler } from "../middlewares/async.middleware.js";
import { errorResponse, successResponse } from "../utils/response.utils.js";
import { getPagination, createPaginationResponse } from "../utils/pagination.utils.js";
import { uploadProfilePicture, updateImage, deleteImage } from "../services/r2.service.js";
import logger from "../configs/logger.config.js";

/**
 * Instructor Self-Management Controller
 * Handles profile, dashboard, courses, live classes, video packages, materials, earnings
 */

// ========================= PROFILE MANAGEMENT =========================

// @route   GET /api/v1/instructor/profile
// @desc    Get own profile
// @access  Private (Instructor)
export const getMyProfile = asyncHandler(async (req, res) => {
    const instructor = await Instructor.findById(req.instructor.id);
    if (!instructor) return errorResponse(res, 404, "Instructor not found");

    successResponse(res, 200, "Profile retrieved successfully", instructor);
});

// @route   PUT /api/v1/instructor/profile
// @desc    Update own profile (with optional profile picture via form-data)
// @access  Private (Instructor)
export const updateMyProfile = asyncHandler(async (req, res) => {
    const instructorId = req.instructor.id;
    const updateData = req.body;

    logger.info(`Instructor updating profile: ${instructorId}`);

    // Restricted fields
    const restrictedFields = [
        "password", "email", "isEmailVerified", "isPhoneVerified", "isActive",
        "isSuspended", "suspensionReason", "suspendedAt", "isDocumentsVerified",
        "isKYCVerified", "sessions", "loginAttempts", "lockUntil",
        "verificationCode", "verificationCodeExpires", "isOtpVerified",
        "otpAttempts", "otpLastSentAt", "passwordChangedAt",
        "passwordResetToken", "passwordResetExpires", "deletedAt",
        "deletionReason", "createdBy", "updatedBy", "createdAt", "updatedAt",
        "earnings", "paymentHistory", "rating", "bankDetails"
    ];
    restrictedFields.forEach(field => delete updateData[field]);

    // Handle profile picture upload via form-data
    if (req.file) {
        const instructor = await Instructor.findById(instructorId);
        if (!instructor) return errorResponse(res, 404, "Instructor not found");

        const userName = `${instructor.firstName}_${instructor.lastName}`;
        const oldPublicId = instructor.profilePicture?.public_id || null;

        try {
            const uploadResult = await updateImage(
                oldPublicId, req.file.buffer, uploadProfilePicture, "Instructor", userName
            );
            updateData.profilePicture = {
                public_id: uploadResult.public_id,
                secure_url: uploadResult.secure_url
            };
        } catch (error) {
            logger.error(`Profile picture upload failed for instructor ${instructorId}: ${error.message}`);
        }
    }

    const instructor = await Instructor.findByIdAndUpdate(instructorId, updateData, {
        new: true,
        runValidators: true
    });

    if (!instructor) return errorResponse(res, 404, "Instructor not found");

    successResponse(res, 200, "Profile updated successfully", instructor);
});

// @route   DELETE /api/v1/instructor/profile-picture
// @desc    Delete own profile picture
// @access  Private (Instructor)
export const deleteMyProfilePicture = asyncHandler(async (req, res) => {
    const instructor = await Instructor.findById(req.instructor.id);
    if (!instructor) return errorResponse(res, 404, "Instructor not found");

    if (!instructor.profilePicture?.public_id) {
        return errorResponse(res, 400, "No profile picture to delete");
    }

    const deleteResult = await deleteImage(instructor.profilePicture.public_id);
    if (deleteResult.result === "ok") {
        instructor.profilePicture = null;
        await instructor.save({ validateBeforeSave: false });
        return successResponse(res, 200, "Profile picture deleted successfully");
    }

    return errorResponse(res, 500, "Failed to delete profile picture");
});

// ========================= PREFERENCES =========================

// @route   PUT /api/v1/instructor/preferences
// @desc    Update instructor preferences
// @access  Private (Instructor)
export const updatePreferences = asyncHandler(async (req, res) => {
    const { emailNotifications, classReminders, studentUpdates, language, timezone } = req.body;

    const updateFields = {};
    if (emailNotifications !== undefined) updateFields["preferences.emailNotifications"] = emailNotifications;
    if (classReminders !== undefined) updateFields["preferences.classReminders"] = classReminders;
    if (studentUpdates !== undefined) updateFields["preferences.studentUpdates"] = studentUpdates;
    if (language) updateFields["preferences.language"] = language;
    if (timezone) updateFields["preferences.timezone"] = timezone;

    const instructor = await Instructor.findByIdAndUpdate(
        req.instructor.id, { $set: updateFields }, { new: true }
    );

    if (!instructor) return errorResponse(res, 404, "Instructor not found");

    successResponse(res, 200, "Preferences updated successfully", instructor.preferences);
});

// ========================= DASHBOARD =========================

// @route   GET /api/v1/instructor/dashboard
// @desc    Get instructor dashboard stats
// @access  Private (Instructor)
export const getDashboard = asyncHandler(async (req, res) => {
    const instructorId = req.instructor.id;

    const [
        instructor,
        totalCourses,
        totalEnrollments,
        totalReviews,
        liveClassStats,
        videoPackageStats
    ] = await Promise.all([
        Instructor.findById(instructorId),
        Course.countDocuments({ instructor: instructorId }),
        Enrollment.countDocuments({
            course: { $in: (await Course.find({ instructor: instructorId }).select("_id")).map(c => c._id) }
        }),
        Review.countDocuments({
            course: { $in: (await Course.find({ instructor: instructorId }).select("_id")).map(c => c._id) }
        }),
        LiveClass.getClassStats(instructorId),
        VideoPackage.getPackageStats(instructorId)
    ]);

    successResponse(res, 200, "Dashboard retrieved successfully", {
        profile: { firstName: instructor.firstName, lastName: instructor.lastName, rating: instructor.rating },
        stats: {
            totalCourses,
            totalEnrollments,
            totalReviews,
            totalStudentsTeaching: instructor.totalStudentsTeaching,
            liveClasses: liveClassStats[0] || {},
            videoPackages: videoPackageStats[0] || {}
        }
    });
});

// ========================= MY COURSES =========================

// @route   GET /api/v1/instructor/courses
// @desc    Get my courses
// @access  Private (Instructor)
export const getMyCourses = asyncHandler(async (req, res) => {
    const { page, limit, skip } = getPagination(req.query, 10);
    const { status } = req.query;

    const filter = { instructor: req.instructor.id };
    if (status) filter.status = status;

    const total = await Course.countDocuments(filter);
    const courses = await Course.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

    successResponse(res, 200, "Courses retrieved successfully", {
        courses,
        pagination: createPaginationResponse(total, page, limit)
    });
});

// ========================= MY STUDENTS =========================

// @route   GET /api/v1/instructor/students
// @desc    Get students enrolled in my courses
// @access  Private (Instructor)
export const getMyStudents = asyncHandler(async (req, res) => {
    const { page, limit, skip } = getPagination(req.query, 20);
    const { courseId } = req.query;

    const courseFilter = { instructor: req.instructor.id };
    if (courseId) courseFilter._id = courseId;

    const courseIds = (await Course.find(courseFilter).select("_id")).map(c => c._id);

    const filter = { course: { $in: courseIds }, status: { $in: ["active", "completed"] } };
    const total = await Enrollment.countDocuments(filter);
    const enrollments = await Enrollment.find(filter)
        .populate("user", "firstName lastName email profilePicture")
        .populate("course", "title")
        .sort({ enrolledAt: -1 })
        .skip(skip)
        .limit(limit);

    successResponse(res, 200, "Students retrieved successfully", {
        students: enrollments,
        pagination: createPaginationResponse(total, page, limit)
    });
});

// ========================= DEACTIVATE =========================

// @route   GET /api/v1/instructor/live-classes
// @desc    Get my live classes
// @access  Private (Instructor)
export const getMyLiveClasses = asyncHandler(async (req, res) => {
    const { page, limit, skip } = getPagination(req.query, 10);
    const { status } = req.query;

    const filter = { instructor: req.instructor.id };
    if (status) filter.status = status;

    const total = await LiveClass.countDocuments(filter);
    const classes = await LiveClass.find(filter)
        .populate("course", "title")
        .sort({ scheduledAt: -1 })
        .skip(skip)
        .limit(limit);

    successResponse(res, 200, "Live classes retrieved successfully", {
        liveClasses: classes,
        pagination: createPaginationResponse(total, page, limit)
    });
});

// ========================= MY VIDEO PACKAGES =========================

// @route   GET /api/v1/instructor/video-packages
// @desc    Get my video packages
// @access  Private (Instructor)
export const getMyVideoPackages = asyncHandler(async (req, res) => {
    const { page, limit, skip } = getPagination(req.query, 10);

    const filter = { instructor: req.instructor.id };
    const total = await VideoPackage.countDocuments(filter);
    const packages = await VideoPackage.find(filter)
        .populate("course", "title")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

    successResponse(res, 200, "Video packages retrieved successfully", {
        videoPackages: packages,
        pagination: createPaginationResponse(total, page, limit)
    });
});

// ========================= MY MATERIALS =========================

// @route   GET /api/v1/instructor/materials
// @desc    Get my materials
// @access  Private (Instructor)
export const getMyMaterials = asyncHandler(async (req, res) => {
    const { page, limit, skip } = getPagination(req.query, 20);
    const { courseId, type } = req.query;

    const filter = { instructor: req.instructor.id };
    if (courseId) filter.course = courseId;
    if (type) filter.type = type;

    const total = await Material.countDocuments(filter);
    const materials = await Material.find(filter)
        .populate("course", "title")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

    successResponse(res, 200, "Materials retrieved successfully", {
        materials,
        pagination: createPaginationResponse(total, page, limit)
    });
});

// ========================= MY ASSIGNMENTS =========================

// @route   GET /api/v1/instructor/assignments
// @desc    Get assignments I created
// @access  Private (Instructor)
export const getMyAssignments = asyncHandler(async (req, res) => {
    const { page, limit, skip } = getPagination(req.query, 10);
    const { courseId } = req.query;

    const filter = { instructor: req.instructor.id };
    if (courseId) filter.course = courseId;

    const total = await Assignment.countDocuments(filter);
    const assignments = await Assignment.find(filter)
        .populate("course", "title")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

    successResponse(res, 200, "Assignments retrieved successfully", {
        assignments,
        pagination: createPaginationResponse(total, page, limit)
    });
});

// ========================= PENDING SUBMISSIONS =========================

// @route   GET /api/v1/instructor/submissions/pending
// @desc    Get pending submissions to grade
// @access  Private (Instructor)
export const getPendingSubmissions = asyncHandler(async (req, res) => {
    const { page, limit, skip } = getPagination(req.query, 20);

    const assignmentIds = (await Assignment.find({ instructor: req.instructor.id }).select("_id")).map(a => a._id);

    const filter = { assignment: { $in: assignmentIds }, status: "submitted" };
    const total = await Submission.countDocuments(filter);
    const submissions = await Submission.find(filter)
        .populate("user", "firstName lastName email")
        .populate("assignment", "title dueDate maxScore")
        .populate("course", "title")
        .sort({ submittedAt: -1 })
        .skip(skip)
        .limit(limit);

    successResponse(res, 200, "Pending submissions retrieved successfully", {
        submissions,
        pagination: createPaginationResponse(total, page, limit)
    });
});

// ========================= DEACTIVATE =========================

// @route   DELETE /api/v1/instructor/account
// @desc    Deactivate (soft delete) instructor account
// @access  Private (Instructor)
export const deactivateAccount = asyncHandler(async (req, res) => {
    const { reason } = req.body;

    const instructor = await Instructor.findById(req.instructor.id);
    if (!instructor) return errorResponse(res, 404, "Instructor not found");

    instructor.isActive = false;
    instructor.deletedAt = new Date();
    instructor.deletionReason = reason || "Instructor requested deactivation";
    instructor.clearAllSessions();
    await instructor.save({ validateBeforeSave: false });

    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");

    successResponse(res, 200, "Account deactivated successfully");
});
