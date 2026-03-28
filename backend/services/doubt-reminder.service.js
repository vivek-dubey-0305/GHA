import { DoubtTicket } from "../models/doubt-ticket.model.js";
import { Notification } from "../models/notification.model.js";
import {
    DOUBT_TICKET_ALLOWED_STATUS_FOR_REMINDER,
    DOUBT_TICKET_NOTIFICATION_TYPES,
} from "../constants/doubt-ticket.constant.js";
import { getIstWeekKey, isIstSaturdayReminderWindow } from "../utils/ist-time.utils.js";
import logger from "../configs/logger.config.js";

const SWEEP_INTERVAL_MS = 60 * 1000;

let intervalRef = null;
let isSweepRunning = false;

const buildReminderMessage = (count) => {
    if (count <= 0) return "You have no pending doubt tickets for today.";
    if (count === 1) return "You have 1 pending doubt ticket to address in today's session.";
    return `You have ${count} pending doubt tickets to address in today's session.`;
};

export async function runDoubtSaturdayReminderSweep(io) {
    if (isSweepRunning) return;
    if (!isIstSaturdayReminderWindow(new Date(), 9, 0, 10)) return;

    isSweepRunning = true;
    try {
        const weekKey = getIstWeekKey(new Date());

        const pendingByInstructor = await DoubtTicket.aggregate([
            {
                $match: {
                    status: { $in: DOUBT_TICKET_ALLOWED_STATUS_FOR_REMINDER },
                },
            },
            {
                $group: {
                    _id: "$instructor",
                    count: { $sum: 1 },
                },
            },
        ]);

        for (const row of pendingByInstructor) {
            const instructorId = String(row._id);
            const alreadySent = await Notification.exists({
                recipient: row._id,
                recipientRole: "Instructor",
                type: DOUBT_TICKET_NOTIFICATION_TYPES.SATURDAY_REMINDER,
                "data.weekKey": weekKey,
            });

            if (alreadySent) continue;

            const notification = await Notification.createNotification({
                recipient: row._id,
                recipientRole: "Instructor",
                type: DOUBT_TICKET_NOTIFICATION_TYPES.SATURDAY_REMINDER,
                title: "Saturday Doubt Session Reminder",
                message: buildReminderMessage(row.count),
                data: {
                    weekKey,
                    pendingTicketCount: row.count,
                },
            });

            if (io) {
                io.to(`notifications:Instructor:${instructorId}`).emit(
                    DOUBT_TICKET_NOTIFICATION_TYPES.SATURDAY_REMINDER,
                    { notification }
                );
            }

            logger.info(`[doubt-reminder] instructor=${instructorId} weekKey=${weekKey} pending=${row.count}`);
        }
    } catch (error) {
        logger.error(`[doubt-reminder] sweep failed: ${error.message}`);
    } finally {
        isSweepRunning = false;
    }
}

export function startDoubtReminderScheduler(io) {
    if (intervalRef) return;

    setTimeout(() => {
        runDoubtSaturdayReminderSweep(io);
    }, 12000);

    intervalRef = setInterval(() => {
        runDoubtSaturdayReminderSweep(io);
    }, SWEEP_INTERVAL_MS);

    logger.info("Doubt ticket Saturday reminder scheduler started");
}

export function stopDoubtReminderScheduler() {
    if (!intervalRef) return;
    clearInterval(intervalRef);
    intervalRef = null;
    logger.info("Doubt ticket Saturday reminder scheduler stopped");
}
