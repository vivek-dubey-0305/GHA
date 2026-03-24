import { Course } from "../models/course.model.js";
import { Module } from "../models/module.model.js";
import { Lesson } from "../models/lesson.model.js";
import { Material } from "../models/material.model.js";
import { Assignment } from "../models/assignment.model.js";
import { Video } from "../models/video.model.js";
import { LiveClass } from "../models/liveclass.model.js";

/**
 * Ownership Service
 * Handles ownership verification for various entities
 */

/**
 * Check if instructor owns a course
 * @param {String} instructorId - Instructor ID
 * @param {String} courseId - Course ID
 * @returns {Boolean} - True if owns
 */
export const isInstructorCourseOwner = async (instructorId, courseId) => {
    const course = await Course.findById(courseId);
    return course && course.instructor.toString() === instructorId;
};

/**
 * Check if instructor owns a module
 * @param {String} instructorId - Instructor ID
 * @param {String} moduleId - Module ID
 * @returns {Boolean} - True if owns
 */
export const isInstructorModuleOwner = async (instructorId, moduleId) => {
    const module = await Module.findById(moduleId).populate('course');
    return module && module.course.instructor.toString() === instructorId;
};

/**
 * Check if instructor owns a lesson
 * @param {String} instructorId - Instructor ID
 * @param {String} lessonId - Lesson ID
 * @returns {Boolean} - True if owns
 */
export const isInstructorLessonOwner = async (instructorId, lessonId) => {
    const lesson = await Lesson.findById(lessonId).populate({
        path: 'module',
        populate: { path: 'course' }
    });
    return lesson && lesson.module.course.instructor.toString() === instructorId;
};

/**
 * Check if instructor owns a material
 * @param {String} instructorId - Instructor ID
 * @param {String} materialId - Material ID
 * @returns {Boolean} - True if owns
 */
export const isInstructorMaterialOwner = async (instructorId, materialId) => {
    const material = await Material.findById(materialId).populate('course');
    return material && material.instructor.toString() === instructorId;
};

/**
 * Check if instructor owns an assignment
 * @param {String} instructorId - Instructor ID
 * @param {String} assignmentId - Assignment ID
 * @returns {Boolean} - True if owns
 */
export const isInstructorAssignmentOwner = async (instructorId, assignmentId) => {
    const assignment = await Assignment.findById(assignmentId).populate({
        path: 'lesson',
        populate: {
            path: 'module',
            populate: { path: 'course' }
        }
    });
    return assignment && assignment.lesson.module.course.instructor.toString() === instructorId;
};

/**
 * Check if instructor owns a video
 * @param {String} instructorId - Instructor ID
 * @param {String} videoId - Video ID
 * @returns {Boolean} - True if owns
 */
export const isInstructorVideoOwner = async (instructorId, videoId) => {
    const video = await Video.findById(videoId);
    return video && video.instructor.toString() === instructorId;
};

/**
 * Check if instructor owns a live class
 * @param {String} instructorId - Instructor ID
 * @param {String} liveClassId - Live Class ID
 * @returns {Boolean} - True if owns
 */
export const isInstructorLiveClassOwner = async (instructorId, liveClassId) => {
    const liveClass = await LiveClass.findById(liveClassId);
    return liveClass && liveClass.instructor.toString() === instructorId;
};

/**
 * Generic ownership check
 * @param {String} entityType - Type of entity (course, module, lesson, etc.)
 * @param {String} entityId - Entity ID
 * @param {String} instructorId - Instructor ID
 * @returns {Boolean} - True if owns
 */
export const checkInstructorOwnership = async (entityType, entityId, instructorId) => {
    switch (entityType) {
        case 'course':
            return await isInstructorCourseOwner(instructorId, entityId);
        case 'module':
            return await isInstructorModuleOwner(instructorId, entityId);
        case 'lesson':
            return await isInstructorLessonOwner(instructorId, entityId);
        case 'material':
            return await isInstructorMaterialOwner(instructorId, entityId);
        case 'assignment':
            return await isInstructorAssignmentOwner(instructorId, entityId);
        case 'video':
            return await isInstructorVideoOwner(instructorId, entityId);
        case 'liveclass':
            return await isInstructorLiveClassOwner(instructorId, entityId);
        default:
            return false;
    }
};