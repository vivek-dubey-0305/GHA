import { Certificate } from "../models/certificate.model.js";
import { Course } from "../models/course.model.js";
import { Enrollment } from "../models/enrollment.model.js";
import { asyncHandler } from "../middlewares/async.middleware.js";
import { errorResponse, successResponse } from "../utils/response.utils.js";
import { getPagination, createPaginationResponse } from "../utils/pagination.utils.js";
import logger from "../configs/logger.config.js";

/**
 * Certificate Controller
 * Handles certificate generation, retrieval, and verification
 */

// @route   POST /api/v1/certificates/generate
// @desc    Generate a certificate for a completed course
// @access  Private (User)
export const generateCertificate = asyncHandler(async (req, res) => {
    const { courseId } = req.body;

    // Check enrollment and completion
    const enrollment = await Enrollment.findOne({
        user: req.user.id,
        course: courseId,
        status: "active"
    });

    if (!enrollment) {
        return errorResponse(res, 404, "Enrollment not found");
    }

    if (enrollment.progressPercentage < 100) {
        return errorResponse(res, 400, `Course not completed. Current progress: ${enrollment.progressPercentage}%`);
    }

    // Check if certificate already exists
    const existingCert = await Certificate.findOne({
        user: req.user.id,
        course: courseId,
        status: { $ne: "revoked" }
    });

    if (existingCert) {
        return errorResponse(res, 400, "Certificate already exists for this course");
    }

    const course = await Course.findById(courseId).populate("instructor", "firstName lastName");
    if (!course) return errorResponse(res, 404, "Course not found");

    const certificate = await Certificate.create({
        user: req.user.id,
        course: courseId,
        instructor: course.instructor._id,
        completionPercentage: enrollment.progressPercentage,
        skills: course.learningOutcomes || [],
        grade: calculateGrade(enrollment.progressPercentage),
        status: "issued"
    });

    // Update enrollment with certificate reference
    enrollment.certificateId = certificate._id;
    await enrollment.save();

    successResponse(res, 201, "Certificate generated successfully", certificate);
});

// @route   GET /api/v1/certificates/my
// @desc    Get all certificates for the logged-in user
// @access  Private (User)
export const getMyCertificates = asyncHandler(async (req, res) => {
    const { page, limit, skip } = getPagination(req.query, 10);

    const filter = { user: req.user.id, status: { $ne: "revoked" } };

    const total = await Certificate.countDocuments(filter);
    const certificates = await Certificate.find(filter)
        .populate("course", "title thumbnail category")
        .populate("instructor", "firstName lastName")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

    successResponse(res, 200, "Certificates retrieved successfully", {
        certificates,
        pagination: createPaginationResponse(total, page, limit)
    });
});

// @route   GET /api/v1/certificates/:id
// @desc    Get certificate details
// @access  Private
export const getCertificate = asyncHandler(async (req, res) => {
    const certificate = await Certificate.findById(req.params.id)
        .populate("user", "firstName lastName email")
        .populate("course", "title thumbnail category description")
        .populate("instructor", "firstName lastName");

    if (!certificate) return errorResponse(res, 404, "Certificate not found");

    successResponse(res, 200, "Certificate retrieved successfully", certificate);
});

// @route   GET /api/v1/certificates/verify/:verificationCode
// @desc    Verify a certificate by verification code
// @access  Public
export const verifyCertificate = asyncHandler(async (req, res) => {
    const certificate = await Certificate.verifyCertificate(req.params.verificationCode);

    if (!certificate) {
        return errorResponse(res, 404, "Invalid or revoked certificate");
    }

    successResponse(res, 200, "Certificate verified successfully", {
        isValid: true,
        certificate
    });
});

// @route   GET /api/v1/certificates/course/:courseId
// @desc    Get all certificates for a course (instructor/admin)
// @access  Private (Instructor - course owner)
export const getCourseCertificates = asyncHandler(async (req, res) => {
    const course = await Course.findById(req.params.courseId);
    if (!course) return errorResponse(res, 404, "Course not found");

    if (req.instructor && course.instructor.toString() !== req.instructor.id) {
        return errorResponse(res, 403, "You can only view certificates for your own courses");
    }

    const { page, limit, skip } = getPagination(req.query, 20);

    const total = await Certificate.countDocuments({ course: req.params.courseId });
    const certificates = await Certificate.find({ course: req.params.courseId })
        .populate("user", "firstName lastName email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

    successResponse(res, 200, "Course certificates retrieved", {
        certificates,
        pagination: createPaginationResponse(total, page, limit)
    });
});

// Helper function to calculate grade
function calculateGrade(percentage) {
    if (percentage >= 90) return "A+";
    if (percentage >= 85) return "A";
    if (percentage >= 80) return "B+";
    if (percentage >= 75) return "B";
    if (percentage >= 70) return "C+";
    if (percentage >= 65) return "C";
    if (percentage >= 60) return "D";
    return "F";
}
