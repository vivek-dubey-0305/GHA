import { Announcement } from "../models/announcement.model.js";
import { Course } from "../models/course.model.js";
import { Enrollment } from "../models/enrollment.model.js";
import { Notification } from "../models/notification.model.js";
import { asyncHandler } from "../middlewares/async.middleware.js";
import { successResponse, errorResponse } from "../utils/response.utils.js";
import { getPagination, createPaginationResponse } from "../utils/pagination.utils.js";

// @route   POST /api/v1/announcements
// @desc    Create announcement
// @access  Private (Instructor)
export const createAnnouncement = asyncHandler(async (req, res) => {
    const { title, content, course, type, priority } = req.body;

    // Verify course ownership if specified
    if (course) {
        const courseDoc = await Course.findOne({ _id: course, instructor: req.instructor.id });
        if (!courseDoc) return errorResponse(res, 404, "Course not found or not owned by you");
    }

    const announcement = await Announcement.create({
        instructor: req.instructor.id,
        course: course || null,
        title,
        content,
        type: type || "general",
        priority: priority || "normal"
    });

    // Create notifications for enrolled students
    const courseFilter = course
        ? { course, status: "active" }
        : { course: { $in: (await Course.find({ instructor: req.instructor.id }).select("_id")).map(c => c._id) }, status: "active" };

    const enrollments = await Enrollment.find(courseFilter).select("user").lean();
    const uniqueUsers = [...new Set(enrollments.map(e => e.user.toString()))];

    if (uniqueUsers.length > 0) {
        const notifications = uniqueUsers.map(userId => ({
            recipient: userId,
            recipientRole: "User",
            type: "announcement",
            title: `New Announcement: ${title}`,
            message: content.substring(0, 200),
            data: { announcementId: announcement._id, courseId: course || null }
        }));
        await Notification.insertMany(notifications);
    }

    successResponse(res, 201, "Announcement created successfully", announcement);
});

// @route   GET /api/v1/announcements/instructor/my
// @desc    Get instructor's announcements
// @access  Private (Instructor)
export const getMyAnnouncements = asyncHandler(async (req, res) => {
    const { page, limit, skip } = getPagination(req.query, 10);
    const { courseId } = req.query;

    const filter = { instructor: req.instructor.id };
    if (courseId) filter.course = courseId;

    const total = await Announcement.countDocuments(filter);
    const announcements = await Announcement.find(filter)
        .populate("course", "title")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

    successResponse(res, 200, "Announcements retrieved successfully", {
        announcements,
        pagination: createPaginationResponse(total, page, limit)
    });
});

// @route   PUT /api/v1/announcements/instructor/my/:id
// @desc    Update announcement
// @access  Private (Instructor)
export const updateAnnouncement = asyncHandler(async (req, res) => {
    const { title, content, type, priority, isPublished } = req.body;

    const announcement = await Announcement.findOne({ _id: req.params.id, instructor: req.instructor.id });
    if (!announcement) return errorResponse(res, 404, "Announcement not found");

    if (title) announcement.title = title;
    if (content) announcement.content = content;
    if (type) announcement.type = type;
    if (priority) announcement.priority = priority;
    if (isPublished !== undefined) announcement.isPublished = isPublished;

    await announcement.save();
    successResponse(res, 200, "Announcement updated successfully", announcement);
});

// @route   DELETE /api/v1/announcements/instructor/my/:id
// @desc    Delete announcement
// @access  Private (Instructor)
export const deleteAnnouncement = asyncHandler(async (req, res) => {
    const announcement = await Announcement.findOneAndDelete({ _id: req.params.id, instructor: req.instructor.id });
    if (!announcement) return errorResponse(res, 404, "Announcement not found");

    successResponse(res, 200, "Announcement deleted successfully");
});

// @route   GET /api/v1/announcements/course/:courseId
// @desc    Get announcements for a course (students)
// @access  Private (User)
export const getCourseAnnouncements = asyncHandler(async (req, res) => {
    const { page, limit, skip } = getPagination(req.query, 10);

    const filter = { course: req.params.courseId, isPublished: true };
    const total = await Announcement.countDocuments(filter);
    const announcements = await Announcement.find(filter)
        .populate("instructor", "firstName lastName profilePicture")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

    successResponse(res, 200, "Announcements retrieved successfully", {
        announcements,
        pagination: createPaginationResponse(total, page, limit)
    });
});

// @route   GET /api/v1/announcements/user/my
// @desc    Get all announcements relevant to logged-in user
// @access  Private (User)
export const getUserAnnouncements = asyncHandler(async (req, res) => {
    const { page, limit, skip } = getPagination(req.query, 20);

    const enrollments = await Enrollment.find({ user: req.user.id, status: { $in: ["active", "completed"] } })
        .select("course")
        .lean();

    const courseIds = enrollments.map((e) => e.course).filter(Boolean);

    const instructorIds = courseIds.length > 0
        ? (await Course.find({ _id: { $in: courseIds } }).select("instructor").lean()).map((c) => c.instructor)
        : [];

    const filter = {
        isPublished: true,
        $or: [
            { course: { $in: courseIds } },
            { course: null, instructor: { $in: instructorIds } },
        ],
    };

    const total = await Announcement.countDocuments(filter);
    const announcements = await Announcement.find(filter)
        .populate("instructor", "firstName lastName profilePicture")
        .populate("course", "title")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

    const withReadState = announcements.map((a) => {
        const isRead = Array.isArray(a.readBy) && a.readBy.some((entry) => String(entry?.user) === String(req.user.id));
        return { ...a, isRead };
    });

    const unreadCount = withReadState.filter((a) => !a.isRead).length;

    successResponse(res, 200, "User announcements retrieved successfully", {
        announcements: withReadState,
        unreadCount,
        pagination: createPaginationResponse(total, page, limit),
    });
});

// @route   PATCH /api/v1/announcements/user/:id/read
// @desc    Mark one announcement as read for logged-in user
// @access  Private (User)
export const markAnnouncementRead = asyncHandler(async (req, res) => {
    const announcement = await Announcement.findById(req.params.id);
    if (!announcement) return errorResponse(res, 404, "Announcement not found");

    const alreadyRead = announcement.readBy.some((entry) => String(entry?.user) === String(req.user.id));
    if (!alreadyRead) {
        announcement.readBy.push({ user: req.user.id, readAt: new Date() });
        await announcement.save();
    }

    successResponse(res, 200, "Announcement marked as read", announcement);
});

// @route   PATCH /api/v1/announcements/user/read-all
// @desc    Mark all visible announcements as read for logged-in user
// @access  Private (User)
export const markAllUserAnnouncementsRead = asyncHandler(async (req, res) => {
    const enrollments = await Enrollment.find({ user: req.user.id, status: { $in: ["active", "completed"] } })
        .select("course")
        .lean();

    const courseIds = enrollments.map((e) => e.course).filter(Boolean);
    const instructorIds = courseIds.length > 0
        ? (await Course.find({ _id: { $in: courseIds } }).select("instructor").lean()).map((c) => c.instructor)
        : [];

    await Announcement.updateMany(
        {
            isPublished: true,
            $or: [
                { course: { $in: courseIds } },
                { course: null, instructor: { $in: instructorIds } },
            ],
            "readBy.user": { $ne: req.user.id },
        },
        {
            $push: {
                readBy: { user: req.user.id, readAt: new Date() },
            },
        }
    );

    successResponse(res, 200, "All announcements marked as read");
});
