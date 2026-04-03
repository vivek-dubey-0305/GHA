import { asyncHandler } from "../middlewares/async.middleware.js";
import { successResponse } from "../utils/response.utils.js";
import {
    invalidateLeaderboardCache,
    notifyLeaderboardRefresh,
} from "../services/leaderboard.service.js";
import {
    getUserStreakOverview,
    markStreakActivity,
} from "../services/streak.service.js";

export const getMyStreak = asyncHandler(async (req, res) => {
    const data = await getUserStreakOverview(req.user.id);
    successResponse(res, 200, "Streak details fetched", data);
});

export const markMyStreakActivity = asyncHandler(async (req, res) => {
    const io = req.app.get("io");
    const data = await markStreakActivity({
        userId: req.user.id,
        io,
        source: "streak.manual",
    });

    await invalidateLeaderboardCache();
    notifyLeaderboardRefresh({
        io,
        payload: { source: "streak.manual", userId: req.user.id },
    });

    successResponse(res, 200, "Streak activity marked", data);
});
