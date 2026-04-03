//leaderboard-cron.service.js
import cron from "node-cron";
import logger from "../configs/logger.config.js";
import {
    LEADERBOARD_CRON,
    LEADERBOARD_PERIODS,
    LEADERBOARD_TYPES,
} from "../constants/leaderboard.constant.js";
import { cleanupStaleOnlineUsers } from "./online-users.service.js";
import {
    createLeaderboardSnapshot,
    invalidateLeaderboardCache,
    notifyLeaderboardRefresh,
    rebuildPrimaryLeaderboards,
} from "./leaderboard.service.js";

let weeklyTask = null;
let monthlyTask = null;
let cleanupTask = null;

const safeRun = async (label, fn) => {
    try {
        await fn();
    } catch (error) {
        logger.error(`[leaderboard-cron:${label}] ${error.message}`);
    }
};

const runWeeklyReset = async (io) => {
    await safeRun("weekly", async () => {
        await Promise.all([
            createLeaderboardSnapshot({ type: LEADERBOARD_TYPES.GLOBAL, period: LEADERBOARD_PERIODS.ALL_TIME }),
            createLeaderboardSnapshot({ type: LEADERBOARD_TYPES.ASSIGNMENT, period: LEADERBOARD_PERIODS.ALL_TIME }),
            createLeaderboardSnapshot({ type: LEADERBOARD_TYPES.STREAK, period: LEADERBOARD_PERIODS.ALL_TIME }),
        ]);

        await invalidateLeaderboardCache();
        await rebuildPrimaryLeaderboards();
        notifyLeaderboardRefresh({ io, payload: { source: "weekly-reset" } });
        logger.info("Weekly leaderboard reset completed");
    });
};

const runMonthlyReset = async (io) => {
    await safeRun("monthly", async () => {
        await Promise.all([
            createLeaderboardSnapshot({ type: LEADERBOARD_TYPES.GLOBAL, period: LEADERBOARD_PERIODS.MONTHLY }),
            createLeaderboardSnapshot({ type: LEADERBOARD_TYPES.ASSIGNMENT, period: LEADERBOARD_PERIODS.MONTHLY }),
        ]);

        await invalidateLeaderboardCache();
        await rebuildPrimaryLeaderboards();
        notifyLeaderboardRefresh({ io, payload: { source: "monthly-reset" } });
        logger.info("Monthly leaderboard reset completed");
    });
};

export const startLeaderboardCronScheduler = (io) => {
    if (weeklyTask || monthlyTask || cleanupTask) {
        return;
    }

    weeklyTask = cron.schedule(
        LEADERBOARD_CRON.WEEKLY_RESET,
        () => runWeeklyReset(io),
        { timezone: LEADERBOARD_CRON.TIMEZONE }
    );

    monthlyTask = cron.schedule(
        LEADERBOARD_CRON.MONTHLY_RESET,
        () => runMonthlyReset(io),
        { timezone: LEADERBOARD_CRON.TIMEZONE }
    );

    cleanupTask = cron.schedule(
        LEADERBOARD_CRON.HEARTBEAT_CLEANUP,
        () => safeRun("presence-cleanup", cleanupStaleOnlineUsers),
        { timezone: LEADERBOARD_CRON.TIMEZONE }
    );

    logger.info("Leaderboard cron scheduler started");
};

export const stopLeaderboardCronScheduler = () => {
    if (weeklyTask) {
        weeklyTask.stop();
        weeklyTask = null;
    }

    if (monthlyTask) {
        monthlyTask.stop();
        monthlyTask = null;
    }

    if (cleanupTask) {
        cleanupTask.stop();
        cleanupTask = null;
    }

    logger.info("Leaderboard cron scheduler stopped");
};
