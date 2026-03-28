import { DateTime } from "luxon";
import { DOUBT_TICKET_IST_TIMEZONE } from "../constants/doubt-ticket.constant.js";

export const getIstNow = () => DateTime.now().setZone(DOUBT_TICKET_IST_TIMEZONE);

export const getIstDayBounds = (date = new Date()) => {
    const dt = DateTime.fromJSDate(date).setZone(DOUBT_TICKET_IST_TIMEZONE);
    const start = dt.startOf("day").toUTC().toJSDate();
    const end = dt.endOf("day").toUTC().toJSDate();
    return { start, end };
};

export const getIstWeekKey = (date = new Date()) => {
    const dt = DateTime.fromJSDate(date).setZone(DOUBT_TICKET_IST_TIMEZONE);
    return `${dt.weekYear}-W${String(dt.weekNumber).padStart(2, "0")}`;
};

export const isIstSaturday = (date = new Date()) => {
    const dt = DateTime.fromJSDate(date).setZone(DOUBT_TICKET_IST_TIMEZONE);
    return dt.weekday === 6;
};

export const isIstSaturdayReminderWindow = (date = new Date(), hour = 9, minute = 0, windowMinutes = 10) => {
    const dt = DateTime.fromJSDate(date).setZone(DOUBT_TICKET_IST_TIMEZONE);
    if (dt.weekday !== 6) return false;

    const target = dt.set({ hour, minute, second: 0, millisecond: 0 });
    const diff = Math.abs(dt.diff(target, "minutes").minutes);
    return diff <= windowMinutes;
};
