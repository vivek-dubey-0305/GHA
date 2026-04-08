import { Assignment } from "../models/assignment.model.js";
import { Course } from "../models/course.model.js";
import { Submission } from "../models/submission.model.js";
import mongoose from "mongoose";
import { asyncHandler } from "../middlewares/async.middleware.js";
import { errorResponse, successResponse } from "../utils/response.utils.js";
import { getPagination, createPaginationResponse } from "../utils/pagination.utils.js";
import { uploadAssignmentThumbnail, updateImage, deleteImage } from "../services/r2.service.js";
import logger from "../configs/logger.config.js";

const RECORDED_ALLOWED_ASSESSMENT_TYPES = ["mcq", "true_false", "matching"];
const AUTO_GRADED_ASSESSMENT_TYPES = ["mcq", "true_false", "matching"];

const normalizeAssessmentType = (value) => String(value || "subjective").trim().toLowerCase();

const applyCourseAssignmentRules = ({ course, assessmentType }) => {
    const normalizedType = normalizeAssessmentType(assessmentType);

    if (course.type === "recorded") {
        if (!RECORDED_ALLOWED_ASSESSMENT_TYPES.includes(normalizedType)) {
            const allowed = RECORDED_ALLOWED_ASSESSMENT_TYPES.join(", ");
            throw new Error(`Recorded courses support only these assignment assessment types: ${allowed}`);
        }

        return {
            assessmentType: normalizedType,
            gradingType: "auto",
        };
    }

    return {
        assessmentType: normalizedType,
        gradingType: AUTO_GRADED_ASSESSMENT_TYPES.includes(normalizedType) ? "auto" : "manual",
    };
};

/**
 * Assignment Controller
 * Handles assignment CRUD for instructors
 */

// @route   GET /api/v1/courses/:courseId/assignments
// @desc    Get assignments for a course
// @access  Private (Enrolled User / Instructor - owner)
export const getAssignments = asyncHandler(async (req, res) => {
    const { courseId } = req.params;
    const { page, limit, skip } = getPagination(req.query, 10);

    if (!mongoose.isValidObjectId(courseId)) {
        return successResponse(res, 200, "Assignments retrieved successfully", {
            assignments: [],
            pagination: createPaginationResponse(0, page, limit),
        });
    }

    const filter = { course: courseId };

    // If user (not admin/instructor-owner), only show published
    if (req.user && !req.admin) {
        filter.isPublished = true;
    }
    if (req.instructor) {
        const course = await Course.findById(courseId);
        if (!course || course.instructor.toString() !== req.instructor.id) {
            filter.isPublished = true;
        }
    }

    const total = await Assignment.countDocuments(filter);
    const assignments = await Assignment.find(filter)
        .populate("lesson", "title")
        .sort({ dueDate: 1 })
        .skip(skip)
        .limit(limit);

    successResponse(res, 200, "Assignments retrieved successfully", {
        assignments,
        pagination: createPaginationResponse(total, page, limit)
    });
});

// @route   GET /api/v1/assignments/:id
// @desc    Get single assignment
// @access  Private (Enrolled User / Instructor - owner)
export const getAssignment = asyncHandler(async (req, res) => {
    const assignment = await Assignment.findById(req.params.id)
        .populate("course", "title instructor")
        .populate("lesson", "title");

    if (!assignment) return errorResponse(res, 404, "Assignment not found");

    successResponse(res, 200, "Assignment retrieved successfully", assignment);
});

