import { updateImage, uploadProfilePicture, deleteImage } from "./r2.service.js";
import logger from "../configs/logger.config.js";

/**
 * Instructor Profile Service
 * Comprehensive profile management for instructor model with support for:
 * - Basic info (name, contact, demographics)
 * - Media assets (profile picture, banner)
 * - Professional identity (title, bio, shortBio)
 * - Rich professional data (specializations, skills, qualifications, achievements)
 * - Work experience and career background
 * - Social links and teaching languages
 * - Availability and preferences
 */

/**
 * Get instructor profile
 * @param {Model} Instructor - Mongoose Instructor model
 * @param {string} id - Instructor ID
 * @returns {Object} - Instructor profile or null
 */
export const getInstructorProfile = async (Instructor, id) => {
    try {
        const profile = await Instructor.findById(id);
        return profile;
    } catch (error) {
        logger.error(`Error fetching instructor profile ${id}: ${error.message}`);
        throw error;
    }
};

/**
 * Update instructor profile with complete support for new fields
 * @param {Model} Instructor - Mongoose Instructor model
 * @param {string} id - Instructor ID
 * @param {Object} updateData - Data to update
 * @param {Object} file - Optional profile picture file
 * @returns {Object} - Updated instructor profile
 */
export const updateInstructorProfile = async (Instructor, id, updateData, file) => {
    try {
        logger.info(`Instructor updating profile: ${id}`);

        // Fields that cannot be updated by the instructor
        const restrictedFields = [
            "password", "email", "isEmailVerified", "isPhoneVerified",
            "isActive", "isSuspended", "suspensionReason", "suspendedAt",
            "isDocumentsVerified", "isKYCVerified", "sessions", "loginAttempts",
            "lockUntil", "verificationCode", "verificationCodeExpires", "isOtpVerified",
            "otpAttempts", "otpLastSentAt", "passwordChangedAt", "passwordResetToken",
            "passwordResetExpires", "deletedAt", "deletionReason", "createdBy",
            "updatedBy", "createdAt", "updatedAt", "courses", "liveClasses",
            "totalStudentsTeaching", "totalCourses", "totalLiveClasses",
            "totalReviews", "rating", "isTopInstructor", "cfLiveInputId", "cfRtmpUrl",
            "cfRtmpKey", "cfSrtUrl", "cfWebRTCUrl", "lastLogin", "lastLoginIP"
        ];

        // Create clean update object
        const cleanData = { ...updateData };

        // Remove restricted fields
        restrictedFields.forEach(field => delete cleanData[field]);

        // Handle profile picture upload
        if (file) {
            const profile = await Instructor.findById(id);
            if (!profile) throw new Error("Instructor not found");

            const userName = `${profile.firstName}_${profile.lastName}`;
            const oldPublicId = profile.profilePicture?.public_id || null;

            try {
                const uploadResult = await updateImage(
                    oldPublicId,
                    file.buffer,
                    uploadProfilePicture,
                    "Instructor",
                    userName
                );
                cleanData.profilePicture = {
                    public_id: uploadResult.public_id,
                    secure_url: uploadResult.secure_url
                };
            } catch (error) {
                logger.error(`Profile picture upload failed for instructor ${id}: ${error.message}`);
                // Continue without failing the update
            }
        }

        // Update profile with all new fields
        const updatedProfile = await Instructor.findByIdAndUpdate(id, cleanData, {
            new: true,
            runValidators: true
        });

        if (!updatedProfile) {
            throw new Error("Instructor not found");
        }

        logger.info(`Instructor profile updated successfully: ${id}`);
        return updatedProfile;
    } catch (error) {
        logger.error(`Error updating instructor profile ${id}: ${error.message}`);
        throw error;
    }
};

/**
 * Update instructor professional profile (specializations, skills, qualifications, etc)
 * @param {Model} Instructor - Mongoose Instructor model
 * @param {string} id - Instructor ID
 * @param {Object} professionalData - Professional profile data
 * @returns {Object} - Updated instructor profile
 */
export const updateInstructorProfessionalInfo = async (
    Instructor,
    id,
    {
        professionalTitle,
        shortBio,
        bio,
        specializations,
        skills,
        tags,
        workExperience,
        yearsOfExperience,
        qualifications,
        achievements,
        socialLinks,
        teachingLanguages,
        backgroundType,
        availability
    }
) => {
    try {
        logger.info(`Updating professional info for instructor: ${id}`);

        const updateFields = {};

        // Text fields
        if (professionalTitle !== undefined) updateFields.professionalTitle = professionalTitle;
        if (shortBio !== undefined) updateFields.shortBio = shortBio;
        if (bio !== undefined) updateFields.bio = bio;

        // Array fields
        if (specializations !== undefined) updateFields.specializations = specializations;
        if (skills !== undefined) updateFields.skills = skills;
        if (tags !== undefined) updateFields.tags = tags;
        if (workExperience !== undefined) updateFields.workExperience = workExperience;
        if (yearsOfExperience !== undefined) updateFields.yearsOfExperience = yearsOfExperience;
        if (qualifications !== undefined) updateFields.qualifications = qualifications;
        if (achievements !== undefined) updateFields.achievements = achievements;

        // Nested objects
        if (socialLinks !== undefined) updateFields.socialLinks = socialLinks;
        if (teachingLanguages !== undefined) updateFields.teachingLanguages = teachingLanguages;
        if (backgroundType !== undefined) updateFields.backgroundType = backgroundType;
        if (availability !== undefined) updateFields.availability = availability;

        const updatedProfile = await Instructor.findByIdAndUpdate(
            id,
            { $set: updateFields },
            { new: true, runValidators: true }
        );

        if (!updatedProfile) {
            throw new Error("Instructor not found");
        }

        logger.info(`Professional info updated for instructor: ${id}`);
        return updatedProfile;
    } catch (error) {
        logger.error(`Error updating professional info for instructor ${id}: ${error.message}`);
        throw error;
    }
};

