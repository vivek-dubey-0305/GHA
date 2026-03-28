import mongoose from "mongoose";
import { uploadMaterialFile } from "./r2.service.js";
import { Enrollment } from "../models/enrollment.model.js";
import { Course } from "../models/course.model.js";
import { Lesson } from "../models/lesson.model.js";
import { LiveClass } from "../models/liveclass.model.js";
import { DoubtTicket } from "../models/doubt-ticket.model.js";
import {
    DOUBT_TICKET_DAILY_LIMIT,
    DOUBT_TICKET_STATUS,
} from "../constants/doubt-ticket.constant.js";
import { getIstDayBounds } from "../utils/ist-time.utils.js";

const detectAttachmentType = (mimeType = "") => {
    if (mimeType.startsWith("image/")) return "image";
    if (mimeType.startsWith("video/")) return "video";
    return null;
};

export const countUserDailyDoubtsIst = async (userId, now = new Date()) => {
    const { start, end } = getIstDayBounds(now);
    return DoubtTicket.countDocuments({
        user: userId,
        createdAt: { $gte: start, $lte: end },
    });
};

export const getUserDailyDoubtQuota = async (userId, now = new Date()) => {
    const used = await countUserDailyDoubtsIst(userId, now);
    return {
        limit: DOUBT_TICKET_DAILY_LIMIT,
        used,
        remaining: Math.max(0, DOUBT_TICKET_DAILY_LIMIT - used),
    };
};

export const validateUserCourseAccessForDoubt = async ({ userId, courseId, lessonId, liveClassId }) => {
    const course = await Course.findById(courseId).select("_id title instructor").lean();
    if (!course) {
        return { ok: false, code: 404, message: "Course not found" };
    }

    const isEnrolled = await Enrollment.exists({
        user: userId,
        course: courseId,
        status: { $in: ["active", "completed"] },
        "moderationLock.isLocked": { $ne: true },
    });

    if (!isEnrolled) {
        return { ok: false, code: 403, message: "You are not enrolled in this course" };
    }

    if (lessonId) {
        const lesson = await Lesson.findOne({ _id: lessonId, course: courseId }).select("_id").lean();
        if (!lesson) {
            return { ok: false, code: 400, message: "Lesson does not belong to the selected course" };
        }
    }

    if (liveClassId) {
        const liveClass = await LiveClass.findOne({ _id: liveClassId, course: courseId }).select("_id").lean();
        if (!liveClass) {
            return { ok: false, code: 400, message: "Live class does not belong to the selected course" };
        }
    }

    return { ok: true, course };
};

export const canCreateDoubtTicketForUser = async (userId) => {
    const quota = await getUserDailyDoubtQuota(userId);
    if (quota.used >= DOUBT_TICKET_DAILY_LIMIT) {
        return {
            ok: false,
            code: 429,
            message: `Daily doubt ticket limit reached (${DOUBT_TICKET_DAILY_LIMIT}/day in IST)`,
            quota,
        };
    }

    return { ok: true, quota };
};

export const uploadDoubtAttachments = async ({ files = [], courseTitle, ticketId }) => {
    const uploaded = [];

    for (const file of files) {
        const kind = detectAttachmentType(file.mimetype);
        if (!kind) continue;

        const upload = await uploadMaterialFile(
            file.buffer,
            courseTitle,
            "doubt_tickets",
            String(ticketId),
            file.originalname,
            "raw"
        );

        uploaded.push({
            type: kind,
            mimeType: file.mimetype,
            originalName: file.originalname,
            public_id: upload.public_id,
            secure_url: upload.secure_url,
            size: file.size || upload.bytes || 0,
        });
    }

    return uploaded;
};

export const buildCreateDoubtPayload = ({ userId, course, body, ticketId, attachments = [] }) => {
    return {
        _id: ticketId || new mongoose.Types.ObjectId(),
        user: userId,
        instructor: course.instructor,
        course: course._id,
        lesson: body.lessonId || null,
        liveClass: body.liveClassId || null,
        title: body.title?.trim(),
        description: body.description?.trim(),
        notes: body.notes?.trim() || "",
        attachments,
        status: DOUBT_TICKET_STATUS.OPEN,
    };
};

export const isAllowedInstructorTransition = ({ fromStatus, toStatus }) => {
    const transitions = {
        [DOUBT_TICKET_STATUS.OPEN]: [DOUBT_TICKET_STATUS.ACCEPTED, DOUBT_TICKET_STATUS.CLOSED],
        [DOUBT_TICKET_STATUS.ACCEPTED]: [DOUBT_TICKET_STATUS.IN_PROGRESS, DOUBT_TICKET_STATUS.RESOLVED, DOUBT_TICKET_STATUS.CLOSED],
        [DOUBT_TICKET_STATUS.IN_PROGRESS]: [DOUBT_TICKET_STATUS.RESOLVED, DOUBT_TICKET_STATUS.CLOSED],
        [DOUBT_TICKET_STATUS.RESOLVED]: [DOUBT_TICKET_STATUS.CLOSED],
        [DOUBT_TICKET_STATUS.CLOSED]: [],
    };

    return Boolean(transitions[fromStatus]?.includes(toStatus));
};
