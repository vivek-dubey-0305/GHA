//online-users.service.js
import {
    LEADERBOARD_DEFAULTS,
    LEADERBOARD_REDIS_KEYS,
} from "../constants/leaderboard.constant.js";
import { getRedisClient, isRedisReady } from "./redis.service.js";

const getHeartbeatKey = (userId) => `${LEADERBOARD_REDIS_KEYS.USER_HEARTBEAT}${userId}`;

export const markUserOnline = async ({ userId }) => {
    if (!userId || !isRedisReady()) return;

    const client = getRedisClient();
    const now = Date.now();
    await client.sAdd(LEADERBOARD_REDIS_KEYS.ONLINE_USERS, String(userId));
    await client.set(getHeartbeatKey(userId), String(now), {
        EX: LEADERBOARD_DEFAULTS.PRESENCE_TTL_SECONDS,
    });
};

export const markUserHeartbeat = async ({ userId }) => {
    if (!userId || !isRedisReady()) return;

    const client = getRedisClient();
    await client.set(getHeartbeatKey(userId), String(Date.now()), {
        EX: LEADERBOARD_DEFAULTS.PRESENCE_TTL_SECONDS,
    });
};

export const markUserOffline = async ({ userId }) => {
    if (!userId || !isRedisReady()) return;

    const client = getRedisClient();
    await client.sRem(LEADERBOARD_REDIS_KEYS.ONLINE_USERS, String(userId));
    await client.del(getHeartbeatKey(userId));
};

export const getOnlineUsersCount = async () => {
    if (!isRedisReady()) return 0;
    const client = getRedisClient();
    return client.sCard(LEADERBOARD_REDIS_KEYS.ONLINE_USERS);
};

export const cleanupStaleOnlineUsers = async () => {
    if (!isRedisReady()) return;

    const client = getRedisClient();
    const users = await client.sMembers(LEADERBOARD_REDIS_KEYS.ONLINE_USERS);

    if (!Array.isArray(users) || users.length === 0) return;

    const now = Date.now();
    const staleUserIds = [];

    for (const userId of users) {
        const heartbeat = await client.get(getHeartbeatKey(userId));
        if (!heartbeat) {
            staleUserIds.push(userId);
            continue;
        }

        const age = now - Number(heartbeat);
        if (!Number.isFinite(age) || age > LEADERBOARD_DEFAULTS.PRESENCE_TTL_SECONDS * 1000) {
            staleUserIds.push(userId);
        }
    }

    if (staleUserIds.length) {
        await client.sRem(LEADERBOARD_REDIS_KEYS.ONLINE_USERS, ...staleUserIds);
    }
};
