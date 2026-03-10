import { User } from "../models/user.model.js";
import mongoose from "mongoose";
import { Course } from "../models/course.model.js";
import { Instructor } from "../models/instructor.model.js";
import { Enrollment } from "../models/enrollment.model.js";
import { Module } from "../models/module.model.js";
import { Lesson } from "../models/lesson.model.js";
import { Payment } from "../models/payment.model.js";
import { Review } from "../models/review.model.js";
import { Assignment } from "../models/assignment.model.js";
import { Submission } from "../models/submission.model.js";
import { Certificate } from "../models/certificate.model.js";
import { LiveClass } from "../models/liveclass.model.js";
import { VideoPackage } from "../models/videopackage.model.js";
import { Material } from "../models/material.model.js";
import { Progress } from "../models/progress.model.js";
import { asyncHandler } from "../middlewares/async.middleware.js";
import { errorResponse, successResponse } from "../utils/response.utils.js";
import { getPagination, createPaginationResponse } from "../utils/pagination.utils.js";
import {
    updateImage,
    uploadProfilePicture,
    uploadCourseThumbnail,
    uploadModuleThumbnail,
    uploadLessonThumbnail,
    uploadAssignmentThumbnail,
    uploadMaterialFile,
    uploadCertificateImage,
    uploadAssignmentFile,
    deleteImage,
    deleteRawResource,
} from "../services/r2.service.js";
import {
    uploadVideoPackageVideo, uploadCourseTrailer, uploadLessonVideo,
    deleteVideo as deleteBunnyVideo, getVideoThumbnail,
    createLiveStream, deleteLiveStream
} from "../services/bunny.service.js";
import bcrypt from "bcrypt";
import logger from "../configs/logger.config.js";
import { getAllDocuments, getDocumentById, createDocument, updateDocument, deleteDocument } from "../services/crud.service.js";
import { generateCrudHandlers } from "../services/admin.crud.service.js";

/**
 * Admin Controller - Full CRUD Operations for ALL Models
 * Superadmin can edit, delete, read, update each and every field
 * including createdAt, updatedAt, images, histories, etc.
 */

// ========================= USER CRUD =========================

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

        if (!user.profilePicture || !user.profilePicture.public_id) {
            logger.warn(`Profile picture delete failed - No profile picture found for user: ${id}`);
            return errorResponse(res, 400, "User has no profile picture");
        }

        // Get public ID
        const publicId = user.profilePicture.public_id;

        logger.info(`Deleting profile picture: ${publicId} for user: ${id}`);

        // Delete from R2
        const deleteResult = await deleteImage(publicId);

        if (deleteResult.result === 'ok') {
            // Update user profile picture to null
            user.profilePicture = null;
            await user.save({ validateBeforeSave: false });

            logger.info(`Profile picture deleted successfully for user: ${id}`);

            return successResponse(res, 200, "Profile picture deleted successfully");
        } else {
            logger.warn(`Failed to delete profile picture from R2 for user: ${id}`);
            return errorResponse(res, 500, "Failed to delete profile picture from storage");
        }
    } catch (error) {
        logger.error(`Profile picture delete error for user ${id}: ${error.message}`);
        return errorResponse(res, 500, "Failed to delete profile picture. Please try again.");
    }
});

// Use generateCrudHandlers for user CRUD
const userCrud = generateCrudHandlers(User, {
    uploadFunction: uploadProfilePicture,
    updateImageFunction: updateImage,
    deleteImageFunction: deleteImage,
    entityType: "User",
    // populateOptions: ["enrollments", "certificates", "reviews"]
});

export const getAllUsers = userCrud.getAll;
export const getUserById = userCrud.getById;
export const createUser = userCrud.create;
export const updateUser = userCrud.update;
export const deleteUser = userCrud.delete;

// ========================
// INSTRUCTOR CRUD OPERATIONS
// ========================

// ========================= USER CRUD =========================

// ... existing user CRUD functions ...

// ========================= INSTRUCTOR CRUD =========================

const instructorCrud = generateCrudHandlers(Instructor, {
    uploadFunction: uploadProfilePicture,
    updateImageFunction: updateImage,
    deleteImageFunction: deleteImage,
    entityType: "Instructor",
    populateOptions: ["courses", "liveClasses", "videoPackages"]
});

export const getAllInstructors = instructorCrud.getAll;
export const getInstructorById = instructorCrud.getById;
export const createInstructor = instructorCrud.create;
export const updateInstructor = instructorCrud.update;
export const deleteInstructor = instructorCrud.delete;

// @route   DELETE /api/v1/admin/instructors/:id/profile-picture
// @desc    Delete profile picture for an instructor
// @access  Private (Admin)
export const deleteInstructorProfilePicture = asyncHandler(async (req, res) => {
    const { id } = req.params;

    logger.info(`Admin deleting profile picture for instructor: ${id}`);

    try {
        const instructor = await Instructor.findById(id);

        if (!instructor) {
            logger.warn(`Profile picture delete failed - Instructor not found: ${id}`);
            return errorResponse(res, 404, "Instructor not found");
        }

        if (!instructor.profilePicture || !instructor.profilePicture.public_id) {
            logger.warn(`Profile picture delete failed - No profile picture found for instructor: ${id}`);
            return errorResponse(res, 400, "Instructor has no profile picture");
        }

        // Get public ID
        const publicId = instructor.profilePicture.public_id;

        logger.info(`Deleting profile picture: ${publicId} for instructor: ${id}`);

        // Delete from R2
        const deleteResult = await deleteImage(publicId);

        if (deleteResult.result === 'ok') {
            // Update instructor profile picture to null
            instructor.profilePicture = null;
            await instructor.save({ validateBeforeSave: false });

            logger.info(`Profile picture deleted successfully for instructor: ${id}`);

            return successResponse(res, 200, "Profile picture deleted successfully");
        } else {
            logger.warn(`Failed to delete profile picture from R2 for instructor: ${id}`);
            return errorResponse(res, 500, "Failed to delete profile picture from storage");
        }
    } catch (error) {
        logger.error(`Profile picture delete error for instructor ${id}: ${error.message}`);
        return errorResponse(res, 500, "Failed to delete profile picture. Please try again.");
    }
});

// ========================
// COURSE CRUD OPERATIONS
// ========================

// @route   GET /api/v1/admin/courses
// @access  Private (Admin)
export const getAllCourses = asyncHandler(async (req, res) => {
    const { page, limit, skip } = getPagination(req.query, 10);
    const filter = {};

    if (req.query.status) filter.status = req.query.status;
    if (req.query.category) filter.category = req.query.category;
    if (req.query.instructorId) filter.instructor = req.query.instructorId;
    if (req.query.search) {
        filter.$or = [
            { title: { $regex: req.query.search, $options: "i" } },
            { description: { $regex: req.query.search, $options: "i" } }
        ];
    }

    const total = await Course.countDocuments(filter);
    const courses = await Course.find(filter)
        .populate("instructor", "firstName lastName email")
        .skip(skip).limit(limit).sort({ createdAt: -1 });

    successResponse(res, 200, "Courses retrieved successfully", {
        courses, pagination: createPaginationResponse(total, page, limit)
    });
});

// @route   GET /api/v1/admin/courses/:id
// @access  Private (Admin)
export const getCourseById = asyncHandler(async (req, res) => {
    const course = await Course.findById(req.params.id)
        .populate("instructor", "firstName lastName email")
        .populate("modules");
    if (!course) return errorResponse(res, 404, "Course not found");
    successResponse(res, 200, "Course retrieved successfully", course);
});

// @route   POST /api/v1/admin/courses
// @access  Private (Admin)
export const createCourse = asyncHandler(async (req, res) => {
    const courseData = req.file ? JSON.parse(req.body.data || "{}") : req.body;

    if (req.file) {
        try {
            const result = await uploadCourseThumbnail(req.file.buffer, courseData.title || "course");
            courseData.thumbnail = { public_id: result.public_id, secure_url: result.secure_url };
        } catch (error) {
            logger.error(`Course thumbnail upload failed: ${error.message}`);
        }
    }

    const course = await Course.create(courseData);
    successResponse(res, 201, "Course created successfully", course);
});

// @route   PUT /api/v1/admin/courses/:id
// @access  Private (Admin) - Can update ANY field
export const updateCourse = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const updateData = req.file ? JSON.parse(req.body.data || "{}") : req.body;

    if (req.file) {
        const course = await Course.findById(id);
        if (!course) return errorResponse(res, 404, "Course not found");
        const oldPublicId = course.thumbnail?.public_id || null;
        try {
            const result = await updateImage(oldPublicId, req.file.buffer, uploadCourseThumbnail, updateData.title || course.title);
            updateData.thumbnail = { public_id: result.public_id, secure_url: result.secure_url };
        } catch (error) {
            logger.error(`Course thumbnail update failed: ${error.message}`);
        }
    }

    const course = await Course.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
    if (!course) return errorResponse(res, 404, "Course not found");
    successResponse(res, 200, "Course updated successfully", course);
});

// @route   DELETE /api/v1/admin/courses/:id
// @access  Private (Admin)
export const deleteCourse = asyncHandler(async (req, res) => {
    const course = await Course.findById(req.params.id);
    if (!course) return errorResponse(res, 404, "Course not found");

    // Delete thumbnail from R2 if exists
    if (course.thumbnail?.public_id) {
        await deleteImage(course.thumbnail.public_id).catch(err => logger.error(`Failed to delete course thumbnail: ${err.message}`));
    }
// 
    // Cascade delete modules and lessons
    const modules = await Module.find({ course: req.params.id });
    for (const mod of modules) {
        await Lesson.deleteMany({ module: mod._id });
    }
    await Module.deleteMany({ course: req.params.id });
    await Enrollment.deleteMany({ course: req.params.id });

    await Course.findByIdAndDelete(req.params.id);
    successResponse(res, 200, "Course and related data deleted successfully");
});

// ===================== FULL COURSE MANAGEMENT (GET, UPDATE, DELETE) =====================

// @route   GET /api/v1/admin/courses/:id/full
// @desc    Get complete course structure with all modules, lessons, materials, certificates (hierarchical display)
// @access  Private (Admin)
export const getFullCourse = asyncHandler(async (req, res) => {
    const courseId = req.params.id;

    // Get course with basic info
    const course = await Course.findById(courseId)
        .populate("instructor", "firstName lastName email specialization")
        .populate("certificates");

    if (!course) return errorResponse(res, 404, "Course not found");

    // Get all modules for this course
    const modules = await Module.find({ course: courseId })
        .populate("createdBy", "firstName lastName email")
        .populate("updatedBy", "firstName lastName email")
        .sort({ order: 1 });

    // Build hierarchical structure
    const courseStructure = {
        course: course.toObject(),
        modules: []
    };

    for (const module of modules) {
        const moduleObj = module.toObject();
        moduleObj.lessons = [];

        // Get all lessons for this module
        const lessons = await Lesson.find({ module: module._id })
            .populate("createdBy", "firstName lastName email")
            .sort({ order: 1 });

        for (const lesson of lessons) {
            const lessonObj = lesson.toObject();
            lessonObj.details = {};

            // Get type-specific content based on lesson type
            if (lesson.type === "video" && lesson.videoPackageId) {
                const vp = await VideoPackage.findById(lesson.videoPackageId);
                if (vp) lessonObj.details.videoPackage = vp.toObject();
            } else if (lesson.type === "assignment" && lesson.assignmentId) {
                const asg = await Assignment.findById(lesson.assignmentId);
                if (asg) lessonObj.details.assignment = asg.toObject();
            } else if (lesson.type === "live" && lesson.liveClassId) {
                const live = await LiveClass.findById(lesson.liveClassId);
                if (live) lessonObj.details.liveClass = live.toObject();
            } else if (lesson.type === "material" && lesson.materialId) {
                const mat = await Material.findById(lesson.materialId);
                if (mat) lessonObj.details.material = mat.toObject();
            }

            // Get all materials related to this lesson
            const materials = await Material.find({ lesson: lesson._id }).lean();
            lessonObj.materials = materials;

            moduleObj.lessons.push(lessonObj);
        }

        courseStructure.modules.push(moduleObj);
    }

    successResponse(res, 200, "Full course structure retrieved successfully", courseStructure);
});

