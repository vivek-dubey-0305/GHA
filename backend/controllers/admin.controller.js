import { User } from "../models/user.model.js";
import { Course } from "../models/course.model.js";
import { Instructor } from "../models/instructor.model.js";
import { asyncHandler } from "../middlewares/async.middleware.js";
import { errorResponse, successResponse } from "../utils/response.utils.js";
import { getPagination, createPaginationResponse } from "../utils/pagination.utils.js";
import { updateProfilePicture, deleteProfilePicture } from "../services/cloudinary.service.js";
import bcrypt from "bcrypt";
import logger from "../configs/logger.config.js";

/**
 * Admin Controller for User CRUD Operations
 * Superadmin can perform full CRUD on users with all fields
 */

// @route   GET /api/v1/admin/users
// @desc    Get all users with pagination
// @access  Private (Admin)
export const getAllUsers = asyncHandler(async (req, res) => {
    logger.info("Fetching all users with pagination");

    const { page, limit, skip } = getPagination(req.query, 10); // Default 10 users per page

    // Get total count for pagination
    const totalUsers = await User.countDocuments();

    // Get paginated users
    const users = await User.find()
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 }); // Sort by newest first

    const pagination = createPaginationResponse(totalUsers, page, limit);

    successResponse(res, 200, "Users retrieved successfully", {
        users,
        pagination
    });
});

// @route   GET /api/v1/admin/users/:id
// @desc    Get user by ID
// @access  Private (Admin)
export const getUserById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    logger.info(`Fetching user: ${id}`);

    const user = await User.findById(id);

    if (!user) {
        return errorResponse(res, 404, "User not found");
    }

    successResponse(res, 200, "User retrieved successfully", user);
});

// @route   POST /api/v1/admin/users
// @desc    Create a new user
// @access  Private (Admin)
export const createUser = asyncHandler(async (req, res) => {
    const userData = req.body;

    logger.info(`Creating user: ${userData.email}`);

    // Hash password if provided
    if (userData.password) {
        userData.password = await bcrypt.hash(userData.password, 12);
    }

    // Create user with all provided fields
    const user = await User.create(userData);

    successResponse(res, 201, "User created successfully", user);
});

// @route   PUT /api/v1/admin/users/:id
// @desc    Update user by ID
// @access  Private (Admin)
export const updateUser = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const updateData = req.body;

    logger.info(`Updating user: ${id}`);

    // Hash password if provided in update
    if (updateData.password) {
        updateData.password = await bcrypt.hash(updateData.password, 12);
    }

    const user = await User.findByIdAndUpdate(id, updateData, {
        new: true,
        runValidators: true
    });

    if (!user) {
        return errorResponse(res, 404, "User not found");
    }

    successResponse(res, 200, "User updated successfully", user);
});

// @route   DELETE /api/v1/admin/users/:id
// @desc    Delete user by ID (hard delete)
// @access  Private (Admin)
export const deleteUser = asyncHandler(async (req, res) => {
    const { id } = req.params;

    logger.info(`Deleting user: ${id}`);

    const user = await User.findByIdAndDelete(id);

    if (!user) {
        return errorResponse(res, 404, "User not found");
    }

    successResponse(res, 200, "User deleted successfully");
});

// @route   POST /api/v1/admin/users/:id/upload-profile-picture
// @desc    Upload or update profile picture for a user
// @access  Private (Admin)
export const uploadUserProfilePicture = asyncHandler(async (req, res) => {
    const { id } = req.params;

    logger.info(`Admin uploading profile picture for user: ${id}`);

    if (!req.file) {
        logger.warn(`Profile picture upload failed - No file provided for user: ${id}`);
        return errorResponse(res, 400, "No file provided");
    }

    try {
        const user = await User.findById(id);

        if (!user) {
            logger.warn(`Profile picture upload failed - User not found: ${id}`);
            return errorResponse(res, 404, "User not found");
        }

        const userName = `${user.firstName}_${user.lastName}`;
        const oldPublicId = user.profilePicture ? user.profilePicture.split('/').pop().split('.')[0] : null;

        logger.info(`Uploading profile picture for user: ${userName} (${id})`);

        // Upload to Cloudinary
        const uploadResult = await updateProfilePicture(
            req.file,
            "student",
            userName,
            oldPublicId
        );

        // Update user profile picture URL
        user.profilePicture = uploadResult.url;
        await user.save({ validateBeforeSave: false });

        logger.info(`Profile picture updated successfully for user: ${id}`);

        return successResponse(res, 200, "Profile picture uploaded successfully", {
            profilePicture: uploadResult.url,
            cloudinaryId: uploadResult.cloudinaryId,
            size: uploadResult.size
        });
    } catch (error) {
        logger.error(`Profile picture upload error for user ${id}: ${error.message}`);
        return errorResponse(res, 500, "Failed to upload profile picture. Please try again.");
    }
});

// @route   DELETE /api/v1/admin/users/:id/profile-picture
// @desc    Delete profile picture for a user
// @access  Private (Admin)
export const deleteUserProfilePicture = asyncHandler(async (req, res) => {
    const { id } = req.params;

    logger.info(`Admin deleting profile picture for user: ${id}`);

    try {
        const user = await User.findById(id);

        if (!user) {
            logger.warn(`Profile picture delete failed - User not found: ${id}`);
            return errorResponse(res, 404, "User not found");
        }

        if (!user.profilePicture) {
            logger.warn(`Profile picture delete failed - No profile picture found for user: ${id}`);
            return errorResponse(res, 400, "User has no profile picture");
        }

        // Extract public ID from URL
        const publicId = user.profilePicture.split('/').pop().split('.')[0];

        logger.info(`Deleting profile picture: ${publicId} for user: ${id}`);

        // Delete from Cloudinary
        const deleteResult = await deleteProfilePicture(publicId);

        if (deleteResult.success) {
            // Update user profile picture to null
            user.profilePicture = null;
            await user.save({ validateBeforeSave: false });

            logger.info(`Profile picture deleted successfully for user: ${id}`);

            return successResponse(res, 200, "Profile picture deleted successfully");
        } else {
            logger.warn(`Failed to delete profile picture from Cloudinary for user: ${id}`);
            return errorResponse(res, 500, "Failed to delete profile picture from storage");
        }
    } catch (error) {
        logger.error(`Profile picture delete error for user ${id}: ${error.message}`);
        return errorResponse(res, 500, "Failed to delete profile picture. Please try again.");
    }
});
