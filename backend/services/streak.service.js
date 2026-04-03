//streak.service.js
import { DateTime } from "luxon";
import {
    ACHIEVEMENT_CATEGORIES,
    ACHIEVEMENT_POINTS,
    ACHIEVEMENT_STATUS,
} from "../constants/achievement.constant.js";
import {
    LEADERBOARD_DEFAULTS,
    LEADERBOARD_REDIS_KEYS,
    STREAK_MILESTONES,
    STREAK_SOCKET_EVENTS,
} from "../constants/leaderboard.constant.js";
import { Notification } from "../models/notification.model.js";
import { UserStreak } from "../models/user-streak.model.js";
import { createAchievementEvent } from "./achievement.service.js";
import { getRedisClient, isRedisReady } from "./redis.service.js";

const IST_ZONE = "Asia/Kolkata";

const toDateKey = (dt) => dt.setZone(IST_ZONE).toFormat("yyyy-LL-dd");

const toInt = (value, fallback = 0) => {
    const num = Number(value);
    return Number.isFinite(num) ? Math.floor(num) : fallback;
};

const stateKey = (userId) => `${LEADERBOARD_REDIS_KEYS.STREAK_STATE}${userId}`;
const activityKey = (userId) => `${LEADERBOARD_REDIS_KEYS.STREAK_ACTIVITY}${userId}`;

const getStateFromDb = async (userId) => {
    const streak = await UserStreak.findOne({ user: userId }).lean();
    if (!streak) {
        return {
            userId: String(userId),
            currentStreak: 0,
            longestStreak: 0,
            totalActiveDays: 0,
            lastActivityDateKey: null,
        };
    }

    return {
        userId: String(userId),
        currentStreak: toInt(streak.currentStreak, 0),
        longestStreak: toInt(streak.longestStreak, 0),
        totalActiveDays: toInt(streak.totalActiveDays, 0),
        lastActivityDateKey: streak.lastActivityDateKey || null,
    };
};

const cacheState = async (userId, state) => {
    if (!isRedisReady()) return;

    const client = getRedisClient();
    await client.hSet(stateKey(userId), {
        currentStreak: String(state.currentStreak || 0),
        longestStreak: String(state.longestStreak || 0),
        totalActiveDays: String(state.totalActiveDays || 0),
        lastActivityDateKey: state.lastActivityDateKey || "",
    });

    await client.expire(stateKey(userId), LEADERBOARD_DEFAULTS.STREAK_ACTIVITY_TTL_SECONDS);
};

const readCachedState = async (userId) => {
    if (!isRedisReady()) return null;
    const client = getRedisClient();
    const data = await client.hGetAll(stateKey(userId));
    if (!data || Object.keys(data).length === 0) return null;

    return {
        userId: String(userId),
        currentStreak: toInt(data.currentStreak, 0),
        longestStreak: toInt(data.longestStreak, 0),
        totalActiveDays: toInt(data.totalActiveDays, 0),
        lastActivityDateKey: data.lastActivityDateKey || null,
    };
};

const persistStateToDb = async (userId, state) => {
    await UserStreak.findOneAndUpdate(
        { user: userId },
        {
            $set: {
                currentStreak: state.currentStreak,
                longestStreak: state.longestStreak,
                totalActiveDays: state.totalActiveDays,
                lastActivityDateKey: state.lastActivityDateKey,
            },
        },
        {
            upsert: true,
            new: true,
            setDefaultsOnInsert: true,
        }
    );
};

const markDayActivity = async (userId, dateKey) => {
    if (!isRedisReady()) return;

    const client = getRedisClient();
    await client.hSet(activityKey(userId), dateKey, "1");
    await client.expire(activityKey(userId), LEADERBOARD_DEFAULTS.STREAK_ACTIVITY_TTL_SECONDS);
};

const getRecentActivityMap = async (userId) => {
    if (!isRedisReady()) return {};

    const client = getRedisClient();
    return client.hGetAll(activityKey(userId));
};

const emitMilestoneNotification = async ({ io, userId, milestone, streak }) => {
    const title = `Streak Milestone Unlocked: ${milestone} Days`;
    const message = `Amazing consistency! You reached a ${milestone}-day learning streak badge.`;
    const data = {
        category: "streak_milestone",
        milestone,
        badge: `${milestone}_day_streak`,
        currentStreak: streak.currentStreak,
        longestStreak: streak.longestStreak,
    };

    const notification = await Notification.createNotification({
        recipient: userId,
        recipientRole: "User",
        type: "general",
        title,
        message,
        data,
    });

    if (io) {
        io.to(`notifications:User:${userId}`).emit("general", {
            notification,
            data,
        });
    }
};

export const getStreakState = async (userId) => {
    const cached = await readCachedState(userId);
    if (cached) return cached;

    const fromDb = await getStateFromDb(userId);
    await cacheState(userId, fromDb);
    return fromDb;
};

