//leaderboard.service.js
import mongoose from "mongoose";
import { Enrollment } from "../models/enrollment.model.js";
import { Progress } from "../models/progress.model.js";
import { Submission } from "../models/submission.model.js";
import { User } from "../models/user.model.js";
import { UserStreak } from "../models/user-streak.model.js";
import { Achievement } from "../models/achievement.model.js";
import { LeaderboardSnapshot } from "../models/leaderboard-snapshot.model.js";
import logger from "../configs/logger.config.js";
import {
    ACHIEVEMENT_CATEGORIES,
    ACHIEVEMENT_STATUS,
} from "../constants/achievement.constant.js";
import {
    LEADERBOARD_DEFAULTS,
    LEADERBOARD_PERIODS,
    LEADERBOARD_REDIS_KEYS,
    LEADERBOARD_SOCKET_EVENTS,
    LEADERBOARD_TYPES,
} from "../constants/leaderboard.constant.js";
import {
    buildRankMetadata,
    clampPageLimit,
    createCacheKey,
    getLeaderboardTier,
    getLevelMeta,
    getPeriodDateRange,
    toUserName,
} from "../utils/leaderboard.utils.js";
import { getRedisClient, isRedisReady } from "./redis.service.js";
import { markStreakActivity } from "./streak.service.js";

const asObjectId = (id) => {
    if (!id) return null;
    if (id instanceof mongoose.Types.ObjectId) return id;
    try {
        return new mongoose.Types.ObjectId(String(id));
    } catch {
        return null;
    }
};

const addMatchDate = (fieldName, range) => {
    if (!range?.start || !range?.end) return {};
    return { [fieldName]: { $gte: range.start, $lte: range.end } };
};

const getOrCreateMetric = (map, userId) => {
    const key = String(userId);
    if (!map.has(key)) {
        map.set(key, {
            userId: key,
            lessonCompletedCount: 0,
            moduleCompletedCount: 0,
            enrolledCourseCount: 0,
            courseCompletedCount: 0,
            assignmentSubmittedCount: 0,
            assignment90PlusCount: 0,
            liveSessionJoinCount: 0,
            studyHours: 0,
            currentStreak: 0,
            longestStreak: 0,
            totalActiveDays: 0,
            courseAchievedPoints: 0,
            assignmentAchievedPoints: 0,
            streakAchievedPoints: 0,
            liveAchievedPoints: 0,
        });
    }

    return map.get(key);
};

const computePointsBreakdown = (entry, type = LEADERBOARD_TYPES.GLOBAL) => {
    const courseOnlyPoints = Number(entry.courseAchievedPoints || 0) + Number(entry.liveAchievedPoints || 0);
    const assignmentOnlyPoints = Number(entry.assignmentAchievedPoints || 0);
    const streakOnlyPoints = Number(entry.streakAchievedPoints || 0);

    let totalPoints = courseOnlyPoints + assignmentOnlyPoints + streakOnlyPoints;

    if (type === LEADERBOARD_TYPES.STREAK) {
        totalPoints = streakOnlyPoints;
    }

    if (type === LEADERBOARD_TYPES.ASSIGNMENT) {
        totalPoints = assignmentOnlyPoints;
    }

    if (type === LEADERBOARD_TYPES.COURSE) {
        totalPoints = courseOnlyPoints;
    }

    return {
        studyHoursPoints: 0,
        quizPoints: 0,
        courseCompletionPoints: Number(entry.courseAchievedPoints || 0),
        assignmentPoints: assignmentOnlyPoints,
        engagementPoints: Number(entry.liveAchievedPoints || 0),
        bonusPoints: streakOnlyPoints,
        streakPoints: streakOnlyPoints,
        coursePoints: courseOnlyPoints,
        assignmentOnlyPoints,
        streakOnlyPoints,
        totalPoints,
    };
};

const getScopeKey = ({ type, courseId = null }) => `${type}:${courseId ? String(courseId) : "all"}`;

const getCacheStorageKey = ({ type, period, courseId, page, limit }) => {
    const core = createCacheKey({ type, period, courseId: courseId || "all", page, limit });
    return `${LEADERBOARD_REDIS_KEYS.CACHE}${core}`;
};

