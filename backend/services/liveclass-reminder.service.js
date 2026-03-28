import { LiveClass } from "../models/liveclass.model.js";
import { Enrollment } from "../models/enrollment.model.js";
import { User } from "../models/user.model.js";
import { Instructor } from "../models/instructor.model.js";
import { Notification } from "../models/notification.model.js";
import logger from "../configs/logger.config.js";

const REMINDER_OFFSETS_MINUTES = [30, 5];
const SWEEP_INTERVAL_MS = 60 * 1000;
const REMINDER_WINDOW_MS = 75 * 1000;

let intervalRef = null;
let isSweepRunning = false;

const channelForUser = (liveClass, userId) => {
    const pref = liveClass.reminderPreferences?.find(
        (entry) => entry.user?.toString() === userId.toString()
    );
    return pref?.channel || "email";
};

const isDispatchRecorded = (liveClass, recipientId, recipientRole, offsetMinutes) => {
    return (liveClass.reminderDispatches || []).some((entry) => (
        entry.recipient?.toString() === recipientId.toString()
        && entry.recipientRole === recipientRole
        && entry.offsetMinutes === offsetMinutes
    ));
};

const shouldTriggerOffset = (scheduledAt, offsetMinutes, nowMs) => {
    const targetMs = new Date(scheduledAt).getTime() - (offsetMinutes * 60 * 1000);
    return nowMs >= targetMs && nowMs < targetMs + REMINDER_WINDOW_MS;
};

const getEligibleStudentIds = async (liveClass) => {
    if (!liveClass.course) return [];

    const enrollmentFilter = {
        course: liveClass.course,
        status: { $in: ["active", "completed"] },
    };

    if (liveClass.sessionType === "doubt" && liveClass.invitedStudents?.length) {
        enrollmentFilter.user = { $in: liveClass.invitedStudents };
    }

    const enrollments = await Enrollment.find(enrollmentFilter).select("user").lean();
    if (!enrollments.length) return [];

    const userIds = enrollments.map((enrollment) => enrollment.user);
    const users = await User.find({
        _id: { $in: userIds },
        isActive: true,
        deletedAt: null,
        "preferences.emailNotifications": true,
    }).select("_id").lean();

    return users.map((user) => user._id.toString());
};

const getEligibleInvitedInstructorIds = async (liveClass) => {
    if (!liveClass.invitedInstructors?.length) return [];

    const instructors = await Instructor.find({
        _id: { $in: liveClass.invitedInstructors },
        isActive: true,
        deletedAt: null,
        "preferences.classReminders": true,
    }).select("_id").lean();

    return instructors.map((instructor) => instructor._id.toString());
};

const getHostInstructor = async (liveClass) => {
    return Instructor.findOne({
        _id: liveClass.instructor,
        isActive: true,
        deletedAt: null,
        "preferences.classReminders": true,
    }).select("_id firstName lastName").lean();
};

const buildReminderData = (liveClass, offsetMinutes, preferredChannelPlaceholder) => ({
    liveClassId: liveClass._id,
    courseId: liveClass.course || null,
    lessonId: liveClass.lesson || null,
    scheduledAt: liveClass.scheduledAt,
    reminderOffsetMinutes: offsetMinutes,
    preferredChannelPlaceholder,
    sessionType: liveClass.sessionType,
});

