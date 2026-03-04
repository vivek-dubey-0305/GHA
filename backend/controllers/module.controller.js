import { Module } from "../models/module.model.js";
import { Course } from "../models/course.model.js";
import { Lesson } from "../models/lesson.model.js";
import { asyncHandler } from "../middlewares/async.middleware.js";
import { errorResponse, successResponse } from "../utils/response.utils.js";
import { uploadModuleThumbnail, updateImage, deleteImage } from "../services/r2.service.js";
import logger from "../configs/logger.config.js";

/**
 * Module Controller
 * Handles module CRUD within courses (instructor-owned)
 */

// @route   GET /api/v1/courses/:courseId/modules
// @desc    Get all modules for a course
// @access  Public (published) / Private (all for owner)
export const getModules = asyncHandler(async (req, res) => {
    const { courseId } = req.params;
    const course = await Course.findById(courseId);
    if (!course) return errorResponse(res, 404, "Course not found");

    const isOwner = req.instructor && course.instructor.toString() === req.instructor.id;
    const filter = { course: courseId };
    if (!isOwner && !req.admin) filter.isPublished = true;

    const modules = await Module.find(filter)
        .populate({ path: "lessons", options: { sort: { order: 1 } }, select: "title type order isPublished content.videoDuration isFree" })
        .sort({ order: 1 });

    successResponse(res, 200, "Modules retrieved successfully", modules);
});

// @route   GET /api/v1/modules/:id
// @desc    Get single module
// @access  Public (published) / Private (owner)
export const getModule = asyncHandler(async (req, res) => {
    const module = await Module.findById(req.params.id)
        .populate({ path: "lessons", options: { sort: { order: 1 } } });

    if (!module) return errorResponse(res, 404, "Module not found");

    successResponse(res, 200, "Module retrieved successfully", module);
});

// @route   POST /api/v1/courses/:courseId/modules
// @desc    Create a module (with optional thumbnail via form-data)
// @access  Private (Instructor - course owner)
export const createModule = asyncHandler(async (req, res) => {
    const { courseId } = req.params;
    const course = await Course.findById(courseId);
    if (!course) return errorResponse(res, 404, "Course not found");

    if (course.instructor.toString() !== req.instructor.id) {
        return errorResponse(res, 403, "You can only add modules to your own courses");
    }

    const moduleData = req.body;
    moduleData.course = courseId;
    moduleData.createdBy = req.instructor.id;

    // Parse objectives from form-data
    if (typeof moduleData.objectives === "string") moduleData.objectives = JSON.parse(moduleData.objectives);

    // Auto-set order if not provided
    if (!moduleData.order) {
        const lastModule = await Module.findOne({ course: courseId }).sort({ order: -1 });
        moduleData.order = lastModule ? lastModule.order + 1 : 1;
    }

    // Handle thumbnail upload
    if (req.file) {
        const courseName = course.title.replace(/\s+/g, "_");
        const moduleName = moduleData.title.replace(/\s+/g, "_");
        try {
            const uploadResult = await uploadModuleThumbnail(req.file.buffer, courseName, moduleName);
            moduleData.thumbnail = { public_id: uploadResult.public_id, secure_url: uploadResult.secure_url };
        } catch (error) {
            logger.error(`Module thumbnail upload failed: ${error.message}`);
        }
    }

    const module = await Module.create(moduleData);

    // Update course references
    await Course.findByIdAndUpdate(courseId, {
        $push: { modules: module._id },
        $inc: { totalModules: 1 }
    });

    successResponse(res, 201, "Module created successfully", module);
});

// @route   PUT /api/v1/modules/:id
// @desc    Update a module (with optional thumbnail via form-data)
// @access  Private (Instructor - course owner)
export const updateModule = asyncHandler(async (req, res) => {
    const module = await Module.findById(req.params.id);
    if (!module) return errorResponse(res, 404, "Module not found");

    const course = await Course.findById(module.course);
    if (course.instructor.toString() !== req.instructor.id) {
        return errorResponse(res, 403, "You can only update modules in your own courses");
    }

    const updateData = req.body;
    updateData.updatedBy = req.instructor.id;

    if (typeof updateData.objectives === "string") updateData.objectives = JSON.parse(updateData.objectives);

    // Handle thumbnail upload
    if (req.file) {
        const courseName = course.title.replace(/\s+/g, "_");
        const moduleName = (updateData.title || module.title).replace(/\s+/g, "_");
        const oldPublicId = module.thumbnail?.public_id || null;

        try {
            const uploadResult = await updateImage(
                oldPublicId, req.file.buffer, uploadModuleThumbnail, courseName, moduleName
            );
            updateData.thumbnail = { public_id: uploadResult.public_id, secure_url: uploadResult.secure_url };
        } catch (error) {
            logger.error(`Module thumbnail update failed: ${error.message}`);
        }
    }

    const updated = await Module.findByIdAndUpdate(req.params.id, updateData, {
        new: true, runValidators: true
    });

    successResponse(res, 200, "Module updated successfully", updated);
});

// @route   DELETE /api/v1/modules/:id
// @desc    Delete a module
// @access  Private (Instructor - course owner)
export const deleteModule = asyncHandler(async (req, res) => {
    const module = await Module.findById(req.params.id);
    if (!module) return errorResponse(res, 404, "Module not found");

    const course = await Course.findById(module.course);
    if (course.instructor.toString() !== req.instructor.id) {
        return errorResponse(res, 403, "You can only delete modules in your own courses");
    }

    // Delete thumbnail
    if (module.thumbnail?.public_id) await deleteImage(module.thumbnail.public_id);

    // Delete all lessons in this module
    const lessons = await Lesson.find({ module: req.params.id });
    for (const lesson of lessons) {
        if (lesson.thumbnail?.public_id) await deleteImage(lesson.thumbnail.public_id);
    }
    await Lesson.deleteMany({ module: req.params.id });

    // Update course
    await Course.findByIdAndUpdate(module.course, {
        $pull: { modules: module._id },
        $inc: { totalModules: -1, totalLessons: -lessons.length }
    });

    await Module.findByIdAndDelete(req.params.id);

    successResponse(res, 200, "Module deleted successfully");
});

// @route   PUT /api/v1/courses/:courseId/modules/reorder
// @desc    Reorder modules
// @access  Private (Instructor - course owner)
export const reorderModules = asyncHandler(async (req, res) => {
    const { courseId } = req.params;
    const { moduleOrders } = req.body; // [{ moduleId, order }]

    const course = await Course.findById(courseId);
    if (!course) return errorResponse(res, 404, "Course not found");
    if (course.instructor.toString() !== req.instructor.id) {
        return errorResponse(res, 403, "You can only reorder modules in your own courses");
    }

    if (!moduleOrders || !Array.isArray(moduleOrders)) {
        return errorResponse(res, 400, "moduleOrders array is required");
    }

    await Module.reorderModules(courseId, moduleOrders);

    successResponse(res, 200, "Modules reordered successfully");
});
