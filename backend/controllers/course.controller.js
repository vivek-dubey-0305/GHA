import { Course } from "../models/course.model.js";
import { Module } from "../models/module.model.js";
import { Lesson } from "../models/lesson.model.js";
import { Instructor } from "../models/instructor.model.js";
import { Enrollment } from "../models/enrollment.model.js";
import { Review } from "../models/review.model.js";
import { asyncHandler } from "../middlewares/async.middleware.js";
import { errorResponse, successResponse } from "../utils/response.utils.js";
import { getPagination, createPaginationResponse } from "../utils/pagination.utils.js";
import {
    uploadCourseThumbnail, updateImage, deleteImage
} from "../services/r2.service.js";
import logger from "../configs/logger.config.js";
import {
    createFullCourseService,
    getFullCourseService,
    deleteFullCourseService,
    updateFullCourseService,
    createDraftCourseService,
    saveDraftCourseService,
} from "../services/fullCourse.service.js";

/**
 * Course Controller
 * Handles public course browsing and instructor course management.
 * Full course operations (create/update/delete with modules+lessons)
 * use centralized fullCourse.service.js.
 */

// ========================= PUBLIC ROUTES =========================

// @route   GET /api/v1/courses
// @desc    Get all published courses (public)
export const getPublicCourses = asyncHandler(async (req, res) => {
    const { page, limit, skip } = getPagination(req.query, 12);
    const { category, level, language, sort: sortBy, search, minPrice, maxPrice } = req.query;

    const filter = { status: "published", isPublished: true };
    if (category) filter.category = category;
    if (level) filter.level = level;
    if (language) filter.language = language;
    if (minPrice || maxPrice) {
        filter.price = {};
        if (minPrice) filter.price.$gte = Number(minPrice);
        if (maxPrice) filter.price.$lte = Number(maxPrice);
    }
    if (search) {
        filter.$or = [
            { title: { $regex: search, $options: "i" } },
            { description: { $regex: search, $options: "i" } },
            { tags: { $in: [new RegExp(search, "i")] } }
        ];
    }

    let sortOption = { createdAt: -1 };
    if (sortBy === "popular") sortOption = { enrolledCount: -1 };
    else if (sortBy === "rating") sortOption = { rating: -1 };
    else if (sortBy === "price-low") sortOption = { price: 1 };
    else if (sortBy === "price-high") sortOption = { price: -1 };
    else if (sortBy === "newest") sortOption = { publishedAt: -1 };

    const total = await Course.countDocuments(filter);
    const courses = await Course.find(filter)
        .populate("instructor", "firstName lastName profilePicture rating")
        .select("-modules")
        .sort(sortOption)
        .skip(skip)
        .limit(limit);

    successResponse(res, 200, "Courses retrieved successfully", {
        courses, pagination: createPaginationResponse(total, page, limit)
    });
});

// @route   GET /api/v1/courses/:id
// @desc    Get course details (public)
export const getCourseDetails = asyncHandler(async (req, res) => {
    const course = await Course.findById(req.params.id)
        .populate("instructor", "firstName lastName profilePicture bio rating totalStudentsTeaching totalCourses")
        .populate({
            path: "modules",
            match: { isPublished: true },
            options: { sort: { order: 1 } },
            populate: {
                path: "lessons",
                match: { isPublished: true },
                options: { sort: { order: 1 } },
                select: "title type isFree order videoPackageId assignmentId liveClassId materialId content",
                populate: [
                    { path: "videoPackageId" },
                    { path: "assignmentId" },
                    { path: "liveClassId" },
                    { path: "materialId" }
                ]
            }
        });

    if (!course) return errorResponse(res, 404, "Course not found");
    if (course.status !== "published" && !req.instructor && !req.admin) {
        return errorResponse(res, 404, "Course not found");
    }

    successResponse(res, 200, "Course details retrieved successfully", course);
});