const attachPreviousRanks = async ({ type, period, scopeKey, entries = [] }) => {
    if (!entries.length) return entries;

    const lastSnapshot = await LeaderboardSnapshot.findOne({ type, period, scopeKey })
        .sort({ snapshotAt: -1 })
        .lean();

    if (!lastSnapshot) {
        return entries.map((item) => ({ ...item, ...buildRankMetadata({ rank: item.rank }) }));
    }

    const previousRankMap = new Map(
        (lastSnapshot.entries || []).map((item) => [String(item.user), Number(item.rank)])
    );

    return entries.map((item) => {
        const previousRank = previousRankMap.get(String(item.userId));
        return {
            ...item,
            ...buildRankMetadata({ rank: item.rank, previousRank }),
        };
    });
};

const queryBaseUserIds = async ({ type, courseObjectId = null }) => {
    const [fromEnrollment, fromProgress, fromSubmission, fromStreak, fromAchievement] = await Promise.all([
        Enrollment.distinct("user", {
            ...(courseObjectId ? { course: courseObjectId } : {}),
            status: { $in: ["active", "completed"] },
        }),
        Progress.distinct("user", {
            ...(courseObjectId ? { course: courseObjectId } : {}),
        }),
        Submission.distinct("user", {
            ...(courseObjectId ? { course: courseObjectId } : {}),
            status: { $in: ["submitted", "graded", "returned"] },
        }),
        type === LEADERBOARD_TYPES.STREAK ? UserStreak.distinct("user", {}) : [],
        Achievement.distinct("user", {
            ...(courseObjectId ? { course: courseObjectId } : {}),
            status: { $in: [ACHIEVEMENT_STATUS.ACHIEVED, ACHIEVEMENT_STATUS.PARTIAL] },
        }),
    ]);

    return Array.from(
        new Set(
            [...fromEnrollment, ...fromProgress, ...fromSubmission, ...fromStreak, ...fromAchievement]
                .filter(Boolean)
                .map((id) => String(id))
        )
    );
};

const mergeAchievementPoints = async ({ map, userIds, courseObjectId, range }) => {
    if (!userIds.length) return;

    const match = {
        user: { $in: userIds.map((id) => asObjectId(id)).filter(Boolean) },
        status: { $in: [ACHIEVEMENT_STATUS.ACHIEVED, ACHIEVEMENT_STATUS.PARTIAL] },
    };

    if (range?.start && range?.end) {
        match.occurredAt = { $gte: range.start, $lte: range.end };
    }

    if (courseObjectId) {
        match.course = courseObjectId;
    }

    const rows = await Achievement.aggregate([
        { $match: match },
        {
            $group: {
                _id: {
                    user: "$user",
                    category: "$category",
                },
                points: { $sum: "$pointsAwarded" },
            },
        },
    ]);

    rows.forEach((row) => {
        const user = row?._id?.user;
        const category = row?._id?.category;
        const points = Number(row?.points || 0);
        if (!user || !category) return;

        const entry = getOrCreateMetric(map, user);

        if (category === ACHIEVEMENT_CATEGORIES.COURSE) {
            entry.courseAchievedPoints = points;
            return;
        }

        if (category === ACHIEVEMENT_CATEGORIES.ASSIGNMENT) {
            entry.assignmentAchievedPoints = points;
            return;
        }

        if (category === ACHIEVEMENT_CATEGORIES.STREAK) {
            entry.streakAchievedPoints = points;
            return;
        }

        if (category === ACHIEVEMENT_CATEGORIES.LIVE) {
            entry.liveAchievedPoints = points;
        }
    });
};

