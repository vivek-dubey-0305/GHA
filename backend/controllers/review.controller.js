import { Review } from "../models/review.model.js";
import { Course } from "../models/course.model.js";
import { Enrollment } from "../models/enrollment.model.js";
import { asyncHandler } from "../middlewares/async.middleware.js";
import { errorResponse, successResponse } from "../utils/response.utils.js";
import { getPagination, createPaginationResponse } from "../utils/pagination.utils.js";
import logger from "../configs/logger.config.js";

/**
 * Review Controller
 * Handles course review CRUD for users
 */

// @route   POST /api/v1/reviews
// @desc    Create a review for a course
// @access  Private (User - must be enrolled)
export const createReview = asyncHandler(async (req, res) => {
    const { courseId, rating, title, comment } = req.body;

    if (!courseId || !rating || !title || !comment) {
        return errorResponse(res, 400, "courseId, rating, title, and comment are required");
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
        rating,
        title,
        comment
    });

    // Update course rating
    const course = await Course.findById(courseId);
    if (course) await course.updateRating();

    logger.info(`User ${req.user.id} reviewed course ${courseId} with rating ${rating}`);

    successResponse(res, 201, "Review created successfully", review);
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
    if (rating) review.rating = rating;
    if (title) review.title = title;
    if (comment) review.comment = comment;

    await review.save();

    // Update course rating
    const course = await Course.findById(review.course);
    if (course) await course.updateRating();

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
    const course = await Course.findById(courseId);
    if (course) await course.updateRating();

    successResponse(res, 200, "Review deleted successfully");
});

// @route   POST /api/v1/reviews/:id/helpful
// @desc    Mark review as helpful
// @access  Private (User)
export const markHelpful = asyncHandler(async (req, res) => {
    const review = await Review.findById(req.params.id);
    if (!review) return errorResponse(res, 404, "Review not found");

    await review.markHelpful();

    successResponse(res, 200, "Review marked as helpful", { helpful: review.helpful });
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