export const markStreakActivity = async ({ userId, io = null, source = "activity" }) => {
    if (!userId) return null;

    const state = await getStreakState(userId);
    const now = DateTime.now().setZone(IST_ZONE);
    const today = toDateKey(now);
    const yesterday = toDateKey(now.minus({ days: 1 }));
    const previousStreak = Number(state.currentStreak || 0);

    let changed = false;
    let streakBroken = false;

    if (state.lastActivityDateKey !== today) {
        changed = true;

        if (state.lastActivityDateKey === yesterday) {
            state.currentStreak += 1;
        } else {
            // Streak is being reset - detect missed milestones
            streakBroken = previousStreak > 0 && state.lastActivityDateKey !== yesterday;
            state.currentStreak = 1;
        }

        state.longestStreak = Math.max(state.longestStreak, state.currentStreak);
        state.totalActiveDays += 1;
        state.lastActivityDateKey = today;

        await persistStateToDb(userId, state);
        await cacheState(userId, state);

        // Create missed streak milestone achievements if streak was broken
        if (streakBroken && previousStreak > 0) {
            const missedMilestones = STREAK_MILESTONES.filter(
                (milestone) => previousStreak < milestone
            );

            for (const milestone of missedMilestones) {
                const milestonePoints =
                    milestone >= 30
                        ? ACHIEVEMENT_POINTS.STREAK_30
                        : milestone >= 14
                            ? ACHIEVEMENT_POINTS.STREAK_14
                            : milestone >= 7
                                ? ACHIEVEMENT_POINTS.STREAK_7
                                : ACHIEVEMENT_POINTS.STREAK_3;

                await createAchievementEvent({
                    userId,
                    category: ACHIEVEMENT_CATEGORIES.STREAK,
                    status: ACHIEVEMENT_STATUS.MISSED,
                    title: `Missed ${milestone}-day streak milestone`,
                    description: `Could not maintain a ${milestone}-day streak. Streak of ${previousStreak} day(s) was reset.`,
                    pointsAwarded: 0,
                    pointsPossible: milestonePoints,
                    source,
                    occurredAt: now.toJSDate(),
                    metadata: {
                        milestone,
                        streakReachedBefore: previousStreak,
                        missedAt: today,
                    },
                    dedupeKey: `achievement:streak-milestone-missed:${userId}:${milestone}:${previousStreak}`,
                });
            }
        }

        await createAchievementEvent({
            userId,
            category: ACHIEVEMENT_CATEGORIES.STREAK,
            status: ACHIEVEMENT_STATUS.ACHIEVED,
            title: "Daily streak maintained",
            description: `Streak updated to ${state.currentStreak} day(s)`,
            pointsAwarded: ACHIEVEMENT_POINTS.STREAK_DAILY,
            pointsPossible: ACHIEVEMENT_POINTS.STREAK_DAILY,
            source,
            occurredAt: now.toJSDate(),
            metadata: {
                currentStreak: state.currentStreak,
                dayKey: today,
            },
            dedupeKey: `achievement:streak-daily:${userId}:${today}`,
        });
    }

    await markDayActivity(userId, today);

    const overview = await getUserStreakOverview(userId);

    const earnedMilestone = STREAK_MILESTONES.find(
        (milestone) => previousStreak < milestone && overview.currentStreak >= milestone
    );

    if (earnedMilestone) {
        const milestonePoints =
            earnedMilestone >= 30
                ? ACHIEVEMENT_POINTS.STREAK_30
                : earnedMilestone >= 14
                    ? ACHIEVEMENT_POINTS.STREAK_14
                    : earnedMilestone >= 7
                        ? ACHIEVEMENT_POINTS.STREAK_7
                        : ACHIEVEMENT_POINTS.STREAK_3;

        await createAchievementEvent({
            userId,
            category: ACHIEVEMENT_CATEGORIES.STREAK,
            status: ACHIEVEMENT_STATUS.ACHIEVED,
            title: `${earnedMilestone}-day streak milestone`,
            description: `Unlocked ${earnedMilestone}-day streak reward`,
            pointsAwarded: milestonePoints,
            pointsPossible: milestonePoints,
            source,
            occurredAt: now.toJSDate(),
            metadata: {
                milestone: earnedMilestone,
                currentStreak: overview.currentStreak,
            },
            dedupeKey: `achievement:streak-milestone:${userId}:${earnedMilestone}`,
        });

        await emitMilestoneNotification({
            io,
            userId,
            milestone: earnedMilestone,
            streak: overview,
        });
    }

    if (io && changed) {
        io.to(`notifications:User:${userId}`).emit(STREAK_SOCKET_EVENTS.UPDATED, {
            source,
            streak: overview,
            at: new Date().toISOString(),
        });
    }

    return overview;
};

export const getUserStreakOverview = async (userId) => {
    const state = await getStreakState(userId);
    const activityMap = await getRecentActivityMap(userId);

    const now = DateTime.now().setZone(IST_ZONE);
    const window = LEADERBOARD_DEFAULTS.STREAK_ACTIVITY_WINDOW_DAYS;
    const weeklyActivity = [];

    for (let offset = window - 1; offset >= 0; offset -= 1) {
        const day = now.minus({ days: offset });
        const key = toDateKey(day);
        const active = activityMap[key] === "1" || state.lastActivityDateKey === key;
        weeklyActivity.push({
            dateKey: key,
            day: day.toFormat("ccc"),
            active,
            isToday: offset === 0,
        });
    }

    return {
        currentStreak: state.currentStreak,
        longestStreak: state.longestStreak,
        totalActiveDays: state.totalActiveDays,
        lastActivityDateKey: state.lastActivityDateKey,
        todayActive: state.lastActivityDateKey === toDateKey(now),
        weeklyActivity,
    };
};
