import { User } from "../models/user.model.js";
import { Course } from "../models/course.model.js";
import { Instructor } from "../models/instructor.model.js";
import { Enrollment } from "../models/enrollment.model.js";
import { Module } from "../models/module.model.js";
import { Lesson } from "../models/lesson.model.js";
import { Payment } from "../models/payment.model.js";
import { Review } from "../models/review.model.js";
import { Assignment } from "../models/assignment.model.js";
import { Submission } from "../models/submission.model.js";
import { Certificate } from "../models/certificate.model.js";
import { LiveClass } from "../models/liveclass.model.js";
import { Video } from "../models/video.model.js";
import { Material } from "../models/material.model.js";
import { Progress } from "../models/progress.model.js";
import { asyncHandler } from "../middlewares/async.middleware.js";
import { errorResponse, successResponse } from "../utils/response.utils.js";
import { getPagination, createPaginationResponse } from "../utils/pagination.utils.js";
import {
    uploadProfilePicture, uploadModuleThumbnail, uploadLessonThumbnail,
    uploadAssignmentThumbnail, updateImage, deleteImage
} from "../services/r2.service.js";
import { deleteVideo as deleteBunnyVideo } from "../services/bunny.service.js";
import logger from "../configs/logger.config.js";
import { generateCrudHandlers } from "../services/admin.crud.service.js";
import { generateAdminResourceHandlers } from "../services/adminResource.service.js";
import {
    getFullCourseService,
    createFullCourseService,
    updateFullCourseService,
    deleteFullCourseService,
    saveDraftCourseService,
} from "../services/fullCourse.service.js";

/**
 * Admin Controller
 * Superadmin CRUD operations for ALL models.
 * Uses centralized services to avoid logic duplication.
 *
 * Structure:
 *  1. User & Instructor CRUD (via generateCrudHandlers)
 *  2. Course - Full course operations (via fullCourse.service.js)
 *  3. Resource CRUD (via generateAdminResourceHandlers):
 *     Module, Lesson, Enrollment, Payment, Review, Assignment,
 *     Submission, Certificate, Live Class, Video Package, Material, Progress
 *  4. Dashboard
 */

// ========================= USER CRUD =========================

export const deleteUserProfilePicture = asyncHandler(async (req, res) => {
    const { id } = req.params;
    logger.info(`Admin deleting profile picture for user: ${id}`);

    try {
        const user = await User.findById(id);
        if (!user) return errorResponse(res, 404, "User not found");
        if (!user.profilePicture?.public_id) return errorResponse(res, 400, "User has no profile picture");

        const deleteResult = await deleteImage(user.profilePicture.public_id);
        if (deleteResult.result === "ok") {
            user.profilePicture = null;
            await user.save({ validateBeforeSave: false });
            return successResponse(res, 200, "Profile picture deleted successfully");
        }
        return errorResponse(res, 500, "Failed to delete profile picture from storage");
    } catch (error) {
        logger.error(`Profile picture delete error for user ${id}: ${error.message}`);
        return errorResponse(res, 500, "Failed to delete profile picture. Please try again.");
    }
});

const userCrud = generateCrudHandlers(User, {
    uploadFunction: uploadProfilePicture,
    updateImageFunction: updateImage,
    deleteImageFunction: deleteImage,
    entityType: "User",
});

export const getAllUsers = userCrud.getAll;
export const getUserById = userCrud.getById;
export const createUser = userCrud.create;
export const updateUser = userCrud.update;
export const deleteUser = userCrud.delete;

// ========================= INSTRUCTOR CRUD =========================

export const deleteInstructorProfilePicture = asyncHandler(async (req, res) => {
    const { id } = req.params;
    logger.info(`Admin deleting profile picture for instructor: ${id}`);

    try {
        const instructor = await Instructor.findById(id);
        if (!instructor) return errorResponse(res, 404, "Instructor not found");
        if (!instructor.profilePicture?.public_id) return errorResponse(res, 400, "Instructor has no profile picture");

        const deleteResult = await deleteImage(instructor.profilePicture.public_id);
        if (deleteResult.result === "ok") {
            instructor.profilePicture = null;
            await instructor.save({ validateBeforeSave: false });
            return successResponse(res, 200, "Profile picture deleted successfully");
        }
        return errorResponse(res, 500, "Failed to delete profile picture from storage");
    } catch (error) {
        logger.error(`Profile picture delete error for instructor ${id}: ${error.message}`);
        return errorResponse(res, 500, "Failed to delete profile picture. Please try again.");
    }
});

