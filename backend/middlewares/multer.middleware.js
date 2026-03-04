import multer from "multer";
import path from "path";
import logger from "../configs/logger.config.js";

/**
 * Multer Middleware Configuration
 * Handles file uploads for R2 integration
 * Supports images, videos, and documents
 */

// Use memory storage for R2 uploads
const storage = multer.memoryStorage();

// File filter for image uploads only
const imageFilter = (req, file, cb) => {
    try {
        logger.info(`Image upload request: ${file.fieldname} - ${file.originalname}`);
        const allowedMimes = [
            "image/jpeg", "image/png", "image/gif", "image/webp", "image/jpg"
        ];
        if (allowedMimes.includes(file.mimetype)) {
            logger.info(`Image validation passed: ${file.originalname}`);
            cb(null, true);
        } else {
            logger.warn(`Invalid image type: ${file.mimetype} for ${file.originalname}`);
            cb(new Error(`Invalid file type. Allowed: JPEG, PNG, GIF, WebP. Got: ${file.mimetype}`));
        }
    } catch (error) {
        logger.error(`Image filter error: ${error.message}`);
        cb(error);
    }
};

// File filter for course media (images + videos + documents)
const courseMediaFilter = (req, file, cb) => {
    try {
        logger.info(`Course media upload request: ${file.fieldname} - ${file.originalname}`);
        const allowedMimes = [
            // Images
            "image/jpeg", "image/png", "image/gif", "image/webp", "image/jpg",
            // Videos
            "video/mp4", "video/mpeg", "video/quicktime", "video/x-msvideo",
            "video/webm", "video/x-matroska",
            // Documents
            "application/pdf",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "application/vnd.ms-powerpoint",
            "application/vnd.openxmlformats-officedocument.presentationml.presentation",
            "application/vnd.ms-excel",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "application/zip", "application/x-zip-compressed",
            "text/plain", "text/csv", "text/markdown",
            "application/json",
            // Audio
            "audio/mpeg", "audio/mp3", "audio/wav", "audio/ogg",
        ];

        if (allowedMimes.includes(file.mimetype)) {
            logger.info(`Course media validation passed: ${file.originalname}`);
            cb(null, true);
        } else {
            logger.warn(`Invalid course media type: ${file.mimetype} for ${file.originalname}`);
            cb(new Error(`Invalid file type: ${file.mimetype}. Allowed: images, videos, PDF, DOC, PPT, ZIP, TXT`));
        }
    } catch (error) {
        logger.error(`Course media filter error: ${error.message}`);
        cb(error);
    }
};

// Standard image upload configuration (profile pictures, etc.)
export const upload = multer({
    storage,
    fileFilter: imageFilter,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5 MB limit
        files: 1,
    },
});

// Course media upload - supports larger files (videos up to 500MB)
export const courseMediaUpload = multer({
    storage,
    fileFilter: courseMediaFilter,
    limits: {
        fileSize: 500 * 1024 * 1024, // 500 MB limit for videos
        files: 50, // Allow many files for full course creation
    },
});

/**
 * Custom error handler for multer errors
 */
export const handleMulterError = (error, req, res, next) => {
    logger.error(`Multer error: ${error.message}`);

    if (error instanceof multer.MulterError) {
        if (error.code === "LIMIT_FILE_SIZE") {
            logger.warn(`File size exceeded by user: ${req.user?.id}`);
            return res.status(400).json({
                success: false,
                message: "File size exceeds the allowed limit",
                error: error.message,
            });
        }

        if (error.code === "LIMIT_FILE_COUNT") {
            logger.warn(`Too many files uploaded by user: ${req.user?.id}`);
            return res.status(400).json({
                success: false,
                message: "Too many files uploaded",
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

export default { upload, courseMediaUpload, handleMulterError };