const mergeProgressMetrics = async ({ map, userIds, courseObjectId, range }) => {
    if (!userIds.length) return;

    const match = {
        user: { $in: userIds.map((id) => asObjectId(id)).filter(Boolean) },
        ...(courseObjectId ? { course: courseObjectId } : {}),
    };

    const [completedLessons, liveJoined, timeSpent] = await Promise.all([
        Progress.aggregate([
            {
                $match: {
                    ...match,
                    status: "completed",
                    ...addMatchDate("completedAt", range),
                },
            },
            { $group: { _id: "$user", count: { $sum: 1 } } },
        ]),
        Progress.aggregate([
            {
                $match: {
                    ...match,
                    "activityProgress.liveJoined": true,
                    ...addMatchDate("updatedAt", range),
                },
            },
            { $group: { _id: "$user", count: { $sum: 1 } } },
        ]),
        Progress.aggregate([
            {
                $match: {
                    ...match,
                    ...addMatchDate("updatedAt", range),
                },
            },
            { $group: { _id: "$user", seconds: { $sum: "$timeSpent" } } },
        ]),
    ]);

    completedLessons.forEach((item) => {
        const entry = getOrCreateMetric(map, item._id);
        entry.lessonCompletedCount = Number(item.count || 0);
    });

    liveJoined.forEach((item) => {
        const entry = getOrCreateMetric(map, item._id);
        entry.liveSessionJoinCount = Number(item.count || 0);
    });

    timeSpent.forEach((item) => {
        const entry = getOrCreateMetric(map, item._id);
        entry.studyHours = Number(item.seconds || 0) / 3600;
    });
};

const mergeEnrollmentMetrics = async ({ map, userIds, courseObjectId, range }) => {
    if (!userIds.length) return;

    const baseMatch = {
        user: { $in: userIds.map((id) => asObjectId(id)).filter(Boolean) },
        ...(courseObjectId ? { course: courseObjectId } : {}),
    };

    const [enrolledCourses, moduleCompleted, courseCompleted] = await Promise.all([
        Enrollment.aggregate([
            {
                $match: {
                    ...baseMatch,
                    status: { $in: ["active", "completed"] },
                },
            },
            { $group: { _id: "$user", count: { $sum: 1 } } },
        ]),
        Enrollment.aggregate([
            { $match: baseMatch },
            { $unwind: "$progressModules" },
            {
                $match: {
                    "progressModules.status": "completed",
                    ...addMatchDate("progressModules.completedAt", range),
                },
            },
            { $group: { _id: "$user", count: { $sum: 1 } } },
        ]),
        Enrollment.aggregate([
            {
                $match: {
                    ...baseMatch,
                    status: "completed",
                    ...addMatchDate("completedAt", range),
                },
            },
            { $group: { _id: "$user", count: { $sum: 1 } } },
        ]),
    ]);

    enrolledCourses.forEach((item) => {
        const entry = getOrCreateMetric(map, item._id);
        entry.enrolledCourseCount = Number(item.count || 0);
    });

    moduleCompleted.forEach((item) => {
        const entry = getOrCreateMetric(map, item._id);
        entry.moduleCompletedCount = Number(item.count || 0);
    });

    courseCompleted.forEach((item) => {
        const entry = getOrCreateMetric(map, item._id);
        entry.courseCompletedCount = Number(item.count || 0);
    });
};

const mergeSubmissionMetrics = async ({ map, userIds, courseObjectId, range }) => {
    if (!userIds.length) return;

    const match = {
        user: { $in: userIds.map((id) => asObjectId(id)).filter(Boolean) },
        ...(courseObjectId ? { course: courseObjectId } : {}),
    };

    const [submitted, highScore] = await Promise.all([
        Submission.aggregate([
            {
                $match: {
                    ...match,
                    status: { $in: ["submitted", "graded", "returned"] },
                    ...addMatchDate("submittedAt", range),
                },
            },
            { $group: { _id: "$user", count: { $sum: 1 } } },
        ]),
        Submission.aggregate([
            {
                $match: {
                    ...match,
                    status: "graded",
                    score: { $gte: 0 },
                    maxScore: { $gt: 0 },
                    ...addMatchDate("gradedAt", range),
                },
            },
            {
                $project: {
                    user: 1,
                    isNinetyPlus: {
                        $gte: [{ $divide: ["$score", "$maxScore"] }, 0.9],
                    },
                },
            },
            { $match: { isNinetyPlus: true } },
            { $group: { _id: "$user", count: { $sum: 1 } } },
        ]),
    ]);

    submitted.forEach((item) => {
        const entry = getOrCreateMetric(map, item._id);
        entry.assignmentSubmittedCount = Number(item.count || 0);
    });

    highScore.forEach((item) => {
        const entry = getOrCreateMetric(map, item._id);
        entry.assignment90PlusCount = Number(item.count || 0);
    });
};

