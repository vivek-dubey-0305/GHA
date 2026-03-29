import { S3Client, PutObjectCommand, DeleteObjectCommand, ListObjectsV2Command, DeleteObjectsCommand } from "@aws-sdk/client-s3";
import { lookup } from "mime-types";
import logger from "../configs/logger.config.js";

/**
 * Cloudflare R2 Storage Service
 * Drop-in replacement for Cloudinary — handles image/video/document uploads with folder structure:
 * GHA/
 *   --Instructor/
 *     ---instructor_name/
 *       ------instructor_name.extension
 *   --Student/
 *     ---student_name/
 *       ------student_name.extension
 *   --Course/
 *     ----course_name/
 *       ------course_name_image (course thumbnail)
 *       ------course_name_trailer (trailer video)
 *       ------module_name_1/
 *         --------module_name_image
 *         --------lesson_name_1/
 *           ----------lesson files (thumbnail, video, attachments)
 *         --------lesson_name_2/
 *           ----------lesson files
 *       ------module_name_2/
 *         --------module_name_image
 *         --------lesson_name_1/
 *           ----------lesson files
 *       ------others/
 *         --------any other course-level attachments
 */

// ============================================
// R2 CLIENT CONFIGURATION
// ============================================

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const R2_ACCESS_KEY = process.env.R2_ACCESS_KEY;
const R2_SECRET_KEY = process.env.R2_SECRET_KEY;
const R2_BUCKET = process.env.R2_BUCKET || "gha-images";
const R2_PUBLIC_URL = (process.env.R2_PUBLIC_URL || "").replace(/\/+$/, ""); // trim trailing slash

const r2Client = new S3Client({
    region: "auto",
    endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId: R2_ACCESS_KEY,
        secretAccessKey: R2_SECRET_KEY,
    },
});

// ============================================
// HELPERS
// ============================================

/**
 * Sanitize name for folder / file naming (same as old cloudinary helper)
 */
const sanitizeName = (name) =>
    (name || "untitled").replace(/[^a-zA-Z0-9_-]/g, "_").substring(0, 60);

/**
 * Detect MIME content-type from a file key.
 * Falls back to application/octet-stream.
 */
const detectContentType = (key) => lookup(key) || "application/octet-stream";

/**
 * Upload a buffer to R2 and return a result object that mirrors the
 * shape every controller already expects (public_id, secure_url, url, format, bytes …).
 *
 * @param {Buffer} fileBuffer   – raw file bytes
 * @param {string} key          – full object key inside the bucket  (acts as public_id)
 * @param {Object} [opts]       – optional overrides
 * @param {string} [opts.contentType] – explicit MIME type
 * @returns {Promise<Object>}
 */
const uploadToR2 = async (fileBuffer, key, opts = {}) => {
    const contentType = opts.contentType || detectContentType(key);

    const command = new PutObjectCommand({
        Bucket: R2_BUCKET,
        Key: key,
        Body: fileBuffer,
        ContentType: contentType,
    });

    await r2Client.send(command);

    const publicUrl = `${R2_PUBLIC_URL}/${key}`;
    const format = key.split(".").pop() || contentType.split("/").pop() || "";

    return {
        public_id: key,                // used everywhere as the delete handle
        secure_url: publicUrl,         // primary URL served to clients
        url: publicUrl,                // alias kept for backward-compat
        format,
        bytes: fileBuffer.length,
    };
};

export const uploadStudyGroupAttachment = async (fileBuffer, groupId, fileName, contentType) => {
    const safeGroup = sanitizeName(String(groupId || "group"));
    const safeFileName = sanitizeName(fileName || "attachment");
    const ext = fileName && fileName.includes(".")
        ? fileName.split(".").pop()
        : guessExtension(fileBuffer);
    const key = `GHA/StudyGroups/${safeGroup}/attachments/${safeFileName}_${Date.now()}.${ext}`;

    return uploadToR2(fileBuffer, key, { contentType });
};

export const uploadStudyGroupProfilePhoto = async (fileBuffer, groupId, fileName = "profile") => {
    const safeGroup = sanitizeName(String(groupId || "group"));
    const ext = fileName && fileName.includes(".")
        ? fileName.split(".").pop()
        : guessExtension(fileBuffer);
    const key = `GHA/StudyGroups/${safeGroup}/profile/profile_${Date.now()}.${ext}`;

    return uploadToR2(fileBuffer, key, {
        contentType: `image/${ext === "jpg" ? "jpeg" : ext}`,
    });
};

/**
 * Delete a single object from R2 by key.  Silently succeeds if the key doesn't exist.
 */
