import { asyncHandler } from "../middlewares/async.middleware.js";
import { errorResponse, successResponse } from "../utils/response.utils.js";
import {
    LEADERBOARD_PERIODS,
    LEADERBOARD_TYPES,
} from "../constants/leaderboard.constant.js";
import {
    getEnrolledCourseFilterOptions,
    getLeaderboardData,
} from "../services/leaderboard.service.js";

const VALID_TYPES = new Set(Object.values(LEADERBOARD_TYPES));
const VALID_PERIODS = new Set(Object.values(LEADERBOARD_PERIODS));

export const getLeaderboard = asyncHandler(async (req, res) => {
    const {
        type = LEADERBOARD_TYPES.GLOBAL,
        period = LEADERBOARD_PERIODS.ALL_TIME,
        courseId,
        page = 1,
        limit = 25,
    } = req.query;

    if (!VALID_TYPES.has(type)) {
        return errorResponse(res, 400, "Invalid leaderboard type");
    }

    if (!VALID_PERIODS.has(period)) {
        return errorResponse(res, 400, "Invalid leaderboard period");
    }

    if (type === LEADERBOARD_TYPES.COURSE && !courseId) {
        return errorResponse(res, 400, "courseId is required for course leaderboard");
    }

    const data = await getLeaderboardData({
        type,
        period,
        courseId,
        page,
        limit,
        userId: req.user.id,
    });

    successResponse(res, 200, "Leaderboard fetched successfully", data);
});

export const getLeaderboardSummary = asyncHandler(async (req, res) => {
    const {
        type = LEADERBOARD_TYPES.GLOBAL,
        period = LEADERBOARD_PERIODS.ALL_TIME,
        courseId,
    } = req.query;

    const data = await getLeaderboardData({
        type,
        period,
        courseId,
        page: 1,
        limit: 100,
        userId: req.user.id,
    });

    successResponse(res, 200, "Leaderboard summary fetched successfully", data.mySummary || {});
});

export const getLeaderboardFilterCourses = asyncHandler(async (req, res) => {
    const courses = await getEnrolledCourseFilterOptions({ userId: req.user.id });
    successResponse(res, 200, "Leaderboard filter courses fetched", courses);
});