const mergeStreakMetrics = async ({ map, userIds }) => {
    if (!userIds.length) return;

    const streaks = await UserStreak.find({
        user: { $in: userIds.map((id) => asObjectId(id)).filter(Boolean) },
    }).lean();

    streaks.forEach((item) => {
        const entry = getOrCreateMetric(map, item.user);
        entry.currentStreak = Number(item.currentStreak || 0);
        entry.longestStreak = Number(item.longestStreak || 0);
        entry.totalActiveDays = Number(item.totalActiveDays || 0);
    });
};

const buildEntries = async ({ metricsMap, userId, type, period, scopeKey, page, limit }) => {
    const metrics = Array.from(metricsMap.values());
    if (!metrics.length) {
        return {
            items: [],
            total: 0,
            mySummary: {
                rank: null,
                totalPoints: 0,
                tier: "Beginner",
                level: 1,
                xp: 0,
                xpPercent: 0,
                currentStreak: 0,
                longestStreak: 0,
                rankChange: 0,
                lastWeekRank: null,
            },
        };
    }

    const users = await User.find({
        _id: { $in: metrics.map((item) => asObjectId(item.userId)).filter(Boolean) },
    }).select("firstName lastName profilePicture").lean();

    const userMap = new Map(users.map((item) => [String(item._id), item]));

    const sorted = metrics
        .map((item) => {
            const breakdown = computePointsBreakdown(item, type);
            const levelMeta = getLevelMeta(breakdown.totalPoints);
            const tier = getLeaderboardTier(breakdown.totalPoints);
            const user = userMap.get(item.userId) || {};

            return {
                userId: item.userId,
                name: toUserName(user),
                avatar: user?.profilePicture?.secure_url || user?.profilePicture?.url || null,
                totalPoints: breakdown.totalPoints,
                studyHours: Number((item.studyHours || 0).toFixed(2)),
                currentStreak: item.currentStreak,
                longestStreak: item.longestStreak,
                totalActiveDays: item.totalActiveDays,
                lessonCompletedCount: item.lessonCompletedCount,
                moduleCompletedCount: item.moduleCompletedCount,
                enrolledCourseCount: item.enrolledCourseCount,
                courseCompletedCount: item.courseCompletedCount,
                assignmentSubmittedCount: item.assignmentSubmittedCount,
                assignment90PlusCount: item.assignment90PlusCount,
                liveSessionJoinCount: item.liveSessionJoinCount,
                pointsBreakdown: breakdown,
                level: levelMeta.level,
                xp: levelMeta.xp,
                xpPercent: levelMeta.xpPercent,
                tier,
            };
        })
        .sort((a, b) => {
            if (type === LEADERBOARD_TYPES.STREAK) {
                if (b.currentStreak !== a.currentStreak) return b.currentStreak - a.currentStreak;
            }

            if (type === LEADERBOARD_TYPES.ASSIGNMENT) {
                if (b.assignmentSubmittedCount !== a.assignmentSubmittedCount) {
                    return b.assignmentSubmittedCount - a.assignmentSubmittedCount;
                }
            }

            if (type === LEADERBOARD_TYPES.COURSE) {
                if (b.courseCompletedCount !== a.courseCompletedCount) {
                    return b.courseCompletedCount - a.courseCompletedCount;
                }
            }

            if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
            if (b.studyHours !== a.studyHours) return b.studyHours - a.studyHours;
            return a.name.localeCompare(b.name);
        })
        .map((item, index) => ({ ...item, rank: index + 1, isCurrentUser: String(item.userId) === String(userId) }));

    const withRankMeta = await attachPreviousRanks({
        type,
        period,
        scopeKey,
        entries: sorted,
    });

    const total = withRankMeta.length;
    const paginated = withRankMeta.slice((page - 1) * limit, (page - 1) * limit + limit);
    const mine = withRankMeta.find((item) => String(item.userId) === String(userId));

    return {
        items: paginated,
        total,
        mySummary: mine
            ? {
                rank: mine.rank,
                totalPoints: mine.totalPoints,
                tier: mine.tier,
                level: mine.level,
                xp: mine.xp,
                xpPercent: mine.xpPercent,
                currentStreak: mine.currentStreak,
                longestStreak: mine.longestStreak,
                totalActiveDays: mine.totalActiveDays,
                enrolledCourseCount: mine.enrolledCourseCount,
                courseCompletedCount: mine.courseCompletedCount,
                assignmentSubmittedCount: mine.assignmentSubmittedCount,
                assignment90PlusCount: mine.assignment90PlusCount,
                studyHours: mine.studyHours,
                pointsBreakdown: mine.pointsBreakdown,
                rankChange: mine.rankChange,
                lastWeekRank: mine.lastWeekRank,
            }
            : {
                rank: null,
                totalPoints: 0,
                tier: "Beginner",
                level: 1,
                xp: 0,
                xpPercent: 0,
                currentStreak: 0,
                longestStreak: 0,
                totalActiveDays: 0,
                enrolledCourseCount: 0,
                courseCompletedCount: 0,
                assignmentSubmittedCount: 0,
                assignment90PlusCount: 0,
                studyHours: 0,
                pointsBreakdown: {
                    totalPoints: 0,
                    streakPoints: 0,
                    assignmentPoints: 0,
                    coursePoints: 0,
                },
                rankChange: 0,
                lastWeekRank: null,
            },
    };
};