const deleteFromR2 = async (key) => {
    if (!key) return { result: "ok" };

    try {
        const command = new DeleteObjectCommand({
            Bucket: R2_BUCKET,
            Key: key,
        });
        await r2Client.send(command);
        logger.info(`R2 object deleted: ${key}`);
        return { result: "ok" };
    } catch (error) {
        logger.error(`Error deleting R2 object ${key}: ${error.message}`);
        throw new Error(`Failed to delete R2 object: ${error.message}`);
    }
};

/**
 * Guess a file extension from a Buffer's initial bytes (magic-number sniffing).
 * Returns a string like "png", "jpg", "webp", "gif", "mp4", "pdf" etc.
 * Falls back to "bin" if unknown.
 */
const guessExtension = (buffer) => {
    if (!buffer || buffer.length < 4) return "bin";
    const h = buffer.slice(0, 12);

    // Images
    if (h[0] === 0x89 && h[1] === 0x50 && h[2] === 0x4e && h[3] === 0x47) return "png";
    if (h[0] === 0xff && h[1] === 0xd8 && h[2] === 0xff) return "jpg";
    if (h[0] === 0x52 && h[1] === 0x49 && h[2] === 0x46 && h[3] === 0x46 &&
        h[8] === 0x57 && h[9] === 0x45 && h[10] === 0x42 && h[11] === 0x50) return "webp";
    if (h[0] === 0x47 && h[1] === 0x49 && h[2] === 0x46) return "gif";

    // Video
    if (h.length >= 8 && h[4] === 0x66 && h[5] === 0x74 && h[6] === 0x79 && h[7] === 0x70) return "mp4";

    // PDF
    if (h[0] === 0x25 && h[1] === 0x50 && h[2] === 0x44 && h[3] === 0x46) return "pdf";

    return "bin";
};

// ============================================
// PROFILE PICTURE
// ============================================

/**
 * Upload profile picture to R2
 * Key: GHA/{userType}/{userName}/{userName}_{timestamp}.{ext}
 */
export const uploadProfilePicture = async (fileBuffer, userType, userName) => {
    try {
        const safeName = sanitizeName(userName);
        const ext = guessExtension(fileBuffer);
        const key = `GHA/${userType}/${safeName}/${safeName}_${Date.now()}.${ext}`;

        const result = await uploadToR2(fileBuffer, key, {
            contentType: `image/${ext === "jpg" ? "jpeg" : ext}`,
        });

        logger.info(`Profile picture uploaded successfully for ${userType} ${safeName}`);
        return result;
    } catch (error) {
        logger.error(`Error uploading profile picture for ${userType} ${userName}: ${error.message}`);
        throw new Error(`Failed to upload profile picture: ${error.message}`);
    }
};

// ============================================
// COURSE ASSETS
// ============================================

/**
 * Upload course thumbnail
 * Key: GHA/Course/{courseName}/{courseName}_image_{ts}.{ext}
 */
export const uploadCourseThumbnail = async (fileBuffer, courseName) => {
    try {
        const safeName = sanitizeName(courseName);
        const ext = guessExtension(fileBuffer);
        const key = `GHA/Course/${safeName}/${safeName}_image_${Date.now()}.${ext}`;

        const result = await uploadToR2(fileBuffer, key, {
            contentType: `image/${ext === "jpg" ? "jpeg" : ext}`,
        });

        logger.info(`Course thumbnail uploaded for course: ${safeName}`);
        return result;
    } catch (error) {
        logger.error(`Error uploading course thumbnail for ${courseName}: ${error.message}`);
        throw new Error(`Failed to upload course thumbnail: ${error.message}`);
    }
};

// Course trailer videos are now handled by Bunny Stream service (bunny.service.js)

// ============================================
// MODULE ASSETS
// ============================================

/**
 * Upload module thumbnail
 * Key: GHA/Course/{courseName}/{moduleName}/{moduleName}_image_{ts}.{ext}
 */
export const uploadModuleThumbnail = async (fileBuffer, courseName, moduleName) => {
    try {
        const safeCourseName = sanitizeName(courseName);
        const safeModuleName = sanitizeName(moduleName);
        const ext = guessExtension(fileBuffer);
        const key = `GHA/Course/${safeCourseName}/${safeModuleName}/${safeModuleName}_image_${Date.now()}.${ext}`;

        const result = await uploadToR2(fileBuffer, key, {
            contentType: `image/${ext === "jpg" ? "jpeg" : ext}`,
        });

        logger.info(`Module thumbnail uploaded for module: ${safeModuleName} in course: ${safeCourseName}`);
        return result;
    } catch (error) {
        logger.error(`Error uploading module thumbnail for ${moduleName}: ${error.message}`);
        throw new Error(`Failed to upload module thumbnail: ${error.message}`);
    }
};

