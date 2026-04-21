import mongoose from "mongoose";
import { asyncHandler } from "../middlewares/async.middleware.js";
import { successResponse, errorResponse } from "../utils/response.utils.js";
import { getPagination, createPaginationResponse } from "../utils/pagination.utils.js";
import { DoubtTicket } from "../models/doubt-ticket.model.js";
import { Notification } from "../models/notification.model.js";
import {
    DOUBT_TICKET_NOTIFICATION_TYPES,
    DOUBT_TICKET_RESOLVER_SOURCE,
    DOUBT_TICKET_STATUS,
} from "../constants/doubt-ticket.constant.js";
import {
    canCreateDoubtTicketForUser,
    validateUserCourseAccessForDoubt,
    uploadDoubtAttachments,
    buildCreateDoubtPayload,
    getUserDailyDoubtQuota,
    isAllowedInstructorTransition,
} from "../services/doubt-ticket.service.js";
import { uploadMaterialFile } from "../services/r2.service.js";

const emitNotification = ({ req, recipientId, recipientRole, event, payload }) => {
    const io = req.app.get("io");
    if (!io) return;
    io.to(`notifications:${recipientRole}:${recipientId}`).emit(event, payload);
};

const uploadReplyImages = async ({ files = [], courseTitle, ticketId, roleLabel }) => {
    if (!Array.isArray(files) || files.length === 0) return [];

    const uploaded = [];
    for (const file of files) {
        if (!String(file.mimetype || "").startsWith("image/")) {
            continue;
        }

        const result = await uploadMaterialFile(
            file.buffer,
            courseTitle || "course",
            "doubt_ticket_replies",
            `${ticketId}_${roleLabel}`,
            file.originalname,
            "image"
        );

        uploaded.push({
            mimeType: file.mimetype,
            originalName: file.originalname,
            public_id: result.public_id,
            secure_url: result.secure_url,
            size: file.size || result.bytes || 0,
        });
    }

    return uploaded;
};

export const createDoubtTicket = asyncHandler(async (req, res) => {
    const userId = req.user?.id;
    if (!userId) return errorResponse(res, 401, "Authentication required");

    const { courseId, lessonId, liveClassId, title, description, notes } = req.body;
    if (!courseId || !title || !description) {
        return errorResponse(res, 400, "courseId, title and description are required");
    }

    const quotaCheck = await canCreateDoubtTicketForUser(userId);
    if (!quotaCheck.ok) return errorResponse(res, quotaCheck.code, quotaCheck.message, quotaCheck.quota);

    const accessCheck = await validateUserCourseAccessForDoubt({
        userId,
        courseId,
        lessonId,
        liveClassId,
    });
    if (!accessCheck.ok) return errorResponse(res, accessCheck.code, accessCheck.message);

    const ticketId = new mongoose.Types.ObjectId();
    const attachments = await uploadDoubtAttachments({
        files: req.files || [],
        courseTitle: accessCheck.course.title,
        ticketId,
    });

    const payload = buildCreateDoubtPayload({
        userId,
        course: accessCheck.course,
        body: { lessonId, liveClassId, title, description, notes },
        ticketId,
        attachments,
    });
    payload.courseType = accessCheck.course?.type || "recorded";

    const ticket = await DoubtTicket.create(payload);

    const notification = await Notification.createNotification({
        recipient: accessCheck.course.instructor,
        recipientRole: "Instructor",
        type: DOUBT_TICKET_NOTIFICATION_TYPES.CREATED,
        title: `New doubt ticket: ${ticket.title}`,
        message: ticket.description.slice(0, 200),
        data: {
            doubtTicketId: ticket._id,
            courseId: ticket.course,
            userId: ticket.user,
            status: ticket.status,
        },
    });

    emitNotification({
        req,
        recipientId: String(accessCheck.course.instructor),
        recipientRole: "Instructor",
        event: DOUBT_TICKET_NOTIFICATION_TYPES.CREATED,
        payload: { notification },
    });

    const quota = await getUserDailyDoubtQuota(userId);
    successResponse(res, 201, "Doubt ticket created successfully", { ticket, quota });
});