const readCache = async (key) => {
    if (!isRedisReady()) return null;
    const client = getRedisClient();
    const raw = await client.get(key);
    if (!raw) return null;
    try {
        return JSON.parse(raw);
    } catch {
        return null;
    }
};

const writeCache = async (key, value) => {
    if (!isRedisReady()) return;
    const client = getRedisClient();
    await client.set(key, JSON.stringify(value), {
        EX: LEADERBOARD_DEFAULTS.CACHE_TTL_SECONDS,
    });
};

export const invalidateLeaderboardCache = async () => {
    if (!isRedisReady()) return;
    const client = getRedisClient();
    const keys = await client.keys(`${LEADERBOARD_REDIS_KEYS.CACHE}*`);
    if (keys.length) {
        await client.del(keys);
    }
};

export const notifyLeaderboardRefresh = ({ io, payload = {} }) => {
    if (!io) return;
    io.emit(LEADERBOARD_SOCKET_EVENTS.REFRESH_REQUIRED, {
        at: new Date().toISOString(),
        ...payload,
    });
};

export const getLeaderboardData = async ({
    type = LEADERBOARD_TYPES.GLOBAL,
    period = LEADERBOARD_PERIODS.ALL_TIME,
    courseId = null,
    page = LEADERBOARD_DEFAULTS.PAGE,
    limit = LEADERBOARD_DEFAULTS.LIMIT,
    userId,
}) => {
    const { page: safePage, limit: safeLimit } = clampPageLimit({ page, limit });
    const courseObjectId = asObjectId(courseId);

    const scopeKey = getScopeKey({ type, courseId: courseObjectId || null });
    const cacheKey = getCacheStorageKey({
        type,
        period,
        courseId: courseObjectId ? String(courseObjectId) : "all",
        page: safePage,
        limit: safeLimit,
    });

    const cached = await readCache(cacheKey);
    if (cached) return cached;

    const range = getPeriodDateRange(period);
    const userIds = await queryBaseUserIds({ type, courseObjectId });
    const metricsMap = new Map();

    userIds.forEach((uid) => getOrCreateMetric(metricsMap, uid));

    await Promise.all([
        mergeProgressMetrics({ map: metricsMap, userIds, courseObjectId: type === LEADERBOARD_TYPES.COURSE ? courseObjectId : null, range }),
        mergeEnrollmentMetrics({ map: metricsMap, userIds, courseObjectId: type === LEADERBOARD_TYPES.COURSE ? courseObjectId : null, range }),
        mergeSubmissionMetrics({
            map: metricsMap,
            userIds,
            courseObjectId: type === LEADERBOARD_TYPES.ASSIGNMENT || type === LEADERBOARD_TYPES.COURSE ? courseObjectId : null,
            range,
        }),
        mergeStreakMetrics({ map: metricsMap, userIds }),
        mergeAchievementPoints({
            map: metricsMap,
            userIds,
            courseObjectId: type === LEADERBOARD_TYPES.COURSE ? courseObjectId : null,
            range,
        }),
    ]);

    const built = await buildEntries({
        metricsMap,
        userId,
        type,
        period,
        scopeKey,
        page: safePage,
        limit: safeLimit,
    });

    const payload = {
        type,
        period,
        courseId: courseObjectId ? String(courseObjectId) : null,
        page: safePage,
        limit: safeLimit,
        total: built.total,
        totalPages: Math.ceil(built.total / safeLimit),
        entries: built.items,
        mySummary: built.mySummary,
    };

    await writeCache(cacheKey, payload);
    return payload;
};