/**
 * Add single specialization
 * @param {Model} Instructor - Mongoose Instructor model
 * @param {string} id - Instructor ID
 * @param {Object} specialization - Specialization object
 * @returns {Object} - Updated instructor profile
 */
export const addSpecialization = async (Instructor, id, specialization) => {
    try {
        const updated = await Instructor.findByIdAndUpdate(
            id,
            { $push: { specializations: specialization } },
            { new: true, runValidators: true }
        );
        return updated;
    } catch (error) {
        logger.error(`Error adding specialization for instructor ${id}: ${error.message}`);
        throw error;
    }
};

/**
 * Update single specialization by index
 * @param {Model} Instructor - Mongoose Instructor model
 * @param {string} id - Instructor ID
 * @param {number} index - Array index
 * @param {Object} specialization - Updated specialization object
 * @returns {Object} - Updated instructor profile
 */
export const updateSpecialization = async (Instructor, id, index, specialization) => {
    try {
        const updated = await Instructor.findByIdAndUpdate(
            id,
            { $set: { [`specializations.${index}`]: specialization } },
            { new: true, runValidators: true }
        );
        return updated;
    } catch (error) {
        logger.error(`Error updating specialization for instructor ${id}: ${error.message}`);
        throw error;
    }
};

/**
 * Remove specialization by index
 * @param {Model} Instructor - Mongoose Instructor model
 * @param {string} id - Instructor ID
 * @param {number} index - Array index
 * @returns {Object} - Updated instructor profile
 */
export const removeSpecialization = async (Instructor, id, index) => {
    try {
        const instructor = await Instructor.findById(id);
        if (!instructor) throw new Error("Instructor not found");

        instructor.specializations.splice(index, 1);
        await instructor.save();
        return instructor;
    } catch (error) {
        logger.error(`Error removing specialization for instructor ${id}: ${error.message}`);
        throw error;
    }
};

/**
 * Add single skill
 * @param {Model} Instructor - Mongoose Instructor model
 * @param {string} id - Instructor ID
 * @param {Object} skill - Skill object
 * @returns {Object} - Updated instructor profile
 */
export const addSkill = async (Instructor, id, skill) => {
    try {
        const updated = await Instructor.findByIdAndUpdate(
            id,
            { $push: { skills: skill } },
            { new: true, runValidators: true }
        );
        return updated;
    } catch (error) {
        logger.error(`Error adding skill for instructor ${id}: ${error.message}`);
        throw error;
    }
};

/**
 * Remove skill by index
 * @param {Model} Instructor - Mongoose Instructor model
 * @param {string} id - Instructor ID
 * @param {number} index - Array index
 * @returns {Object} - Updated instructor profile
 */
export const removeSkill = async (Instructor, id, index) => {
    try {
        const instructor = await Instructor.findById(id);
        if (!instructor) throw new Error("Instructor not found");

        instructor.skills.splice(index, 1);
        await instructor.save();
        return instructor;
    } catch (error) {
        logger.error(`Error removing skill for instructor ${id}: ${error.message}`);
        throw error;
    }
};

/**
 * Add work experience
 * @param {Model} Instructor - Mongoose Instructor model
 * @param {string} id - Instructor ID
 * @param {Object} workExp - Work experience object
 * @returns {Object} - Updated instructor profile
 */
export const addWorkExperience = async (Instructor, id, workExp) => {
    try {
        const updated = await Instructor.findByIdAndUpdate(
            id,
            { $push: { workExperience: workExp } },
            { new: true, runValidators: true }
        );
        return updated;
    } catch (error) {
        logger.error(`Error adding work experience for instructor ${id}: ${error.message}`);
        throw error;
    }
};

/**
 * Remove work experience by index
 * @param {Model} Instructor - Mongoose Instructor model
 * @param {string} id - Instructor ID
 * @param {number} index - Array index
 * @returns {Object} - Updated instructor profile
 */
export const removeWorkExperience = async (Instructor, id, index) => {
    try {
        const instructor = await Instructor.findById(id);
        if (!instructor) throw new Error("Instructor not found");

        instructor.workExperience.splice(index, 1);
        await instructor.save();
        return instructor;
    } catch (error) {
        logger.error(`Error removing work experience for instructor ${id}: ${error.message}`);
        throw error;
    }
};