const instructorCrud = generateCrudHandlers(Instructor, {
    uploadFunction: uploadProfilePicture,
    updateImageFunction: updateImage,
    deleteImageFunction: deleteImage,
    entityType: "Instructor",
    populateOptions: ["courses", "liveClasses", "videos"],
});

export const getAllInstructors = instructorCrud.getAll;
export const getInstructorById = instructorCrud.getById;
export const createInstructor = instructorCrud.create;
export const updateInstructor = instructorCrud.update;
export const deleteInstructor = instructorCrud.delete;

// ========================= COURSE - FULL OPERATIONS =========================

// @route   GET /api/v1/admin/courses
export const getAllCourses = asyncHandler(async (req, res) => {
    const { page, limit, skip } = getPagination(req.query, 10);
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.category) filter.category = req.query.category;
    if (req.query.instructorId) filter.instructor = req.query.instructorId;
    if (req.query.search) {
        filter.$or = [
            { title: { $regex: req.query.search, $options: "i" } },
            { description: { $regex: req.query.search, $options: "i" } }
        ];
    }

    const total = await Course.countDocuments(filter);
    const courses = await Course.find(filter)
        .populate("instructor", "firstName lastName email")
        .skip(skip).limit(limit).sort({ createdAt: -1 });

    successResponse(res, 200, "Courses retrieved successfully", {
        courses, pagination: createPaginationResponse(total, page, limit)
    });
});

// @route   GET /api/v1/admin/courses/drafts
export const getDraftCourses = asyncHandler(async (req, res) => {
    const { page, limit, skip } = getPagination(req.query, 10);
    const filter = { status: "draft" };
    if (req.query.search) {
        filter.$or = [
            { title: { $regex: req.query.search, $options: "i" } },
            { description: { $regex: req.query.search, $options: "i" } }
        ];
    }

    const total = await Course.countDocuments(filter);
    const courses = await Course.find(filter)
        .populate("instructor", "firstName lastName email")
        .populate({
            path: "modules",
            populate: { path: "lessons", select: "title type order", options: { sort: { order: 1 } } }
        })
        .skip(skip).limit(limit).sort({ updatedAt: -1 });

    successResponse(res, 200, "Draft courses retrieved successfully", {
        courses, pagination: createPaginationResponse(total, page, limit)
    });
});

// @route   GET /api/v1/admin/courses/:id/full
export const getFullCourse = asyncHandler(async (req, res) => {
    const result = await getFullCourseService(req.params.id);
    if (!result) return errorResponse(res, 404, "Course not found");
    successResponse(res, 200, "Full course structure retrieved successfully", result);
});

// @route   POST /api/v1/admin/courses/full
export const createFullCourse = asyncHandler(async (req, res) => {
    let data;
    try {
        data = typeof req.body.data === "string" ? JSON.parse(req.body.data) : req.body.data || req.body;
    } catch (e) {
        return errorResponse(res, 400, "Invalid JSON payload in 'data' field");
    }

    const instructorId = data.instructor;
    if (!instructorId) return errorResponse(res, 400, "Instructor is required");

    try {
        const { course, errors, isResuming } = await createFullCourseService({
            data, files: req.files, instructorId
        });

        if (errors.length > 0) {
            logger.error(`Course creation completed with ${errors.length} error(s)`);
            return errorResponse(res, 207, `Course created with ${errors.length} error(s). Fix and retry to complete.`, {
                course, errors
            });
        }

        successResponse(res, 201, isResuming ? "Course updated successfully (resumed)" : "Full course created successfully", course);
    } catch (e) {
        return errorResponse(res, 400, e.message);
    }
});

// @route   PUT /api/v1/admin/courses/:id/full
export const updateFullCourse = asyncHandler(async (req, res) => {
    let updateData;
    try {
        updateData = typeof req.body.data === "string" ? JSON.parse(req.body.data) : (req.body.data || req.body);
    } catch (e) {
        return errorResponse(res, 400, "Invalid JSON payload in 'data' field");
    }

    try {
        const { course, errors } = await updateFullCourseService({
            courseId: req.params.id, updateData, files: req.files
        });

        successResponse(res, 200, "Course structure updated successfully", {
            course, errors: errors.length > 0 ? errors : undefined
        });
    } catch (e) {
        return errorResponse(res, e.message === "Course not found" ? 404 : 500, e.message);
    }
});

