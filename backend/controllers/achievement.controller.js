import { asyncHandler } from "../middlewares/async.middleware.js";
import { successResponse } from "../utils/response.utils.js";
import {
    ACHIEVEMENT_STATUS,
    ACHIEVEMENT_TABS,
} from "../constants/achievement.constant.js";
import { listMyAchievements } from "../services/achievement.service.js";

const VALID_TABS = new Set(Object.values(ACHIEVEMENT_TABS));
const VALID_STATUS = new Set(Object.values(ACHIEVEMENT_STATUS));

export const getMyAchievements = asyncHandler(async (req, res) => {
    const {
        tab = ACHIEVEMENT_TABS.ALL,
        status,
        page = 1,
        limit = 20,
        courseId,
    } = req.query;

    const safeTab = VALID_TABS.has(tab) ? tab : ACHIEVEMENT_TABS.ALL;
    const safeStatus = status && VALID_STATUS.has(status) ? status : undefined;

    const data = await listMyAchievements({
        userId: req.user.id,
        tab: safeTab,
        status: safeStatus,
        page,
        limit,
        courseId,
    });

    successResponse(res, 200, "Achievements fetched successfully", data);
});
