import { v2 as cloudinary } from "cloudinary";
import logger from "../configs/logger.config.js";

/**
 * Cloudinary Service
 * Handles image uploads and management with folder structure:
 * Profile_Pictures/Instructor/image.extension
 * Profile_Pictures/Student/image.extension
 */

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Upload profile picture to Cloudinary
 * @param {Buffer} fileBuffer - The file buffer
 * @param {string} userType - 'Student' or 'Instructor'
 * @param {string} userId - User ID for unique naming
 * @returns {Object} - Cloudinary upload result
 */
export const uploadProfilePicture = async (fileBuffer, userType, userId) => {
    try {
        const folder = `Profile_Pictures/${userType}`;
        const publicId = `${userType}_${userId}_${Date.now()}`;

        const result = await new Promise((resolve, reject) => {
            cloudinary.uploader.upload_stream(
                {
                    folder,
                    public_id: publicId,
                    resource_type: 'image',
                    transformation: [
                        { width: 300, height: 300, crop: 'fill', gravity: 'face' },
                        { quality: 'auto' }
                    ]
                },
                (error, result) => {
                    if (error) reject(error);
                    else resolve(result);
                }
            ).end(fileBuffer);
        });

        logger.info(`Profile picture uploaded successfully for ${userType} ${userId}`);
        return {
            public_id: result.public_id,
            secure_url: result.secure_url,
            url: result.url,
            format: result.format,
            bytes: result.bytes
        };
    } catch (error) {
        logger.error(`Error uploading profile picture: ${error.message}`);
        throw new Error(`Failed to upload profile picture: ${error.message}`);
    }
};

/**
 * Delete profile picture from Cloudinary
 * @param {string} publicId - The public ID of the image to delete
 * @returns {Object} - Cloudinary delete result
 */
export const deleteProfilePicture = async (publicId) => {
    try {
        if (!publicId) {
            logger.warn('No publicId provided for deletion');
            return { result: 'ok' };
        }

        const result = await cloudinary.uploader.destroy(publicId);
        logger.info(`Profile picture deleted successfully: ${publicId}`);
        return result;
    } catch (error) {
        logger.error(`Error deleting profile picture: ${error.message}`);
        throw new Error(`Failed to delete profile picture: ${error.message}`);
    }
};

/**
 * Update profile picture (delete old and upload new)
 * @param {string} oldPublicId - The public ID of the old image
 * @param {Buffer} newFileBuffer - The new file buffer
 * @param {string} userType - 'Student' or 'Instructor'
 * @param {string} userId - User ID for unique naming
 * @returns {Object} - New Cloudinary upload result
 */
export const updateProfilePicture = async (oldPublicId, newFileBuffer, userType, userId) => {
    try {
        // Delete old image if exists
        if (oldPublicId) {
            await deleteProfilePicture(oldPublicId);
        }

        // Upload new image
        const result = await uploadProfilePicture(newFileBuffer, userType, userId);
        logger.info(`Profile picture updated successfully for ${userType} ${userId}`);
        return result;
    } catch (error) {
        logger.error(`Error updating profile picture: ${error.message}`);
        throw new Error(`Failed to update profile picture: ${error.message}`);
    }
};

/**
 * Get profile picture URL
 * @param {string} publicId - The public ID of the image
 * @param {Object} options - Transformation options
 * @returns {string} - The secure URL
 */
export const getProfilePictureUrl = (publicId, options = {}) => {
    try {
        if (!publicId) return null;

        const defaultOptions = {
            width: 150,
            height: 150,
            crop: 'fill',
            gravity: 'face',
            quality: 'auto'
        };

        const transformationOptions = { ...defaultOptions, ...options };

        return cloudinary.url(publicId, {
            secure: true,
            transformation: [transformationOptions]
        });
    } catch (error) {
        logger.error(`Error generating profile picture URL: ${error.message}`);
        return null;
    }
};

/**
 * Get optimized profile picture URL for different sizes
 * @param {string} publicId - The public ID of the image
 * @param {string} size - 'thumbnail', 'medium', 'large'
 * @returns {string} - The optimized URL
 */
export const getOptimizedProfilePictureUrl = (publicId, size = 'medium') => {
    const sizeOptions = {
        thumbnail: { width: 50, height: 50 },
        medium: { width: 150, height: 150 },
        large: { width: 300, height: 300 }
    };

    return getProfilePictureUrl(publicId, sizeOptions[size]);
};