// @route   DELETE /api/v1/admin/courses/:id/full
export const deleteFullCourse = asyncHandler(async (req, res) => {
    try {
        const { deletedCourseId, errors } = await deleteFullCourseService(req.params.id);

        successResponse(res, 200, "Course and all related data deleted successfully", {
            deletedCourseId, errors: errors.length > 0 ? errors : undefined
        });
    } catch (e) {
        return errorResponse(res, e.message === "Course not found" ? 404 : 500, e.message);
    }
});

// @route   PUT /api/v1/admin/courses/:id/save-draft
export const saveDraftCourse = asyncHandler(async (req, res) => {
    let data;
    try {
        data = typeof req.body.data === "string" ? JSON.parse(req.body.data) : req.body.data || req.body;
    } catch (e) {
        return errorResponse(res, 400, "Invalid JSON payload");
    }

    try {
        const { course } = await saveDraftCourseService({
            courseId: req.params.id, data, files: req.files
        });
        successResponse(res, 200, "Draft course saved successfully", course);
    } catch (e) {
        return errorResponse(res, e.message === "Course not found" ? 404 : 500, e.message);
    }
});

// ========================= MODULE CRUD =========================

const moduleCrud = generateAdminResourceHandlers(Module, {
    resourceName: "Module",
    resourceKey: "modules",
    buildFilter: (query) => {
        const f = {};
        if (query.courseId) f.course = query.courseId;
        return f;
    },
    listPopulate: [
        { path: "course", select: "title" },
        { path: "lessons", select: "title type" }
    ],
    detailPopulate: [
        { path: "course", select: "title instructor" },
        { path: "lessons" }
    ],
    listSort: { course: 1, order: 1 },
    imageConfig: { field: "thumbnail", uploadFn: uploadModuleThumbnail },
    afterCreate: async (doc) => {
        if (doc.course) {
            await Course.findByIdAndUpdate(doc.course, { $push: { modules: doc._id } });
        }
    },
    beforeDelete: async (doc) => {
        if (doc.thumbnail?.public_id) await deleteImage(doc.thumbnail.public_id).catch(() => {});
        await Lesson.deleteMany({ module: doc._id });
        await Course.findByIdAndUpdate(doc.course, { $pull: { modules: doc._id } });
    }
});

export const getAllModules = moduleCrud.getAll;
export const getModuleById = moduleCrud.getById;
export const createModule = moduleCrud.create;
export const updateModule = moduleCrud.update;
export const deleteModule = moduleCrud.delete;

// ========================= LESSON CRUD =========================

const lessonCrud = generateAdminResourceHandlers(Lesson, {
    resourceName: "Lesson",
    resourceKey: "lessons",
    buildFilter: (query) => {
        const f = {};
        if (query.courseId) f.course = query.courseId;
        if (query.moduleId) f.module = query.moduleId;
        if (query.type) f.type = query.type;
        return f;
    },
    listPopulate: [
        { path: "course", select: "title" },
        { path: "module", select: "title" }
    ],
    detailPopulate: [
        { path: "course", select: "title" },
        { path: "module", select: "title" }
    ],
    listSort: { module: 1, order: 1 },
    imageConfig: { field: "thumbnail", uploadFn: uploadLessonThumbnail },
    afterCreate: async (doc) => {
        if (doc.module) {
            await Module.findByIdAndUpdate(doc.module, { $push: { lessons: doc._id } });
        }
    },
    beforeDelete: async (doc) => {
        if (doc.thumbnail?.public_id) await deleteImage(doc.thumbnail.public_id).catch(() => {});
        await Module.findByIdAndUpdate(doc.module, { $pull: { lessons: doc._id } });
    }
});

export const getAllLessons = lessonCrud.getAll;
export const getLessonById = lessonCrud.getById;
export const createLesson = lessonCrud.create;
export const updateLesson = lessonCrud.update;
export const deleteLesson = lessonCrud.delete;

// ========================= ENROLLMENT CRUD =========================

