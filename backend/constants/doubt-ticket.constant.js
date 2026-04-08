export const DOUBT_TICKET_STATUS = {
    OPEN: "open",
    ACCEPTED: "accepted",
    IN_PROGRESS: "in_progress",
    RESOLVED: "resolved",
    CLOSED: "closed",
};

export const DOUBT_TICKET_NOTIFICATION_TYPES = {
    CREATED: "doubt_ticket_created",
    ACCEPTED: "doubt_ticket_accepted",
    RESOLVED: "doubt_ticket_resolved",
    SATURDAY_REMINDER: "doubt_saturday_session_reminder",
};

export const DOUBT_TICKET_RESOLVER_SOURCE = {
    INSTRUCTOR: "instructor",
    AI: "ai",
};

export const DOUBT_TICKET_DAILY_LIMIT = 3;
export const DOUBT_TICKET_IST_TIMEZONE = "Asia/Kolkata";

export const DOUBT_TICKET_ALLOWED_STATUS_FOR_REMINDER = [
    DOUBT_TICKET_STATUS.OPEN,
    DOUBT_TICKET_STATUS.ACCEPTED,
    DOUBT_TICKET_STATUS.IN_PROGRESS,
];

export default {
    DOUBT_TICKET_STATUS,
    DOUBT_TICKET_NOTIFICATION_TYPES,
    DOUBT_TICKET_RESOLVER_SOURCE,
    DOUBT_TICKET_DAILY_LIMIT,
    DOUBT_TICKET_IST_TIMEZONE,
    DOUBT_TICKET_ALLOWED_STATUS_FOR_REMINDER,
};
