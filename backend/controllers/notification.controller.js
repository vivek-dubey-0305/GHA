import { Notification } from "../models/notification.model.js";
import { asyncHandler } from "../middlewares/async.middleware.js";
import { successResponse, errorResponse } from "../utils/response.utils.js";
import { getPagination, createPaginationResponse } from "../utils/pagination.utils.js";

// @route   GET /api/v1/notifications/my
// @desc    Get my notifications
// @access  Private (User or Instructor)
export const getMyNotifications = asyncHandler(async (req, res) => {
    const { page, limit, skip } = getPagination(req.query, 20);
    const recipientId = req.instructor?.id || req.user?.id;
    const recipientRole = req.instructor ? "Instructor" : "User";

    const filter = { recipient: recipientId, recipientRole };
    const total = await Notification.countDocuments(filter);
    const notifications = await Notification.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

    const unreadCount = await Notification.countDocuments({ ...filter, isRead: false });

    successResponse(res, 200, "Notifications retrieved successfully", {
        notifications,
        unreadCount,
        pagination: createPaginationResponse(total, page, limit)
    });
});

// @route   PATCH /api/v1/notifications/:id/read
// @desc    Mark notification as read
// @access  Private
export const markAsRead = asyncHandler(async (req, res) => {
    const recipientId = req.instructor?.id || req.user?.id;

    const notification = await Notification.findOneAndUpdate(
        { _id: req.params.id, recipient: recipientId },
        { isRead: true, readAt: new Date() },
        { new: true }
    );
    if (!notification) return errorResponse(res, 404, "Notification not found");

    successResponse(res, 200, "Notification marked as read", notification);
});

// @route   PATCH /api/v1/notifications/read-all
// @desc    Mark all notifications as read
// @access  Private
export const markAllAsRead = asyncHandler(async (req, res) => {
    const recipientId = req.instructor?.id || req.user?.id;
    const recipientRole = req.instructor ? "Instructor" : "User";

    await Notification.updateMany(
        { recipient: recipientId, recipientRole, isRead: false },
        { isRead: true, readAt: new Date() }
    );

    successResponse(res, 200, "All notifications marked as read");
});

// @route   GET /api/v1/notifications/unread-count
// @desc    Get unread notification count
// @access  Private
export const getUnreadCount = asyncHandler(async (req, res) => {
    const recipientId = req.instructor?.id || req.user?.id;
    const recipientRole = req.instructor ? "Instructor" : "User";

    const count = await Notification.countDocuments({
        recipient: recipientId,
        recipientRole,
        isRead: false
    });

    successResponse(res, 200, "Unread count retrieved", { count });
});

// @route   GET /api/v1/notifications/unread-summary
// @desc    Get unread summary by communication type
// @access  Private
export const getUnreadSummary = asyncHandler(async (req, res) => {
    const recipientId = req.instructor?.id || req.user?.id;
    const recipientRole = req.instructor ? "Instructor" : "User";

    const [announcementsUnread, notificationsUnread] = await Promise.all([
        Notification.countDocuments({
            recipient: recipientId,
            recipientRole,
            type: "announcement",
            isRead: false,
        }),
        Notification.countDocuments({
            recipient: recipientId,
            recipientRole,
            type: { $ne: "announcement" },
            isRead: false,
        }),
    ]);

    successResponse(res, 200, "Unread summary retrieved", {
        announcementsUnread,
        notificationsUnread,
    });
});

// @route   DELETE /api/v1/notifications/:id
// @desc    Delete a notification
// @access  Private
export const deleteNotification = asyncHandler(async (req, res) => {
    const recipientId = req.instructor?.id || req.user?.id;

    const notification = await Notification.findOneAndDelete({
        _id: req.params.id,
        recipient: recipientId
    });
    if (!notification) return errorResponse(res, 404, "Notification not found");

    successResponse(res, 200, "Notification deleted successfully");
});