// @route   PUT /api/v1/admin/courses/:id/full
// @desc    Update complete course structure (course, modules, lessons with proper image/video handling)
// @access  Private (Admin)
export const updateFullCourse = asyncHandler(async (req, res) => {
    const courseId = req.params.id;
    let updateData;
    try {
        updateData = typeof req.body.data === "string" ? JSON.parse(req.body.data) : (req.body.data || req.body);
    } catch (e) {
        return errorResponse(res, 400, "Invalid JSON payload in 'data' field");
    }

    logger.info(`[Admin] Updating full course structure: ${courseId}`);

    // Verify course exists
    const course = await Course.findById(courseId);
    if (!course) return errorResponse(res, 404, "Course not found");

    // ========== UPDATE COURSE-LEVEL DATA ==========
    if (updateData.course) {
        const courseUpdate = updateData.course;

        // Handle course thumbnail update (delete old, upload new)
        const courseThumbnailFile = req.files?.find(f => f.fieldname === "course.thumbnail");
        if (courseThumbnailFile) {
            const oldPublicId = course.thumbnail?.public_id || null;
            try {
                const result = await updateImage(
                    oldPublicId,
                    courseThumbnailFile.buffer,
                    uploadCourseThumbnail,
                    courseUpdate.title || course.title
                );
                courseUpdate.thumbnail = {
                    public_id: result.public_id,
                    secure_url: result.secure_url
                };
            } catch (error) {
                logger.error(`Course thumbnail update failed: ${error.message}`);
                return errorResponse(res, 500, "Course thumbnail upload failed");
            }
        }

        // Handle course trailer video (delete old from Bunny, upload new)
        const courseTrailerFile = req.files?.find(f => f.fieldname === "course.trailerVideo");
        if (courseTrailerFile) {
            const oldTrailer = course.trailerVideo;
            try {
                if (oldTrailer) {
                    // Extract Bunny video ID from URL if needed and delete
                    await deleteBunnyVideo(oldTrailer).catch(err => 
                        logger.warn(`Old trailer delete failed: ${err.message}`)
                    );
                }
                const result = await uploadCourseTrailer(
                    courseTrailerFile.buffer,
                    course.title || "course"
                );
                courseUpdate.trailerVideo = result.secure_url;
            } catch (error) {
                logger.error(`Course trailer update failed: ${error.message}`);
                return errorResponse(res, 500, "Course trailer upload failed");
            }
        }

        // Remove restricted fields that admin shouldn't directly update
        const restrictedFields = ["modules", "totalModules", "totalLessons", "totalDuration", "certificates"];
        restrictedFields.forEach(field => delete courseUpdate[field]);

        // Update course
        Object.assign(course, courseUpdate);
        await course.save({ validateBeforeSave: false });
    }

    const errors = [];

    // ========== UPDATE MODULES & LESSONS ==========
    if (updateData.modules && Array.isArray(updateData.modules)) {
        for (let mIdx = 0; mIdx < updateData.modules.length; mIdx++) {
            const moduleData = updateData.modules[mIdx];
            if (!moduleData.id) continue;

            const module = await Module.findById(moduleData.id);
            if (!module) {
                errors.push(`Module ${moduleData.id} not found`);
                continue;
            }

            // Handle module thumbnail update
            const modThumbFile = req.files?.find(f => f.fieldname === `module.${mIdx}.thumbnail`);
            if (modThumbFile) {
                const oldPublicId = module.thumbnail?.public_id || null;
                try {
                    const result = await updateImage(
                        oldPublicId,
                        modThumbFile.buffer,
                        uploadModuleThumbnail,
                        course.title,
                        moduleData.title || module.title
                    );
                    module.thumbnail = {
                        public_id: result.public_id,
                        secure_url: result.secure_url
                    };
                } catch (error) {
                    logger.error(`Module thumbnail update failed: ${error.message}`);
                    errors.push(`Module thumbnail: ${error.message}`);
                }
            }

            // Update module basic fields
            if (moduleData.title) module.title = moduleData.title;
            if (moduleData.description !== undefined) module.description = moduleData.description;
            if (moduleData.order) module.order = moduleData.order;
            if (moduleData.objectives) module.objectives = moduleData.objectives;
            if (moduleData.isPublished !== undefined) module.isPublished = moduleData.isPublished;

            await module.save({ validateBeforeSave: false });

            // ========== UPDATE LESSONS ==========
            if (moduleData.lessons && Array.isArray(moduleData.lessons)) {
                for (let lIdx = 0; lIdx < moduleData.lessons.length; lIdx++) {
                    const lessonData = moduleData.lessons[lIdx];
                    if (!lessonData.id) continue;

                    const lesson = await Lesson.findById(lessonData.id);
                    if (!lesson) {
                        errors.push(`Lesson ${lessonData.id} not found`);
                        continue;
                    }

                    // Handle lesson thumbnail update
                    const lessonThumbFile = req.files?.find(f => f.fieldname === `lesson.${mIdx}.${lIdx}.thumbnail`);
                    if (lessonThumbFile) {
                        const oldPublicId = lesson.thumbnail?.public_id || null;
                        try {
                            const result = await updateImage(
                                oldPublicId,
                                lessonThumbFile.buffer,
                                uploadLessonThumbnail,
                                course.title,
                                moduleData.title || module.title,
                                lessonData.title || lesson.title
                            );
                            lesson.thumbnail = {
                                public_id: result.public_id,
                                secure_url: result.secure_url
                            };
                        } catch (error) {
                            logger.error(`Lesson thumbnail update failed: ${error.message}`);
                            errors.push(`Lesson thumbnail: ${error.message}`);
                        }
                    }

                    // Update lesson basic fields
                    if (lessonData.title) lesson.title = lessonData.title;
                    if (lessonData.description !== undefined) lesson.description = lessonData.description;
                    if (lessonData.order) lesson.order = lessonData.order;
                    if (lessonData.isFree !== undefined) lesson.isFree = lessonData.isFree;

                    await lesson.save({ validateBeforeSave: false });

                    // ========== UPDATE VIDEO PACKAGE (if type is video) ==========
                    if (lessonData.type === "video" && lessonData.videoPackage && lesson.videoPackageId) {
                        const vp = await VideoPackage.findById(lesson.videoPackageId);
                        if (vp) {
                            // Update package-level fields
                            if (lessonData.videoPackage.packageName) vp.packageName = lessonData.videoPackage.packageName;
                            if (lessonData.videoPackage.description !== undefined) vp.description = lessonData.videoPackage.description;

                            // Handle individual video updates
                            if (lessonData.videoPackage.videos && Array.isArray(lessonData.videoPackage.videos)) {
                                for (let vIdx = 0; vIdx < lessonData.videoPackage.videos.length; vIdx++) {
                                    const videoData = lessonData.videoPackage.videos[vIdx];
                                    const vpVideoIndex = vp.videos.findIndex(v => 
                                        v._id?.toString() === videoData.id || v.videoId?.toString() === videoData.id
                                    );

                                    if (vpVideoIndex >= 0) {
                                        const vpVideo = vp.videos[vpVideoIndex];

                                        // Update basic video fields
                                        if (videoData.title) vpVideo.title = videoData.title;
                                        if (videoData.description !== undefined) vpVideo.description = videoData.description;

                                        // Handle video file update (delete old from Bunny, upload new)
                                        const videoFile = req.files?.find(f => f.fieldname === `video.${mIdx}.${lIdx}.${vIdx}`);
                                        if (videoFile) {
                                            if (vpVideo.bunnyVideoId) {
                                                try {
                                                    await deleteBunnyVideo(vpVideo.bunnyVideoId).catch(err =>
                                                        logger.warn(`Old video delete failed: ${err.message}`)
                                                    );
                                                } catch (err) {
                                                    logger.error(`Bunny video deletion error: ${err.message}`);
                                                }
                                            }

                                            try {
                                                const result = await uploadVideoPackageVideo(
                                                    videoFile.buffer,
                                                    course.title,
                                                    moduleData.title || module.title,
                                                    lessonData.title || lesson.title,
                                                    videoData.title || `video_${vIdx}`
                                                );
                                                vpVideo.bunnyVideoId = result.bunnyVideoId || result.public_id;
                                                vpVideo.url = result.secure_url;
                                                vpVideo.duration = result.duration || vpVideo.duration || 0;
                                                vpVideo.fileSize = result.bytes || 0;
                                                vpVideo.status = result.status || "processing";
                                                vpVideo.thumbnail = result.thumbnail || getVideoThumbnail(result.bunnyVideoId || result.public_id);
                                            } catch (error) {
                                                logger.error(`Video upload failed: ${error.message}`);
                                                errors.push(`Video upload: ${error.message}`);
                                            }
                                        }

                                        // Handle custom video thumbnail update
                                        const videoThumbFile = req.files?.find(f => f.fieldname === `video.${mIdx}.${lIdx}.${vIdx}.thumb`);
                                        if (videoThumbFile) {
                                            try {
                                                const result = await uploadLessonThumbnail(
                                                    videoThumbFile.buffer,
                                                    course.title,
                                                    moduleData.title || module.title,
                                                    lessonData.title || lesson.title
                                                );
                                                vpVideo.thumbnail = result.secure_url;
                                            } catch (error) {
                                                logger.error(`Video thumbnail update failed: ${error.message}`);
                                                errors.push(`Video thumbnail: ${error.message}`);
                                            }
                                        }
                                    }
                                }
                            }

                            await vp.save({ validateBeforeSave: false });
                        }
                    }

                    // ========== UPDATE MATERIALS ==========
                    if (lessonData.materials && Array.isArray(lessonData.materials)) {
                        for (let matIdx = 0; matIdx < lessonData.materials.length; matIdx++) {
                            const materialData = lessonData.materials[matIdx];
                            if (!materialData.id) continue;

                            const material = await Material.findById(materialData.id);
                            if (!material) {
                                errors.push(`Material ${materialData.id} not found`);
                                continue;
                            }

                            // Update material fields
                            if (materialData.title) material.title = materialData.title;
                            if (materialData.description !== undefined) material.description = materialData.description;
                            if (materialData.type) material.type = materialData.type;

                            // Handle material file update (delete old, upload new)
                            const matFile = req.files?.find(f => f.fieldname === `material.${mIdx}.${lIdx}.${matIdx}`);
                            if (matFile) {
                                if (material.fileUrl && material.fileUrl.includes("r2")) {
                                    try {
                                        await deleteRawResource(material.fileUrl).catch(err =>
                                            logger.warn(`Old material delete failed: ${err.message}`)
                                        );
                                    } catch (err) {
                                        logger.error(`Material deletion error: ${err.message}`);
                                    }
                                }

                                try {
                                    const result = await uploadMaterialFile(
                                        matFile.buffer,
                                        course.title,
                                        moduleData.title || module.title,
                                        materialData.title || material.title
                                    );
                                    material.fileUrl = result.secure_url;
                                    material.fileName = matFile.originalname;
                                    material.fileSize = matFile.size;
                                    material.mimeType = matFile.mimetype;
                                } catch (error) {
                                    logger.error(`Material file upload failed: ${error.message}`);
                                    errors.push(`Material file: ${error.message}`);
                                }
                            }

                            await material.save({ validateBeforeSave: false });
                        }
                    }
                }
            }
        }
    }

    // ========== UPDATE CERTIFICATES ==========
    if (updateData.certificates && Array.isArray(updateData.certificates)) {
        for (let certIdx = 0; certIdx < updateData.certificates.length; certIdx++) {
            const certData = updateData.certificates[certIdx];
            if (!certData.id) continue;

            const cert = await Certificate.findById(certData.id);
            if (!cert) {
                errors.push(`Certificate ${certData.id} not found`);
                continue;
            }

            // Update certificate fields
            if (certData.title) cert.title = certData.title;
            if (certData.expiryDate !== undefined) cert.expiryDate = certData.expiryDate;
            if (certData.skills) cert.skills = certData.skills;

            // Handle certificate image update
            const certFile = req.files?.find(f => f.fieldname === `certificate.${certIdx}`);
            if (certFile) {
                if (cert.certificateUrl && cert.certificateUrl.includes("r2")) {
                    try {
                        await deleteRawResource(cert.certificateUrl).catch(err =>
                            logger.warn(`Old certificate delete failed: ${err.message}`)
                        );
                    } catch (err) {
                        logger.error(`Certificate deletion error: ${err.message}`);
                    }
                }

                try {
                    const result = await uploadCertificateImage(
                        certFile.buffer,
                        course.title
                    );
                    cert.certificateUrl = result.secure_url;
                } catch (error) {
                    logger.error(`Certificate image upload failed: ${error.message}`);
                    errors.push(`Certificate image: ${error.message}`);
                }
            }

            await cert.save({ validateBeforeSave: false });
        }
    }

    // Final response
    const updatedCourse = await Course.findById(courseId);
    successResponse(res, 200, "Course structure updated successfully", {
        course: updatedCourse,
        errors: errors.length > 0 ? errors : undefined
    });
});