export const getEnrolledCourseFilterOptions = async ({ userId }) => {
    const enrollments = await Enrollment.find({
        user: userId,
        status: { $in: ["active", "completed"] },
    })
        .populate("course", "title")
        .lean();

    return enrollments
        .map((item) => {
            const course = item.course;
            if (!course?._id) return null;
            return {
                value: String(course._id),
                label: course.title || "Course",
            };
        })
        .filter(Boolean);
};

export const createLeaderboardSnapshot = async ({ type, period, courseId = null }) => {
    const data = await getLeaderboardData({
        type,
        period,
        courseId,
        page: 1,
        limit: LEADERBOARD_DEFAULTS.MAX_LIMIT,
        userId: null,
    });

    const scopeKey = getScopeKey({ type, courseId });
    const entries = (data.entries || []).map((entry) => ({
        user: entry.userId,
        rank: entry.rank,
    }));

    if (!entries.length) return null;

    return LeaderboardSnapshot.create({
        type,
        period,
        scopeKey,
        entries,
        snapshotAt: new Date(),
    });
};

export const rebuildPrimaryLeaderboards = async () => {
    const courseIds = await Enrollment.distinct("course", {
        status: { $in: ["active", "completed"] },
    });

    await Promise.all([
        getLeaderboardData({ type: LEADERBOARD_TYPES.GLOBAL, period: LEADERBOARD_PERIODS.ALL_TIME, page: 1, limit: 25, userId: null }),
        getLeaderboardData({ type: LEADERBOARD_TYPES.GLOBAL, period: LEADERBOARD_PERIODS.WEEKLY, page: 1, limit: 25, userId: null }),
        getLeaderboardData({ type: LEADERBOARD_TYPES.GLOBAL, period: LEADERBOARD_PERIODS.MONTHLY, page: 1, limit: 25, userId: null }),
        getLeaderboardData({ type: LEADERBOARD_TYPES.ASSIGNMENT, period: LEADERBOARD_PERIODS.ALL_TIME, page: 1, limit: 25, userId: null }),
        getLeaderboardData({ type: LEADERBOARD_TYPES.STREAK, period: LEADERBOARD_PERIODS.ALL_TIME, page: 1, limit: 25, userId: null }),
        ...courseIds.map((courseId) =>
            getLeaderboardData({
                type: LEADERBOARD_TYPES.COURSE,
                period: LEADERBOARD_PERIODS.ALL_TIME,
                courseId,
                page: 1,
                limit: 25,
                userId: null,
            })
        ),
    ]);
};

export const refreshLeaderboardAfterActivity = async ({ userId, io, source = "unknown" }) => {
    try {
        await markStreakActivity({ userId, io, source });
        await invalidateLeaderboardCache();
        notifyLeaderboardRefresh({ io, payload: { source, userId: String(userId || "") } });
    } catch (error) {
        logger.error(`[leaderboard.refreshAfterActivity] ${error.message}`);
    }
};