// @route   GET /api/v1/courses/:id/reviews
// @desc    Get course reviews (public)
export const getCourseReviews = asyncHandler(async (req, res) => {
    const { page, limit, skip } = getPagination(req.query, 10);
    const { verifiedOnly } = req.query;

    const filter = { course: req.params.id, isApproved: true };
    if (verifiedOnly === "true") filter.isVerified = true;

    const total = await Review.countDocuments(filter);
    const reviews = await Review.find(filter)
        .populate("user", "firstName lastName profilePicture")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

    const ratingStats = await Review.getCourseRating(req.params.id);

    successResponse(res, 200, "Reviews retrieved successfully", {
        reviews,
        ratingStats: ratingStats[0] || null,
        pagination: createPaginationResponse(total, page, limit)
    });
});

// ========================= INSTRUCTOR ROUTES =========================

// @route   GET /api/v1/courses/:id/full
// @desc    Get full course structure (instructor - owner only)
export const getFullCourse = asyncHandler(async (req, res) => {
    const course = await Course.findById(req.params.id);
    if (!course) return errorResponse(res, 404, "Course not found");

    // Only owner instructor or admin can view full structure
    if (req.instructor && course.instructor.toString() !== req.instructor.id) {
        return errorResponse(res, 403, "You can only view your own courses");
    }

    const result = await getFullCourseService(req.params.id);
    if (!result) return errorResponse(res, 404, "Course not found");
    successResponse(res, 200, "Full course structure retrieved successfully", result);
});

