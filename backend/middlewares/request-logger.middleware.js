import logger from "../configs/logger.config.js";

const isDevelopment = process.env.NODE_ENV !== "production";

const summarizeValue = (value) => {
    if (value === null || value === undefined) return value;
    if (Array.isArray(value)) return `[array:${value.length}]`;
    if (typeof value === "object") return "[object]";
    if (typeof value === "string") return value.length > 120 ? `${value.slice(0, 120)}...` : value;
    return value;
};

const summarizeBody = (body) => {
    if (!body || typeof body !== "object" || Array.isArray(body)) return body;
    const out = {};
    for (const [key, value] of Object.entries(body)) {
        out[key] = summarizeValue(value);
    }
    return out;
};

export const requestLogger = (req, res, next) => {
    if (!isDevelopment) return next();

    const start = Date.now();
    const requestId = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
    req.requestId = requestId;

    logger.info(
        `[${requestId}] ${req.method} ${req.originalUrl} ip=${req.ip} query=${JSON.stringify(req.query || {})} body=${JSON.stringify(summarizeBody(req.body || {}))}`
    );

    res.on("finish", () => {
        const durationMs = Date.now() - start;
        logger.info(
            `[${requestId}] ${res.statusCode} ${req.method} ${req.originalUrl} (${durationMs}ms)`
        );
    });

    next();
};
