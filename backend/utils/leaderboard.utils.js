//leaderboard.utils.js
import { DateTime } from "luxon";
import {
    LEADERBOARD_DEFAULTS,
    LEADERBOARD_PERIODS,
    LEADERBOARD_TIER_BANDS,
} from "../constants/leaderboard.constant.js";

const IST_ZONE = "Asia/Kolkata";

export const clampPageLimit = ({ page = 1, limit = LEADERBOARD_DEFAULTS.LIMIT }) => {
    const safePage = Math.max(1, Number(page) || LEADERBOARD_DEFAULTS.PAGE);
    const safeLimit = Math.min(
        LEADERBOARD_DEFAULTS.MAX_LIMIT,
        Math.max(1, Number(limit) || LEADERBOARD_DEFAULTS.LIMIT)
    );

    return {
        page: safePage,
        limit: safeLimit,
        skip: (safePage - 1) * safeLimit,
    };
};

export const getPeriodDateRange = (period = LEADERBOARD_PERIODS.ALL_TIME, now = DateTime.now().setZone(IST_ZONE)) => {
    if (period === LEADERBOARD_PERIODS.WEEKLY) {
        return {
            start: now.startOf("week").toJSDate(),
            end: now.endOf("week").toJSDate(),
        };
    }

    if (period === LEADERBOARD_PERIODS.MONTHLY) {
        return {
            start: now.startOf("month").toJSDate(),
            end: now.endOf("month").toJSDate(),
        };
    }

    return { start: null, end: null };
};

export const getLeaderboardTier = (points = 0) => {
    const value = Number(points) || 0;
    const found = LEADERBOARD_TIER_BANDS.find((band) => value >= band.min && value < band.max);
    return found?.name || "Beginner";
};

export const getLevelMeta = (points = 0) => {
    const total = Math.max(0, Math.floor(Number(points) || 0));
    const level = Math.floor(total / 500) + 1;
    const inLevelXp = total % 500;
    const xpRequired = 500;
    const xpPercent = Math.min(100, Math.round((inLevelXp / xpRequired) * 100));

    return {
        level,
        xp: total,
        xpInLevel: inLevelXp,
        xpRequired,
        xpPercent,
    };
};

export const buildRankMetadata = ({ rank, previousRank = null }) => {
    let rankChange = 0;
    if (Number.isFinite(previousRank) && Number.isFinite(rank)) {
        rankChange = previousRank - rank;
    }

    return {
        rank,
        lastWeekRank: Number.isFinite(previousRank) ? previousRank : null,
        rankChange,
        rankChangeDirection: rankChange > 0 ? "up" : rankChange < 0 ? "down" : "same",
    };
};

export const toUserName = (user = {}) => {
    const full = [user.firstName, user.lastName].filter(Boolean).join(" ").trim();
    return full || user.name || "Learner";
};

export const createCacheKey = ({ type, period, courseId = "all", page = 1, limit = LEADERBOARD_DEFAULTS.LIMIT }) => {
    return `${type}:${period}:${courseId}:${page}:${limit}`;
};

export const getIstTodayKey = (date = DateTime.now().setZone(IST_ZONE)) => date.toFormat("yyyy-LL-dd");

export const getYesterdayIstDate = (date = DateTime.now().setZone(IST_ZONE)) => date.minus({ days: 1 }).toFormat("yyyy-LL-dd");