// @route   DELETE /api/v1/admin/courses/:id/full
// @desc    Delete complete course with all modules, lessons, materials, certificates, and media assets
// @access  Private (Admin)
export const deleteFullCourse = asyncHandler(async (req, res) => {
    const courseId = req.params.id;
    logger.info(`[Admin] Deleting full course and all assets: ${courseId}`);

    const course = await Course.findById(courseId);
    if (!course) return errorResponse(res, 404, "Course not found");

    const errors = [];

    // Delete course-level assets from R2 & Bunny
    if (course.thumbnail?.public_id) {
        try {
            await deleteImage(course.thumbnail.public_id);
        } catch (err) {
            logger.error(`Failed to delete course thumbnail: ${err.message}`);
            errors.push(`Thumbnail deletion: ${err.message}`);
        }
    }

    if (course.trailerVideo) {
        try {
            await deleteBunnyVideo(course.trailerVideo);
        } catch (err) {
            logger.error(`Failed to delete course trailer: ${err.message}`);
            errors.push(`Trailer deletion: ${err.message}`);
        }
    }

    // Delete all certificates and their assets
    if (course.certificates && course.certificates.length > 0) {
        for (const certId of course.certificates) {
            try {
                const cert = await Certificate.findById(certId);
                if (cert && cert.certificateUrl) {
                    await deleteRawResource(cert.certificateUrl).catch(err =>
                        logger.warn(`Certificate asset delete failed: ${err.message}`)
                    );
                }
                await Certificate.findByIdAndDelete(certId);
            } catch (err) {
                logger.error(`Certificate deletion error: ${err.message}`);
                errors.push(`Certificate: ${err.message}`);
            }
        }
    }

    // Get all modules for this course
    const modules = await Module.find({ course: courseId });

    for (const module of modules) {
        // Delete module thumbnail
        if (module.thumbnail?.public_id) {
            try {
                await deleteImage(module.thumbnail.public_id);
            } catch (err) {
                logger.error(`Failed to delete module thumbnail: ${err.message}`);
                errors.push(`Module thumbnail: ${err.message}`);
            }
        }

        // Get all lessons for this module
        const lessons = await Lesson.find({ module: module._id });

        for (const lesson of lessons) {
            // Delete lesson thumbnail
            if (lesson.thumbnail?.public_id) {
                try {
                    await deleteImage(lesson.thumbnail.public_id);
                } catch (err) {
                    logger.error(`Failed to delete lesson thumbnail: ${err.message}`);
                    errors.push(`Lesson thumbnail: ${err.message}`);
                }
            }

            // Delete video package and Bunny videos
            if (lesson.videoPackageId) {
                try {
                    const vp = await VideoPackage.findById(lesson.videoPackageId);
                    if (vp && vp.videos && vp.videos.length > 0) {
                        for (const video of vp.videos) {
                            if (video.bunnyVideoId) {
                                try {
                                    await deleteBunnyVideo(video.bunnyVideoId);
                                } catch (err) {
                                    logger.warn(`Bunny video delete failed: ${err.message}`);
                                }
                            }
                        }
                    }
                    await VideoPackage.findByIdAndDelete(lesson.videoPackageId);
                } catch (err) {
                    logger.error(`VideoPackage deletion error: ${err.message}`);
                    errors.push(`VideoPackage: ${err.message}`);
                }
            }

            // Delete assignment
            if (lesson.assignmentId) {
                try {
                    const asg = await Assignment.findById(lesson.assignmentId);
                    if (asg) {
                        // Delete assignment attachments from R2
                        if (asg.attachments && asg.attachments.length > 0) {
                            for (const att of asg.attachments) {
                                try {
                                    await deleteRawResource(att.url || att);
                                } catch (err) {
                                    logger.warn(`Attachment delete failed: ${err.message}`);
                                }
                            }
                        }
                    }
                    await Assignment.findByIdAndDelete(lesson.assignmentId);
                } catch (err) {
                    logger.error(`Assignment deletion error: ${err.message}`);
                    errors.push(`Assignment: ${err.message}`);
                }
            }

            // Delete live class stream
            if (lesson.liveClassId) {
                try {
                    const live = await LiveClass.findById(lesson.liveClassId);
                    if (live && live.streamId) {
                        try {
                            await deleteLiveStream(live.streamId);
                        } catch (err) {
                            logger.warn(`Stream deletion failed: ${err.message}`);
                        }
                    }
                    await LiveClass.findByIdAndDelete(lesson.liveClassId);
                } catch (err) {
                    logger.error(`LiveClass deletion error: ${err.message}`);
                    errors.push(`LiveClass: ${err.message}`);
                }
            }

            // Delete materials and their files
            if (lesson.materialId) {
                try {
                    const mat = await Material.findById(lesson.materialId);
                    if (mat && mat.fileUrl) {
                        try {
                            await deleteRawResource(mat.fileUrl);
                        } catch (err) {
                            logger.warn(`Material file delete failed: ${err.message}`);
                        }
                    }
                    await Material.findByIdAndDelete(lesson.materialId);
                } catch (err) {
                    logger.error(`Material deletion error: ${err.message}`);
                    errors.push(`Material: ${err.message}`);
                }
            }

            // Delete all related materials for this lesson
            try {
                const relatedMaterials = await Material.find({ lesson: lesson._id });
                for (const mat of relatedMaterials) {
                    if (mat.fileUrl) {
                        try {
                            await deleteRawResource(mat.fileUrl);
                        } catch (err) {
                            logger.warn(`Related material file delete failed: ${err.message}`);
                        }
                    }
                }
                await Material.deleteMany({ lesson: lesson._id });
            } catch (err) {
                logger.error(`Related materials deletion error: ${err.message}`);
                errors.push(`Related materials: ${err.message}`);
            }

            // Delete submissions related to this lesson
            try {
                await Submission.deleteMany({ lesson: lesson._id });
            } catch (err) {
                logger.error(`Submissions deletion error: ${err.message}`);
                errors.push(`Submissions: ${err.message}`);
            }

            // Delete progress records
            try {
                await Progress.deleteMany({ lesson: lesson._id });
            } catch (err) {
                logger.error(`Progress deletion error: ${err.message}`);
                errors.push(`Progress: ${err.message}`);
            }
        }

        // Delete all lessons in this module
        await Lesson.deleteMany({ module: module._id });
    }

    // Delete all modules
    await Module.deleteMany({ course: courseId });

    // Delete enrollments
    try {
        await Enrollment.deleteMany({ course: courseId });
    } catch (err) {
        logger.error(`Enrollments deletion error: ${err.message}`);
        errors.push(`Enrollments: ${err.message}`);
    }

    // Delete reviews
    try {
        await Review.deleteMany({ course: courseId });
    } catch (err) {
        logger.error(`Reviews deletion error: ${err.message}`);
        errors.push(`Reviews: ${err.message}`);
    }

    // Delete the course itself
    await Course.findByIdAndDelete(courseId);

    successResponse(res, 200, "Course and all related data deleted successfully", {
        deletedCourseId: courseId,
        errors: errors.length > 0 ? errors : undefined
    });
});

