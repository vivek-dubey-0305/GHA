import { Review } from "../models/review.model.js";
import { Course } from "../models/course.model.js";
import { Enrollment } from "../models/enrollment.model.js";
import { asyncHandler } from "../middlewares/async.middleware.js";
import { errorResponse, successResponse } from "../utils/response.utils.js";
import logger from "../configs/logger.config.js";

/**
 * Review Controller
 * Handles course review CRUD for users
 */

const deriveTitleFromComment = (title, comment) => {
    const normalizedTitle = typeof title === "string" ? title.trim() : "";
    if (normalizedTitle.length >= 5) return normalizedTitle;

    const normalizedComment = typeof comment === "string"
        ? comment.replace(/\s+/g, " ").trim()
        : "";

    if (!normalizedComment) return "Course Review";

    const derived = normalizedComment.slice(0, 100).trim();
    if (derived.length >= 5) return derived;
    return "Course Review";
};

const parseIntegerRating = (rawRating) => {
    if (rawRating === undefined || rawRating === null || rawRating === "") return null;

    const parsed = Number(rawRating);
    if (!Number.isInteger(parsed) || parsed < 1 || parsed > 5) {
        return null;
    }

    return parsed;
};

const syncCourseRating = async (courseId) => {
    try {
        const course = await Course.findById(courseId);
        if (course) await course.updateRating();
    } catch (error) {
        logger.warn(`Review saved but rating sync failed for course ${courseId}: ${error.message}`);
    }
};

// @route   POST /api/v1/reviews
// @desc    Create a review for a course
// @access  Private (User - must be enrolled)
export const createReview = asyncHandler(async (req, res) => {
    const { courseId, rating, title, comment } = req.body;

    if (!courseId || !comment) {
        return errorResponse(res, 400, "courseId, rating, and comment are required");
    }

    const parsedRating = parseIntegerRating(rating);
    if (!parsedRating) {
        return errorResponse(res, 400, "Rating must be an integer between 1 and 5");
    }

    // Verify enrollment
    const isEnrolled = await Enrollment.isUserEnrolled(req.user.id, courseId);
    if (!isEnrolled) {
        return errorResponse(res, 403, "You must be enrolled in the course to leave a review");
    }

    // Check for existing review
    const existing = await Review.findOne({ user: req.user.id, course: courseId });
    if (existing) {
        return errorResponse(res, 400, "You have already reviewed this course. Use update instead.");
    }

    const review = await Review.create({
        user: req.user.id,
        course: courseId,
        rating: parsedRating,
        title: deriveTitleFromComment(title, comment),
        comment
    });

    // Update course rating
    await syncCourseRating(courseId);

    logger.info(`User ${req.user.id} reviewed course ${courseId} with rating ${parsedRating}`);

    successResponse(res, 201, "Review created successfully", review);
});

// @route   GET /api/v1/reviews/me?courseId=<courseId>
// @desc    Get current user's review for a specific course
// @access  Private (User)
export const getMyReviewForCourse = asyncHandler(async (req, res) => {
    const { courseId } = req.query;
    if (!courseId) {
        return errorResponse(res, 400, "courseId is required");
    }

    const review = await Review.findOne({
        user: req.user.id,
        course: courseId,
    }).populate("course", "title thumbnail rating totalReviews");

    successResponse(res, 200, "My review fetched successfully", { review: review || null });
});

// @route   PUT /api/v1/reviews/:id
// @desc    Update own review
// @access  Private (User - owner)
export const updateReview = asyncHandler(async (req, res) => {
    const review = await Review.findById(req.params.id);
    if (!review) return errorResponse(res, 404, "Review not found");

    if (review.user.toString() !== req.user.id) {
        return errorResponse(res, 403, "You can only update your own reviews");
    }

    const { rating, title, comment } = req.body;

    if (rating !== undefined) {
        const parsedRating = parseIntegerRating(rating);
        if (!parsedRating) {
            return errorResponse(res, 400, "Rating must be an integer between 1 and 5");
        }

        if (parsedRating < review.rating) {
            return errorResponse(res, 400, "You can only keep or increase your rating");
        }

        review.rating = parsedRating;
    }

    if (title !== undefined) {
        review.title = deriveTitleFromComment(title, comment ?? review.comment);
    }

    if (comment !== undefined) review.comment = comment;

    if (comment !== undefined && title === undefined) {
        review.title = deriveTitleFromComment(review.title, comment);
    }

    await review.save();

    // Update course rating
    await syncCourseRating(review.course);

    successResponse(res, 200, "Review updated successfully", review);
});

// @route   DELETE /api/v1/reviews/:id
// @desc    Delete own review
// @access  Private (User - owner)
export const deleteReview = asyncHandler(async (req, res) => {
    const review = await Review.findById(req.params.id);
    if (!review) return errorResponse(res, 404, "Review not found");

    if (review.user.toString() !== req.user.id) {
        return errorResponse(res, 403, "You can only delete your own reviews");
    }

    const courseId = review.course;
    await Review.findByIdAndDelete(req.params.id);

    // Update course rating
    await syncCourseRating(courseId);

    successResponse(res, 200, "Review deleted successfully");
});

// @route   POST /api/v1/reviews/:id/helpful
// @desc    Mark review as helpful
// @access  Private (User)
export const markHelpful = asyncHandler(async (req, res) => {
    const review = await Review.findById(req.params.id);
    if (!review) return errorResponse(res, 404, "Review not found");

    const { review: updatedReview, alreadyMarked } = await review.markHelpful(req.user.id);

    successResponse(res, 200, alreadyMarked ? "Review already marked as helpful" : "Review marked as helpful", {
        helpful: Number(updatedReview.helpful || 0),
        alreadyMarked,
        isMarkedHelpfulByMe: true,
    });
});

// @route   POST /api/v1/reviews/:id/report
// @desc    Report a review
// @access  Private (User)
export const reportReview = asyncHandler(async (req, res) => {
    const { reason } = req.body;
    const review = await Review.findById(req.params.id);
    if (!review) return errorResponse(res, 404, "Review not found");

    await review.report(reason || "Reported by user");

    successResponse(res, 200, "Review reported successfully");
});
