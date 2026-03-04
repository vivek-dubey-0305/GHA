import { Submission } from "../models/submission.model.js";
import { Assignment } from "../models/assignment.model.js";
import { Course } from "../models/course.model.js";
import { Enrollment } from "../models/enrollment.model.js";
import { asyncHandler } from "../middlewares/async.middleware.js";
import { errorResponse, successResponse } from "../utils/response.utils.js";
import { getPagination, createPaginationResponse } from "../utils/pagination.utils.js";
import logger from "../configs/logger.config.js";

/**
 * Submission Controller
 * Handles assignment submissions for users and grading for instructors
 */

// @route   POST /api/v1/assignments/:assignmentId/submissions
// @desc    Submit an assignment
// @access  Private (User - enrolled)
export const createSubmission = asyncHandler(async (req, res) => {
    const { assignmentId } = req.params;
    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) return errorResponse(res, 404, "Assignment not found");

    // Verify enrollment
    const isEnrolled = await Enrollment.isUserEnrolled(req.user.id, assignment.course);
    if (!isEnrolled) return errorResponse(res, 403, "You must be enrolled in the course");

    // Check for existing submission
    const existing = await Submission.findOne({ user: req.user.id, assignment: assignmentId });
    if (existing && existing.status !== "returned") {
        return errorResponse(res, 400, "You have already submitted this assignment");
    }

    // Check if overdue
    const isLate = new Date() > assignment.dueDate;
    if (isLate && !assignment.allowLateSubmission) {
        return errorResponse(res, 400, "Assignment submission deadline has passed");
    }

    const submissionData = {
        user: req.user.id,
        assignment: assignmentId,
        course: assignment.course,
        content: req.body.content,
        maxScore: assignment.maxScore,
        status: "submitted",
        submittedAt: new Date(),
        submittedBy: req.user.id,
        isLate,
        latePenalty: isLate ? assignment.lateSubmissionPenalty : 0
    };

    // If resubmitting
    if (existing && existing.status === "returned") {
        const updated = await existing.resubmit(req.body.content);
        return successResponse(res, 200, "Assignment resubmitted successfully", updated);
    }

    const submission = await Submission.create(submissionData);

    // Update assignment submission count
    await assignment.updateAnalytics();

    successResponse(res, 201, "Assignment submitted successfully", submission);
});

// @route   GET /api/v1/submissions/my
// @desc    Get my submissions
// @access  Private (User)
export const getMySubmissions = asyncHandler(async (req, res) => {
    const { page, limit, skip } = getPagination(req.query, 10);
    const { courseId, status } = req.query;

    const options = { courseId, status, limit, skip, sort: "-submittedAt" };
    const submissions = await Submission.getUserSubmissions(req.user.id, options);
    const total = await Submission.countDocuments({
        user: req.user.id,
        ...(courseId && { course: courseId }),
        ...(status && { status })
    });

    successResponse(res, 200, "Submissions retrieved successfully", {
        submissions,
        pagination: createPaginationResponse(total, page, limit)
    });
});

// @route   GET /api/v1/submissions/:id
// @desc    Get submission by ID
// @access  Private (User - own / Instructor - assignment owner)
export const getSubmission = asyncHandler(async (req, res) => {
    const submission = await Submission.findById(req.params.id)
        .populate("user", "firstName lastName email profilePicture")
        .populate("assignment", "title description dueDate maxScore rubrics")
        .populate("course", "title");

    if (!submission) return errorResponse(res, 404, "Submission not found");

    // Access control
    const isOwner = req.user && submission.user._id.toString() === req.user.id;
    const isAdmin = !!req.admin;
    let isInstructor = false;
    if (req.instructor) {
        const assignment = await Assignment.findById(submission.assignment._id);
        isInstructor = assignment && assignment.instructor.toString() === req.instructor.id;
    }

    if (!isOwner && !isAdmin && !isInstructor) {
        return errorResponse(res, 403, "Access denied");
    }

    successResponse(res, 200, "Submission retrieved successfully", submission);
});

// @route   GET /api/v1/assignments/:assignmentId/submissions
// @desc    Get all submissions for an assignment
// @access  Private (Instructor - assignment owner / Admin)
export const getAssignmentSubmissions = asyncHandler(async (req, res) => {
    const { assignmentId } = req.params;
    const { page, limit, skip } = getPagination(req.query, 20);
    const { status } = req.query;

    // Verify instructor owns the assignment
    if (req.instructor) {
        const assignment = await Assignment.findById(assignmentId);
        if (!assignment || assignment.instructor.toString() !== req.instructor.id) {
            return errorResponse(res, 403, "You can only view submissions for your own assignments");
        }
    }

    const filter = { assignment: assignmentId };
    if (status) filter.status = status;

    const total = await Submission.countDocuments(filter);
    const submissions = await Submission.find(filter)
        .populate("user", "firstName lastName email profilePicture")
        .sort({ submittedAt: -1 })
        .skip(skip)
        .limit(limit);

    // Get stats
    const stats = await Submission.getSubmissionStats(assignmentId);

    successResponse(res, 200, "Submissions retrieved successfully", {
        submissions,
        stats: stats[0] || null,
        pagination: createPaginationResponse(total, page, limit)
    });
});

// @route   PUT /api/v1/submissions/:id/grade
// @desc    Grade a submission
// @access  Private (Instructor - assignment owner)
export const gradeSubmission = asyncHandler(async (req, res) => {
    const { score, feedback, rubricScores } = req.body;
    const submission = await Submission.findById(req.params.id);
    if (!submission) return errorResponse(res, 404, "Submission not found");

    // Verify instructor owns the assignment
    const assignment = await Assignment.findById(submission.assignment);
    if (!assignment || assignment.instructor.toString() !== req.instructor.id) {
        return errorResponse(res, 403, "You can only grade submissions for your own assignments");
    }

    if (score === undefined) return errorResponse(res, 400, "Score is required");

    const graded = await submission.grade(
        score,
        feedback || "",
        req.instructor.id,
        rubricScores || []
    );

    // Update assignment analytics
    await assignment.updateAnalytics();

    logger.info(`Instructor ${req.instructor.id} graded submission ${req.params.id} with score ${score}`);

    successResponse(res, 200, "Submission graded successfully", graded);
});

// @route   PUT /api/v1/submissions/:id/return
// @desc    Return submission for revision
// @access  Private (Instructor - assignment owner)
export const returnSubmission = asyncHandler(async (req, res) => {
    const { feedback } = req.body;
    const submission = await Submission.findById(req.params.id);
    if (!submission) return errorResponse(res, 404, "Submission not found");

    const assignment = await Assignment.findById(submission.assignment);
    if (!assignment || assignment.instructor.toString() !== req.instructor.id) {
        return errorResponse(res, 403, "You can only return submissions for your own assignments");
    }

    const returned = await submission.returnForRevision(
        feedback || "Please revise and resubmit",
        req.instructor.id
    );

    successResponse(res, 200, "Submission returned for revision", returned);
});
