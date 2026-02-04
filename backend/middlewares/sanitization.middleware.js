import logger from "../configs/logger.config.js";

// Simple input sanitization middleware
export const sanitizeInput = (req, res, next) => {
    try {
        // Sanitize body
        if (req.body && typeof req.body === 'object') {
            sanitizeObject(req.body);
        }

        // Sanitize query parameters
        if (req.query && typeof req.query === 'object') {
            sanitizeObject(req.query);
        }

        // Sanitize route parameters
        if (req.params && typeof req.params === 'object') {
            sanitizeObject(req.params);
        }

        next();
    } catch (error) {
        logger.error(`Input sanitization error: ${error.message}`);
        next();
    }
};

// Helper function to sanitize objects
function sanitizeObject(obj) {
    for (const key in obj) {
        if (typeof obj[key] === 'string') {
            // Remove potentially dangerous characters
            obj[key] = obj[key]
                .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
                .replace(/<[^>]*>/g, '') // Remove HTML tags
                .trim();
        } else if (typeof obj[key] === 'object' && obj[key] !== null) {
            sanitizeObject(obj[key]);
        }
    }
}