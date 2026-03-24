import { Lesson } from "../models/lesson.model.js";
import { Module } from "../models/module.model.js";
import { Course } from "../models/course.model.js";
import { Assignment } from "../models/assignment.model.js";
import { Video } from "../models/video.model.js";
import { LiveClass } from "../models/liveclass.model.js";
import { Material } from "../models/material.model.js";
import { asyncHandler } from "../middlewares/async.middleware.js";
import { errorResponse, successResponse } from "../utils/response.utils.js";
import { uploadLessonThumbnail, updateImage, deleteImage, deleteRawResource } from "../services/r2.service.js";
import { deleteVideo as deleteBunnyVideo, deleteLiveStream } from "../services/bunny.service.js";
import logger from "../configs/logger.config.js";

/**
 * Lesson Controller
 * Handles lesson CRUD within modules/courses (instructor-owned)
 */

// @route   GET /api/v1/modules/:moduleId/lessons
// @desc    Get all lessons for a module
// @access  Public (published) / Private (all for owner)
export const getLessons = asyncHandler(async (req, res) => {
    const { moduleId } = req.params;
    const module = await Module.findById(moduleId).populate("course");
    if (!module) return errorResponse(res, 404, "Module not found");

    const isOwner = req.instructor && module.course.instructor.toString() === req.instructor.id;
    const filter = { module: moduleId };
    if (!isOwner && !req.admin) filter.isPublished = true;

    const lessons = await Lesson.find(filter).sort({ order: 1 });

    successResponse(res, 200, "Lessons retrieved successfully", lessons);
});

// @route   GET /api/v1/lessons/:id
// @desc    Get single lesson
// @access  Public (free) / Private (enrolled user / owner)
export const getLesson = asyncHandler(async (req, res) => {
    const lesson = await Lesson.findById(req.params.id)
        .populate("module", "title order")
        .populate("videoId")
        .populate("assignmentId")
        .populate("liveClassId")
        .populate("materialId");

    if (!lesson) return errorResponse(res, 404, "Lesson not found");

    // Increment view count
    lesson.viewCount += 1;
    await lesson.save({ validateBeforeSave: false });

    successResponse(res, 200, "Lesson retrieved successfully", lesson);
});

// @route   POST /api/v1/modules/:moduleId/lessons
// @desc    Create a lesson (with optional thumbnail via form-data)
// @access  Private (Instructor - course owner)
export const createLesson = asyncHandler(async (req, res) => {
    const { moduleId } = req.params;
    const module = await Module.findById(moduleId);
    if (!module) return errorResponse(res, 404, "Module not found");

    const course = await Course.findById(module.course);
    if (course.instructor.toString() !== req.instructor.id) {
        return errorResponse(res, 403, "You can only add lessons to your own courses");
    }

    const lessonData = req.body;
    lessonData.module = moduleId;
    lessonData.course = module.course;
    lessonData.createdBy = req.instructor.id;

    // Parse nested content from form-data
    if (typeof lessonData.content === "string") lessonData.content = JSON.parse(lessonData.content);

    // Auto-set order
    if (!lessonData.order) {
        const lastLesson = await Lesson.findOne({ module: moduleId }).sort({ order: -1 });
        lessonData.order = lastLesson ? lastLesson.order + 1 : 1;
    }

    // Handle thumbnail upload
    if (req.file) {
        const courseName = course.title.replace(/\s+/g, "_");
        const lessonName = lessonData.title.replace(/\s+/g, "_");
        try {
            const uploadResult = await uploadLessonThumbnail(req.file.buffer, courseName, lessonName);
            lessonData.thumbnail = { public_id: uploadResult.public_id, secure_url: uploadResult.secure_url };
        } catch (error) {
            logger.error(`Lesson thumbnail upload failed: ${error.message}`);
        }
    }

    const lesson = await Lesson.create(lessonData);

    // Update module and course
    await Module.findByIdAndUpdate(moduleId, {
        $push: { lessons: lesson._id },
        $inc: { totalLessons: 1, totalDuration: lesson.content?.videoDuration || 0 }
    });
    await Course.findByIdAndUpdate(module.course, {
        $inc: { totalLessons: 1, totalDuration: lesson.content?.videoDuration ? Math.ceil(lesson.content.videoDuration / 60) : 0 }
    });

    successResponse(res, 201, "Lesson created successfully", lesson);
});