async function processLiveClassReminder(liveClass, nowMs, io) {
    if (liveClass.status !== "scheduled") return;

    for (const offsetMinutes of REMINDER_OFFSETS_MINUTES) {
        if (!shouldTriggerOffset(liveClass.scheduledAt, offsetMinutes, nowMs)) continue;

        const notifications = [];
        const dispatchRecords = [];

        const host = await getHostInstructor(liveClass);
        if (host && !isDispatchRecorded(liveClass, host._id, "Instructor", offsetMinutes)) {
            const data = buildReminderData(liveClass, offsetMinutes, "email");
            notifications.push({
                recipient: host._id,
                recipientRole: "Instructor",
                type: "live_class_reminder",
                title: `Upcoming live class: ${liveClass.title}`,
                message: `Your live class starts in ${offsetMinutes} minutes.`,
                data,
            });
            dispatchRecords.push({
                recipient: host._id,
                recipientRole: "Instructor",
                offsetMinutes,
                sentAt: new Date(),
            });

            if (io) {
                io.to(`notifications:Instructor:${host._id}`).emit("live_class_reminder", data);
            }
        }

        if (["lecture", "doubt"].includes(liveClass.sessionType) && liveClass.course) {
            const studentIds = await getEligibleStudentIds(liveClass);
            for (const studentId of studentIds) {
                if (isDispatchRecorded(liveClass, studentId, "User", offsetMinutes)) continue;

                const preferredChannelPlaceholder = channelForUser(liveClass, studentId);
                const data = buildReminderData(liveClass, offsetMinutes, preferredChannelPlaceholder);

                notifications.push({
                    recipient: studentId,
                    recipientRole: "User",
                    type: "live_class_reminder",
                    title: `Upcoming live class: ${liveClass.title}`,
                    message: `Your class starts in ${offsetMinutes} minutes.`,
                    data,
                });
                dispatchRecords.push({
                    recipient: studentId,
                    recipientRole: "User",
                    offsetMinutes,
                    sentAt: new Date(),
                });

                if (io) {
                    io.to(`notifications:User:${studentId}`).emit("live_class_reminder", data);
                }
            }
        }

        if (liveClass.sessionType === "instructor") {
            const invitedInstructorIds = await getEligibleInvitedInstructorIds(liveClass);
            for (const instructorId of invitedInstructorIds) {
                if (isDispatchRecorded(liveClass, instructorId, "Instructor", offsetMinutes)) continue;

                const data = buildReminderData(liveClass, offsetMinutes, "email");

                notifications.push({
                    recipient: instructorId,
                    recipientRole: "Instructor",
                    type: "live_class_reminder",
                    title: `Upcoming instructor session: ${liveClass.title}`,
                    message: `Your invited session starts in ${offsetMinutes} minutes.`,
                    data,
                });
                dispatchRecords.push({
                    recipient: instructorId,
                    recipientRole: "Instructor",
                    offsetMinutes,
                    sentAt: new Date(),
                });

                if (io) {
                    io.to(`notifications:Instructor:${instructorId}`).emit("live_class_reminder", data);
                }
            }
        }

        if (notifications.length) {
            await Notification.insertMany(notifications);
            liveClass.reminderDispatches = [...(liveClass.reminderDispatches || []), ...dispatchRecords];
            await liveClass.save({ validateBeforeSave: false });

            logger.info(
                `[live-reminder] liveClass=${liveClass._id} offset=${offsetMinutes}m notifications=${notifications.length}`
            );
        }
    }
}

export async function runLiveClassReminderSweep(io) {
    if (isSweepRunning) return;
    isSweepRunning = true;

    try {
        const now = new Date();
        const upperBound = new Date(now.getTime() + (31 * 60 * 1000));
        const liveClasses = await LiveClass.find({
            status: "scheduled",
            scheduledAt: { $gte: now, $lte: upperBound },
        })
            .select("_id title sessionType scheduledAt instructor course lesson invitedStudents invitedInstructors reminderPreferences reminderDispatches")
            .lean(false);

        const nowMs = now.getTime();
        for (const liveClass of liveClasses) {
            await processLiveClassReminder(liveClass, nowMs, io);
        }
    } catch (error) {
        logger.error(`[live-reminder] sweep failed: ${error.message}`);
    } finally {
        isSweepRunning = false;
    }
}

export function startLiveClassReminderScheduler(io) {
    if (intervalRef) return;

    setTimeout(() => {
        runLiveClassReminderSweep(io);
    }, 15000);

    intervalRef = setInterval(() => {
        runLiveClassReminderSweep(io);
    }, SWEEP_INTERVAL_MS);

    logger.info("Live class reminder scheduler started");
}

export function stopLiveClassReminderScheduler() {
    if (!intervalRef) return;
    clearInterval(intervalRef);
    intervalRef = null;
    logger.info("Live class reminder scheduler stopped");
}
