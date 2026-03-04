import { User } from "../models/user.model.js";
import { Enrollment } from "../models/enrollment.model.js";
import { Progress } from "../models/progress.model.js";
import { Review } from "../models/review.model.js";
import { Certificate } from "../models/certificate.model.js";
import { asyncHandler } from "../middlewares/async.middleware.js";
import { errorResponse, successResponse } from "../utils/response.utils.js";
import { getPagination, createPaginationResponse } from "../utils/pagination.utils.js";
import { uploadProfilePicture, updateImage, deleteImage } from "../services/r2.service.js";
import logger from "../configs/logger.config.js";

/**
 * User (Student) Self-Management Controller
 * Handles profile management, preferences, enrollments, progress, and reviews
 */

// ========================= PROFILE MANAGEMENT =========================

// @route   GET /api/v1/user/profile
// @desc    Get current user profile
// @access  Private (User)
export const getMyProfile = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user.id);

    if (!user) {
        return errorResponse(res, 404, "User not found");
    }

    successResponse(res, 200, "Profile retrieved successfully", user);
});

// @route   PUT /api/v1/user/profile
// @desc    Update current user profile (with optional profile picture via form-data)
// @access  Private (User)
export const updateMyProfile = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const updateData = req.body;

    logger.info(`User updating profile: ${userId}`);

    // Fields users are NOT allowed to update themselves
    const restrictedFields = [
        "password", "email", "isEmailVerified", "isPhoneVerified",
        "isActive", "sessions", "loginAttempts", "lockUntil",
        "verificationCode", "verificationCodeExpires", "isOtpVerified",
        "otpAttempts", "otpLastSentAt", "passwordChangedAt",
        "passwordResetToken", "passwordResetExpires", "deletedAt",
        "deletionReason", "createdBy", "updatedBy", "createdAt", "updatedAt"
    ];
    restrictedFields.forEach(field => delete updateData[field]);

    // Handle profile picture upload via form-data
    if (req.file) {
        const user = await User.findById(userId);
        if (!user) return errorResponse(res, 404, "User not found");

        const userName = `${user.firstName}_${user.lastName}`;
        const oldPublicId = user.profilePicture?.public_id || null;

        try {
            const uploadResult = await updateImage(
                oldPublicId, req.file.buffer, uploadProfilePicture, "Student", userName
            );
            updateData.profilePicture = {
                public_id: uploadResult.public_id,
                secure_url: uploadResult.secure_url
            };
        } catch (error) {
            logger.error(`Profile picture upload failed for user ${userId}: ${error.message}`);
        }
    }

    const user = await User.findByIdAndUpdate(userId, updateData, {
        new: true,
        runValidators: true
    });

    if (!user) return errorResponse(res, 404, "User not found");

    successResponse(res, 200, "Profile updated successfully", user);
});

// @route   DELETE /api/v1/user/profile-picture
// @desc    Delete current user's profile picture
// @access  Private (User)
export const deleteMyProfilePicture = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user.id);

    if (!user) return errorResponse(res, 404, "User not found");
    if (!user.profilePicture?.public_id) {
        return errorResponse(res, 400, "No profile picture to delete");
    }

    const deleteResult = await deleteImage(user.profilePicture.public_id);
    if (deleteResult.result === "ok") {
        user.profilePicture = null;
        await user.save({ validateBeforeSave: false });
        return successResponse(res, 200, "Profile picture deleted successfully");
    }

    return errorResponse(res, 500, "Failed to delete profile picture");
});

// ========================= PREFERENCES =========================

// @route   PUT /api/v1/user/preferences
// @desc    Update user preferences
// @access  Private (User)
export const updatePreferences = asyncHandler(async (req, res) => {
    const { emailNotifications, smsNotifications, courseUpdates, promotionalEmails, language } = req.body;

    const updateFields = {};
    if (emailNotifications !== undefined) updateFields["preferences.emailNotifications"] = emailNotifications;
    if (smsNotifications !== undefined) updateFields["preferences.smsNotifications"] = smsNotifications;
    if (courseUpdates !== undefined) updateFields["preferences.courseUpdates"] = courseUpdates;
    if (promotionalEmails !== undefined) updateFields["preferences.promotionalEmails"] = promotionalEmails;
    if (language) updateFields["preferences.language"] = language;

    const user = await User.findByIdAndUpdate(req.user.id, { $set: updateFields }, { new: true });

    if (!user) return errorResponse(res, 404, "User not found");

    successResponse(res, 200, "Preferences updated successfully", user.preferences);
});

// ========================= ENROLLMENTS =========================

// @route   GET /api/v1/user/enrollments
// @desc    Get my enrollments
// @access  Private (User)
export const getMyEnrollments = asyncHandler(async (req, res) => {
    const { page, limit, skip } = getPagination(req.query, 10);
    const { status } = req.query;

    const filter = { user: req.user.id };
    if (status) filter.status = status;

    const total = await Enrollment.countDocuments(filter);
    const enrollments = await Enrollment.find(filter)
        .populate("course", "title thumbnail instructor rating totalDuration price category level")
        .populate("payment", "amount currency status")
        .sort({ enrolledAt: -1 })
        .skip(skip)
        .limit(limit);

    successResponse(res, 200, "Enrollments retrieved successfully", {
        enrollments,
        pagination: createPaginationResponse(total, page, limit)
    });
});

