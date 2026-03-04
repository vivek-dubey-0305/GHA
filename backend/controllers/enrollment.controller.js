import { Enrollment } from "../models/enrollment.model.js";
import { Course } from "../models/course.model.js";
import { Payment } from "../models/payment.model.js";
import { User } from "../models/user.model.js";
import { asyncHandler } from "../middlewares/async.middleware.js";
import { errorResponse, successResponse } from "../utils/response.utils.js";
import { getPagination, createPaginationResponse } from "../utils/pagination.utils.js";
import logger from "../configs/logger.config.js";

/**
 * Enrollment Controller
 * Handles course enrollment, progress tracking, and refund requests
 */

// @route   POST /api/v1/enrollments
// @desc    Enroll user in a course (after payment)
// @access  Private (User)
export const enrollInCourse = asyncHandler(async (req, res) => {
    const { courseId, paymentId } = req.body;

    if (!courseId || !paymentId) {
        return errorResponse(res, 400, "courseId and paymentId are required");
    }

    // Verify course exists and is published
    const course = await Course.findById(courseId);
    if (!course || !course.isPublished) {
        return errorResponse(res, 404, "Course not found or not available");
    }

    // Check max students
    if (course.maxStudents && course.enrolledCount >= course.maxStudents) {
        return errorResponse(res, 400, "Course is full");
    }

    // Verify payment
    const payment = await Payment.findById(paymentId);
    if (!payment || payment.status !== "completed") {
        return errorResponse(res, 400, "Valid completed payment is required");
    }

    // Check if already enrolled
    const existing = await Enrollment.findOne({ user: req.user.id, course: courseId });
    if (existing) {
        return errorResponse(res, 400, "Already enrolled in this course");
    }

    // Create enrollment
    try {
        const enrollment = new Enrollment({
            user: req.user.id,
            course: courseId,
            payment: paymentId,
            totalLessons: course.totalLessons || 0
        });

        await enrollment.save();

        // Update user's learning progress
        await User.findByIdAndUpdate(req.user.id, {
            $inc: { "learningProgress.totalCoursesEnrolled": 1 }
        });

        // Increment course enrollment count
        await Course.findByIdAndUpdate(courseId, { $inc: { enrolledCount: 1 } });

        // Update instructor student count
        await User.findByIdAndUpdate(course.instructor, { $inc: { totalStudentsTeaching: 1 } });

        logger.info(`User ${req.user.id} enrolled in course ${courseId}`);

        successResponse(res, 201, "Enrolled successfully", enrollment);
    } catch (error) {
        return errorResponse(res, 400, error.message);
    }
});

// @route   GET /api/v1/enrollments/check/:courseId
// @desc    Check if current user is enrolled in a course
// @access  Private (User)
export const checkEnrollment = asyncHandler(async (req, res) => {
    const isEnrolled = await Enrollment.isUserEnrolled(req.user.id, req.params.courseId);

    successResponse(res, 200, "Enrollment status checked", { isEnrolled: !!isEnrolled });
});

// @route   GET /api/v1/enrollments/course/:courseId
// @desc    Get enrollments for a course (instructor/admin)
// @access  Private (Instructor - course owner / Admin)
export const getCourseEnrollments = asyncHandler(async (req, res) => {
    const { page, limit, skip } = getPagination(req.query, 20);
    const { status } = req.query;

    // Verify ownership if instructor
    if (req.instructor) {
        const course = await Course.findById(req.params.courseId);
        if (!course || course.instructor.toString() !== req.instructor.id) {
            return errorResponse(res, 403, "You can only view enrollments for your own courses");
        }
    }

    const filter = { course: req.params.courseId };
    if (status) filter.status = status;

    const total = await Enrollment.countDocuments(filter);
    const enrollments = await Enrollment.find(filter)
        .populate("user", "firstName lastName email profilePicture")
        .populate("payment", "amount currency status")
        .sort({ enrolledAt: -1 })
        .skip(skip)
        .limit(limit);

    successResponse(res, 200, "Enrollments retrieved successfully", {
        enrollments,
        pagination: createPaginationResponse(total, page, limit)
    });
});

// @route   POST /api/v1/enrollments/:id/refund
// @desc    Request refund for enrollment
// @access  Private (User)
export const requestRefund = asyncHandler(async (req, res) => {
    const { reason } = req.body;
    const enrollment = await Enrollment.findOne({
        _id: req.params.id,
        user: req.user.id
    }).populate("payment");

    if (!enrollment) return errorResponse(res, 404, "Enrollment not found");
    if (enrollment.status === "refunded") {
        return errorResponse(res, 400, "Already refunded");
    }
    if (enrollment.refundRequested) {
        return errorResponse(res, 400, "Refund already requested");
    }

    // Check refund eligibility (30-day policy via payment model)
    if (enrollment.payment && !enrollment.payment.isRefundable()) {
        return errorResponse(res, 400, "Refund period has expired (30 days)");
    }

    await enrollment.requestRefund(enrollment.payment?.amount || 0, reason || "User requested refund");

    successResponse(res, 200, "Refund requested successfully", enrollment);
});

// @route   GET /api/v1/enrollments/:id
// @desc    Get enrollment by ID
// @access  Private (User - own / Instructor - course owner / Admin)
export const getEnrollmentById = asyncHandler(async (req, res) => {
    const enrollment = await Enrollment.findById(req.params.id)
        .populate("user", "firstName lastName email profilePicture")
        .populate("course", "title thumbnail instructor totalModules totalLessons")
        .populate("payment", "amount currency status transactionId");

    if (!enrollment) return errorResponse(res, 404, "Enrollment not found");

    // Access control
    const isOwner = req.user && enrollment.user._id.toString() === req.user.id;
    const isAdmin = !!req.admin;
    const isInstructor = req.instructor && enrollment.course.instructor.toString() === req.instructor.id;

    if (!isOwner && !isAdmin && !isInstructor) {
        return errorResponse(res, 403, "Access denied");
    }

    successResponse(res, 200, "Enrollment retrieved successfully", enrollment);
});