// @route   POST /api/v1/admin/courses/full
// @desc    Create a full course with modules, lessons, and linked models in one flow
// @access  Private (Admin)
export const createFullCourse = asyncHandler(async (req, res) => {
    let data;
    try {
        data = typeof req.body.data === "string" ? JSON.parse(req.body.data) : req.body.data || req.body;
    } catch (e) {
        return errorResponse(res, 400, "Invalid JSON payload in 'data' field");
    }

    const instructorId = data.instructor;
    if (!instructorId) return errorResponse(res, 400, "Instructor is required");

    const instructor = await Instructor.findById(instructorId);
    if (!instructor) return errorResponse(res, 404, "Instructor not found");

    const courseName = (data.title || "untitled").replace(/\s+/g, "_");

    // ── 1. COURSE THUMBNAIL ──
    let thumbnail = null;
    const thumbFile = req.files?.find(f => f.fieldname === "thumbnail");
    if (thumbFile) {
        try {
            const result = await uploadCourseThumbnail(thumbFile.buffer, courseName);
            thumbnail = { public_id: result.public_id, secure_url: result.secure_url };
        } catch (e) {
            logger.error(`Course thumbnail upload failed: ${e.message}`);
            return errorResponse(res, 400, "Course thumbnail upload failed");
        }
    }

    // ── 2. TRAILER VIDEO ──
    let trailerVideo = data.trailerVideo || undefined;
    const trailerFile = req.files?.find(f => f.fieldname === "trailerVideo");
    if (trailerFile) {
        try {
            const result = await uploadCourseTrailer(trailerFile.buffer, courseName);
            trailerVideo = result.secure_url;
        } catch (e) {
            logger.error(`Course trailer upload failed: ${e.message}`);
        }
    }

    // ── 3. CHECK IF COURSE ALREADY EXISTS (idempotent re-publish) ──
    let course = await Course.findOne({ title: data.title }).populate("modules");
    let isResuming = false;
    const existingModuleMap = new Map(); // title → module doc
    const existingLessonMap = new Map(); // "moduleTitle::lessonTitle" → lesson doc

    // Thumbnail is required only for new courses (existing course already has one)
    if (!course && !thumbnail && !data.thumbnail) return errorResponse(res, 400, "Course thumbnail is required");

    if (course) {
        isResuming = true;
        logger.info(`Course "${data.title}" already exists (id: ${course._id}), resuming creation for missing parts`);

        // Update course fields that may have changed
        Object.assign(course, {
            description: data.description || course.description,
            shortDescription: data.shortDescription || course.shortDescription,
            category: data.category || course.category,
            level: data.level || course.level,
            language: data.language || course.language,
            price: Number(data.price) ?? course.price,
            currency: data.currency || course.currency,
            discountPrice: data.discountPrice ? Number(data.discountPrice) : course.discountPrice,
            discountValidUntil: data.discountValidUntil || course.discountValidUntil,
            isFree: data.isFree ?? course.isFree,
            status: data.status || course.status,
            certificateEnabled: data.certificateEnabled ?? course.certificateEnabled,
            allowPreview: data.allowPreview ?? course.allowPreview,
            maxStudents: data.maxStudents ? Number(data.maxStudents) : course.maxStudents,
            learningOutcomes: data.learningOutcomes || course.learningOutcomes,
            prerequisites: data.prerequisites || course.prerequisites,
            targetAudience: data.targetAudience || course.targetAudience,
            tags: data.tags || course.tags,
            seoTitle: data.seoTitle || course.seoTitle,
            seoDescription: data.seoDescription || course.seoDescription,
        });
        if (thumbnail) course.thumbnail = thumbnail;
        if (trailerVideo) course.trailerVideo = trailerVideo;
        await course.save({ validateBeforeSave: false });

        // Build maps of existing modules & lessons so we skip them
        const existingModules = await Module.find({ course: course._id });
        for (const mod of existingModules) {
            existingModuleMap.set(mod.title, mod);
            const existingLessons = await Lesson.find({ module: mod._id });
            for (const les of existingLessons) {
                existingLessonMap.set(`${mod.title}::${les.title}`, les);
            }
        }
    }
    // ── 4. CREATE COURSE (only if it doesn't already exist) ──
    if (!course) {
        const courseData = {
            title: data.title,
            description: data.description,
            shortDescription: data.shortDescription,
            instructor: instructorId,
            category: data.category,
            level: data.level,
            language: data.language || "English",
            price: Number(data.price) || 0,
            currency: data.currency || "USD",
            discountPrice: data.discountPrice ? Number(data.discountPrice) : undefined,
            discountValidUntil: data.discountValidUntil || undefined,
            isFree: data.isFree || false,
            status: data.status || "draft",
            certificateEnabled: data.certificateEnabled ?? true,
            allowPreview: data.allowPreview ?? true,
            maxStudents: data.maxStudents ? Number(data.maxStudents) : undefined,
            learningOutcomes: data.learningOutcomes || [],
            prerequisites: data.prerequisites || [],
            targetAudience: data.targetAudience || [],
            tags: data.tags || [],
            seoTitle: data.seoTitle || undefined,
            seoDescription: data.seoDescription || undefined,
            thumbnail: thumbnail || data.thumbnail,
            trailerVideo,
            createdBy: instructorId,
        };

        course = await Course.create(courseData);
    }

    // Track errors across all steps — if any accumulate, we return them at the end
    const errors = [];

    // ── 5. CERTIFICATE (optional — create Certificate document for template) ──
    if (data.certificateEnabled && data.certificate && (!course.certificates || course.certificates.length === 0)) {
        try {
            const certData = {
                title: data.certificate.title || `${data.title} Certificate`,
                description: data.certificate.description || "",
                course: course._id,
                instructor: instructorId,
                isTemplate: true,
                status: "active",
                completionPercentage: 100, // For template
                totalLessons: 0, // Will be updated later
                completedLessons: 0,
                timeSpent: 0,
                verificationCode: "", // Will be generated
                certificateId: "", // Will be generated
                expiryDate: data.certificate.expiryDate || undefined,
                skills: data.certificate.skills || [],
            };

            const certFile = req.files?.find(f => f.fieldname === "certificateImage");
            if (certFile) {
                const certResult = await uploadCertificateImage(certFile.buffer, courseName);
                certData.certificateUrl = certResult.secure_url;
            }

            const certificate = await Certificate.create(certData);
            course.certificates = [certificate._id];
            await course.save({ validateBeforeSave: false });
        } catch (e) {
            logger.error(`Certificate creation failed: ${e.message}`);
            errors.push(`Certificate: ${e.message}`);
        }
    }

    // ── 6. MODULES & LESSONS ──
    const modulesData = data.modules || [];
    let totalModules = 0;
    let totalLessons = 0;
    let totalDuration = 0;
    const moduleIds = course.modules?.map(m => m._id || m) || [];

    for (let mi = 0; mi < modulesData.length; mi++) {
        const modInfo = modulesData[mi];
        const moduleName = (modInfo.title || `Module_${mi + 1}`).replace(/\s+/g, "_");

        // Check if module already exists (idempotent)
        let moduleDoc = existingModuleMap.get(modInfo.title);
        if (moduleDoc) {
            totalModules++;
            if (!moduleIds.some(id => id.toString() === moduleDoc._id.toString())) {
                moduleIds.push(moduleDoc._id);
            }
        } else {
            // Module thumbnail
            let modThumbnail = null;
            const modThumbFile = req.files?.find(f => f.fieldname === `module_${mi}_thumbnail`);
            if (modThumbFile) {
                try {
                    const result = await uploadModuleThumbnail(modThumbFile.buffer, courseName, moduleName);
                    modThumbnail = { public_id: result.public_id, secure_url: result.secure_url };
                } catch (e) {
                    logger.error(`Module ${mi} thumbnail upload failed: ${e.message}`);
                    errors.push(`Module "${modInfo.title}" thumbnail: ${e.message}`);
                }
            }

            try {
                moduleDoc = await Module.create({
                    title: modInfo.title,
                    description: modInfo.description,
                    course: course._id,
                    order: modInfo.order || mi + 1,
                    objectives: modInfo.objectives || [],
                    thumbnail: modThumbnail,
                    createdBy: instructorId,
                });
                totalModules++;
                moduleIds.push(moduleDoc._id);
            } catch (e) {
                logger.error(`Module "${modInfo.title}" creation failed: ${e.message}`);
                errors.push(`Module "${modInfo.title}": ${e.message}`);
                continue; // skip lessons for this module
            }
        }
        const lessonIds = moduleDoc.lessons?.map(l => l._id || l) || [];

        const lessonsData = modInfo.lessons || [];
        for (let li = 0; li < lessonsData.length; li++) {
            const lesInfo = lessonsData[li];
            const lessonName = (lesInfo.title || `Lesson_${li + 1}`).replace(/\s+/g, "_");
            const lessonType = lesInfo.type || "video";

            // Check if lesson already exists (idempotent)
            const existingLesson = existingLessonMap.get(`${modInfo.title}::${lesInfo.title}`);
            if (existingLesson) {
                totalLessons++;
                if (!lessonIds.some(id => id.toString() === existingLesson._id.toString())) {
                    lessonIds.push(existingLesson._id);
                }

                // Check if type-specific model is missing and needs to be created
                const needsLinkedModel =
                    (lessonType === "video" && lesInfo.videoPackage && !existingLesson.videoPackageId) ||
                    (lessonType === "assignment" && lesInfo.assignment && !existingLesson.assignmentId) ||
                    (lessonType === "live" && lesInfo.liveClass && !existingLesson.liveClassId) ||
                    (lessonType === "material" && lesInfo.material && !existingLesson.materialId);

                if (!needsLinkedModel) continue; // fully created already
                // Fall through to create the missing linked model below
            }

            // Lesson thumbnail
            let lesThumbnail = null;
            const lesThumbFile = req.files?.find(f => f.fieldname === `module_${mi}_lesson_${li}_thumbnail`);
            if (lesThumbFile) {
                try {
                    const result = await uploadLessonThumbnail(lesThumbFile.buffer, courseName, moduleName, lessonName);
                    lesThumbnail = { public_id: result.public_id, secure_url: result.secure_url };
                } catch (e) {
                    logger.error(`Lesson ${mi}.${li} thumbnail upload failed: ${e.message}`);
                    errors.push(`Lesson "${lesInfo.title}" thumbnail: ${e.message}`);
                }
            }

            const lessonDoc = {
                title: lesInfo.title,
                description: lesInfo.description,
                course: course._id,
                module: moduleDoc._id,
                order: lesInfo.order || li + 1,
                type: lessonType,
                isFree: lesInfo.isFree || false,
                thumbnail: lesThumbnail,
                content: {},
                createdBy: instructorId,
            };

            // If resuming and this lesson exists but needs a linked model, we update it in place
            const targetLesson = existingLesson || null;

            // ── TYPE-SPECIFIC MODEL CREATION ──
            if (lessonType === "video" && lesInfo.videoPackage) {
                try {
                    const vpData = {
                        ...lesInfo.videoPackage,
                        instructor: instructorId,
                        course: course._id,
                        packageName: lesInfo.videoPackage.packageName || lesInfo.title,
                        createdBy: instructorId,
                    };

                    const vpVideos = lesInfo.videoPackage.videos || [];
                    const processedVideos = [];
                    for (let vi = 0; vi < vpVideos.length; vi++) {
                        const vidFile = req.files?.find(f => f.fieldname === `module_${mi}_lesson_${li}_video_${vi}`);
                        const videoEntry = { ...vpVideos[vi], videoId: new mongoose.Types.ObjectId() };

                        if (vidFile) {
                            // Upload video to Bunny Stream
                            const vidResult = await uploadVideoPackageVideo(vidFile.buffer, courseName, moduleName, lessonName, videoEntry.title || `video_${vi}`);
                            videoEntry.bunnyVideoId = vidResult.bunnyVideoId || vidResult.public_id;
                            videoEntry.url = vidResult.secure_url;
                            videoEntry.duration = vidResult.duration || videoEntry.duration || 0;
                            videoEntry.fileSize = vidResult.bytes || 0;
                            videoEntry.status = vidResult.status || "processing";
                            videoEntry.thumbnail = vidResult.thumbnail || getVideoThumbnail(vidResult.bunnyVideoId || vidResult.public_id);
                        }

                        // Custom thumbnail still goes to R2
                        const vidThumbFile = req.files?.find(f => f.fieldname === `module_${mi}_lesson_${li}_video_${vi}_thumb`);
                        if (vidThumbFile) {
                            const thumbResult = await uploadLessonThumbnail(vidThumbFile.buffer, courseName, moduleName, lessonName);
                            videoEntry.thumbnail = thumbResult.secure_url;
                        }
                        processedVideos.push(videoEntry);
                    }
                    vpData.videos = processedVideos;

                    const vp = await VideoPackage.create(vpData);
                    lessonDoc.videoPackageId = vp._id;
                    if (targetLesson) {
                        await Lesson.findByIdAndUpdate(targetLesson._id, { videoPackageId: vp._id });
                    }
                    totalDuration += vp.totalDuration || 0;
                } catch (e) {
                    logger.error(`VideoPackage creation failed for lesson ${mi}.${li}: ${e.message}`);
                    errors.push(`VideoPackage for "${lesInfo.title}": ${e.message}`);
                }
            }

            if (lessonType === "assignment" && lesInfo.assignment) {
                try {
                    const asgData = {
                        ...lesInfo.assignment,
                        course: course._id,
                        instructor: instructorId,
                        createdBy: instructorId,
                    };

                    const asgThumbFile = req.files?.find(f => f.fieldname === `module_${mi}_lesson_${li}_assignment_thumb`);
                    if (asgThumbFile) {
                        const result = await uploadAssignmentThumbnail(asgThumbFile.buffer, courseName, lesInfo.assignment.title || lessonName);
                        asgData.thumbnail = { public_id: result.public_id, secure_url: result.secure_url };
                    }

                    const asgFiles = req.files?.filter(f => f.fieldname.startsWith(`module_${mi}_lesson_${li}_assignment_file_`)) || [];
                    if (asgFiles.length > 0) {
                        const requiredFiles = asgData.requiredFiles || [];
                        for (let fi = 0; fi < asgFiles.length; fi++) {
                            const result = await uploadAssignmentFile(asgFiles[fi].buffer, courseName, moduleName, lessonName, asgFiles[fi].originalname);
                            requiredFiles.push({
                                name: asgFiles[fi].originalname,
                                type: asgFiles[fi].mimetype?.split("/")[1] || "other",
                                maxSize: asgFiles[fi].size,
                                url: result.secure_url
                            });
                        }
                        asgData.requiredFiles = requiredFiles;
                    }

                    const asg = await Assignment.create(asgData);
                    lessonDoc.assignmentId = asg._id;
                    if (targetLesson) {
                        await Lesson.findByIdAndUpdate(targetLesson._id, { assignmentId: asg._id });
                    }
                } catch (e) {
                    logger.error(`Assignment creation failed for lesson ${mi}.${li}: ${e.message}`);
                    errors.push(`Assignment for "${lesInfo.title}": ${e.message}`);
                }
            }

            if (lessonType === "live" && lesInfo.liveClass) {
                try {
                    // Create Bunny live stream
                    const streamTitle = lesInfo.liveClass.title || lesInfo.title || `Live_${mi}_${li}`;
                    const bunnyStream = await createLiveStream(streamTitle);

                    const lcData = {
                        ...lesInfo.liveClass,
                        instructor: instructorId,
                        course: course._id,
                        createdBy: instructorId,
                        bunnyVideoId: bunnyStream.videoId,
                        rtmpUrl: bunnyStream.rtmpUrl,
                        rtmpKey: bunnyStream.rtmpKey,
                        playbackUrl: bunnyStream.playbackUrl,
                    };
                    // Remove any Zoom fields
                    delete lcData.zoomMeetingId;
                    delete lcData.zoomJoinUrl;
                    delete lcData.zoomStartUrl;
                    delete lcData.zoomPassword;

                    const lc = await LiveClass.create(lcData);
                    lessonDoc.liveClassId = lc._id;
                    if (targetLesson) {
                        await Lesson.findByIdAndUpdate(targetLesson._id, { liveClassId: lc._id });
                    }
                    totalDuration += lc.duration || 0;
                } catch (e) {
                    logger.error(`LiveClass creation failed for lesson ${mi}.${li}: ${e.message}`);
                    errors.push(`LiveClass for "${lesInfo.title}": ${e.message}`);
                }
            }

            if (lessonType === "material" && lesInfo.material) {
                try {
                    const matData = {
                        ...lesInfo.material,
                        instructor: instructorId,
                        course: course._id,
                        module: moduleDoc._id,
                        createdBy: instructorId,
                    };

                    const matFile = req.files?.find(f => f.fieldname === `module_${mi}_lesson_${li}_material_file`);
                    if (matFile) {
                        const rType = matFile.mimetype?.startsWith("video") ? "video" : matFile.mimetype?.startsWith("image") ? "image" : "raw";
                        const result = await uploadMaterialFile(matFile.buffer, courseName, moduleName, lessonName, matFile.originalname, rType);
                        matData.fileUrl = result.secure_url;
                        matData.fileName = matData.fileName || matFile.originalname;
                        matData.fileSize = result.bytes || matFile.size;
                        matData.mimeType = matFile.mimetype;
                        if (result.pages) matData.metadata = { ...matData.metadata, pages: result.pages };
                        if (result.duration) matData.metadata = { ...matData.metadata, duration: result.duration };
                    }

                    const mat = await Material.create(matData);
                    lessonDoc.materialId = mat._id;
                    if (targetLesson) {
                        await Lesson.findByIdAndUpdate(targetLesson._id, { materialId: mat._id });
                    }
                } catch (e) {
                    logger.error(`Material creation failed for lesson ${mi}.${li}: ${e.message}`);
                    errors.push(`Material for "${lesInfo.title}": ${e.message}`);
                }
            }

            if (lessonType === "article") {
                lessonDoc.content.articleContent = lesInfo.content?.articleContent || "";
            }

            // Only create a new lesson if one doesn't already exist
            if (!targetLesson) {
                try {
                    const lesson = await Lesson.create(lessonDoc);
                    totalLessons++;
                    lessonIds.push(lesson._id);
                } catch (e) {
                    logger.error(`Lesson "${lesInfo.title}" creation failed: ${e.message}`);
                    errors.push(`Lesson "${lesInfo.title}": ${e.message}`);
                }
            }
        }

        await Module.findByIdAndUpdate(moduleDoc._id, {
            lessons: lessonIds,
            totalLessons: lessonIds.length,
        });
    }

    // ── 7. UPDATE COURSE TOTALS ──
    // Recount from DB for accuracy (especially on resume)
    const allModules = await Module.find({ course: course._id });
    const allLessons = await Lesson.find({ course: course._id });
    const allModuleIds = allModules.map(m => m._id);
    const freeLessons = allLessons.filter(l => l.isFree);
    const previewLessonIds = freeLessons.map(l => l._id);

    // Calculate total duration from all video packages + live classes
    let calcDuration = 0;
    for (const les of allLessons) {
        if (les.videoPackageId) {
            const vp = await VideoPackage.findById(les.videoPackageId);
            if (vp) calcDuration += vp.totalDuration || 0;
        }
        if (les.liveClassId) {
            const lc = await LiveClass.findById(les.liveClassId);
            if (lc) calcDuration += lc.duration || 0;
        }
    }

    const updatedCourse = await Course.findByIdAndUpdate(course._id, {
        modules: allModuleIds,
        totalModules: allModules.length,
        totalLessons: allLessons.length,
        totalDuration: Math.ceil(calcDuration / 60),
        previewLessons: previewLessonIds.length > 0 ? previewLessonIds : undefined
    }, { new: true })
        .populate("instructor", "firstName lastName email profilePicture")
        .populate({
            path: "modules",
            options: { sort: { order: 1 } },
            populate: {
                path: "lessons",
                options: { sort: { order: 1 } },
                populate: [
                    { path: "videoPackageId" },
                    { path: "assignmentId" },
                    { path: "liveClassId" },
                    { path: "materialId" }
                ]
            }
        });

    // Add course to instructor (only on first creation, not resume)
    if (!isResuming) {
        await Instructor.findByIdAndUpdate(instructorId, {
            $push: { courses: course._id },
            $inc: { totalCourses: 1 }
        });
    }

    // ── 8. RETURN RESPONSE ──
    if (errors.length > 0) {
        logger.error(`Course creation completed with ${errors.length} error(s): ${errors.join("; ")}`);
        return errorResponse(res, 207, `Course created with ${errors.length} error(s). Fix and retry to complete.`, {
            course: updatedCourse,
            errors,
        });
    }

    successResponse(res, 201, isResuming ? "Course updated successfully (resumed)" : "Full course created successfully", updatedCourse);
});