// @route   POST /api/v1/courses/full
// @desc    Create a full course with modules, lessons, and linked models
// @access  Private (Instructor)
export const createFullCourse = asyncHandler(async (req, res) => {
    let data;
    try {
        data = typeof req.body.data === "string" ? JSON.parse(req.body.data) : req.body.data || req.body;
    } catch (e) {
        return errorResponse(res, 400, "Invalid JSON payload in 'data' field");
    }

    // For instructor routes, use the authenticated instructor's ID
    const instructorId = req.instructor?.id || data.instructor;
    if (!instructorId) return errorResponse(res, 400, "Instructor is required");

    try {
        const { course, errors, isResuming } = await createFullCourseService({
            data: { ...data, instructor: instructorId },
            files: req.files,
            instructorId
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

// @route   POST /api/v1/courses/draft
// @desc    Create draft course without strict validation
// @access  Private (Instructor)
export const createCourseDraft = asyncHandler(async (req, res) => {
    let data;
    try {
        data = typeof req.body.data === "string" ? JSON.parse(req.body.data) : req.body.data || req.body;
    } catch (e) {
        return errorResponse(res, 400, "Invalid JSON payload in 'data' field");
    }

    const instructorId = req.instructor?.id || data.instructor;
    if (!instructorId) return errorResponse(res, 400, "Instructor is required");

    try {
        const { course } = await createDraftCourseService({
            data: { ...data, instructor: instructorId },
            files: req.files,
            instructorId,
        });

        successResponse(res, 201, "Draft course saved successfully", course);
    } catch (e) {
        return errorResponse(res, 400, e.message);
    }
});

// @route   PUT /api/v1/courses/:id/draft
// @desc    Update existing draft course without strict validation
// @access  Private (Instructor)
export const updateCourseDraft = asyncHandler(async (req, res) => {
    const courseDoc = await Course.findById(req.params.id);
    if (!courseDoc) return errorResponse(res, 404, "Course not found");

    if (req.instructor && courseDoc.instructor.toString() !== req.instructor.id) {
        return errorResponse(res, 403, "You can only update your own draft courses");
    }

    let data;
    try {
        data = typeof req.body.data === "string" ? JSON.parse(req.body.data) : req.body.data || req.body;
    } catch (e) {
        return errorResponse(res, 400, "Invalid JSON payload in 'data' field");
    }

    try {
        const { course } = await saveDraftCourseService({
            courseId: req.params.id,
            data,
            files: req.files,
        });

        successResponse(res, 200, "Draft course saved successfully", course);
    } catch (e) {
        return errorResponse(res, e.message === "Course not found" ? 404 : 400, e.message);
    }
});

// @route   PUT /api/v1/courses/:id/full
// @desc    Update full course with modules/lessons (instructor - owner only)
export const updateFullCourse = asyncHandler(async (req, res) => {
    const courseDoc = await Course.findById(req.params.id);
    if (!courseDoc) return errorResponse(res, 404, "Course not found");

    if (req.instructor && courseDoc.instructor.toString() !== req.instructor.id) {
        return errorResponse(res, 403, "You can only update your own courses");
    }

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

        successResponse(res, 200, "Course updated successfully", {
            course, errors: errors.length > 0 ? errors : undefined
        });
    } catch (e) {
        return errorResponse(res, e.message === "Course not found" ? 404 : 400, e.message);
    }
});

// @route   DELETE /api/v1/courses/:id/full
// @desc    Delete full course with all related data (instructor - owner only)
export const deleteFullCourse = asyncHandler(async (req, res) => {
    const course = await Course.findById(req.params.id);
    if (!course) return errorResponse(res, 404, "Course not found");

    if (req.instructor && course.instructor.toString() !== req.instructor.id) {
        return errorResponse(res, 403, "You can only delete your own courses");
    }

    // Check for active enrollments
    const activeEnrollments = await Enrollment.countDocuments({ course: req.params.id, status: "active" });
    if (activeEnrollments > 0) {
        return errorResponse(res, 400, `Cannot delete course with ${activeEnrollments} active enrollments. Archive instead.`);
    }

    try {
        const { deletedCourseId, errors } = await deleteFullCourseService(req.params.id);

        // Remove course reference from instructor
        await Instructor.findByIdAndUpdate(course.instructor, {
            $pull: { courses: course._id },
            $inc: { totalCourses: -1 }
        });

        successResponse(res, 200, "Course and all related data deleted successfully", {
            deletedCourseId, errors: errors.length > 0 ? errors : undefined
        });
    } catch (e) {
        return errorResponse(res, 500, e.message);
    }
});

// @route   PATCH /api/v1/courses/:id/publish
// @desc    Publish/unpublish a course
// @access  Private (Instructor - owner)
export const togglePublishCourse = asyncHandler(async (req, res) => {
    const course = await Course.findById(req.params.id);
    if (!course) return errorResponse(res, 404, "Course not found");

    if (course.instructor.toString() !== req.instructor.id) {
        return errorResponse(res, 403, "You can only publish your own courses");
    }

    if (!course.isPublished) {
        if (course.totalModules === 0) return errorResponse(res, 400, "Course must have at least one module to publish");
        if (course.totalLessons === 0) return errorResponse(res, 400, "Course must have at least one lesson to publish");

        course.status = "published";
        course.isPublished = true;
        course.publishedAt = new Date();
    } else {
        course.status = "draft";
        course.isPublished = false;
    }

    await course.save();
    successResponse(res, 200, `Course ${course.isPublished ? "published" : "unpublished"} successfully`, course);
});

// @route   GET /api/v1/courses/:id/stats
// @desc    Get course analytics
// @access  Private (Instructor - owner)
export const getCourseStats = asyncHandler(async (req, res) => {
    const course = await Course.findById(req.params.id);
    if (!course) return errorResponse(res, 404, "Course not found");

    if (course.instructor.toString() !== req.instructor.id) {
        return errorResponse(res, 403, "You can only view stats for your own courses");
    }

    const [enrollmentCount, activeCount, completedCount, reviewCount, ratingStats] = await Promise.all([
        Enrollment.countDocuments({ course: req.params.id }),
        Enrollment.countDocuments({ course: req.params.id, status: "active" }),
        Enrollment.countDocuments({ course: req.params.id, status: "completed" }),
        Review.countDocuments({ course: req.params.id }),
        Review.getCourseRating(req.params.id)
    ]);

    successResponse(res, 200, "Course stats retrieved successfully", {
        course: { title: course.title, status: course.status },
        enrollments: { total: enrollmentCount, active: activeCount, completed: completedCount },
        reviews: { total: reviewCount, ratingStats: ratingStats[0] || null },
        revenue: course.enrolledCount * (course.discountPrice || course.price)
    });
});
