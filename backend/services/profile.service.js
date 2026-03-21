import { updateImage, uploadProfilePicture, deleteImage } from "./r2.service.js";
import logger from "../configs/logger.config.js";

/**
 * Profile Service
 * Handles common profile management operations for users and instructors
 */

/**
 * Get profile for authenticated user
 * @param {Model} Model - The mongoose model (User or Instructor)
 * @param {Object} req - Express request object
 * @returns {Object} - Profile data or error
 */
export const getMyProfile = async (Model, req) => {
    const profile = await Model.findById(req.user?.id || req.instructor?.id);
    return profile;
};

/**
 * Update profile with optional image upload
 * @param {Model} Model - The mongoose model (User or Instructor)
 * @param {Object} req - Express request object
 * @param {Array} restrictedFields - Fields that cannot be updated
 * @param {String} entityType - "Student" or "Instructor" for image upload
 * @returns {Object} - Updated profile data
 */
export const updateMyProfile = async (Model, req, restrictedFields, entityType) => {
    const userId = req.user?.id || req.instructor?.id;
    const updateData = { ...req.body };

    logger.info(`${entityType} updating profile: ${userId}`);

    // Remove restricted fields
    restrictedFields.forEach(field => delete updateData[field]);

    // Handle profile picture upload via form-data
    if (req.file) {
        const profile = await Model.findById(userId);
        if (!profile) throw new Error(`${entityType} not found`);

        const userName = `${profile.firstName}_${profile.lastName}`;
        const oldPublicId = profile.profilePicture?.public_id || null;

        try {
            const uploadResult = await updateImage(
                oldPublicId, req.file.buffer, uploadProfilePicture, entityType, userName
            );
            updateData.profilePicture = {
                public_id: uploadResult.public_id,
                secure_url: uploadResult.secure_url
            };
        } catch (error) {
            logger.error(`Profile picture upload failed for ${entityType.toLowerCase()} ${userId}: ${error.message}`);
            // Continue without failing the update
        }
    }

    const updatedProfile = await Model.findByIdAndUpdate(userId, updateData, {
        new: true,
        runValidators: true
    });

    return updatedProfile;
};

/**
 * Delete profile picture
 * @param {Model} Model - The mongoose model (User or Instructor)
 * @param {Object} req - Express request object
 * @returns {Object} - Deletion result
 */
export const deleteMyProfilePicture = async (Model, req) => {
    const profile = await Model.findById(req.user?.id || req.instructor?.id);
    if (!profile) throw new Error("Profile not found");

    if (!profile.profilePicture?.public_id) {
        throw new Error("No profile picture to delete");
    }

    const deleteResult = await deleteImage(profile.profilePicture.public_id);
    if (deleteResult.result === "ok") {
        profile.profilePicture = null;
        await profile.save({ validateBeforeSave: false });
        return { success: true, message: "Profile picture deleted successfully" };
    }

    throw new Error("Failed to delete profile picture");
};

/**
 * Update preferences for user (Student)
 * @param {Model} Model - The mongoose model (User)
 * @param {Object} req - Express request object
 * @returns {Object} - Updated preferences
 */
export const updateUserPreferences = async (Model, req) => {
    const { emailNotifications, smsNotifications, courseUpdates, promotionalEmails, language } = req.body;

    const updateFields = {};
    if (emailNotifications !== undefined) updateFields["preferences.emailNotifications"] = emailNotifications;
    if (smsNotifications !== undefined) updateFields["preferences.smsNotifications"] = smsNotifications;
    if (courseUpdates !== undefined) updateFields["preferences.courseUpdates"] = courseUpdates;
    if (promotionalEmails !== undefined) updateFields["preferences.promotionalEmails"] = promotionalEmails;
    if (language) updateFields["preferences.language"] = language;

    const profile = await Model.findByIdAndUpdate(req.user.id, { $set: updateFields }, { new: true });
    return profile?.preferences;
};

/**
 * Update preferences for instructor
 * DEPRECATED: Use instructor.profile.service.js updateInstructorPreferences instead
 * Kept for backward compatibility
 * @param {Model} Model - The mongoose model (Instructor)
 * @param {Object} req - Express request object
 * @returns {Object} - Updated preferences
 */
export const updatePreferences = async (Model, req) => {
    return updateUserPreferences(Model, req);
};