// ============================================
// LESSON ASSETS
// ============================================

/**
 * Upload lesson thumbnail
 * Key: GHA/Course/{courseName}/{moduleName}/{lessonName}/{lessonName}_image_{ts}.{ext}
 */
export const uploadLessonThumbnail = async (fileBuffer, courseName, moduleName = "general", lessonName) => {
    try {
        const safeCourseName = sanitizeName(courseName);
        const safeModuleName = sanitizeName(moduleName);
        const safeLessonName = sanitizeName(lessonName);
        const ext = guessExtension(fileBuffer);
        const key = `GHA/Course/${safeCourseName}/${safeModuleName}/${safeLessonName}/${safeLessonName}_image_${Date.now()}.${ext}`;

        const result = await uploadToR2(fileBuffer, key, {
            contentType: `image/${ext === "jpg" ? "jpeg" : ext}`,
        });

        logger.info(`Lesson thumbnail uploaded for lesson: ${safeLessonName}`);
        return result;
    } catch (error) {
        logger.error(`Error uploading lesson thumbnail for ${lessonName}: ${error.message}`);
        throw new Error(`Failed to upload lesson thumbnail: ${error.message}`);
    }
};

// Lesson videos are now handled by Bunny Stream service (bunny.service.js)

/**
 * Upload lesson attachment / document
 * Key: GHA/Course/{courseName}/{moduleName}/{lessonName}/attachments/{fileName}_{ts}
 */
export const uploadLessonAttachment = async (fileBuffer, courseName, moduleName, lessonName, fileName) => {
    try {
        const safeCourseName = sanitizeName(courseName);
        const safeModuleName = sanitizeName(moduleName);
        const safeLessonName = sanitizeName(lessonName);
        const safeFileName = sanitizeName(fileName);
        const ext = fileName.includes(".") ? fileName.split(".").pop() : guessExtension(fileBuffer);
        const key = `GHA/Course/${safeCourseName}/${safeModuleName}/${safeLessonName}/attachments/${safeFileName}_${Date.now()}.${ext}`;

        const result = await uploadToR2(fileBuffer, key);

        logger.info(`Lesson attachment uploaded: ${safeFileName}`);
        return result;
    } catch (error) {
        logger.error(`Error uploading lesson attachment ${fileName}: ${error.message}`);
        throw new Error(`Failed to upload lesson attachment: ${error.message}`);
    }
};

// ============================================
// COURSE-LEVEL OTHER FILES
// ============================================

/**
 * Upload course-level other files
 * Key: GHA/Course/{courseName}/others/{fileName}_{ts}
 */
export const uploadCourseOther = async (fileBuffer, courseName, fileName, _resourceType = "raw") => {
    try {
        const safeCourseName = sanitizeName(courseName);
        const safeFileName = sanitizeName(fileName);
        const ext = fileName.includes(".") ? fileName.split(".").pop() : guessExtension(fileBuffer);
        const key = `GHA/Course/${safeCourseName}/others/${safeFileName}_${Date.now()}.${ext}`;

        const result = await uploadToR2(fileBuffer, key);

        logger.info(`Course other file uploaded: ${safeFileName}`);
        return result;
    } catch (error) {
        logger.error(`Error uploading course other file ${fileName}: ${error.message}`);
        throw new Error(`Failed to upload course file: ${error.message}`);
    }
};

// ============================================
// ASSIGNMENT ASSETS
// ============================================

/**
 * Upload assignment thumbnail
 * Key: GHA/Course/{courseName}/assignment/{assignmentName}_{ts}.{ext}
 */
export const uploadAssignmentThumbnail = async (fileBuffer, courseName, assignmentName) => {
    try {
        const safeCourseName = sanitizeName(courseName);
        const safeAssignmentName = sanitizeName(assignmentName);
        const ext = guessExtension(fileBuffer);
        const key = `GHA/Course/${safeCourseName}/assignment/${safeAssignmentName}_${Date.now()}.${ext}`;

        const result = await uploadToR2(fileBuffer, key, {
            contentType: `image/${ext === "jpg" ? "jpeg" : ext}`,
        });

        logger.info(`Assignment thumbnail uploaded for assignment: ${safeAssignmentName} in course: ${safeCourseName}`);
        return result;
    } catch (error) {
        logger.error(`Error uploading assignment thumbnail for ${assignmentName}: ${error.message}`);
        throw new Error(`Failed to upload assignment thumbnail: ${error.message}`);
    }
};