// @route   PUT /api/v1/admin/courses/:id/save-draft
// @desc    Save / update a draft course with modules and lessons (new modular structure)
// @access  Private (Admin)
export const saveDraftCourse = asyncHandler(async (req, res) => {
    const { id } = req.params;
    let data;
    try {
        data = typeof req.body.data === "string" ? JSON.parse(req.body.data) : req.body.data || req.body;
    } catch (e) {
        return errorResponse(res, 400, "Invalid JSON payload");
    }
    const { modules: modulesData, ...courseFields } = data;

    let course = await Course.findById(id);
    if (!course) return errorResponse(res, 404, "Course not found");

    const courseName = (courseFields.title || course.title || "untitled").replace(/\s+/g, "_");
    const instructorId = course.instructor;

    // Handle thumbnail upload
    const thumbnailFile = req.files?.find(f => f.fieldname === "thumbnail");
    if (thumbnailFile) {
        try {
            const oldPublicId = course.thumbnail?.public_id || null;
            const result = await updateImage(oldPublicId, thumbnailFile.buffer, uploadCourseThumbnail, courseName);
            courseFields.thumbnail = { public_id: result.public_id, secure_url: result.secure_url };
        } catch (error) {
            logger.error(`Course thumbnail update failed: ${error.message}`);
        }
    }

    // Handle trailer video
    const trailerFile = req.files?.find(f => f.fieldname === "trailerVideo");
    if (trailerFile) {
        try {
            const result = await uploadCourseTrailer(trailerFile.buffer, courseName);
            courseFields.trailerVideo = result.secure_url;
        } catch (error) {
            logger.error(`Course trailer update failed: ${error.message}`);
        }
    }

    courseFields.status = "draft";
    courseFields.isPublished = false;

    // Update course fields
    course = await Course.findByIdAndUpdate(id, courseFields, { new: true, runValidators: true });

    // If modules data was provided, sync them
    if (modulesData && Array.isArray(modulesData)) {
        // Delete old modules, lessons, and their linked models
        const existingModules = await Module.find({ course: id });
        for (const mod of existingModules) {
            const lessons = await Lesson.find({ module: mod._id });
            for (const les of lessons) {
                if (les.videoPackageId) {
                    const vp = await VideoPackage.findById(les.videoPackageId);
                    if (vp) {
                        for (const v of vp.videos || []) { if (v.bunnyVideoId) try { await deleteBunnyVideo(v.bunnyVideoId); } catch(e) {} }
                        await VideoPackage.findByIdAndDelete(vp._id);
                    }
                }
                if (les.assignmentId) await Assignment.findByIdAndDelete(les.assignmentId);
                if (les.liveClassId) {
                    const lc = await LiveClass.findById(les.liveClassId);
                    if (lc?.bunnyVideoId) try { await deleteLiveStream(lc.bunnyVideoId); } catch(e) {}
                    await LiveClass.findByIdAndDelete(les.liveClassId);
                }
                if (les.materialId) {
                    const mat = await Material.findById(les.materialId);
                    if (mat?.fileUrl) try { await deleteRawResource(mat.fileUrl); } catch(e) {}
                    if (mat) await Material.findByIdAndDelete(mat._id);
                }
            }
            await Lesson.deleteMany({ module: mod._id });
        }
        await Module.deleteMany({ course: id });

        let totalModules = 0;
        let totalLessons = 0;
        let totalDuration = 0;
        const moduleIds = [];

        for (let mi = 0; mi < modulesData.length; mi++) {
            const modInfo = modulesData[mi];
            const moduleName = (modInfo.title || `Module_${mi + 1}`).replace(/\s+/g, "_");

            let modThumbnail = null;
            const modThumbFile = req.files?.find(f => f.fieldname === `module_${mi}_thumbnail`);
            if (modThumbFile) {
                try {
                    const result = await uploadModuleThumbnail(modThumbFile.buffer, courseName, moduleName);
                    modThumbnail = { public_id: result.public_id, secure_url: result.secure_url };
                } catch (e) {
                    logger.error(`Module[${mi}] thumbnail upload failed: ${e.message}`);
                }
            }

            const moduleDoc = await Module.create({
                title: modInfo.title,
                description: modInfo.description,
                course: id,
                order: modInfo.order || mi + 1,
                objectives: modInfo.objectives || [],
                thumbnail: modThumbnail,
                createdBy: instructorId,
            });
            moduleIds.push(moduleDoc._id);
            totalModules++;

            const lessonIds = [];
            const lessonsData = modInfo.lessons || [];

            for (let li = 0; li < lessonsData.length; li++) {
                const lesInfo = lessonsData[li];
                const lessonName = (lesInfo.title || `Lesson_${li + 1}`).replace(/\s+/g, "_");
                const lessonType = lesInfo.type || "video";

                let lesThumbnail = null;
                const lesThumbFile = req.files?.find(f => f.fieldname === `module_${mi}_lesson_${li}_thumbnail`);
                if (lesThumbFile) {
                    try {
                        const result = await uploadLessonThumbnail(lesThumbFile.buffer, courseName, moduleName, lessonName);
                        lesThumbnail = { public_id: result.public_id, secure_url: result.secure_url };
                    } catch (e) {
                        logger.error(`Lesson ${mi}.${li} thumbnail upload failed: ${e.message}`);
                    }
                }

                const lessonDoc = {
                    title: lesInfo.title,
                    description: lesInfo.description,
                    course: id,
                    module: moduleDoc._id,
                    order: lesInfo.order || li + 1,
                    type: lessonType,
                    isFree: lesInfo.isFree || false,
                    thumbnail: lesThumbnail,
                    content: {},
                    createdBy: instructorId,
                };

                // Type-specific model creation (same as createFullCourse)
                if (lessonType === "video" && lesInfo.videoPackage) {
                    try {
                        const vpData = {
                            ...lesInfo.videoPackage,
                            instructor: instructorId,
                            course: id,
                            packageName: lesInfo.videoPackage.packageName || lesInfo.title,
                            createdBy: instructorId,
                        };
                        const vpVideos = lesInfo.videoPackage.videos || [];
                        const processedVideos = [];
                        for (let vi = 0; vi < vpVideos.length; vi++) {
                            const vidFile = req.files?.find(f => f.fieldname === `module_${mi}_lesson_${li}_video_${vi}`);
                            const videoEntry = { ...vpVideos[vi], videoId: new mongoose.Types.ObjectId() };
                            if (vidFile) {
                                // Upload video to Bunny Stream
                                const vidResult = await uploadVideoPackageVideo(vidFile.buffer, courseName, moduleName, lessonName, videoEntry.title || `video_${vi}`);
                                videoEntry.bunnyVideoId = vidResult.bunnyVideoId || vidResult.public_id;
                                videoEntry.url = vidResult.secure_url;
                                videoEntry.duration = vidResult.duration || videoEntry.duration || 0;
                                videoEntry.fileSize = vidResult.bytes || 0;
                                videoEntry.status = vidResult.status || "processing";
                                videoEntry.thumbnail = vidResult.thumbnail || getVideoThumbnail(vidResult.bunnyVideoId || vidResult.public_id);
                            }
                            // Custom thumbnail still goes to R2
                            const vidThumbFile = req.files?.find(f => f.fieldname === `module_${mi}_lesson_${li}_video_${vi}_thumb`);
                            if (vidThumbFile) {
                                const thumbResult = await uploadLessonThumbnail(vidThumbFile.buffer, courseName, moduleName, lessonName);
                                videoEntry.thumbnail = thumbResult.secure_url;
                            }
                            processedVideos.push(videoEntry);
                        }
                        vpData.videos = processedVideos;
                        const vp = await VideoPackage.create(vpData);
                        lessonDoc.videoPackageId = vp._id;
                        totalDuration += vp.totalDuration || 0;
                    } catch (e) {
                        logger.error(`VideoPackage creation failed for draft lesson ${mi}.${li}: ${e.message}`);
                    }
                }

                if (lessonType === "assignment" && lesInfo.assignment) {
                    try {
                        const asgData = { ...lesInfo.assignment, course: id, instructor: instructorId, createdBy: instructorId };
                        const asgThumbFile = req.files?.find(f => f.fieldname === `module_${mi}_lesson_${li}_assignment_thumb`);
                        if (asgThumbFile) {
                            const result = await uploadAssignmentThumbnail(asgThumbFile.buffer, courseName, lesInfo.assignment.title || lessonName);
                            asgData.thumbnail = { public_id: result.public_id, secure_url: result.secure_url };
                        }
                        const asg = await Assignment.create(asgData);
                        lessonDoc.assignmentId = asg._id;
                    } catch (e) {
                        logger.error(`Assignment creation failed for draft lesson ${mi}.${li}: ${e.message}`);
                    }
                }

                if (lessonType === "live" && lesInfo.liveClass) {
                    try {
                        const streamTitle = lesInfo.liveClass.title || lesInfo.title || `Live_${mi}_${li}`;
                        const bunnyStream = await createLiveStream(streamTitle);
                        const lcData = {
                            ...lesInfo.liveClass,
                            instructor: instructorId,
                            course: id,
                            createdBy: instructorId,
                            bunnyVideoId: bunnyStream.videoId,
                            rtmpUrl: bunnyStream.rtmpUrl,
                            rtmpKey: bunnyStream.rtmpKey,
                            playbackUrl: bunnyStream.playbackUrl,
                        };
                        delete lcData.zoomMeetingId;
                        delete lcData.zoomJoinUrl;
                        delete lcData.zoomStartUrl;
                        delete lcData.zoomPassword;
                        const lc = await LiveClass.create(lcData);
                        lessonDoc.liveClassId = lc._id;
                        totalDuration += lc.duration || 0;
                    } catch (e) {
                        logger.error(`LiveClass creation failed for draft lesson ${mi}.${li}: ${e.message}`);
                    }
                }

                if (lessonType === "material" && lesInfo.material) {
                    try {
                        const matData = { ...lesInfo.material, instructor: instructorId, course: id, module: moduleDoc._id, createdBy: instructorId };
                        const matFile = req.files?.find(f => f.fieldname === `module_${mi}_lesson_${li}_material_file`);
                        if (matFile) {
                            const rType = matFile.mimetype?.startsWith("video") ? "video" : matFile.mimetype?.startsWith("image") ? "image" : "raw";
                            const result = await uploadMaterialFile(matFile.buffer, courseName, moduleName, lessonName, matFile.originalname, rType);
                            matData.fileUrl = result.secure_url;
                            matData.fileName = matData.fileName || matFile.originalname;
                            matData.fileSize = result.bytes || matFile.size;
                            matData.mimeType = matFile.mimetype;
                        }
                        const mat = await Material.create(matData);
                        lessonDoc.materialId = mat._id;
                    } catch (e) {
                        logger.error(`Material creation failed for draft lesson ${mi}.${li}: ${e.message}`);
                    }
                }

                if (lessonType === "article") {
                    lessonDoc.content.articleContent = lesInfo.content?.articleContent || "";
                }

                const lesson = await Lesson.create(lessonDoc);
                lessonIds.push(lesson._id);
                totalLessons++;
            }

            await Module.findByIdAndUpdate(moduleDoc._id, {
                lessons: lessonIds,
                totalLessons: lessonIds.length
            });
        }

        const freeLesson = await Lesson.find({ course: id, isFree: true }).select("_id");
        const previewLessonIds = freeLesson.map(l => l._id);

        course = await Course.findByIdAndUpdate(id, {
            modules: moduleIds,
            totalModules,
            totalLessons,
            totalDuration: Math.ceil(totalDuration / 60),
            previewLessons: previewLessonIds.length > 0 ? previewLessonIds : undefined
        }, { new: true })
            .populate("instructor", "firstName lastName email profilePicture")
            .populate({
                path: "modules",
                options: { sort: { order: 1 } },
                populate: {
                    path: "lessons",
                    options: { sort: { order: 1 } },
                    populate: [
                        { path: "videoPackageId" },
                        { path: "assignmentId" },
                        { path: "liveClassId" },
                        { path: "materialId" }
                    ]
                }
            });
    }

    successResponse(res, 200, "Draft course saved successfully", course);
});