// @route   PUT /api/v1/lessons/:id
// @desc    Update a lesson (with optional thumbnail via form-data)
// @access  Private (Instructor - course owner)
export const updateLesson = asyncHandler(async (req, res) => {
    const lesson = await Lesson.findById(req.params.id);
    if (!lesson) return errorResponse(res, 404, "Lesson not found");

    const course = await Course.findById(lesson.course);
    if (course.instructor.toString() !== req.instructor.id) {
        return errorResponse(res, 403, "You can only update lessons in your own courses");
    }

    const updateData = req.body;
    updateData.updatedBy = req.instructor.id;

    if (typeof updateData.content === "string") updateData.content = JSON.parse(updateData.content);

    // Handle thumbnail upload
    if (req.file) {
        const courseName = course.title.replace(/\s+/g, "_");
        const lessonName = (updateData.title || lesson.title).replace(/\s+/g, "_");
        const oldPublicId = lesson.thumbnail?.public_id || null;

        try {
            const uploadResult = await updateImage(
                oldPublicId, req.file.buffer, uploadLessonThumbnail, courseName, lessonName
            );
            updateData.thumbnail = { public_id: uploadResult.public_id, secure_url: uploadResult.secure_url };
        } catch (error) {
            logger.error(`Lesson thumbnail update failed: ${error.message}`);
        }
    }

    const updated = await Lesson.findByIdAndUpdate(req.params.id, updateData, {
        new: true, runValidators: true
    });

    successResponse(res, 200, "Lesson updated successfully", updated);
});

// @route   DELETE /api/v1/lessons/:id
// @desc    Delete a lesson
// @access  Private (Instructor - course owner)
export const deleteLesson = asyncHandler(async (req, res) => {
    const lesson = await Lesson.findById(req.params.id);
    if (!lesson) return errorResponse(res, 404, "Lesson not found");

    const course = await Course.findById(lesson.course);
    if (course.instructor.toString() !== req.instructor.id) {
        return errorResponse(res, 403, "You can only delete lessons in your own courses");
    }

    if (lesson.thumbnail?.public_id) await deleteImage(lesson.thumbnail.public_id);

    // Clean up referenced models
    if (lesson.videoId) {
        try {
            const video = await Video.findById(lesson.videoId);
            if (video) {
                // Delete video from Bunny Stream using bunnyVideoId
                if (video.bunnyVideoId) await deleteBunnyVideo(video.bunnyVideoId).catch(() => {});
                await Video.findByIdAndDelete(lesson.videoId);
            }
        } catch (e) { logger.error(`Error cleaning up Video: ${e.message}`); }
    }
    if (lesson.assignmentId) {
        try {
            const asgn = await Assignment.findById(lesson.assignmentId);
            if (asgn?.thumbnail?.public_id) await deleteImage(asgn.thumbnail.public_id);
            await Assignment.findByIdAndDelete(lesson.assignmentId);
        } catch (e) { logger.error(`Error cleaning up Assignment: ${e.message}`); }
    }
    if (lesson.liveClassId) {
        try {
            const lc = await LiveClass.findById(lesson.liveClassId);
            // Delete live stream recording from Bunny
            if (lc?.bunnyVideoId) await deleteLiveStream(lc.bunnyVideoId).catch(() => {});
            await LiveClass.findByIdAndDelete(lesson.liveClassId);
        } catch (e) { logger.error(`Error cleaning up LiveClass: ${e.message}`); }
    }
    if (lesson.materialId) {
        try {
            const mat = await Material.findById(lesson.materialId);
            if (mat?.fileUrl) await deleteRawResource(mat.fileUrl).catch(() => {});
            await Material.findByIdAndDelete(lesson.materialId);
        } catch (e) { logger.error(`Error cleaning up Material: ${e.message}`); }
    }

    // Update module and course
    await Module.findByIdAndUpdate(lesson.module, {
        $pull: { lessons: lesson._id },
        $inc: { totalLessons: -1, totalDuration: -(lesson.content?.videoDuration || 0) }
    });
    await Course.findByIdAndUpdate(lesson.course, {
        $inc: { totalLessons: -1, totalDuration: lesson.content?.videoDuration ? -Math.ceil(lesson.content.videoDuration / 60) : 0 }
    });

    await Lesson.findByIdAndDelete(req.params.id);

    successResponse(res, 200, "Lesson deleted successfully");
});

// @route   PUT /api/v1/modules/:moduleId/lessons/reorder
// @desc    Reorder lessons within module
// @access  Private (Instructor - course owner)
export const reorderLessons = asyncHandler(async (req, res) => {
    const { moduleId } = req.params;
    const { lessonOrders } = req.body;

    const module = await Module.findById(moduleId);
    if (!module) return errorResponse(res, 404, "Module not found");

    const course = await Course.findById(module.course);
    if (course.instructor.toString() !== req.instructor.id) {
        return errorResponse(res, 403, "You can only reorder lessons in your own courses");
    }

    if (!lessonOrders || !Array.isArray(lessonOrders)) {
        return errorResponse(res, 400, "lessonOrders array is required");
    }

    await Lesson.reorderLessons(moduleId, lessonOrders);

    successResponse(res, 200, "Lessons reordered successfully");
});