/**
 * Upload assignment file (raw document)
 * Key: GHA/Course/{courseName}/{moduleName}/{lessonName}/assignments/{fileName}_{ts}
 */
export const uploadAssignmentFile = async (fileBuffer, courseName, moduleName, lessonName, fileName, _resourceType = "raw") => {
    try {
        const safeCourseName = sanitizeName(courseName);
        const safeModuleName = sanitizeName(moduleName || "general");
        const safeLessonName = sanitizeName(lessonName || "general");
        const safeFileName = sanitizeName(fileName);
        const ext = fileName.includes(".") ? fileName.split(".").pop() : guessExtension(fileBuffer);
        const key = `GHA/Course/${safeCourseName}/${safeModuleName}/${safeLessonName}/assignments/${safeFileName}_${Date.now()}.${ext}`;

        const result = await uploadToR2(fileBuffer, key);

        logger.info(`Assignment file uploaded: ${safeFileName}`);
        return result;
    } catch (error) {
        logger.error(`Error uploading assignment file ${fileName}: ${error.message}`);
        throw new Error(`Failed to upload assignment file: ${error.message}`);
    }
};

// ============================================
// MATERIAL FILE UPLOADS
// ============================================

/**
 * Upload material file (document/pdf/ppt/image/audio/video)
 * Key: GHA/Course/{courseName}/{moduleName}/{lessonName}/materials/{fileName}_{ts}
 */
export const uploadMaterialFile = async (fileBuffer, courseName, moduleName, lessonName, fileName, _resourceType = "raw") => {
    try {
        const safeCourseName = sanitizeName(courseName);
        const safeModuleName = sanitizeName(moduleName || "general");
        const safeLessonName = sanitizeName(lessonName || "general");
        const safeFileName = sanitizeName(fileName);
        const ext = fileName.includes(".") ? fileName.split(".").pop() : guessExtension(fileBuffer);
        const key = `GHA/Course/${safeCourseName}/${safeModuleName}/${safeLessonName}/materials/${safeFileName}_${Date.now()}.${ext}`;

        const result = await uploadToR2(fileBuffer, key);

        // Additional metadata fields controllers may reference
        result.duration = null;
        result.pages = null;
        result.width = null;
        result.height = null;
        result.resource_type = _resourceType;

        logger.info(`Material file uploaded: ${safeFileName} for lesson: ${safeLessonName}`);
        return result;
    } catch (error) {
        logger.error(`Error uploading material file ${fileName}: ${error.message}`);
        throw new Error(`Failed to upload material file: ${error.message}`);
    }
};

// ============================================
// CERTIFICATE IMAGE UPLOADS
// ============================================

/**
 * Upload certificate template image
 * Key: GHA/Course/{courseName}/certificate/certificate_{ts}.{ext}
 */
export const uploadCertificateImage = async (fileBuffer, courseName) => {
    try {
        const safeCourseName = sanitizeName(courseName);
        const ext = guessExtension(fileBuffer);
        const key = `GHA/Course/${safeCourseName}/certificate/certificate_${Date.now()}.${ext}`;

        const result = await uploadToR2(fileBuffer, key, {
            contentType: `image/${ext === "jpg" ? "jpeg" : ext}`,
        });

        logger.info(`Certificate image uploaded for course: ${safeCourseName}`);
        return result;
    } catch (error) {
        logger.error(`Error uploading certificate image for ${courseName}: ${error.message}`);
        throw new Error(`Failed to upload certificate image: ${error.message}`);
    }
};

// ============================================
// VIDEO PACKAGE UPLOADS — MOVED TO BUNNY STREAM
// ============================================
// Video package videos are now handled by Bunny Stream service (bunny.service.js)
// Video package thumbnails: Bunny auto-generates thumbnails for uploaded videos.
// Custom thumbnails (images) can still be uploaded to R2 via uploadLessonThumbnail.

// ============================================
// DELETE HELPERS
// ============================================

/**
 * Delete an image from R2 by its key (public_id)
 */
export const deleteImage = async (publicId) => {
    try {
        if (!publicId) {
            logger.warn("No publicId provided for deletion");
            return { result: "ok" };
        }
        const result = await deleteFromR2(publicId);
        logger.info(`Image deleted successfully: ${publicId}`);
        return result;
    } catch (error) {
        logger.error(`Error deleting image: ${error.message}`);
        throw new Error(`Failed to delete image: ${error.message}`);
    }
};

