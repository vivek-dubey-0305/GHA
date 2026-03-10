import { Discussion } from "../models/discussion.model.js";
import { Course } from "../models/course.model.js";
import { Notification } from "../models/notification.model.js";
import { asyncHandler } from "../middlewares/async.middleware.js";
import { successResponse, errorResponse } from "../utils/response.utils.js";
import { getPagination, createPaginationResponse } from "../utils/pagination.utils.js";

// @route   POST /api/v1/discussions
// @desc    Create a discussion thread
// @access  Private (User or Instructor)
export const createDiscussion = asyncHandler(async (req, res) => {
    const { course, lesson, title, content, tags } = req.body;

    const courseDoc = await Course.findById(course);
    if (!courseDoc) return errorResponse(res, 404, "Course not found");

    const isInstructor = req.instructor && courseDoc.instructor.toString() === req.instructor.id;
    const authorId = isInstructor ? req.instructor.id : req.user?.id;
    const authorRole = isInstructor ? "Instructor" : "User";

    if (!authorId) return errorResponse(res, 401, "Authentication required");

    const discussion = await Discussion.create({
        course,
        lesson: lesson || null,
        author: authorId,
        authorRole,
        title,
        content,
        tags: tags || []
    });

    // Notify instructor if created by student
    if (!isInstructor) {
        await Notification.createNotification({
            recipient: courseDoc.instructor,
            recipientRole: "Instructor",
            type: "discussion_reply",
            title: `New Discussion: ${title}`,
            message: content.substring(0, 200),
            data: { discussionId: discussion._id, courseId: course }
        });
    }

    successResponse(res, 201, "Discussion created successfully", discussion);
});

// @route   GET /api/v1/discussions/course/:courseId
// @desc    Get discussions for a course
// @access  Private
export const getCourseDiscussions = asyncHandler(async (req, res) => {
    const { page, limit, skip } = getPagination(req.query, 10);
    const { resolved, search } = req.query;

    const filter = { course: req.params.courseId };
    if (resolved === "true") filter.isResolved = true;
    if (resolved === "false") filter.isResolved = false;
    if (search) filter.title = { $regex: search, $options: "i" };

    const total = await Discussion.countDocuments(filter);
    const discussions = await Discussion.find(filter)
        .populate("author", "firstName lastName profilePicture")
        .sort({ isPinned: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select("-replies");

    successResponse(res, 200, "Discussions retrieved successfully", {
        discussions,
        pagination: createPaginationResponse(total, page, limit)
    });
});

// @route   GET /api/v1/discussions/:id
// @desc    Get single discussion with replies
// @access  Private
export const getDiscussion = asyncHandler(async (req, res) => {
    const discussion = await Discussion.findById(req.params.id)
        .populate("author", "firstName lastName profilePicture")
        .populate("replies.author", "firstName lastName profilePicture");

    if (!discussion) return errorResponse(res, 404, "Discussion not found");

    successResponse(res, 200, "Discussion retrieved successfully", discussion);
});

// @route   POST /api/v1/discussions/:id/replies
// @desc    Add reply to discussion
// @access  Private (User or Instructor)
export const addReply = asyncHandler(async (req, res) => {
    const { content } = req.body;
    if (!content) return errorResponse(res, 400, "Reply content is required");

    const discussion = await Discussion.findById(req.params.id);
    if (!discussion) return errorResponse(res, 404, "Discussion not found");

    const isInstructor = !!req.instructor;
    const authorId = isInstructor ? req.instructor.id : req.user?.id;
    const authorRole = isInstructor ? "Instructor" : "User";

    if (!authorId) return errorResponse(res, 401, "Authentication required");

    discussion.replies.push({ author: authorId, authorRole, content });
    await discussion.save();

    const newReply = discussion.replies[discussion.replies.length - 1];

    // Notify discussion author if replier is different
    if (discussion.author.toString() !== authorId) {
        await Notification.createNotification({
            recipient: discussion.author,
            recipientRole: discussion.authorRole,
            type: "discussion_reply",
            title: "New reply to your discussion",
            message: content.substring(0, 200),
            data: { discussionId: discussion._id }
        });
    }

    // Emit socket event for real-time
    const io = req.app.get("io");
    if (io) {
        io.to(`course:${discussion.course}`).emit("new_reply", {
            discussionId: discussion._id,
            reply: newReply
        });
    }

    successResponse(res, 201, "Reply added successfully", newReply);
});

// @route   PATCH /api/v1/discussions/:id/resolve
// @desc    Toggle resolved status
// @access  Private (Instructor only)
export const toggleResolve = asyncHandler(async (req, res) => {
    const discussion = await Discussion.findById(req.params.id);
    if (!discussion) return errorResponse(res, 404, "Discussion not found");

    const course = await Course.findById(discussion.course);
    if (!course || course.instructor.toString() !== req.instructor.id) {
        return errorResponse(res, 403, "Only the course instructor can resolve discussions");
    }

    discussion.isResolved = !discussion.isResolved;
    await discussion.save();

    successResponse(res, 200, `Discussion ${discussion.isResolved ? "resolved" : "unresolved"} successfully`, discussion);
});

// @route   PATCH /api/v1/discussions/:id/pin
// @desc    Toggle pinned status
// @access  Private (Instructor only)
export const togglePin = asyncHandler(async (req, res) => {
    const discussion = await Discussion.findById(req.params.id);
    if (!discussion) return errorResponse(res, 404, "Discussion not found");

    const course = await Course.findById(discussion.course);
    if (!course || course.instructor.toString() !== req.instructor.id) {
        return errorResponse(res, 403, "Only the course instructor can pin discussions");
    }

    discussion.isPinned = !discussion.isPinned;
    await discussion.save();

    successResponse(res, 200, `Discussion ${discussion.isPinned ? "pinned" : "unpinned"} successfully`, discussion);
});

// @route   GET /api/v1/discussions/instructor/my
// @desc    Get all discussions across instructor's courses
// @access  Private (Instructor)
export const getInstructorDiscussions = asyncHandler(async (req, res) => {
    const { page, limit, skip } = getPagination(req.query, 10);
    const { resolved, courseId } = req.query;

    const courses = await Course.find({ instructor: req.instructor.id }).select("_id");
    const courseIds = courses.map(c => c._id);

    const filter = { course: { $in: courseIds } };
    if (courseId) filter.course = courseId;
    if (resolved === "true") filter.isResolved = true;
    if (resolved === "false") filter.isResolved = false;

    const total = await Discussion.countDocuments(filter);
    const discussions = await Discussion.find(filter)
        .populate("author", "firstName lastName profilePicture")
        .populate("course", "title")
        .sort({ isPinned: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select("-replies");

    const unresolvedCount = await Discussion.countDocuments({ course: { $in: courseIds }, isResolved: false });

    successResponse(res, 200, "Discussions retrieved successfully", {
        discussions,
        unresolvedCount,
        pagination: createPaginationResponse(total, page, limit)
    });
});