// @route   GET /api/v1/admin/courses/drafts
// @desc    Get all draft courses
// @access  Private (Admin)
export const getDraftCourses = asyncHandler(async (req, res) => {
    const { page, limit, skip } = getPagination(req.query, 10);

    const filter = { status: "draft" };
    if (req.query.search) {
        filter.$or = [
            { title: { $regex: req.query.search, $options: "i" } },
            { description: { $regex: req.query.search, $options: "i" } }
        ];
    }

    const total = await Course.countDocuments(filter);
    const courses = await Course.find(filter)
        .populate("instructor", "firstName lastName email")
        .populate({
            path: "modules",
            populate: { path: "lessons", select: "title type order", options: { sort: { order: 1 } } }
        })
        .skip(skip).limit(limit).sort({ updatedAt: -1 });

    successResponse(res, 200, "Draft courses retrieved successfully", {
        courses,
        pagination: createPaginationResponse(total, page, limit)
    });
});

// ========================
// MODULE CRUD OPERATIONS
// ========================

// @route   GET /api/v1/admin/modules
// @access  Private (Admin)
export const getAllModules = asyncHandler(async (req, res) => {
    const { page, limit, skip } = getPagination(req.query, 20);
    const filter = {};
    if (req.query.courseId) filter.course = req.query.courseId;

    const total = await Module.countDocuments(filter);
    const modules = await Module.find(filter)
        .populate("course", "title")
        .populate("lessons", "title type")
        .skip(skip).limit(limit).sort({ course: 1, order: 1 });

    successResponse(res, 200, "Modules retrieved successfully", {
        modules, pagination: createPaginationResponse(total, page, limit)
    });
});

// @route   GET /api/v1/admin/modules/:id
// @access  Private (Admin)
export const getModuleById = asyncHandler(async (req, res) => {
    const module = await Module.findById(req.params.id)
        .populate("course", "title instructor")
        .populate("lessons");
    if (!module) return errorResponse(res, 404, "Module not found");
    successResponse(res, 200, "Module retrieved successfully", module);
});

// @route   POST /api/v1/admin/modules
// @access  Private (Admin)
export const createModule = asyncHandler(async (req, res) => {
    const moduleData = req.file ? JSON.parse(req.body.data || "{}") : req.body;

    if (req.file) {
        try {
            const result = await uploadModuleThumbnail(req.file.buffer, moduleData.title || "module");
            moduleData.thumbnail = { public_id: result.public_id, secure_url: result.secure_url };
        } catch (error) {
            logger.error(`Module thumbnail upload failed: ${error.message}`);
        }
    }

    const mod = await Module.create(moduleData);

    // Add to course modules array
    if (moduleData.course) {
        await Course.findByIdAndUpdate(moduleData.course, { $push: { modules: mod._id } });
    }

    successResponse(res, 201, "Module created successfully", mod);
});

// @route   PUT /api/v1/admin/modules/:id
// @access  Private (Admin)
export const updateModule = asyncHandler(async (req, res) => {
    const updateData = req.file ? JSON.parse(req.body.data || "{}") : req.body;

    if (req.file) {
        const mod = await Module.findById(req.params.id);
        if (!mod) return errorResponse(res, 404, "Module not found");
        const oldPublicId = mod.thumbnail?.public_id || null;
        try {
            const result = await updateImage(oldPublicId, req.file.buffer, uploadModuleThumbnail, updateData.title || mod.title);
            updateData.thumbnail = { public_id: result.public_id, secure_url: result.secure_url };
        } catch (error) {
            logger.error(`Module thumbnail update failed: ${error.message}`);
        }
    }

    const mod = await Module.findByIdAndUpdate(req.params.id, updateData, { new: true, runValidators: true });
    if (!mod) return errorResponse(res, 404, "Module not found");
    successResponse(res, 200, "Module updated successfully", mod);
});

// @route   DELETE /api/v1/admin/modules/:id
// @access  Private (Admin)
export const deleteModule = asyncHandler(async (req, res) => {
    const mod = await Module.findById(req.params.id);
    if (!mod) return errorResponse(res, 404, "Module not found");

    if (mod.thumbnail?.public_id) await deleteImage(mod.thumbnail.public_id).catch(() => {});

    // Cascade delete lessons
    await Lesson.deleteMany({ module: mod._id });

    // Remove from course
    await Course.findByIdAndUpdate(mod.course, { $pull: { modules: mod._id } });

    await Module.findByIdAndDelete(req.params.id);
    successResponse(res, 200, "Module and its lessons deleted successfully");
});

// ========================
// LESSON CRUD OPERATIONS
// ========================

// @route   GET /api/v1/admin/lessons
// @access  Private (Admin)
export const getAllLessons = asyncHandler(async (req, res) => {
    const { page, limit, skip } = getPagination(req.query, 20);
    const filter = {};
    if (req.query.courseId) filter.course = req.query.courseId;
    if (req.query.moduleId) filter.module = req.query.moduleId;
    if (req.query.type) filter.type = req.query.type;

    const total = await Lesson.countDocuments(filter);
    const lessons = await Lesson.find(filter)
        .populate("course", "title")
        .populate("module", "title")
        .skip(skip).limit(limit).sort({ module: 1, order: 1 });

    successResponse(res, 200, "Lessons retrieved successfully", {
        lessons, pagination: createPaginationResponse(total, page, limit)
    });
});

// @route   GET /api/v1/admin/lessons/:id
// @access  Private (Admin)
export const getLessonById = asyncHandler(async (req, res) => {
    const lesson = await Lesson.findById(req.params.id)
        .populate("course", "title")
        .populate("module", "title");
    if (!lesson) return errorResponse(res, 404, "Lesson not found");
    successResponse(res, 200, "Lesson retrieved successfully", lesson);
});

// @route   POST /api/v1/admin/lessons
// @access  Private (Admin)
export const createLesson = asyncHandler(async (req, res) => {
    const lessonData = req.file ? JSON.parse(req.body.data || "{}") : req.body;

    if (req.file) {
        try {
            const result = await uploadLessonThumbnail(req.file.buffer, lessonData.title || "lesson");
            lessonData.thumbnail = { public_id: result.public_id, secure_url: result.secure_url };
        } catch (error) {
            logger.error(`Lesson thumbnail upload failed: ${error.message}`);
        }
    }

    const lesson = await Lesson.create(lessonData);

    // Add to module's lessons array
    if (lessonData.module) {
        await Module.findByIdAndUpdate(lessonData.module, { $push: { lessons: lesson._id } });
    }

    successResponse(res, 201, "Lesson created successfully", lesson);
});

// @route   PUT /api/v1/admin/lessons/:id
// @access  Private (Admin)
export const updateLesson = asyncHandler(async (req, res) => {
    const updateData = req.file ? JSON.parse(req.body.data || "{}") : req.body;

    if (req.file) {
        const lesson = await Lesson.findById(req.params.id);
        if (!lesson) return errorResponse(res, 404, "Lesson not found");
        const oldPublicId = lesson.thumbnail?.public_id || null;
        try {
            const result = await updateImage(oldPublicId, req.file.buffer, uploadLessonThumbnail, updateData.title || lesson.title);
            updateData.thumbnail = { public_id: result.public_id, secure_url: result.secure_url };
        } catch (error) {
            logger.error(`Lesson thumbnail update failed: ${error.message}`);
        }
    }

    const lesson = await Lesson.findByIdAndUpdate(req.params.id, updateData, { new: true, runValidators: true });
    if (!lesson) return errorResponse(res, 404, "Lesson not found");
    successResponse(res, 200, "Lesson updated successfully", lesson);
});

// @route   DELETE /api/v1/admin/lessons/:id
// @access  Private (Admin)
export const deleteLesson = asyncHandler(async (req, res) => {
    const lesson = await Lesson.findById(req.params.id);
    if (!lesson) return errorResponse(res, 404, "Lesson not found");

    if (lesson.thumbnail?.public_id) await deleteImage(lesson.thumbnail.public_id).catch(() => {});

    await Module.findByIdAndUpdate(lesson.module, { $pull: { lessons: lesson._id } });
    await Lesson.findByIdAndDelete(req.params.id);
    successResponse(res, 200, "Lesson deleted successfully");
});

// ========================
// ENROLLMENT CRUD OPERATIONS
// ========================

// @route   GET /api/v1/admin/enrollments
// @access  Private (Admin)
export const getAllEnrollments = asyncHandler(async (req, res) => {
    const { page, limit, skip } = getPagination(req.query, 20);
    const filter = {};
    if (req.query.userId) filter.user = req.query.userId;
    if (req.query.courseId) filter.course = req.query.courseId;
    if (req.query.status) filter.status = req.query.status;

    const total = await Enrollment.countDocuments(filter);
    const enrollments = await Enrollment.find(filter)
        .populate("user", "firstName lastName email")
        .populate("course", "title")
        .populate("payment", "amount status")
        .skip(skip).limit(limit).sort({ createdAt: -1 });

    successResponse(res, 200, "Enrollments retrieved successfully", {
        enrollments, pagination: createPaginationResponse(total, page, limit)
    });
});

// @route   GET /api/v1/admin/enrollments/:id
// @access  Private (Admin)
export const getEnrollmentById = asyncHandler(async (req, res) => {
    const enrollment = await Enrollment.findById(req.params.id)
        .populate("user", "firstName lastName email")
        .populate("course", "title")
        .populate("payment");
    if (!enrollment) return errorResponse(res, 404, "Enrollment not found");
    successResponse(res, 200, "Enrollment retrieved successfully", enrollment);
});

// @route   POST /api/v1/admin/enrollments
// @access  Private (Admin) - Can create enrollments for any user
export const createEnrollment = asyncHandler(async (req, res) => {
    const enrollment = await Enrollment.create(req.body);

    // Update course enrolled count
    await Course.findByIdAndUpdate(req.body.course, { $inc: { enrolledCount: 1 } });

    // Update user enrolled courses count
    await User.findByIdAndUpdate(req.body.user, {
        $inc: { "learningProgress.totalCoursesEnrolled": 1 }
    });

    successResponse(res, 201, "Enrollment created successfully", enrollment);
});