const enrollmentCrud = generateAdminResourceHandlers(Enrollment, {
    resourceName: "Enrollment",
    resourceKey: "enrollments",
    buildFilter: (query) => {
        const f = {};
        if (query.userId) f.user = query.userId;
        if (query.courseId) f.course = query.courseId;
        if (query.status) f.status = query.status;
        return f;
    },
    listPopulate: [
        { path: "user", select: "firstName lastName email" },
        { path: "course", select: "title" },
        { path: "payment", select: "amount status" }
    ],
    detailPopulate: [
        { path: "user", select: "firstName lastName email" },
        { path: "course", select: "title" },
        { path: "payment" }
    ],
    afterCreate: async (doc) => {
        await Course.findByIdAndUpdate(doc.course, { $inc: { enrolledCount: 1 } });
        await User.findByIdAndUpdate(doc.user, { $inc: { "learningProgress.totalCoursesEnrolled": 1 } });
    },
    beforeDelete: async (doc) => {
        await Course.findByIdAndUpdate(doc.course, { $inc: { enrolledCount: -1 } });
    }
});

export const getAllEnrollments = enrollmentCrud.getAll;
export const getEnrollmentById = enrollmentCrud.getById;
export const createEnrollment = enrollmentCrud.create;
export const updateEnrollment = enrollmentCrud.update;
export const deleteEnrollment = enrollmentCrud.delete;

// ========================= PAYMENT CRUD =========================

const paymentCrud = generateAdminResourceHandlers(Payment, {
    resourceName: "Payment",
    resourceKey: "payments",
    buildFilter: (query) => {
        const f = {};
        if (query.status) f.status = query.status;
        if (query.userId) f.user = query.userId;
        if (query.courseId) f.course = query.courseId;
        if (query.paymentMethod) f.paymentMethod = query.paymentMethod;
        return f;
    },
    listPopulate: [
        { path: "user", select: "firstName lastName email" },
        { path: "course", select: "title" }
    ],
    detailPopulate: [
        { path: "user", select: "firstName lastName email" },
        { path: "course", select: "title price" },
        { path: "processedBy", select: "name email" }
    ],
});

export const getAllPayments = paymentCrud.getAll;
export const getPaymentById = paymentCrud.getById;
export const updatePayment = paymentCrud.update;
export const deletePayment = paymentCrud.delete;

// @route   POST /api/v1/admin/payments/:id/refund
export const adminProcessRefund = asyncHandler(async (req, res) => {
    const payment = await Payment.findById(req.params.id);
    if (!payment) return errorResponse(res, 404, "Payment not found");

    const { amount, reason } = req.body;
    const refundAmount = amount || payment.amount;

    await payment.processRefund(refundAmount, reason || "Admin-initiated refund");
    payment.processedBy = req.admin.id;
    await payment.save();

    await Enrollment.findOneAndUpdate(
        { user: payment.user, course: payment.course, payment: payment._id },
        { status: "refunded" }
    );

    successResponse(res, 200, "Refund processed successfully", payment);
});

// @route   GET /api/v1/admin/payments/stats
export const getPaymentStats = asyncHandler(async (req, res) => {
    const { startDate, endDate } = req.query;
    const options = {};
    if (startDate) options.startDate = new Date(startDate);
    if (endDate) options.endDate = new Date(endDate);

    const stats = await Payment.getPaymentStats(options);
    const summary = await Payment.aggregate([
        { $group: { _id: "$status", count: { $sum: 1 }, totalAmount: { $sum: "$amount" } } }
    ]);

    successResponse(res, 200, "Payment statistics retrieved", { dailyStats: stats, summary });
});

// ========================= REVIEW CRUD =========================

const reviewCrud = generateAdminResourceHandlers(Review, {
    resourceName: "Review",
    resourceKey: "reviews",
    buildFilter: (query) => {
        const f = {};
        if (query.courseId) f.course = query.courseId;
        if (query.userId) f.user = query.userId;
        if (query.rating) f.rating = parseInt(query.rating);
        if (query.reported === "true") f["reported.isReported"] = true;
        return f;
    },
    listPopulate: [
        { path: "user", select: "firstName lastName email" },
        { path: "course", select: "title" }
    ],
    detailPopulate: [
        { path: "user", select: "firstName lastName email" },
        { path: "course", select: "title" }
    ],
    beforeDelete: async (doc) => {
        if (doc.course) {
            const courseDoc = await Course.findById(doc.course);
            if (courseDoc) await courseDoc.updateRating();
        }
    }
});

export const getAllReviews = reviewCrud.getAll;
export const getReviewById = reviewCrud.getById;
export const updateReview = reviewCrud.update;
export const deleteReview = reviewCrud.delete;

// ========================= ASSIGNMENT CRUD =========================