export const getMyDoubtTickets = asyncHandler(async (req, res) => {
    const userId = req.user?.id;
    if (!userId) return errorResponse(res, 401, "Authentication required");

    const { page, limit, skip } = getPagination(req.query, 10);
    const { status, search } = req.query;

    const filter = { user: userId };
    if (status) filter.status = status;
    if (search && String(search).trim()) {
        const regex = { $regex: String(search).trim(), $options: "i" };
        filter.$or = [
            { title: regex },
            { description: regex },
            { status: regex },
        ];
    }

    const total = await DoubtTicket.countDocuments(filter);
    const tickets = await DoubtTicket.find(filter)
        .populate("course", "title")
        .populate("instructor", "firstName lastName profilePicture")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

    const quota = await getUserDailyDoubtQuota(userId);

    successResponse(res, 200, "Doubt tickets retrieved", {
        tickets,
        quota,
        pagination: createPaginationResponse(total, page, limit),
    });
});

export const getMyDoubtQuota = asyncHandler(async (req, res) => {
    const userId = req.user?.id;
    if (!userId) return errorResponse(res, 401, "Authentication required");

    const quota = await getUserDailyDoubtQuota(userId);
    successResponse(res, 200, "Doubt ticket quota retrieved", quota);
});

export const getMyDoubtTicketById = asyncHandler(async (req, res) => {
    const userId = req.user?.id;
    if (!userId) return errorResponse(res, 401, "Authentication required");

    const ticket = await DoubtTicket.findOne({ _id: req.params.id, user: userId })
        .populate("course", "title")
        .populate("instructor", "firstName lastName profilePicture")
        .populate("lesson", "title")
        .populate("liveClass", "title scheduledAt")
        .populate("replies.author", "firstName lastName profilePicture")
        .lean();

    if (!ticket) return errorResponse(res, 404, "Doubt ticket not found");
    successResponse(res, 200, "Doubt ticket retrieved", ticket);
});

export const addUserReplyToDoubtTicket = asyncHandler(async (req, res) => {
    const userId = req.user?.id;
    if (!userId) return errorResponse(res, 401, "Authentication required");

    const content = String(req.body?.content || "").trim();

    const ticket = await DoubtTicket.findOne({ _id: req.params.id, user: userId }).populate("course", "title");
    if (!ticket) return errorResponse(res, 404, "Doubt ticket not found");

    if ([DOUBT_TICKET_STATUS.RESOLVED, DOUBT_TICKET_STATUS.CLOSED].includes(ticket.status)) {
        return errorResponse(res, 400, "This ticket is resolved and no longer accepts new replies");
    }

    const images = await uploadReplyImages({
        files: req.files || [],
        courseTitle: ticket?.course?.title,
        ticketId: ticket._id,
        roleLabel: "user",
    });

    if (!content && images.length === 0) {
        return errorResponse(res, 400, "Reply must contain text or at least one image");
    }

    ticket.replies.push({
        author: userId,
        authorRole: "User",
        content,
        images,
    });
    await ticket.save();

    const reply = ticket.replies[ticket.replies.length - 1];

    const notification = await Notification.createNotification({
        recipient: ticket.instructor,
        recipientRole: "Instructor",
        type: DOUBT_TICKET_NOTIFICATION_TYPES.CREATED,
        title: `New reply on doubt ticket: ${ticket.title}`,
        message: content ? content.slice(0, 200) : "New image reply received",
        data: { doubtTicketId: ticket._id, status: ticket.status },
    });

    emitNotification({
        req,
        recipientId: String(ticket.instructor),
        recipientRole: "Instructor",
        event: DOUBT_TICKET_NOTIFICATION_TYPES.CREATED,
        payload: { notification },
    });

    const io = req.app.get("io");
    if (io) {
        io.to(`doubt-ticket:${ticket._id}`).emit("doubt_ticket:new_reply", {
            ticketId: String(ticket._id),
            reply,
            senderRole: "User",
            timestamp: new Date().toISOString(),
        });
    }

    successResponse(res, 201, "Reply added", reply);
});

