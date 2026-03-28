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

const blockedExecutableExtensions = new Set([
    ".bat", ".cmd", ".com", ".exe", ".msi", ".scr", ".pif", ".jar",
    ".vbs", ".js", ".jse", ".ws", ".wsf", ".wsh", ".ps1", ".psm1",
    ".sh", ".bash", ".zsh", ".ksh", ".php", ".py", ".rb", ".pl"
]);

const allowedSubmissionMimes = new Set([
    // Documents
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "text/plain", "text/csv", "text/markdown",
    // Images
    "image/jpeg", "image/jpg", "image/png", "image/webp",
    // Video
    "video/mp4", "video/webm",
    // Archives
    "application/zip", "application/x-zip-compressed"
]);

const allowedSubmissionExtensions = new Set([
    ".pdf", ".doc", ".docx", ".ppt", ".pptx", ".xls", ".xlsx",
    ".txt", ".csv", ".md", ".jpg", ".jpeg", ".png", ".webp",
    ".mp4", ".webm", ".zip"
]);

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

const assignmentSubmissionFilter = (req, file, cb) => {
    try {
        const ext = path.extname(file.originalname || "").toLowerCase();
        logger.info(`Assignment submission upload request: ${file.originalname} (${file.mimetype})`);

        if (blockedExecutableExtensions.has(ext)) {
            return cb(new Error(`Blocked file extension detected: ${ext}`));
        }

        if (!allowedSubmissionExtensions.has(ext)) {
            return cb(new Error(`Unsupported file extension: ${ext || "unknown"}`));
        }

        if (!allowedSubmissionMimes.has(file.mimetype)) {
            return cb(new Error(`Unsupported file type: ${file.mimetype}`));
        }

        cb(null, true);
    } catch (error) {
        logger.error(`Assignment submission filter error: ${error.message}`);
        cb(error);
    }
};

const doubtTicketFilter = (req, file, cb) => {
    try {
        const allowedMimes = new Set([
            "image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif",
            "video/mp4", "video/webm", "video/quicktime", "video/x-matroska"
        ]);

        const ext = path.extname(file.originalname || "").toLowerCase();
        if (blockedExecutableExtensions.has(ext)) {
            return cb(new Error(`Blocked file extension detected: ${ext}`));
        }

        if (!allowedMimes.has(file.mimetype)) {
            return cb(new Error(`Invalid file type for doubt ticket: ${file.mimetype}. Allowed: image/video only`));
        }

        cb(null, true);
    } catch (error) {
        logger.error(`Doubt ticket filter error: ${error.message}`);
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

export const assignmentSubmissionUpload = multer({
    storage,
    fileFilter: assignmentSubmissionFilter,
    limits: {
        fileSize: 100 * 1024 * 1024, // 100 MB per file
        files: 50,
    },
});

export const doubtTicketUpload = multer({
    storage,
    fileFilter: doubtTicketFilter,
    limits: {
        fileSize: 100 * 1024 * 1024,
        files: 5,
    },
});

export const doubtReplyImageUpload = multer({
    storage,
    fileFilter: imageFilter,
    limits: {
        fileSize: 10 * 1024 * 1024,
        files: 6,
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

export default { upload, courseMediaUpload, assignmentSubmissionUpload, doubtTicketUpload, doubtReplyImageUpload, handleMulterError };