// @route   PUT /api/v1/admin/enrollments/:id
// @access  Private (Admin) - Can update any field
export const updateEnrollment = asyncHandler(async (req, res) => {
    const enrollment = await Enrollment.findByIdAndUpdate(req.params.id, req.body, {
        new: true, runValidators: true
    });
    if (!enrollment) return errorResponse(res, 404, "Enrollment not found");
    successResponse(res, 200, "Enrollment updated successfully", enrollment);
});

// @route   DELETE /api/v1/admin/enrollments/:id
// @access  Private (Admin)
export const deleteEnrollment = asyncHandler(async (req, res) => {
    const enrollment = await Enrollment.findById(req.params.id);
    if (!enrollment) return errorResponse(res, 404, "Enrollment not found");

    await Course.findByIdAndUpdate(enrollment.course, { $inc: { enrolledCount: -1 } });
    await Enrollment.findByIdAndDelete(req.params.id);
    successResponse(res, 200, "Enrollment deleted successfully");
});

// ========================
// PAYMENT CRUD OPERATIONS
// ========================

// @route   GET /api/v1/admin/payments
// @access  Private (Admin)
export const getAllPayments = asyncHandler(async (req, res) => {
    const { page, limit, skip } = getPagination(req.query, 20);
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.userId) filter.user = req.query.userId;
    if (req.query.courseId) filter.course = req.query.courseId;
    if (req.query.paymentMethod) filter.paymentMethod = req.query.paymentMethod;

    const total = await Payment.countDocuments(filter);
    const payments = await Payment.find(filter)
        .populate("user", "firstName lastName email")
        .populate("course", "title")
        .skip(skip).limit(limit).sort({ createdAt: -1 });

    successResponse(res, 200, "Payments retrieved successfully", {
        payments, pagination: createPaginationResponse(total, page, limit)
    });
});

// @route   GET /api/v1/admin/payments/:id
// @access  Private (Admin)
export const getPaymentById = asyncHandler(async (req, res) => {
    const payment = await Payment.findById(req.params.id)
        .populate("user", "firstName lastName email")
        .populate("course", "title price")
        .populate("processedBy", "name email");
    if (!payment) return errorResponse(res, 404, "Payment not found");
    successResponse(res, 200, "Payment retrieved successfully", payment);
});

// @route   PUT /api/v1/admin/payments/:id
// @access  Private (Admin) - Can update any field
export const updatePayment = asyncHandler(async (req, res) => {
    const payment = await Payment.findByIdAndUpdate(req.params.id, req.body, {
        new: true, runValidators: true
    });
    if (!payment) return errorResponse(res, 404, "Payment not found");
    successResponse(res, 200, "Payment updated successfully", payment);
});

// @route   DELETE /api/v1/admin/payments/:id
// @access  Private (Admin)
export const deletePayment = asyncHandler(async (req, res) => {
    const payment = await Payment.findByIdAndDelete(req.params.id);
    if (!payment) return errorResponse(res, 404, "Payment not found");
    successResponse(res, 200, "Payment deleted successfully");
});

// @route   POST /api/v1/admin/payments/:id/refund
// @access  Private (Admin) - Manual refund
export const adminProcessRefund = asyncHandler(async (req, res) => {
    const payment = await Payment.findById(req.params.id);
    if (!payment) return errorResponse(res, 404, "Payment not found");

    const { amount, reason } = req.body;
    const refundAmount = amount || payment.amount;

    await payment.processRefund(refundAmount, reason || "Admin-initiated refund");
    payment.processedBy = req.admin.id;
    await payment.save();

    // Update enrollment if exists
    await Enrollment.findOneAndUpdate(
        { user: payment.user, course: payment.course, payment: payment._id },
        { status: "refunded" }
    );

    successResponse(res, 200, "Refund processed successfully", payment);
});

// @route   GET /api/v1/admin/payments/stats
// @access  Private (Admin)
export const getPaymentStats = asyncHandler(async (req, res) => {
    const { startDate, endDate } = req.query;
    const options = {};
    if (startDate) options.startDate = new Date(startDate);
    if (endDate) options.endDate = new Date(endDate);

    const stats = await Payment.getPaymentStats(options);

    // Overall summary
    const summary = await Payment.aggregate([
        { $group: {
            _id: "$status",
            count: { $sum: 1 },
            totalAmount: { $sum: "$amount" }
        }}
    ]);

    successResponse(res, 200, "Payment statistics retrieved", { dailyStats: stats, summary });
});

// ========================
// REVIEW CRUD OPERATIONS
// ========================

// @route   GET /api/v1/admin/reviews
// @access  Private (Admin)
export const getAllReviews = asyncHandler(async (req, res) => {
    const { page, limit, skip } = getPagination(req.query, 20);
    const filter = {};
    if (req.query.courseId) filter.course = req.query.courseId;
    if (req.query.userId) filter.user = req.query.userId;
    if (req.query.rating) filter.rating = parseInt(req.query.rating);
    if (req.query.reported === "true") filter["reported.isReported"] = true;

    const total = await Review.countDocuments(filter);
    const reviews = await Review.find(filter)
        .populate("user", "firstName lastName email")
        .populate("course", "title")
        .skip(skip).limit(limit).sort({ createdAt: -1 });

    successResponse(res, 200, "Reviews retrieved successfully", {
        reviews, pagination: createPaginationResponse(total, page, limit)
    });
});

// @route   GET /api/v1/admin/reviews/:id
// @access  Private (Admin)
export const getReviewById = asyncHandler(async (req, res) => {
    const review = await Review.findById(req.params.id)
        .populate("user", "firstName lastName email")
        .populate("course", "title");
    if (!review) return errorResponse(res, 404, "Review not found");
    successResponse(res, 200, "Review retrieved successfully", review);
});

// @route   PUT /api/v1/admin/reviews/:id
// @access  Private (Admin) - Can update any field, including moderation
export const updateReview = asyncHandler(async (req, res) => {
    const review = await Review.findByIdAndUpdate(req.params.id, req.body, {
        new: true, runValidators: true
    });
    if (!review) return errorResponse(res, 404, "Review not found");
    successResponse(res, 200, "Review updated successfully", review);
});

// @route   DELETE /api/v1/admin/reviews/:id
// @access  Private (Admin)
export const deleteReview = asyncHandler(async (req, res) => {
    const review = await Review.findById(req.params.id);
    if (!review) return errorResponse(res, 404, "Review not found");

    await Review.findByIdAndDelete(req.params.id);

    // Update course rating
    if (review.course) {
        const courseDoc = await Course.findById(review.course);
        if (courseDoc) await courseDoc.updateRating();
    }

    successResponse(res, 200, "Review deleted successfully");
});

// ========================
// ASSIGNMENT CRUD OPERATIONS
// ========================

// @route   GET /api/v1/admin/assignments
// @access  Private (Admin)
export const getAllAssignments = asyncHandler(async (req, res) => {
    const { page, limit, skip } = getPagination(req.query, 20);
    const filter = {};
    if (req.query.courseId) filter.course = req.query.courseId;
    if (req.query.instructorId) filter.instructor = req.query.instructorId;

    const total = await Assignment.countDocuments(filter);
    const assignments = await Assignment.find(filter)
        .populate("course", "title")
        .populate("instructor", "firstName lastName")
        .skip(skip).limit(limit).sort({ createdAt: -1 });

    successResponse(res, 200, "Assignments retrieved successfully", {
        assignments, pagination: createPaginationResponse(total, page, limit)
    });
});

// @route   GET /api/v1/admin/assignments/:id
// @access  Private (Admin)
export const getAssignmentById = asyncHandler(async (req, res) => {
    const assignment = await Assignment.findById(req.params.id)
        .populate("course", "title")
        .populate("instructor", "firstName lastName")
        .populate("lesson", "title");
    if (!assignment) return errorResponse(res, 404, "Assignment not found");
    successResponse(res, 200, "Assignment retrieved successfully", assignment);
});

// @route   POST /api/v1/admin/assignments
// @access  Private (Admin)
export const createAssignment = asyncHandler(async (req, res) => {
    const data = req.file ? JSON.parse(req.body.data || "{}") : req.body;

    if (req.file) {
        try {
            const result = await uploadAssignmentThumbnail(req.file.buffer, data.title || "assignment");
            data.thumbnail = { public_id: result.public_id, secure_url: result.secure_url };
        } catch (error) {
            logger.error(`Assignment thumbnail upload failed: ${error.message}`);
        }
    }

    const assignment = await Assignment.create(data);
    successResponse(res, 201, "Assignment created successfully", assignment);
});

// @route   PUT /api/v1/admin/assignments/:id
// @access  Private (Admin)
export const updateAssignment = asyncHandler(async (req, res) => {
    const data = req.file ? JSON.parse(req.body.data || "{}") : req.body;

    if (req.file) {
        const assignment = await Assignment.findById(req.params.id);
        if (!assignment) return errorResponse(res, 404, "Assignment not found");
        const oldPublicId = assignment.thumbnail?.public_id || null;
        try {
            const result = await updateImage(oldPublicId, req.file.buffer, uploadAssignmentThumbnail, data.title || assignment.title);
            data.thumbnail = { public_id: result.public_id, secure_url: result.secure_url };
        } catch (error) {
            logger.error(`Assignment thumbnail update failed: ${error.message}`);
        }
    }

    const assignment = await Assignment.findByIdAndUpdate(req.params.id, data, { new: true, runValidators: true });
    if (!assignment) return errorResponse(res, 404, "Assignment not found");
    successResponse(res, 200, "Assignment updated successfully", assignment);
});

// @route   DELETE /api/v1/admin/assignments/:id
// @access  Private (Admin)
export const deleteAssignment = asyncHandler(async (req, res) => {
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) return errorResponse(res, 404, "Assignment not found");

    if (assignment.thumbnail?.public_id) await deleteImage(assignment.thumbnail.public_id).catch(() => {});

    await Submission.deleteMany({ assignment: req.params.id });
    await Assignment.findByIdAndDelete(req.params.id);
    successResponse(res, 200, "Assignment and submissions deleted successfully");
});

// ========================
// SUBMISSION CRUD OPERATIONS
// ========================

// @route   GET /api/v1/admin/submissions
// @access  Private (Admin)
export const getAllSubmissions = asyncHandler(async (req, res) => {
    const { page, limit, skip } = getPagination(req.query, 20);
    const filter = {};
    if (req.query.assignmentId) filter.assignment = req.query.assignmentId;
    if (req.query.userId) filter.user = req.query.userId;
    if (req.query.status) filter.status = req.query.status;

    const total = await Submission.countDocuments(filter);
    const submissions = await Submission.find(filter)
        .populate("user", "firstName lastName email")
        .populate("assignment", "title")
        .populate("course", "title")
        .skip(skip).limit(limit).sort({ createdAt: -1 });

    successResponse(res, 200, "Submissions retrieved successfully", {
        submissions, pagination: createPaginationResponse(total, page, limit)
    });
});

// @route   GET /api/v1/admin/submissions/:id
// @access  Private (Admin)
export const getSubmissionById = asyncHandler(async (req, res) => {
    const submission = await Submission.findById(req.params.id)
        .populate("user", "firstName lastName email")
        .populate("assignment", "title maxScore rubrics")
        .populate("course", "title");
    if (!submission) return errorResponse(res, 404, "Submission not found");
    successResponse(res, 200, "Submission retrieved successfully", submission);
});

// @route   PUT /api/v1/admin/submissions/:id
// @access  Private (Admin) - Can update any field
export const updateSubmission = asyncHandler(async (req, res) => {
    const submission = await Submission.findByIdAndUpdate(req.params.id, req.body, {
        new: true, runValidators: true
    });
    if (!submission) return errorResponse(res, 404, "Submission not found");
    successResponse(res, 200, "Submission updated successfully", submission);
});

// @route   DELETE /api/v1/admin/submissions/:id
// @access  Private (Admin)
export const deleteSubmission = asyncHandler(async (req, res) => {
    const submission = await Submission.findByIdAndDelete(req.params.id);
    if (!submission) return errorResponse(res, 404, "Submission not found");
    successResponse(res, 200, "Submission deleted successfully");
});

// ========================
// CERTIFICATE CRUD OPERATIONS
// ========================

// @route   GET /api/v1/admin/certificates
// @access  Private (Admin)
export const getAllCertificates = asyncHandler(async (req, res) => {
    const { page, limit, skip } = getPagination(req.query, 20);
    const filter = {};
    if (req.query.userId) filter.user = req.query.userId;
    if (req.query.courseId) filter.course = req.query.courseId;
    if (req.query.status) filter.status = req.query.status;

    const total = await Certificate.countDocuments(filter);
    const certificates = await Certificate.find(filter)
        .populate("user", "firstName lastName email")
        .populate("course", "title")
        .populate("instructor", "firstName lastName")
        .skip(skip).limit(limit).sort({ createdAt: -1 });

    successResponse(res, 200, "Certificates retrieved successfully", {
        certificates, pagination: createPaginationResponse(total, page, limit)
    });
});