export const getAssignedDoubtTickets = asyncHandler(async (req, res) => {
    const instructorId = req.instructor?.id;
    if (!instructorId) return errorResponse(res, 401, "Authentication required");

    const { page, limit, skip } = getPagination(req.query, 10);
    const { status } = req.query;

    const filter = { instructor: instructorId };
    if (status) filter.status = status;

    const total = await DoubtTicket.countDocuments(filter);
    const tickets = await DoubtTicket.find(filter)
        .populate("course", "title")
        .populate("user", "firstName lastName profilePicture")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

    successResponse(res, 200, "Assigned doubt tickets retrieved", {
        tickets,
        pagination: createPaginationResponse(total, page, limit),
    });
});

export const getAssignedDoubtTicketById = asyncHandler(async (req, res) => {
    const instructorId = req.instructor?.id;
    if (!instructorId) return errorResponse(res, 401, "Authentication required");

    const ticket = await DoubtTicket.findOne({ _id: req.params.id, instructor: instructorId })
        .populate("course", "title")
        .populate("user", "firstName lastName email profilePicture")
        .populate("lesson", "title")
        .populate("liveClass", "title scheduledAt")
        .populate("replies.author", "firstName lastName profilePicture")
        .lean();

    if (!ticket) return errorResponse(res, 404, "Doubt ticket not found");
    successResponse(res, 200, "Doubt ticket retrieved", ticket);
});

export const acceptDoubtTicket = asyncHandler(async (req, res) => {
    const instructorId = req.instructor?.id;
    if (!instructorId) return errorResponse(res, 401, "Authentication required");

    const ticket = await DoubtTicket.findOne({ _id: req.params.id, instructor: instructorId });
    if (!ticket) return errorResponse(res, 404, "Doubt ticket not found");

    const nextStatus = DOUBT_TICKET_STATUS.ACCEPTED;
    if (!isAllowedInstructorTransition({ fromStatus: ticket.status, toStatus: nextStatus })) {
        return errorResponse(res, 400, `Cannot accept ticket from status ${ticket.status}`);
    }

    ticket.status = nextStatus;
    ticket.acceptedAt = new Date();
    await ticket.save();

    const notification = await Notification.createNotification({
        recipient: ticket.user,
        recipientRole: "User",
        type: DOUBT_TICKET_NOTIFICATION_TYPES.ACCEPTED,
        title: `Doubt accepted: ${ticket.title}`,
        message: "Your instructor has accepted your doubt ticket.",
        data: { doubtTicketId: ticket._id, status: ticket.status },
    });

    emitNotification({
        req,
        recipientId: String(ticket.user),
        recipientRole: "User",
        event: DOUBT_TICKET_NOTIFICATION_TYPES.ACCEPTED,
        payload: { notification },
    });

    successResponse(res, 200, "Doubt ticket accepted", ticket);
});

export const resolveDoubtTicket = asyncHandler(async (req, res) => {
    const instructorId = req.instructor?.id;
    if (!instructorId) return errorResponse(res, 401, "Authentication required");

    const { resolutionNote } = req.body;

    const ticket = await DoubtTicket.findOne({ _id: req.params.id, instructor: instructorId });
    if (!ticket) return errorResponse(res, 404, "Doubt ticket not found");

    const nextStatus = DOUBT_TICKET_STATUS.RESOLVED;
    if (!isAllowedInstructorTransition({ fromStatus: ticket.status, toStatus: nextStatus })) {
        return errorResponse(res, 400, `Cannot resolve ticket from status ${ticket.status}`);
    }

    ticket.status = nextStatus;
    ticket.resolutionNote = resolutionNote?.trim() || "";
    ticket.resolvedAt = new Date();
    ticket.resolvedBy = instructorId;
    ticket.resolverSource = DOUBT_TICKET_RESOLVER_SOURCE.INSTRUCTOR;
    await ticket.save();

    const notification = await Notification.createNotification({
        recipient: ticket.user,
        recipientRole: "User",
        type: DOUBT_TICKET_NOTIFICATION_TYPES.RESOLVED,
        title: `Doubt resolved: ${ticket.title}`,
        message: "Your instructor resolved your doubt ticket.",
        data: {
            doubtTicketId: ticket._id,
            status: ticket.status,
            resolutionNote: ticket.resolutionNote,
        },
    });

    emitNotification({
        req,
        recipientId: String(ticket.user),
        recipientRole: "User",
        event: DOUBT_TICKET_NOTIFICATION_TYPES.RESOLVED,
        payload: { notification },
    });

    successResponse(res, 200, "Doubt ticket resolved", ticket);
});