// @route   POST /api/v1/courses/:courseId/assignments
// @desc    Create an assignment (with optional thumbnail via form-data)
// @access  Private (Instructor - course owner)
export const createAssignment = asyncHandler(async (req, res) => {
    const courseId = req.params.courseId || req.body.courseId || req.body.course;
    if (!courseId) return errorResponse(res, 400, "courseId is required");

    const course = await Course.findById(courseId);
    if (!course) return errorResponse(res, 404, "Course not found");

    if (course.instructor.toString() !== req.instructor.id) {
        return errorResponse(res, 403, "You can only create assignments for your own courses");
    }

    const assignmentData = req.body;
    assignmentData.course = courseId;
    assignmentData.instructor = req.instructor.id;
    assignmentData.createdBy = req.instructor.id;

    // Parse JSON fields from form-data
    if (typeof assignmentData.requiredFiles === "string") assignmentData.requiredFiles = JSON.parse(assignmentData.requiredFiles);
    if (typeof assignmentData.rubrics === "string") assignmentData.rubrics = JSON.parse(assignmentData.rubrics);
    if (typeof assignmentData.wordLimit === "string") assignmentData.wordLimit = JSON.parse(assignmentData.wordLimit);
    if (typeof assignmentData.questions === "string") assignmentData.questions = JSON.parse(assignmentData.questions);
    if (typeof assignmentData.testCases === "string") assignmentData.testCases = JSON.parse(assignmentData.testCases);

    assignmentData.assessmentType = assignmentData.assessmentType || "subjective";

    try {
        const mapped = applyCourseAssignmentRules({
            course,
            assessmentType: assignmentData.assessmentType,
        });
        assignmentData.assessmentType = mapped.assessmentType;
        assignmentData.gradingType = mapped.gradingType;
    } catch (ruleError) {
        return errorResponse(res, 400, ruleError.message);
    }

    // Handle thumbnail upload
    if (req.file) {
        const courseName = course.title.replace(/\s+/g, "_");
        const assignmentName = assignmentData.title.replace(/\s+/g, "_");
        try {
            const uploadResult = await uploadAssignmentThumbnail(req.file.buffer, courseName, assignmentName);
            assignmentData.thumbnail = { public_id: uploadResult.public_id, secure_url: uploadResult.secure_url };
        } catch (error) {
            logger.error(`Assignment thumbnail upload failed: ${error.message}`);
        }
    }

    const assignment = await Assignment.create(assignmentData);

    successResponse(res, 201, "Assignment created successfully", assignment);
});

// @route   PUT /api/v1/assignments/:id
// @desc    Update an assignment (with optional thumbnail via form-data)
// @access  Private (Instructor - course owner)
export const updateAssignment = asyncHandler(async (req, res) => {
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) return errorResponse(res, 404, "Assignment not found");

    const course = await Course.findById(assignment.course);
    if (course.instructor.toString() !== req.instructor.id) {
        return errorResponse(res, 403, "You can only update your own course assignments");
    }

    const updateData = req.body;
    updateData.updatedBy = req.instructor.id;

    if (typeof updateData.requiredFiles === "string") updateData.requiredFiles = JSON.parse(updateData.requiredFiles);
    if (typeof updateData.rubrics === "string") updateData.rubrics = JSON.parse(updateData.rubrics);
    if (typeof updateData.wordLimit === "string") updateData.wordLimit = JSON.parse(updateData.wordLimit);
    if (typeof updateData.questions === "string") updateData.questions = JSON.parse(updateData.questions);
    if (typeof updateData.testCases === "string") updateData.testCases = JSON.parse(updateData.testCases);

    const nextAssessmentType = updateData.assessmentType || assignment.assessmentType || "subjective";

    if (nextAssessmentType !== assignment.assessmentType) {
        const submittedCount = await Submission.countDocuments({
            assignment: assignment._id,
            status: { $in: ["submitted", "graded", "returned"] },
        });

        if (submittedCount > 0) {
            return errorResponse(res, 400, "Cannot change assessment type after submissions exist");
        }
    }

    try {
        const mapped = applyCourseAssignmentRules({
            course,
            assessmentType: nextAssessmentType,
        });
        updateData.assessmentType = mapped.assessmentType;
        updateData.gradingType = mapped.gradingType;
    } catch (ruleError) {
        return errorResponse(res, 400, ruleError.message);
    }

    // Handle thumbnail upload
    if (req.file) {
        const courseName = course.title.replace(/\s+/g, "_");
        const assignmentName = (updateData.title || assignment.title).replace(/\s+/g, "_");
        const oldPublicId = assignment.thumbnail?.public_id || null;

        try {
            const uploadResult = await updateImage(
                oldPublicId, req.file.buffer, uploadAssignmentThumbnail, courseName, assignmentName
            );
            updateData.thumbnail = { public_id: uploadResult.public_id, secure_url: uploadResult.secure_url };
        } catch (error) {
            logger.error(`Assignment thumbnail update failed: ${error.message}`);
        }
    }

    const updated = await Assignment.findByIdAndUpdate(req.params.id, updateData, {
        new: true, runValidators: true
    });

    successResponse(res, 200, "Assignment updated successfully", updated);
});

// @route   DELETE /api/v1/assignments/:id
// @desc    Delete an assignment
// @access  Private (Instructor - course owner)
export const deleteAssignment = asyncHandler(async (req, res) => {
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) return errorResponse(res, 404, "Assignment not found");

    const course = await Course.findById(assignment.course);
    if (course.instructor.toString() !== req.instructor.id) {
        return errorResponse(res, 403, "You can only delete your own course assignments");
    }

    if (assignment.thumbnail?.public_id) await deleteImage(assignment.thumbnail.public_id);

    await Assignment.findByIdAndDelete(req.params.id);

    successResponse(res, 200, "Assignment deleted successfully");
});