// @route   GET /api/v1/admin/certificates/:id
// @access  Private (Admin)
export const getCertificateById = asyncHandler(async (req, res) => {
    const certificate = await Certificate.findById(req.params.id)
        .populate("user", "firstName lastName email")
        .populate("course", "title")
        .populate("instructor", "firstName lastName");
    if (!certificate) return errorResponse(res, 404, "Certificate not found");
    successResponse(res, 200, "Certificate retrieved successfully", certificate);
});

// @route   POST /api/v1/admin/certificates
// @access  Private (Admin) - Can issue certificates manually
export const createCertificate = asyncHandler(async (req, res) => {
    const certificate = await Certificate.create(req.body);
    successResponse(res, 201, "Certificate created successfully", certificate);
});

// @route   PUT /api/v1/admin/certificates/:id
// @access  Private (Admin) - Can update any field
export const updateCertificate = asyncHandler(async (req, res) => {
    const certificate = await Certificate.findByIdAndUpdate(req.params.id, req.body, {
        new: true, runValidators: true
    });
    if (!certificate) return errorResponse(res, 404, "Certificate not found");
    successResponse(res, 200, "Certificate updated successfully", certificate);
});

// @route   DELETE /api/v1/admin/certificates/:id
// @access  Private (Admin)
export const deleteCertificate = asyncHandler(async (req, res) => {
    const certificate = await Certificate.findByIdAndDelete(req.params.id);
    if (!certificate) return errorResponse(res, 404, "Certificate not found");
    successResponse(res, 200, "Certificate deleted successfully");
});

// Keep custom delete for now since it might be used elsewhere
// export const deleteCertificate = certificateCrud.delete;

// @route   PATCH /api/v1/admin/certificates/:id/revoke
// @access  Private (Admin)
export const revokeCertificate = asyncHandler(async (req, res) => {
    const certificate = await Certificate.findById(req.params.id);
    if (!certificate) return errorResponse(res, 404, "Certificate not found");

    await certificate.revoke(req.body.reason || "Revoked by admin");
    successResponse(res, 200, "Certificate revoked successfully", certificate);
});

// ========================
// LIVE CLASS CRUD OPERATIONS
// ========================

// @route   GET /api/v1/admin/live-classes
// @access  Private (Admin)
export const getAllLiveClasses = asyncHandler(async (req, res) => {
    const { page, limit, skip } = getPagination(req.query, 20);
    const filter = {};
    if (req.query.instructorId) filter.instructor = req.query.instructorId;
    if (req.query.courseId) filter.course = req.query.courseId;
    if (req.query.status) filter.status = req.query.status;

    const total = await LiveClass.countDocuments(filter);
    const liveClasses = await LiveClass.find(filter)
        .populate("instructor", "firstName lastName")
        .populate("course", "title")
        .skip(skip).limit(limit).sort({ scheduledAt: -1 });

    successResponse(res, 200, "Live classes retrieved successfully", {
        liveClasses, pagination: createPaginationResponse(total, page, limit)
    });
});

// @route   GET /api/v1/admin/live-classes/:id
// @access  Private (Admin)
export const getLiveClassById = asyncHandler(async (req, res) => {
    const liveClass = await LiveClass.findById(req.params.id)
        .populate("instructor", "firstName lastName")
        .populate("course", "title")
        .populate("materials");
    if (!liveClass) return errorResponse(res, 404, "Live class not found");
    successResponse(res, 200, "Live class retrieved successfully", liveClass);
});

// @route   PUT /api/v1/admin/live-classes/:id
// @access  Private (Admin)
export const updateLiveClass = asyncHandler(async (req, res) => {
    const liveClass = await LiveClass.findByIdAndUpdate(req.params.id, req.body, {
        new: true, runValidators: true
    });
    if (!liveClass) return errorResponse(res, 404, "Live class not found");
    successResponse(res, 200, "Live class updated successfully", liveClass);
});

// @route   DELETE /api/v1/admin/live-classes/:id
// @access  Private (Admin)
export const deleteLiveClass = asyncHandler(async (req, res) => {
    const liveClass = await LiveClass.findByIdAndDelete(req.params.id);
    if (!liveClass) return errorResponse(res, 404, "Live class not found");
    successResponse(res, 200, "Live class deleted successfully");
});

// ========================
// VIDEO PACKAGE CRUD OPERATIONS
// ========================

// @route   GET /api/v1/admin/video-packages
// @access  Private (Admin)
export const getAllVideoPackages = asyncHandler(async (req, res) => {
    const { page, limit, skip } = getPagination(req.query, 20);
    const filter = {};
    if (req.query.instructorId) filter.instructor = req.query.instructorId;
    if (req.query.courseId) filter.course = req.query.courseId;
    if (req.query.status) filter.status = req.query.status;

    const total = await VideoPackage.countDocuments(filter);
    const videoPackages = await VideoPackage.find(filter)
        .populate("instructor", "firstName lastName")
        .populate("course", "title")
        .skip(skip).limit(limit).sort({ createdAt: -1 });

    successResponse(res, 200, "Video packages retrieved successfully", {
        videoPackages, pagination: createPaginationResponse(total, page, limit)
    });
});

// @route   GET /api/v1/admin/video-packages/:id
// @access  Private (Admin)
export const getVideoPackageById = asyncHandler(async (req, res) => {
    const pkg = await VideoPackage.findById(req.params.id)
        .populate("instructor", "firstName lastName")
        .populate("course", "title");
    if (!pkg) return errorResponse(res, 404, "Video package not found");
    successResponse(res, 200, "Video package retrieved successfully", pkg);
});

// @route   PUT /api/v1/admin/video-packages/:id
// @access  Private (Admin)
export const updateVideoPackage = asyncHandler(async (req, res) => {
    const pkg = await VideoPackage.findByIdAndUpdate(req.params.id, req.body, {
        new: true, runValidators: true
    });
    if (!pkg) return errorResponse(res, 404, "Video package not found");
    successResponse(res, 200, "Video package updated successfully", pkg);
});

// @route   DELETE /api/v1/admin/video-packages/:id
// @access  Private (Admin)
export const deleteVideoPackage = asyncHandler(async (req, res) => {
    const pkg = await VideoPackage.findById(req.params.id);
    if (!pkg) return errorResponse(res, 404, "Video package not found");

    // Delete all videos from Bunny Stream
    for (const video of (pkg.videos || [])) {
        if (video.bunnyVideoId) {
            try { await deleteBunnyVideo(video.bunnyVideoId); } catch (e) {
                logger.error(`Failed to delete Bunny video ${video.bunnyVideoId}: ${e.message}`);
            }
        }
    }

    await VideoPackage.findByIdAndDelete(req.params.id);
    successResponse(res, 200, "Video package deleted successfully");
});

// ========================
// MATERIAL CRUD OPERATIONS
// ========================

// @route   GET /api/v1/admin/materials
// @access  Private (Admin)
export const getAllMaterials = asyncHandler(async (req, res) => {
    const { page, limit, skip } = getPagination(req.query, 20);
    const filter = {};
    if (req.query.courseId) filter.course = req.query.courseId;
    if (req.query.instructorId) filter.instructor = req.query.instructorId;
    if (req.query.type) filter.type = req.query.type;

    const total = await Material.countDocuments(filter);
    const materials = await Material.find(filter)
        .populate("instructor", "firstName lastName")
        .populate("course", "title")
        .skip(skip).limit(limit).sort({ createdAt: -1 });

    successResponse(res, 200, "Materials retrieved successfully", {
        materials, pagination: createPaginationResponse(total, page, limit)
    });
});

// @route   GET /api/v1/admin/materials/:id
// @access  Private (Admin)
export const getMaterialById = asyncHandler(async (req, res) => {
    const material = await Material.findById(req.params.id)
        .populate("instructor", "firstName lastName")
        .populate("course", "title")
        .populate("module", "title")
        .populate("lesson", "title");
    if (!material) return errorResponse(res, 404, "Material not found");
    successResponse(res, 200, "Material retrieved successfully", material);
});

// @route   PUT /api/v1/admin/materials/:id
// @access  Private (Admin)
export const updateMaterial = asyncHandler(async (req, res) => {
    const material = await Material.findByIdAndUpdate(req.params.id, req.body, {
        new: true, runValidators: true
    });
    if (!material) return errorResponse(res, 404, "Material not found");
    successResponse(res, 200, "Material updated successfully", material);
});

// @route   DELETE /api/v1/admin/materials/:id
// @access  Private (Admin)
export const deleteMaterial = asyncHandler(async (req, res) => {
    const material = await Material.findByIdAndDelete(req.params.id);
    if (!material) return errorResponse(res, 404, "Material not found");
    successResponse(res, 200, "Material deleted successfully");
});

// ========================
// PROGRESS CRUD OPERATIONS
// ========================

// @route   GET /api/v1/admin/progress
// @access  Private (Admin)
export const getAllProgress = asyncHandler(async (req, res) => {
    const { page, limit, skip } = getPagination(req.query, 20);
    const filter = {};
    if (req.query.userId) filter.user = req.query.userId;
    if (req.query.courseId) filter.course = req.query.courseId;
    if (req.query.status) filter.status = req.query.status;

    const total = await Progress.countDocuments(filter);
    const progress = await Progress.find(filter)
        .populate("user", "firstName lastName email")
        .populate("course", "title")
        .populate("lesson", "title")
        .skip(skip).limit(limit).sort({ updatedAt: -1 });

    successResponse(res, 200, "Progress records retrieved successfully", {
        progress, pagination: createPaginationResponse(total, page, limit)
    });
});

// @route   PUT /api/v1/admin/progress/:id
// @access  Private (Admin) - Can update any field
export const updateProgress = asyncHandler(async (req, res) => {
    const progress = await Progress.findByIdAndUpdate(req.params.id, req.body, {
        new: true, runValidators: true
    });
    if (!progress) return errorResponse(res, 404, "Progress record not found");
    successResponse(res, 200, "Progress updated successfully", progress);
});

// @route   DELETE /api/v1/admin/progress/:id
// @access  Private (Admin)
export const deleteProgress = asyncHandler(async (req, res) => {
    const progress = await Progress.findByIdAndDelete(req.params.id);
    if (!progress) return errorResponse(res, 404, "Progress record not found");
    successResponse(res, 200, "Progress record deleted successfully");
});

// ========================
// ADMIN DASHBOARD & ANALYTICS
// ========================

// @route   GET /api/v1/admin/dashboard
// @desc    Get admin dashboard overview
// @access  Private (Admin)
export const getDashboard = asyncHandler(async (req, res) => {
    const [
        totalUsers,
        totalInstructors,
        totalCourses,
        totalEnrollments,
        publishedCourses,
        activeEnrollments,
        pendingPayments,
        completedPayments,
        totalCertificates,
        reportedReviews
    ] = await Promise.all([
        User.countDocuments(),
        Instructor.countDocuments(),
        Course.countDocuments(),
        Enrollment.countDocuments(),
        Course.countDocuments({ status: "published" }),
        Enrollment.countDocuments({ status: "active" }),
        Payment.countDocuments({ status: "pending" }),
        Payment.countDocuments({ status: "completed" }),
        Certificate.countDocuments(),
        Review.countDocuments({ "reported.isReported": true })
    ]);

    // Revenue summary
    const revenue = await Payment.aggregate([
        { $match: { status: "completed" } },
        { $group: {
            _id: null,
            totalRevenue: { $sum: "$amount" },
            totalTransactions: { $sum: 1 }
        }}
    ]);

    // Recent enrollments (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const recentEnrollments = await Enrollment.countDocuments({
        createdAt: { $gte: thirtyDaysAgo }
    });

    // Recent users (last 30 days)
    const recentUsers = await User.countDocuments({
        createdAt: { $gte: thirtyDaysAgo }
    });

    successResponse(res, 200, "Dashboard data retrieved", {
        overview: {
            totalUsers,
            totalInstructors,
            totalCourses,
            publishedCourses,
            totalEnrollments,
            activeEnrollments,
            totalCertificates,
            reportedReviews
        },
        payments: {
            pending: pendingPayments,
            completed: completedPayments,
            totalRevenue: revenue[0]?.totalRevenue || 0,
            totalTransactions: revenue[0]?.totalTransactions || 0
        },
        recent: {
            enrollments: recentEnrollments,
            users: recentUsers
        }
    });
});