export const submitDoubtResolutionFeedback = asyncHandler(async (req, res) => {
    const userId = req.user?.id;
    if (!userId) return errorResponse(res, 401, "Authentication required");

    const { solved, rating, comment } = req.body || {};

    const ticket = await DoubtTicket.findOne({ _id: req.params.id, user: userId });
    if (!ticket) return errorResponse(res, 404, "Doubt ticket not found");

    if (ticket.status !== DOUBT_TICKET_STATUS.RESOLVED) {
        return errorResponse(res, 400, "Feedback can be submitted only after ticket resolution");
    }

    if (typeof solved !== "boolean") {
        return errorResponse(res, 400, "Solved is required and must be boolean");
    }

    let normalizedRating = null;
    if (rating !== undefined && rating !== null && String(rating).trim() !== "") {
        normalizedRating = Number(rating);
        if (!Number.isFinite(normalizedRating) || normalizedRating < 1 || normalizedRating > 5) {
            return errorResponse(res, 400, "Rating must be a number between 1 and 5");
        }
    }

    ticket.resolutionFeedback = {
        solved,
        rating: normalizedRating,
        comment: String(comment || "").trim(),
        ratedAt: new Date(),
    };

    await ticket.save();

    successResponse(res, 200, "Doubt resolution feedback submitted", ticket);
});

export const addInstructorReplyToDoubtTicket = asyncHandler(async (req, res) => {
    const instructorId = req.instructor?.id;
    if (!instructorId) return errorResponse(res, 401, "Authentication required");

    const content = String(req.body?.content || "").trim();

    const ticket = await DoubtTicket.findOne({ _id: req.params.id, instructor: instructorId }).populate("course", "title");
    if (!ticket) return errorResponse(res, 404, "Doubt ticket not found");

    if ([DOUBT_TICKET_STATUS.RESOLVED, DOUBT_TICKET_STATUS.CLOSED].includes(ticket.status)) {
        return errorResponse(res, 400, "This ticket is resolved and no longer accepts new replies");
    }

    const images = await uploadReplyImages({
        files: req.files || [],
        courseTitle: ticket?.course?.title,
        ticketId: ticket._id,
        roleLabel: "instructor",
    });

    if (!content && images.length === 0) {
        return errorResponse(res, 400, "Reply must contain text or at least one image");
    }

    if (ticket.status === DOUBT_TICKET_STATUS.OPEN) {
        ticket.status = DOUBT_TICKET_STATUS.ACCEPTED;
        ticket.acceptedAt = ticket.acceptedAt || new Date();
    }

    ticket.replies.push({
        author: instructorId,
        authorRole: "Instructor",
        content,
        images,
    });

    await ticket.save();

    const reply = ticket.replies[ticket.replies.length - 1];

    const notification = await Notification.createNotification({
        recipient: ticket.user,
        recipientRole: "User",
        type: DOUBT_TICKET_NOTIFICATION_TYPES.ACCEPTED,
        title: `Instructor replied: ${ticket.title}`,
        message: content ? content.slice(0, 200) : "Instructor sent an image reply",
        data: { doubtTicketId: ticket._id, status: ticket.status },
    });

    emitNotification({
        req,
        recipientId: String(ticket.user),
        recipientRole: "User",
        event: DOUBT_TICKET_NOTIFICATION_TYPES.ACCEPTED,
        payload: { notification },
    });

    const io = req.app.get("io");
    if (io) {
        io.to(`doubt-ticket:${ticket._id}`).emit("doubt_ticket:new_reply", {
            ticketId: String(ticket._id),
            reply,
            senderRole: "Instructor",
            timestamp: new Date().toISOString(),
        });
    }

    successResponse(res, 201, "Reply added", reply);
});
