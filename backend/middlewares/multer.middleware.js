import multer from "multer";
import path from "path";
import logger from "../configs/logger.config.js";

/**
 * Multer Middleware Configuration
 * Handles file uploads for Cloudinary integration
 * Supports profile pictures for both instructors and students
 */

// Use memory storage for Cloudinary uploads
const storage = multer.memoryStorage();

// File filter for image uploads
const fileFilter = (req, file, cb) => {
    try {
        logger.info(`File upload request: ${file.fieldname} - ${file.originalname}`);

        // Allow only specific image types
        const allowedMimes = [
            "image/jpeg",
            "image/png",
            "image/gif",
            "image/webp",
            "image/jpg"
        ];

        if (allowedMimes.includes(file.mimetype)) {
            logger.info(`File validation passed: ${file.originalname}`);
            cb(null, true);
        } else {
            logger.warn(`Invalid file type: ${file.mimetype} for ${file.originalname}`);
            cb(new Error(`Invalid file type. Allowed: JPEG, PNG, GIF, WebP. Got: ${file.mimetype}`));
        }
    } catch (error) {
        logger.error(`File filter error: ${error.message}`);
        cb(error);
    }
};

// Multer upload configuration
export const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5 MB limit
        files: 1, // Max 1 file per request
    },
});

/**
 * Custom error handler for multer errors
 * @param {Error} error - Multer error
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Express next middleware
 */
export const handleMulterError = (error, req, res, next) => {
    logger.error(`Multer error: ${error.message}`);

    if (error instanceof multer.MulterError) {
        if (error.code === "LIMIT_FILE_SIZE") {
            logger.warn(`File size exceeded by user: ${req.user?.id}`);
            return res.status(400).json({
                success: false,
                message: "File size exceeds 5 MB limit",
                error: error.message,
            });
        }

        if (error.code === "LIMIT_FILE_COUNT") {
            logger.warn(`Too many files uploaded by user: ${req.user?.id}`);
            return res.status(400).json({
                success: false,
                message: "Only one file is allowed per upload",
                error: error.message,
            });
        }

        if (error.code === "LIMIT_UNEXPECTED_FILE") {
            logger.warn(`Unexpected file field: ${error.field}`);
            return res.status(400).json({
                success: false,
                message: `Unexpected file field: ${error.field}`,
                error: error.message,
            });
        }
    }

    if (error.message && error.message.includes("Invalid file type")) {
        return res.status(400).json({
            success: false,
            message: error.message,
            error: error.message,
        });
    }

    logger.error(`Unexpected multer error: ${error.message}`);
    res.status(500).json({
        success: false,
        message: "File upload failed",
        error: error.message,
    });
};

export default { upload, handleMulterError };