/**
 * Add qualification
 * @param {Model} Instructor - Mongoose Instructor model
 * @param {string} id - Instructor ID
 * @param {Object} qualification - Qualification object
 * @returns {Object} - Updated instructor profile
 */
export const addQualification = async (Instructor, id, qualification) => {
    try {
        const updated = await Instructor.findByIdAndUpdate(
            id,
            { $push: { qualifications: qualification } },
            { new: true, runValidators: true }
        );
        return updated;
    } catch (error) {
        logger.error(`Error adding qualification for instructor ${id}: ${error.message}`);
        throw error;
    }
};

/**
 * Remove qualification by index
 * @param {Model} Instructor - Mongoose Instructor model
 * @param {string} id - Instructor ID
 * @param {number} index - Array index
 * @returns {Object} - Updated instructor profile
 */
export const removeQualification = async (Instructor, id, index) => {
    try {
        const instructor = await Instructor.findById(id);
        if (!instructor) throw new Error("Instructor not found");

        instructor.qualifications.splice(index, 1);
        await instructor.save();
        return instructor;
    } catch (error) {
        logger.error(`Error removing qualification for instructor ${id}: ${error.message}`);
        throw error;
    }
};

/**
 * Add achievement
 * @param {Model} Instructor - Mongoose Instructor model
 * @param {string} id - Instructor ID
 * @param {Object} achievement - Achievement object
 * @returns {Object} - Updated instructor profile
 */
export const addAchievement = async (Instructor, id, achievement) => {
    try {
        const updated = await Instructor.findByIdAndUpdate(
            id,
            { $push: { achievements: achievement } },
            { new: true, runValidators: true }
        );
        return updated;
    } catch (error) {
        logger.error(`Error adding achievement for instructor ${id}: ${error.message}`);
        throw error;
    }
};

/**
 * Remove achievement by index
 * @param {Model} Instructor - Mongoose Instructor model
 * @param {string} id - Instructor ID
 * @param {number} index - Array index
 * @returns {Object} - Updated instructor profile
 */
export const removeAchievement = async (Instructor, id, index) => {
    try {
        const instructor = await Instructor.findById(id);
        if (!instructor) throw new Error("Instructor not found");

        instructor.achievements.splice(index, 1);
        await instructor.save();
        return instructor;
    } catch (error) {
        logger.error(`Error removing achievement for instructor ${id}: ${error.message}`);
        throw error;
    }
};

/**
 * Update preferences
 * @param {Model} Instructor - Mongoose Instructor model
 * @param {string} id - Instructor ID
 * @param {Object} preferences - Preferences object
 * @returns {Object} - Updated preferences
 */
export const updateInstructorPreferences = async (
    Instructor,
    id,
    { emailNotifications, classReminders, studentUpdates, promotionalEmails, language, timezone }
) => {
    try {
        logger.info(`Updating preferences for instructor: ${id}`);

        const updateFields = {};
        if (emailNotifications !== undefined) updateFields["preferences.emailNotifications"] = emailNotifications;
        if (classReminders !== undefined) updateFields["preferences.classReminders"] = classReminders;
        if (studentUpdates !== undefined) updateFields["preferences.studentUpdates"] = studentUpdates;
        if (promotionalEmails !== undefined) updateFields["preferences.promotionalEmails"] = promotionalEmails;
        if (language !== undefined) updateFields["preferences.language"] = language;
        if (timezone !== undefined) updateFields["preferences.timezone"] = timezone;

        const updated = await Instructor.findByIdAndUpdate(
            id,
            { $set: updateFields },
            { new: true, runValidators: true }
        );

        return updated?.preferences;
    } catch (error) {
        logger.error(`Error updating preferences for instructor ${id}: ${error.message}`);
        throw error;
    }
};

/**
 * Delete profile picture
 * @param {Model} Instructor - Mongoose Instructor model
 * @param {string} id - Instructor ID
 * @returns {Object} - Deletion result
 */
export const deleteInstructorProfilePicture = async (Instructor, id) => {
    try {
        const profile = await Instructor.findById(id);
        if (!profile) throw new Error("Instructor not found");

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
    } catch (error) {
        logger.error(`Error deleting profile picture for instructor ${id}: ${error.message}`);
        throw error;
    }
};

/**
 * Delete banner image
 * @param {Model} Instructor - Mongoose Instructor model
 * @param {string} id - Instructor ID
 * @returns {Object} - Deletion result
 */
export const deleteInstructorBannerImage = async (Instructor, id) => {
    try {
        const profile = await Instructor.findById(id);
        if (!profile) throw new Error("Instructor not found");

        if (!profile.bannerImage?.public_id) {
            throw new Error("No banner image to delete");
        }

        const deleteResult = await deleteImage(profile.bannerImage.public_id);
        if (deleteResult.result === "ok") {
            profile.bannerImage = null;
            await profile.save({ validateBeforeSave: false });
            return { success: true, message: "Banner image deleted successfully" };
        }

        throw new Error("Failed to delete banner image");
    } catch (error) {
        logger.error(`Error deleting banner image for instructor ${id}: ${error.message}`);
        throw error;
    }
};
