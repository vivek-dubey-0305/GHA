//redis.service.js
import { createClient } from "redis";
import logger from "../configs/logger.config.js";

let redisClient = null;
let isConnected = false;

const buildRedisUrl = () => {
    const host = process.env.REDIS_HOST;
    const port = process.env.REDIS_PORT;

    if (!host || !port) {
        return null;
    }

    return `redis://${host}:${port}`;
};

export const getRedisClient = () => redisClient;

export const isRedisReady = () => Boolean(redisClient && isConnected);

export const connectRedis = async () => {
    if (redisClient && isConnected) return redisClient;

    const url = buildRedisUrl();
    const username = process.env.REDIS_USERNAME || undefined;
    const password = process.env.REDIS_PASSWORD || undefined;

    if (!url) {
        logger.warn("Redis host/port not configured, running leaderboard in DB fallback mode");
        return null;
    }

    redisClient = createClient({
        url,
        username,
        password,
    });

    redisClient.on("error", (err) => {
        isConnected = false;
        logger.error(`Redis Client Error: ${err.message}`);
    });

    redisClient.on("ready", () => {
        isConnected = true;
        logger.info("Redis client is ready");
    });

    redisClient.on("end", () => {
        isConnected = false;
        logger.warn("Redis connection closed");
    });

    await redisClient.connect();
    isConnected = true;
    logger.info("Redis connected successfully");
    return redisClient;
};

export const disconnectRedis = async () => {
    if (!redisClient) return;

    try {
        await redisClient.quit();
    } catch (error) {
        logger.error(`Failed to quit redis cleanly: ${error.message}`);
        try {
            await redisClient.disconnect();
        } catch {
            // Ignore forced disconnect failure.
        }
    } finally {
        isConnected = false;
        redisClient = null;
    }
};