const assignmentCrud = generateAdminResourceHandlers(Assignment, {
    resourceName: "Assignment",
    resourceKey: "assignments",
    buildFilter: (query) => {
        const f = {};
        if (query.courseId) f.course = query.courseId;
        if (query.instructorId) f.instructor = query.instructorId;
        return f;
    },
    listPopulate: [
        { path: "course", select: "title" },
        { path: "instructor", select: "firstName lastName" }
    ],
    detailPopulate: [
        { path: "course", select: "title" },
        { path: "instructor", select: "firstName lastName" },
        { path: "lesson", select: "title" }
    ],
    imageConfig: { field: "thumbnail", uploadFn: uploadAssignmentThumbnail },
    beforeDelete: async (doc) => {
        if (doc.thumbnail?.public_id) await deleteImage(doc.thumbnail.public_id).catch(() => {});
        await Submission.deleteMany({ assignment: doc._id });
    }
});

export const getAllAssignments = assignmentCrud.getAll;
export const getAssignmentById = assignmentCrud.getById;
export const createAssignment = assignmentCrud.create;
export const updateAssignment = assignmentCrud.update;
export const deleteAssignment = assignmentCrud.delete;

// ========================= SUBMISSION CRUD =========================

const submissionCrud = generateAdminResourceHandlers(Submission, {
    resourceName: "Submission",
    resourceKey: "submissions",
    buildFilter: (query) => {
        const f = {};
        if (query.assignmentId) f.assignment = query.assignmentId;
        if (query.userId) f.user = query.userId;
        if (query.status) f.status = query.status;
        return f;
    },
    listPopulate: [
        { path: "user", select: "firstName lastName email" },
        { path: "assignment", select: "title" },
        { path: "course", select: "title" }
    ],
    detailPopulate: [
        { path: "user", select: "firstName lastName email" },
        { path: "assignment", select: "title maxScore rubrics" },
        { path: "course", select: "title" }
    ],
});

export const getAllSubmissions = submissionCrud.getAll;
export const getSubmissionById = submissionCrud.getById;
export const updateSubmission = submissionCrud.update;
export const deleteSubmission = submissionCrud.delete;

// ========================= CERTIFICATE CRUD =========================

const certificateCrud = generateAdminResourceHandlers(Certificate, {
    resourceName: "Certificate",
    resourceKey: "certificates",
    buildFilter: (query) => {
        const f = {};
        if (query.userId) f.user = query.userId;
        if (query.courseId) f.course = query.courseId;
        if (query.status) f.status = query.status;
        return f;
    },
    listPopulate: [
        { path: "user", select: "firstName lastName email" },
        { path: "course", select: "title" },
        { path: "instructor", select: "firstName lastName" }
    ],
    detailPopulate: [
        { path: "user", select: "firstName lastName email" },
        { path: "course", select: "title" },
        { path: "instructor", select: "firstName lastName" }
    ],
});

export const getAllCertificates = certificateCrud.getAll;
export const getCertificateById = certificateCrud.getById;
export const createCertificate = certificateCrud.create;
export const updateCertificate = certificateCrud.update;
export const deleteCertificate = certificateCrud.delete;

// @route   PATCH /api/v1/admin/certificates/:id/revoke
export const revokeCertificate = asyncHandler(async (req, res) => {
    const certificate = await Certificate.findById(req.params.id);
    if (!certificate) return errorResponse(res, 404, "Certificate not found");
    await certificate.revoke(req.body.reason || "Revoked by admin");
    successResponse(res, 200, "Certificate revoked successfully", certificate);
});

// ========================= LIVE CLASS CRUD =========================

const liveClassCrud = generateAdminResourceHandlers(LiveClass, {
    resourceName: "Live class",
    resourceKey: "liveClasses",
    buildFilter: (query) => {
        const f = {};
        if (query.instructorId) f.instructor = query.instructorId;
        if (query.courseId) f.course = query.courseId;
        if (query.status) f.status = query.status;
        return f;
    },
    listPopulate: [
        { path: "instructor", select: "firstName lastName" },
        { path: "course", select: "title" }
    ],
    listSort: { scheduledAt: -1 },
    detailPopulate: [
        { path: "instructor", select: "firstName lastName" },
        { path: "course", select: "title" },
        { path: "materials" }
    ],
});

export const getAllLiveClasses = liveClassCrud.getAll;
export const getLiveClassById = liveClassCrud.getById;
export const updateLiveClass = liveClassCrud.update;
export const deleteLiveClass = liveClassCrud.delete;

// ========================= VIDEO CRUD =========================

