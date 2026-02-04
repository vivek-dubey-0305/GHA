import { v2 as cloudinary } from "cloudinary";
import logger from "../configs/logger.config.js";

/**
 * Cloudinary Service
 * Handles image uploads and management with folder structure:
 * Instructor/(instructor_name)/image.extension
 * Student/(student_name)/image.extension
 */

// Configure cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

logger.info("Cloudinary service initialized");

/**
 * Upload profile picture to Cloudinary
 * @param {Object} fileBuffer - File buffer or file object
 * @param {string} type - User type: 'instructor' or 'student'
 * @param {string} userName - User name for folder structure
 * @param {string} publicId - Optional custom public ID
 * @returns {Promise<Object>} - Upload result with secure_url
 */
export const uploadProfilePicture = async (fileBuffer, type, userName, publicId = null) => {
    try {
        // Validate inputs
        if (!fileBuffer) {
            throw new Error("File buffer is required");
        }

        const validTypes = ["instructor", "student"];
        if (!validTypes.includes(type.toLowerCase())) {
            throw new Error(`Invalid user type. Must be one of: ${validTypes.join(", ")}`);
        }

        if (!userName || userName.trim().length === 0) {
            throw new Error("User name is required");
        }

        // Create folder structure
        const folderPath = type.toLowerCase() === "instructor"
            ? `Instructor/${userName.trim().replace(/\s+/g, "_")}`
            : `Student/${userName.trim().replace(/\s+/g, "_")}`;

        // Generate public ID if not provided
        const generatedPublicId = publicId || `${folderPath}/profile_${Date.now()}`;

        logger.info(`Uploading profile picture for ${type}: ${userName} to path: ${folderPath}`);

        // Return a promise that handles the upload
        return new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                {
                    resource_type: "auto",
                    public_id: generatedPublicId,
                    folder: folderPath,
                    overwrite: true,
                    quality: "auto",
                    transformation: [
                        { width: 500, height: 500, crop: "fill", gravity: "face" },
                    ],
                },
                (error, result) => {
                    if (error) {
                        logger.error(`Cloudinary upload failed: ${error.message}`);
                        return reject(new Error(`Cloudinary upload failed: ${error.message}`));
                    }

                    logger.info(`Profile picture uploaded successfully for ${userName}`);
                    logger.info(`Image URL: ${result.secure_url}`);

                    resolve({
                        success: true,
                        url: result.secure_url,
                        publicId: result.public_id,
                        cloudinaryId: result.public_id,
                        size: result.bytes,
                        format: result.format,
                    });
                }
            );

            // Handle buffer or stream
            if (fileBuffer.buffer) {
                // If it's a multer file object
                uploadStream.end(fileBuffer.buffer);
            } else if (Buffer.isBuffer(fileBuffer)) {
                // If it's already a buffer
                uploadStream.end(fileBuffer);
            } else {
                // If it's a stream
                fileBuffer.pipe(uploadStream);
            }
        });
    } catch (error) {
        logger.error(`Profile picture upload error: ${error.message}`);
        throw error;
    }
};

/**
 * Delete profile picture from Cloudinary
 * @param {string} publicId - Public ID of the image in Cloudinary
 * @returns {Promise<Object>} - Delete result
 */
export const deleteProfilePicture = async (publicId) => {
    try {
        if (!publicId) {
            throw new Error("Public ID is required for deletion");
        }

        logger.info(`Deleting profile picture: ${publicId}`);

        const result = await cloudinary.uploader.destroy(publicId);

        if (result.result === "ok") {
            logger.info(`Profile picture deleted successfully: ${publicId}`);
            return {
                success: true,
                message: "Profile picture deleted successfully",
                result,
            };
        } else {
            logger.warn(`Failed to delete profile picture: ${publicId}`);
            return {
                success: false,
                message: "Failed to delete profile picture",
                result,
            };
        }
    } catch (error) {
        logger.error(`Profile picture deletion error: ${error.message}`);
        throw error;
    }
};

/**
 * Update profile picture (delete old and upload new)
 * @param {Object} fileBuffer - New file buffer
 * @param {string} type - User type: 'instructor' or 'student'
 * @param {string} userName - User name for folder structure
 * @param {string} oldPublicId - Old image public ID to delete
 * @returns {Promise<Object>} - Upload result
 */
export const updateProfilePicture = async (fileBuffer, type, userName, oldPublicId) => {
    try {
        logger.info(`Updating profile picture for ${type}: ${userName}`);

        // Delete old image if exists
        if (oldPublicId) {
            try {
                await deleteProfilePicture(oldPublicId);
                logger.info(`Old profile picture deleted: ${oldPublicId}`);
            } catch (error) {
                logger.warn(`Failed to delete old profile picture: ${error.message}`);
                // Don't throw error, continue with upload
            }
        }

        // Upload new image
        const uploadResult = await uploadProfilePicture(fileBuffer, type, userName);
        logger.info(`Profile picture updated successfully for ${userName}`);

        return uploadResult;
    } catch (error) {
        logger.error(`Profile picture update error: ${error.message}`);
        throw error;
    }
};

/**
 * Get profile picture URL
 * @param {string} publicId - Public ID of the image
 * @returns {string} - Secure URL of the image
 */
export const getProfilePictureUrl = (publicId) => {
    try {
        if (!publicId) {
            return null;
        }

        const url = cloudinary.url(publicId, {
            secure: true,
            quality: "auto",
            fetch_format: "auto",
        });

        logger.info(`Generated profile picture URL for ${publicId}`);
        return url;
    } catch (error) {
        logger.error(`Failed to generate URL for ${publicId}: ${error.message}`);
        throw error;
    }
};

/**
 * Verify cloudinary connection
 * @returns {Promise<boolean>} - True if connection is successful
 */
export const verifyCloudinaryConnection = async () => {
    try {
        logger.info("Verifying Cloudinary connection...");

        const result = await cloudinary.api.ping();
        logger.info("Cloudinary connection verified successfully");
        return true;
    } catch (error) {
        logger.error(`Cloudinary connection failed: ${error.message}`);
        return false;
    }
};

export default {
    uploadProfilePicture,
    deleteProfilePicture,
    updateProfilePicture,
    getProfilePictureUrl,
    verifyCloudinaryConnection,
};