/**
 * Delete a video from R2 by its key (public_id)
 */
export const deleteVideo = async (publicId) => {
    try {
        if (!publicId) return { result: "ok" };
        const result = await deleteFromR2(publicId);
        logger.info(`Video deleted successfully: ${publicId}`);
        return result;
    } catch (error) {
        logger.error(`Error deleting video: ${error.message}`);
        throw new Error(`Failed to delete video: ${error.message}`);
    }
};

/**
 * Delete a raw resource from R2 by its key (public_id)
 */
export const deleteRawResource = async (publicId) => {
    try {
        if (!publicId) return { result: "ok" };
        const result = await deleteFromR2(publicId);
        logger.info(`Raw resource deleted successfully: ${publicId}`);
        return result;
    } catch (error) {
        logger.error(`Error deleting raw resource: ${error.message}`);
        throw new Error(`Failed to delete raw resource: ${error.message}`);
    }
};

/**
 * Delete an R2 "folder" (all objects sharing a key prefix)
 */
export const deleteFolder = async (folderPath) => {
    try {
        if (!folderPath) return;

        // List all objects with this prefix
        let continuationToken;
        const keysToDelete = [];

        do {
            const listCommand = new ListObjectsV2Command({
                Bucket: R2_BUCKET,
                Prefix: folderPath,
                ContinuationToken: continuationToken,
            });

            const listResult = await r2Client.send(listCommand);

            if (listResult.Contents && listResult.Contents.length > 0) {
                keysToDelete.push(...listResult.Contents.map((obj) => ({ Key: obj.Key })));
            }

            continuationToken = listResult.IsTruncated ? listResult.NextContinuationToken : undefined;
        } while (continuationToken);

        if (keysToDelete.length === 0) {
            logger.info(`No objects found under prefix: ${folderPath}`);
            return;
        }

        // R2 supports batch delete of up to 1000 keys at a time
        const BATCH = 1000;
        for (let i = 0; i < keysToDelete.length; i += BATCH) {
            const batch = keysToDelete.slice(i, i + BATCH);
            const deleteCommand = new DeleteObjectsCommand({
                Bucket: R2_BUCKET,
                Delete: { Objects: batch, Quiet: true },
            });
            await r2Client.send(deleteCommand);
        }

        logger.info(`Folder deleted successfully: ${folderPath} (${keysToDelete.length} objects)`);
    } catch (error) {
        logger.error(`Error deleting folder ${folderPath}: ${error.message}`);
    }
};

// ============================================
// UPDATE HELPER
// ============================================

/**
 * Update image (delete old, upload new via the given upload function).
 * Matches old Cloudinary signature exactly so controllers don't need changes.
 *
 * @param {string} oldPublicId    – R2 key of the old file
 * @param {Buffer} newFileBuffer  – new file bytes
 * @param {Function} uploadFunction – one of the upload* functions above
 * @param {...any} uploadArgs     – remaining args forwarded to uploadFunction
 * @returns {Object} – new upload result
 */
export const updateImage = async (oldPublicId, newFileBuffer, uploadFunction, ...uploadArgs) => {
    try {
        // Delete old file if exists (best-effort, don't fail the update)
        if (oldPublicId) {
            await deleteImage(oldPublicId).catch((err) =>
                logger.warn(`Non-critical: could not delete old file ${oldPublicId}: ${err.message}`)
            );
        }

        // Upload new file
        const result = await uploadFunction(newFileBuffer, ...uploadArgs);
        logger.info("Image updated successfully");
        return result;
    } catch (error) {
        logger.error(`Error updating image: ${error.message}`);
        throw new Error(`Failed to update image: ${error.message}`);
    }
};

// ============================================
// URL HELPERS (lightweight — no server-side transforms in R2)
// ============================================

/**
 * Get public URL for a stored object.
 * Since R2 doesn't do on-the-fly transforms the way Cloudinary does,
 * this simply returns the public URL. Resize in the client / via Workers if needed.
 */
export const getOptimizedImageUrl = (publicId, _options = {}) => {
    try {
        if (!publicId){
            console.log("returning null")
            return null;
        } 
        console.log("No optimized image URL generated for publicId:", publicId);
        return `${R2_PUBLIC_URL}/${publicId}`;
    } catch (error) {
        logger.error(`Error generating image URL: ${error.message}`);
        return null;
    }
};

/**
 * Get image URL for different sizes.
 * Returns the same URL — client-side or Cloudflare Image Resizing can handle sizing.
 */
export const getImageUrlBySize = (publicId, _size = "medium") => {
    return getOptimizedImageUrl(publicId);
};