// @route   GET /api/v1/user/enrollments/:courseId
// @desc    Get enrollment details for a specific course
// @access  Private (User)
export const getEnrollmentDetails = asyncHandler(async (req, res) => {
    const enrollment = await Enrollment.findOne({
        user: req.user.id,
        course: req.params.courseId
    })
        .populate("course", "title thumbnail instructor modules totalModules totalLessons totalDuration")
        .populate("payment", "amount currency status transactionId");

    if (!enrollment) return errorResponse(res, 404, "Enrollment not found");

    successResponse(res, 200, "Enrollment details retrieved successfully", enrollment);
});

// ========================= PROGRESS =========================

// @route   GET /api/v1/user/progress
// @desc    Get all course progress
// @access  Private (User)
export const getMyProgress = asyncHandler(async (req, res) => {
    const progress = await Progress.getUserProgress(req.user.id);

    successResponse(res, 200, "Progress retrieved successfully", progress);
});

// @route   GET /api/v1/user/progress/:courseId
// @desc    Get progress for a specific course
// @access  Private (User)
export const getCourseProgress = asyncHandler(async (req, res) => {
    const progress = await Progress.getCourseProgress(req.user.id, req.params.courseId);

    successResponse(res, 200, "Course progress retrieved successfully", progress);
});

// @route   PUT /api/v1/user/progress/:lessonId
// @desc    Update lesson progress
// @access  Private (User)
export const updateLessonProgress = asyncHandler(async (req, res) => {
    const { lessonId } = req.params;
    const { courseId, progressPercentage, timeSpent, videoProgress } = req.body;

    if (!courseId) return errorResponse(res, 400, "courseId is required");

    // Verify enrollment
    const isEnrolled = await Enrollment.isUserEnrolled(req.user.id, courseId);
    if (!isEnrolled) return errorResponse(res, 403, "You are not enrolled in this course");

    let progress = await Progress.findOne({ user: req.user.id, lesson: lessonId });

    if (!progress) {
        progress = await Progress.create({
            user: req.user.id,
            course: courseId,
            lesson: lessonId,
            status: "in-progress"
        });
    }

    const updated = await progress.updateProgress({ progressPercentage, timeSpent, videoProgress });

    // Update enrollment progress
    const courseProgressData = await Progress.getCourseProgress(req.user.id, courseId);
    if (courseProgressData.length > 0) {
        await Enrollment.findOneAndUpdate(
            { user: req.user.id, course: courseId },
            {
                progressPercentage: courseProgressData[0].completionPercentage,
                completedLessons: courseProgressData[0].completedLessons,
                lastAccessedAt: new Date()
            }
        );
    }

    successResponse(res, 200, "Progress updated successfully", updated);
});

// ========================= LEARNING STATS =========================

// @route   GET /api/v1/user/learning-stats
// @desc    Get learning statistics
// @access  Private (User)
export const getLearningStats = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user.id);
    if (!user) return errorResponse(res, 404, "User not found");

    const certificates = await Certificate.countDocuments({ user: req.user.id, status: "active" });

    successResponse(res, 200, "Learning stats retrieved successfully", {
        ...user.learningProgress.toObject(),
        certificates
    });
});

// ========================= REVIEWS =========================

// @route   GET /api/v1/user/reviews
// @desc    Get my reviews
// @access  Private (User)
export const getMyReviews = asyncHandler(async (req, res) => {
    const { page, limit, skip } = getPagination(req.query, 10);

    const total = await Review.countDocuments({ user: req.user.id });
    const reviews = await Review.find({ user: req.user.id })
        .populate("course", "title thumbnail")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

    successResponse(res, 200, "Reviews retrieved successfully", {
        reviews,
        pagination: createPaginationResponse(total, page, limit)
    });
});

// ========================= CERTIFICATES =========================

// @route   GET /api/v1/user/certificates
// @desc    Get my certificates
// @access  Private (User)
export const getMyCertificates = asyncHandler(async (req, res) => {
    const certificates = await Certificate.getUserCertificates(req.user.id);

    successResponse(res, 200, "Certificates retrieved successfully", certificates);
});

// ========================= SOFT DELETE (DEACTIVATE) =========================

// @route   DELETE /api/v1/user/account
// @desc    Deactivate (soft delete) my account
// @access  Private (User)
export const deactivateAccount = asyncHandler(async (req, res) => {
    const { reason } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) return errorResponse(res, 404, "User not found");

    user.isActive = false;
    user.deletedAt = new Date();
    user.deletionReason = reason || "User requested deactivation";
    user.clearAllSessions();
    await user.save({ validateBeforeSave: false });

    // Clear cookies
    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");

    successResponse(res, 200, "Account deactivated successfully");
});