const videoCrud = generateAdminResourceHandlers(Video, {
    resourceName: "Video",
    resourceKey: "videos",
    buildFilter: (query) => {
        const f = {};
        if (query.instructorId) f.instructor = query.instructorId;
        if (query.courseId) f.course = query.courseId;
        if (query.status) f.status = query.status;
        return f;
    },
    listPopulate: [
        { path: "instructor", select: "firstName lastName" },
        { path: "course", select: "title" },
        { path: "lesson", select: "title" }
    ],
    detailPopulate: [
        { path: "instructor", select: "firstName lastName" },
        { path: "course", select: "title" },
        { path: "lesson", select: "title" }
    ],
    beforeDelete: async (doc) => {
        if (doc.bunnyVideoId) {
            try { await deleteBunnyVideo(doc.bunnyVideoId); } catch (e) {
                logger.error(`Failed to delete Bunny video ${doc.bunnyVideoId}: ${e.message}`);
            }
        }
    }
});

export const getAllVideos = videoCrud.getAll;
export const getVideoById = videoCrud.getById;
export const updateVideo = videoCrud.update;
export const deleteVideo = videoCrud.delete;

// ========================= MATERIAL CRUD =========================

const materialCrud = generateAdminResourceHandlers(Material, {
    resourceName: "Material",
    resourceKey: "materials",
    buildFilter: (query) => {
        const f = {};
        if (query.courseId) f.course = query.courseId;
        if (query.instructorId) f.instructor = query.instructorId;
        if (query.type) f.type = query.type;
        return f;
    },
    listPopulate: [
        { path: "instructor", select: "firstName lastName" },
        { path: "course", select: "title" }
    ],
    detailPopulate: [
        { path: "instructor", select: "firstName lastName" },
        { path: "course", select: "title" },
        { path: "module", select: "title" },
        { path: "lesson", select: "title" }
    ],
});

export const getAllMaterials = materialCrud.getAll;
export const getMaterialById = materialCrud.getById;
export const updateMaterial = materialCrud.update;
export const deleteMaterial = materialCrud.delete;

// ========================= PROGRESS CRUD =========================

const progressCrud = generateAdminResourceHandlers(Progress, {
    resourceName: "Progress record",
    resourceKey: "progress",
    buildFilter: (query) => {
        const f = {};
        if (query.userId) f.user = query.userId;
        if (query.courseId) f.course = query.courseId;
        if (query.status) f.status = query.status;
        return f;
    },
    listPopulate: [
        { path: "user", select: "firstName lastName email" },
        { path: "course", select: "title" },
        { path: "lesson", select: "title" }
    ],
    listSort: { updatedAt: -1 },
});

export const getAllProgress = progressCrud.getAll;
export const updateProgress = progressCrud.update;
export const deleteProgress = progressCrud.delete;

// ========================= DASHBOARD =========================

// @route   GET /api/v1/admin/dashboard
export const getDashboard = asyncHandler(async (req, res) => {
    const [
        totalUsers, totalInstructors, totalCourses, totalEnrollments,
        publishedCourses, activeEnrollments, pendingPayments,
        completedPayments, totalCertificates, reportedReviews
    ] = await Promise.all([
        User.countDocuments(),
        Instructor.countDocuments(),
        Course.countDocuments(),
        Enrollment.countDocuments(),
        Course.countDocuments({ status: "published" }),
        Enrollment.countDocuments({ status: "active" }),
        Payment.countDocuments({ status: "pending" }),
        Payment.countDocuments({ status: "completed" }),
        Certificate.countDocuments(),
        Review.countDocuments({ "reported.isReported": true })
    ]);

    const revenue = await Payment.aggregate([
        { $match: { status: "completed" } },
        { $group: { _id: null, totalRevenue: { $sum: "$amount" }, totalTransactions: { $sum: 1 } } }
    ]);

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const [recentEnrollments, recentUsers] = await Promise.all([
        Enrollment.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
        User.countDocuments({ createdAt: { $gte: thirtyDaysAgo } })
    ]);

    successResponse(res, 200, "Dashboard data retrieved", {
        overview: {
            totalUsers, totalInstructors, totalCourses, publishedCourses,
            totalEnrollments, activeEnrollments, totalCertificates, reportedReviews
        },
        payments: {
            pending: pendingPayments, completed: completedPayments,
            totalRevenue: revenue[0]?.totalRevenue || 0,
            totalTransactions: revenue[0]?.totalTransactions || 0
        },
        recent: { enrollments: recentEnrollments, users: recentUsers }
    });
});
