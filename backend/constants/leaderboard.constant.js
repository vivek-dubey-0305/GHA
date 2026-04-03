export const LEADERBOARD_TYPES = {
    GLOBAL: "global",
    COURSE: "course",
    ASSIGNMENT: "assignment",
    STREAK: "streak",
};

export const LEADERBOARD_PERIODS = {
    ALL_TIME: "all-time",
    WEEKLY: "weekly",
    MONTHLY: "monthly",
};

export const LEADERBOARD_DEFAULTS = {
    PAGE: 1,
    LIMIT: 25,
    MAX_LIMIT: 100,
    CACHE_TTL_SECONDS: 60,
    PRESENCE_TTL_SECONDS: 70,
    SOCKET_ROOM_PREFIX: "leaderboard:",
    STREAK_ACTIVITY_WINDOW_DAYS: 7,
    STREAK_ACTIVITY_TTL_SECONDS: 60 * 60 * 24 * 45,
};

export const LEADERBOARD_ACTIVITY_POINTS = {
    LESSON_COMPLETED: 5,
    MODULE_COMPLETED: 20,
    COURSE_COMPLETED: 200,
    ASSIGNMENT_SUBMITTED: 20,
    ASSIGNMENT_90_PLUS: 40,
    LIVE_SESSION_JOIN: 20,
    STREAK_DAILY: 5,
    STREAK_3_DAY: 10,
    STREAK_7_DAY: 20,
    STREAK_14_DAY: 40,
    STREAK_30_DAY: 100,
};

export const STREAK_MILESTONES = [3, 7, 14, 30];

export const LEADERBOARD_TIER_BANDS = [
    { name: "Beginner", min: 0, max: 500 },
    { name: "Learner", min: 500, max: 1500 },
    { name: "Pro", min: 1500, max: 3000 },
    { name: "Expert", min: 3000, max: 6000 },
    { name: "Master", min: 6000, max: 10000 },
    { name: "Legend", min: 10000, max: Number.POSITIVE_INFINITY },
];

export const LEADERBOARD_SOCKET_EVENTS = {
    REFRESH_REQUIRED: "leaderboard:refresh_required",
    SUMMARY_UPDATED: "leaderboard:summary_updated",
};

export const LEADERBOARD_REDIS_KEYS = {
    CACHE: "leaderboard:cache:",
    ONLINE_USERS: "leaderboard:online-users",
    USER_HEARTBEAT: "leaderboard:user-heartbeat:",
    STREAK_STATE: "streak:state:",
    STREAK_ACTIVITY: "streak:activity:",
};

export const LEADERBOARD_CRON = {
    WEEKLY_RESET: "0 0 * * 0",
    MONTHLY_RESET: "0 0 1 * *",
    HEARTBEAT_CLEANUP: "*/2 * * * *",
    TIMEZONE: "Asia/Kolkata",
};

export const STREAK_SOCKET_EVENTS = {
    UPDATED: "streak:updated",
};
