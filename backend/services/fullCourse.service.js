//fullCourse.service.js

import mongoose from "mongoose";
import { Course } from "../models/course.model.js";
import { Module } from "../models/module.model.js";
import { Lesson } from "../models/lesson.model.js";
import { Instructor } from "../models/instructor.model.js";
import { Enrollment } from "../models/enrollment.model.js";
import { Review } from "../models/review.model.js";
import { Assignment } from "../models/assignment.model.js";
import { Submission } from "../models/submission.model.js";
import { Certificate } from "../models/certificate.model.js";
import { LiveClass } from "../models/liveclass.model.js";
import { Video } from "../models/video.model.js";
import { Material } from "../models/material.model.js";
import { Progress } from "../models/progress.model.js";
import {
    uploadCourseThumbnail, uploadModuleThumbnail,
    uploadLessonThumbnail, uploadAssignmentThumbnail,
    uploadMaterialFile, uploadCertificateImage,
    uploadAssignmentFile,
    updateImage, deleteImage, deleteRawResource
} from "./r2.service.js";
import {
    uploadVideo, uploadCourseTrailer,
    deleteVideo as deleteBunnyVideo,
    deleteLiveStream, getVideoThumbnail
} from "./bunny.service.js";
import {
    createLiveInput,
    getLiveInputDetails,
} from "./cloudflare-stream.service.js";
import logger from "../configs/logger.config.js";

const DRAFT_THUMBNAIL_PLACEHOLDER = {
    public_id: "course_draft_placeholder",
    secure_url: "https://placehold.co/1280x720/png"
};

const findFile = (files = [], ...fieldNames) =>
    files.find((file) => fieldNames.includes(file.fieldname));

const findFilesByPrefixes = (files = [], prefixes = []) =>
    files.filter((file) => prefixes.some((prefix) => file.fieldname.startsWith(prefix)));

const extractBunnyVideoId = (value) => {
    if (!value || typeof value !== "string") return null;

    const guidPattern = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;
    const guidMatch = value.match(guidPattern);
    return guidMatch ? guidMatch[0] : null;
};

const sameId = (a, b) => {
    if (!a || !b) return false;
    return a.toString() === b.toString();
};

const createMediaRollbackContext = () => ({
    bunnyVideoIds: new Set(),
    rawUrls: new Set(),
    imagePublicIds: new Set(),
});

const trackUploadedBunnyVideo = (rollbackCtx, videoId) => {
    if (!rollbackCtx || !videoId) return;
    rollbackCtx.bunnyVideoIds.add(videoId);
};

const trackUploadedRawUrl = (rollbackCtx, url) => {
    if (!rollbackCtx || !url) return;
    rollbackCtx.rawUrls.add(url);
};

const trackUploadedImagePublicId = (rollbackCtx, publicId) => {
    if (!rollbackCtx || !publicId) return;
    rollbackCtx.imagePublicIds.add(publicId);
};

const hasVideoRelatedErrors = (errors = []) =>
    errors.some((err) => /video|trailer|bunny|thumbnail/i.test(String(err || "")));

const rollbackUploadedMedia = async (rollbackCtx) => {
    if (!rollbackCtx) return;

    for (const videoId of rollbackCtx.bunnyVideoIds) {
        try {
            await deleteBunnyVideo(videoId);
        } catch (err) {
            logger.warn(`Rollback Bunny video delete failed for ${videoId}: ${err.message}`);
        }
    }

    for (const url of rollbackCtx.rawUrls) {
        try {
            await deleteRawResource(url);
        } catch (err) {
            logger.warn(`Rollback raw resource delete failed for ${url}: ${err.message}`);
        }
    }

    for (const publicId of rollbackCtx.imagePublicIds) {
        try {
            await deleteImage(publicId);
        } catch (err) {
            logger.warn(`Rollback image delete failed for ${publicId}: ${err.message}`);
        }
    }
};

const ensureInstructorCloudflareInput = async (instructorId) => {
    const instructor = await Instructor.findById(instructorId).select("+cfRtmpKey");
    if (!instructor) {
        throw new Error("Instructor not found for live class setup");
    }

    if (instructor.cfLiveInputId) {
        if (!instructor.cfRtmpUrl || !instructor.cfRtmpKey) {
            const details = await getLiveInputDetails(instructor.cfLiveInputId);
            instructor.cfRtmpUrl = details.rtmps?.url || `rtmps://live.cloudflare.com:443/live/`;
            instructor.cfRtmpKey = details.rtmps?.streamKey || "";
            instructor.cfSrtUrl = details.srt?.url || "";
            instructor.cfWebRTCUrl = details.webRTC?.url || "";
            await instructor.save({ validateBeforeSave: false });
        }

        return {
            cfLiveInputId: instructor.cfLiveInputId,
            rtmpUrl: instructor.cfRtmpUrl || "",
            rtmpKey: instructor.cfRtmpKey || "",
            srtUrl: instructor.cfSrtUrl || "",
            webRTCUrl: instructor.cfWebRTCUrl || "",
            playbackUrl: `https://${process.env.CLOUDFLARE_STREAM_SUBDOMAIN}/${instructor.cfLiveInputId}/manifest/video.m3u8`,
        };
    }

    const label = `${instructor.firstName} ${instructor.lastName} - Live Input`;
    const created = await createLiveInput(label, { requireSignedURLs: true });

    instructor.cfLiveInputId = created.liveInputId;
    instructor.cfRtmpUrl = created.rtmpUrl;
    instructor.cfRtmpKey = created.rtmpKey;
    instructor.cfSrtUrl = created.srtUrl;
    instructor.cfWebRTCUrl = created.webRTCUrl;
    await instructor.save({ validateBeforeSave: false });

    return {
        cfLiveInputId: created.liveInputId,
        rtmpUrl: created.rtmpUrl,
        rtmpKey: created.rtmpKey,
        srtUrl: created.srtUrl,
        webRTCUrl: created.webRTCUrl,
        playbackUrl: created.playbackUrl,
    };
};

/**
 * Full Course Service
 * Centralized logic for full course CRUD operations.
 * Used by both admin and instructor controllers.
 */

// ========================= HELPERS =========================

/**
 * Populate a course with its full hierarchical structure
 */
const populateFullCourse = (query) => {
    return query
        .populate("instructor", "firstName lastName email profilePicture")
        .populate({
            path: "modules",
            options: { sort: { order: 1 } },
            populate: {
                path: "lessons",
                options: { sort: { order: 1 } },
                populate: [
                    { path: "videoId" },
                    { path: "assignmentId" },
                    { path: "liveClassId" },
                    { path: "materialId" }
                ]
            }
        });
};

/**
 * Recalculate and update course totals (modules, lessons, duration)
 */
const recalculateCourseTotals = async (courseId) => {
    const allModules = await Module.find({ course: courseId });
    const allLessons = await Lesson.find({ course: courseId });
    const allModuleIds = allModules.map(m => m._id);
    const previewLessonIds = allLessons.filter(l => l.isFree).map(l => l._id);

    let calcDuration = 0;
    for (const les of allLessons) {
        if (les.videoId) {
            const video = await Video.findById(les.videoId);
            if (video) calcDuration += video.duration || 0;
        }
        if (les.liveClassId) {
            const lc = await LiveClass.findById(les.liveClassId);
            if (lc) calcDuration += lc.duration || 0;
        }
    }

    return Course.findByIdAndUpdate(courseId, {
        modules: allModuleIds,
        totalModules: allModules.length,
        totalLessons: allLessons.length,
        totalDuration: Math.ceil(calcDuration / 60),
        previewLessons: previewLessonIds.length > 0 ? previewLessonIds : undefined
    }, { new: true });
};

/**
 * Validate whether a course is ready to be published.
 * Returns a list of validation errors; empty array means publish-ready.
 */
const validateCoursePublishReadiness = async (courseId) => {
    const validationErrors = [];

    const course = await Course.findById(courseId).lean();
    if (!course) return ["Course not found"];

    if (!course.title || course.title.trim().length < 3) {
        validationErrors.push("Course title must be at least 3 characters");
    }
    if (!course.description || course.description.trim().length < 10) {
        validationErrors.push("Course description must be at least 10 characters");
    }
    if (!course.category) {
        validationErrors.push("Course category is required");
    }
    if (!course.subCategory) {
        validationErrors.push("Course subcategory is required");
    }
    if (!course.thumbnail?.secure_url) {
        validationErrors.push("Course thumbnail is required");
    }
    if (course.thumbnail?.public_id === DRAFT_THUMBNAIL_PLACEHOLDER.public_id) {
        validationErrors.push("Draft placeholder thumbnail is not allowed for published courses");
    }

    if (course.projectBased) {
        const validProjects = (course.projects || []).filter(
            (project) => project?.title?.trim() && project?.description?.trim()
        );
        if (validProjects.length === 0) {
            validationErrors.push("At least one valid project is required when projectBased is enabled");
        }
    }

    const modules = await Module.find({ course: courseId }).select("_id title").lean();
    if (modules.length === 0) {
        validationErrors.push("Course must have at least one module");
        return validationErrors;
    }

    const moduleIds = modules.map((moduleDoc) => moduleDoc._id);
    const lessons = await Lesson.find({ course: courseId, module: { $in: moduleIds } })
        .select("_id module type title content videoId assignmentId liveClassId materialId")
        .lean();

    if (lessons.length === 0) {
        validationErrors.push("Course must have at least one lesson");
        return validationErrors;
    }

    const lessonsByModule = new Map();
    for (const lesson of lessons) {
        const key = lesson.module?.toString();
        const count = lessonsByModule.get(key) || 0;
        lessonsByModule.set(key, count + 1);
    }

    for (const moduleDoc of modules) {
        const key = moduleDoc._id.toString();
        if (!lessonsByModule.get(key)) {
            validationErrors.push(`Module "${moduleDoc.title || key}" must contain at least one lesson`);
        }
    }

    for (const lesson of lessons) {
        const lessonLabel = lesson.title || lesson._id?.toString() || "lesson";

        if (!lesson.type) {
            validationErrors.push(`Lesson "${lessonLabel}" is missing lesson type`);
            continue;
        }

        if (lesson.type === "video" && !lesson.videoId) {
            validationErrors.push(`Video lesson "${lessonLabel}" must have a video`);
        }
        if (lesson.type === "assignment" && !lesson.assignmentId) {
            validationErrors.push(`Assignment lesson "${lessonLabel}" must have an assignment`);
        }
        if (lesson.type === "live" && !lesson.liveClassId) {
            validationErrors.push(`Live lesson "${lessonLabel}" must have a live class setup`);
        }
        if (lesson.type === "material" && !lesson.materialId) {
            validationErrors.push(`Material lesson "${lessonLabel}" must have material content`);
        }
        if (lesson.type === "article") {
            const article = lesson.content?.articleContent || "";
            if (article.trim().length < 10) {
                validationErrors.push(`Article lesson "${lessonLabel}" must have at least 10 characters of content`);
            }
        }
    }

    return validationErrors;
};

/**
 * Create type-specific linked model for a lesson (video, assignment, live, material, article)
 */
const createLinkedModel = async ({
    lessonType, lesInfo, lessonDoc, targetLesson,
    instructorId, courseId, moduleId,
    courseName, moduleName, lessonName,
    mi, li, files, errors, rollbackCtx
}) => {
    // ── VIDEO ──
    if (lessonType === "video" && lesInfo.video) {
        try {
            // Find video file
            const vidFile = findFile(
                files,
                `module_${mi}_lesson_${li}_video`,
                `video.${mi}.${li}.0`
            );

            if (!vidFile && !lesInfo.video?.bunnyVideoId && !lesInfo.video?.url) {
                errors.push(`Video file missing for lesson "${lesInfo.title}"`);
                return;
            }

            const videoData = {
                instructor: instructorId,
                course: courseId,
                lesson: targetLesson?._id || lessonDoc._id,
                title: lesInfo.video.title || lesInfo.title,
                description: lesInfo.video.description || "",
                isPublished: true,
                isPublic: true,
                status: "uploading",
                createdBy: instructorId,
                uploadedAt: new Date(),
            };

            // If video file exists, upload to Bunny
            if (vidFile) {
                try {
                    const vidResult = await uploadVideo(
                        vidFile.buffer,
                        courseName,
                        moduleName,
                        lessonName,
                        lesInfo.video.title || `video`
                    );
                    videoData.bunnyVideoId = vidResult.bunnyVideoId || vidResult.public_id;
                    videoData.url = vidResult.secure_url;
                    videoData.duration = Number(vidResult.duration) || Number(lesInfo.video.duration) || 0;
                    videoData.fileSize = vidResult.bytes || 0;
                    videoData.status = videoData.bunnyVideoId ? "available" : (vidResult.status || "processing");
                    videoData.thumbnail = vidResult.thumbnail || getVideoThumbnail(vidResult.bunnyVideoId || vidResult.public_id);
                    trackUploadedBunnyVideo(rollbackCtx, videoData.bunnyVideoId);
                } catch (uploadErr) {
                    logger.error(`Video upload to Bunny failed: ${uploadErr.message}`);
                    throw new Error(`Video upload failed for "${lesInfo.title}": ${uploadErr.message}`);
                }
            } else if (lesInfo.video?.bunnyVideoId) {
                // Video already exists on Bunny
                videoData.bunnyVideoId = lesInfo.video.bunnyVideoId;
                videoData.url = lesInfo.video.url;
                videoData.duration = lesInfo.video.duration || 0;
                videoData.thumbnail = lesInfo.video.thumbnail;
                videoData.status = "available";
            }

            // Handle thumbnail upload if provided
            const vidThumbFile = findFile(
                files,
                `module_${mi}_lesson_${li}_video_thumb`,
                `video.${mi}.${li}.thumb`
            );
            if (vidThumbFile) {
                try {
                    const thumbResult = await uploadLessonThumbnail(
                        vidThumbFile.buffer,
                        courseName,
                        moduleName,
                        lessonName
                    );
                    videoData.thumbnail = thumbResult.secure_url;
                    trackUploadedRawUrl(rollbackCtx, thumbResult.secure_url);
                    trackUploadedImagePublicId(rollbackCtx, thumbResult.public_id);
                } catch (thumbErr) {
                    logger.warn(`Video thumbnail upload failed: ${thumbErr.message}`);
                    throw new Error(`Video thumbnail upload failed for "${lesInfo.title}": ${thumbErr.message}`);
                }
            }

            // Create or update Video document
            let video;
            if (targetLesson) {
                video = await Video.findOneAndUpdate(
                    { lesson: targetLesson._id },
                    videoData,
                    { new: true, upsert: true }
                );
            } else {
                video = await Video.create(videoData);
            }

            lessonDoc.videoId = video._id;
        } catch (e) {
            logger.error(`Video creation failed for lesson ${mi}.${li}: ${e.message}`);
            throw new Error(`Video for "${lesInfo.title}": ${e.message}`);
        }
    }

    // ── ASSIGNMENT ──
    if (lessonType === "assignment" && lesInfo.assignment) {
        try {
            const asgData = {
                ...lesInfo.assignment,
                course: courseId,
                lesson: targetLesson?._id,
                instructor: instructorId,
                createdBy: instructorId,
            };

            const asgThumbFile = findFile(
                files,
                `module_${mi}_lesson_${li}_assignment_thumb`,
                `assignment.${mi}.${li}.thumb`
            );
            if (asgThumbFile) {
                const result = await uploadAssignmentThumbnail(asgThumbFile.buffer, courseName, lesInfo.assignment.title || lessonName);
                asgData.thumbnail = { public_id: result.public_id, secure_url: result.secure_url };
            }

            const asgFiles = findFilesByPrefixes(files, [
                `module_${mi}_lesson_${li}_assignment_file_`,
                `assignment.${mi}.${li}.file.`
            ]);
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

    // ── LIVE CLASS ──
    if (lessonType === "live" && lesInfo.liveClass) {
        try {
            const cfCreds = await ensureInstructorCloudflareInput(instructorId);

            const lcData = {
                ...lesInfo.liveClass,
                instructor: instructorId,
                course: courseId,
                createdBy: instructorId,
                cfLiveInputId: cfCreds.cfLiveInputId,
                rtmpUrl: cfCreds.rtmpUrl,
                rtmpKey: cfCreds.rtmpKey,
                srtUrl: cfCreds.srtUrl,
                webRTCUrl: cfCreds.webRTCUrl,
                playbackUrl: cfCreds.playbackUrl,
                requireSignedURLs: true,
            };
            delete lcData.zoomMeetingId;
            delete lcData.zoomJoinUrl;
            delete lcData.zoomStartUrl;
            delete lcData.zoomPassword;

            const lc = await LiveClass.create(lcData);
            lessonDoc.liveClassId = lc._id;
            if (targetLesson) {
                await Lesson.findByIdAndUpdate(targetLesson._id, { liveClassId: lc._id });
            }
        } catch (e) {
            logger.error(`LiveClass creation failed for lesson ${mi}.${li}: ${e.message}`);
            errors.push(`LiveClass for "${lesInfo.title}": ${e.message}`);
        }
    }

    // ── MATERIAL ──
    if (lessonType === "material" && lesInfo.material) {
        try {
            const matData = {
                ...lesInfo.material,
                instructor: instructorId,
                course: courseId,
                module: moduleId,
                lesson: targetLesson?._id,
                status: "published",
                isPublic: !!lesInfo.isFree,
                accessLevel: lesInfo.isFree ? "public" : (lesInfo.material?.accessLevel || "enrolled_students"),
                createdBy: instructorId,
            };

            const matFile = findFile(
                files,
                `module_${mi}_lesson_${li}_material_file`,
                `material.${mi}.${li}.0`
            );
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

    // ── ARTICLE ──
    if (lessonType === "article") {
        lessonDoc.content = lessonDoc.content || {};
        lessonDoc.content.articleContent = lesInfo.content?.articleContent || "";
    }
};

/**
 * Create modules and lessons for a course (shared by createFullCourse and saveDraftCourse)
 */
const createModulesAndLessons = async ({
    modulesData, course, instructorId, courseName, files, errors,
    existingModuleMap = new Map(), existingLessonMap = new Map(),
    existingModuleIds = [], rollbackCtx
}) => {
    let totalModules = 0;
    let totalLessons = 0;
    const moduleIds = [...existingModuleIds];

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
            const modThumbFile = findFile(
                files,
                `module_${mi}_thumbnail`,
                `module.${mi}.thumbnail`
            );
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
                continue;
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

                const needsLinkedModel =
                    (lessonType === "video" && lesInfo.video && !existingLesson.videoId) ||
                    (lessonType === "assignment" && lesInfo.assignment && !existingLesson.assignmentId) ||
                    (lessonType === "live" && lesInfo.liveClass && !existingLesson.liveClassId) ||
                    (lessonType === "material" && lesInfo.material && !existingLesson.materialId);

                if (!needsLinkedModel) continue;
            }

            // Lesson thumbnail
            let lesThumbnail = null;
            const lesThumbFile = findFile(
                files,
                `module_${mi}_lesson_${li}_thumbnail`,
                `lesson.${mi}.${li}.thumbnail`
            );
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
                isPublished: course.status === "published" || course.isPublished,
                thumbnail: lesThumbnail,
                content: {},
                createdBy: instructorId,
            };

            const targetLesson = existingLesson || null;

            // For brand-new lessons, pre-generate _id so linked models (like Video)
            // can safely reference lesson before Lesson.create runs.
            if (!targetLesson) {
                lessonDoc._id = new mongoose.Types.ObjectId();
            }

            // Create linked model (video, assignment, live, material, article)
            await createLinkedModel({
                lessonType, lesInfo, lessonDoc, targetLesson,
                instructorId, courseId: course._id, moduleId: moduleDoc._id,
                courseName, moduleName, lessonName,
                mi, li, files, errors, rollbackCtx
            });

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

    return { totalModules, totalLessons, moduleIds };
};

/**
 * Delete all linked models for lessons in a module (used by saveDraftCourse and deleteFullCourse)
 */
const deleteLessonLinkedModels = async (lesson, errors = []) => {
    // Video + Bunny video
    if (lesson.videoId) {
        try {
            const video = await Video.findById(lesson.videoId);
            if (video?.bunnyVideoId) {
                try { await deleteBunnyVideo(video.bunnyVideoId); } catch (e) {
                    logger.warn(`Bunny video delete failed: ${e.message}`);
                }
            }
            await Video.findByIdAndDelete(lesson.videoId);
        } catch (e) {
            logger.error(`Video deletion error: ${e.message}`);
            errors.push(`Video: ${e.message}`);
        }
    }

    // Assignment + attachments
    if (lesson.assignmentId) {
        try {
            const asg = await Assignment.findById(lesson.assignmentId);
            if (asg?.attachments?.length > 0) {
                for (const att of asg.attachments) {
                    try { await deleteRawResource(att.url || att); } catch (e) {
                        logger.warn(`Attachment delete failed: ${e.message}`);
                    }
                }
            }
            await Assignment.findByIdAndDelete(lesson.assignmentId);
        } catch (e) {
            logger.error(`Assignment deletion error: ${e.message}`);
            errors.push(`Assignment: ${e.message}`);
        }
    }

    // Live class + stream
    if (lesson.liveClassId) {
        try {
            const lc = await LiveClass.findById(lesson.liveClassId);
            if (lc?.streamId) {
                try { await deleteLiveStream(lc.streamId); } catch (e) {
                    logger.warn(`Stream deletion failed: ${e.message}`);
                }
            }
            if (lc?.bunnyVideoId) {
                try { await deleteLiveStream(lc.bunnyVideoId); } catch (e) {
                    logger.warn(`Stream deletion failed: ${e.message}`);
                }
            }
            await LiveClass.findByIdAndDelete(lesson.liveClassId);
        } catch (e) {
            logger.error(`LiveClass deletion error: ${e.message}`);
            errors.push(`LiveClass: ${e.message}`);
        }
    }

    // Material + file
    if (lesson.materialId) {
        try {
            const mat = await Material.findById(lesson.materialId);
            if (mat?.fileUrl) {
                try { await deleteRawResource(mat.fileUrl); } catch (e) {
                    logger.warn(`Material file delete failed: ${e.message}`);
                }
            }
            await Material.findByIdAndDelete(lesson.materialId);
        } catch (e) {
            logger.error(`Material deletion error: ${e.message}`);
            errors.push(`Material: ${e.message}`);
        }
    }

    // Related materials for this lesson
    try {
        const relatedMaterials = await Material.find({ lesson: lesson._id });
        for (const mat of relatedMaterials) {
            if (mat.fileUrl) {
                try { await deleteRawResource(mat.fileUrl); } catch (e) {
                    logger.warn(`Related material file delete failed: ${e.message}`);
                }
            }
        }
        await Material.deleteMany({ lesson: lesson._id });
    } catch (e) {
        logger.error(`Related materials deletion error: ${e.message}`);
        errors.push(`Related materials: ${e.message}`);
    }
};

/**
 * Delete all modules, lessons, and their linked models for a course
 */
const deleteModulesAndLessons = async (courseId, errors = []) => {
    const modules = await Module.find({ course: courseId });

    for (const module of modules) {
        // Delete module thumbnail
        if (module.thumbnail?.public_id) {
            try { await deleteImage(module.thumbnail.public_id); } catch (e) {
                logger.error(`Failed to delete module thumbnail: ${e.message}`);
                errors.push(`Module thumbnail: ${e.message}`);
            }
        }

        const lessons = await Lesson.find({ module: module._id });
        for (const lesson of lessons) {
            // Delete lesson thumbnail
            if (lesson.thumbnail?.public_id) {
                try { await deleteImage(lesson.thumbnail.public_id); } catch (e) {
                    logger.error(`Failed to delete lesson thumbnail: ${e.message}`);
                    errors.push(`Lesson thumbnail: ${e.message}`);
                }
            }

            await deleteLessonLinkedModels(lesson, errors);

            // Delete submissions and progress
            try { await Submission.deleteMany({ lesson: lesson._id }); } catch (e) {
                errors.push(`Submissions: ${e.message}`);
            }
            try { await Progress.deleteMany({ lesson: lesson._id }); } catch (e) {
                errors.push(`Progress: ${e.message}`);
            }
        }

        await Lesson.deleteMany({ module: module._id });
    }

    await Module.deleteMany({ course: courseId });
};

// ========================= MAIN SERVICE FUNCTIONS =========================

/**
 * Get full course structure (hierarchical: course → modules → lessons → linked models)
 */
export const getFullCourseService = async (courseId) => {
    const course = await Course.findById(courseId)
        .populate("instructor", "firstName lastName email specialization")
        .populate("certificates");

    if (!course) return null;

    const modules = await Module.find({ course: courseId })
        .populate("createdBy", "firstName lastName email")
        .populate("updatedBy", "firstName lastName email")
        .sort({ order: 1 });

    const courseStructure = {
        course: course.toObject(),
        modules: []
    };

    for (const module of modules) {
        const moduleObj = module.toObject();
        moduleObj.lessons = [];

        const lessons = await Lesson.find({ module: module._id })
            .populate("createdBy", "firstName lastName email")
            .sort({ order: 1 });

        for (const lesson of lessons) {
            const lessonObj = lesson.toObject();
            lessonObj.details = {};

            if (lesson.type === "video" && lesson.videoId) {
                const video = await Video.findById(lesson.videoId);
                if (video) lessonObj.details.video = video.toObject();
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

            const materials = await Material.find({ lesson: lesson._id }).lean();
            lessonObj.materials = materials;

            moduleObj.lessons.push(lessonObj);
        }

        courseStructure.modules.push(moduleObj);
    }

    return courseStructure;
};

/**
 * Create a full course with modules, lessons, and all linked models
 * @param {Object} options
 * @param {Object} options.data - Parsed course data (JSON)
 * @param {Array} options.files - Uploaded files (req.files)
 * @param {string} options.instructorId - Instructor ID
 * @returns {Object} { course, errors, isResuming }
 */
export const createFullCourseService = async ({ data, files, instructorId }) => {
    const rollbackCtx = createMediaRollbackContext();

    try {
        const instructor = await Instructor.findById(instructorId);
        if (!instructor) throw new Error("Instructor not found");

        const courseName = (data.title || "untitled").replace(/\s+/g, "_");
        const errors = [];

    // ── 1. COURSE THUMBNAIL ──
    let thumbnail = null;
    const thumbFile = findFile(files, "thumbnail", "course.thumbnail");
    if (thumbFile) {
        try {
            const result = await uploadCourseThumbnail(thumbFile.buffer, courseName);
            thumbnail = { public_id: result.public_id, secure_url: result.secure_url };
        } catch (e) {
            logger.error(`Course thumbnail upload failed: ${e.message}`);
            throw new Error("Course thumbnail upload failed");
        }
    }

    // ── 2. TRAILER VIDEO ──
        let trailerVideo = data.trailerVideo || undefined;
        const trailerFile = findFile(files, "trailerVideo", "course.trailerVideo");
        if (trailerFile) {
            try {
                const result = await uploadCourseTrailer(trailerFile.buffer, courseName);
                trailerVideo = result.bunnyVideoId || result.public_id || result.secure_url;
                trackUploadedBunnyVideo(rollbackCtx, result.bunnyVideoId || result.public_id);
            } catch (e) {
                logger.error(`Course trailer upload failed: ${e.message}`);
                throw new Error(`Course trailer upload failed: ${e.message}`);
            }
        }

    // ── 3. CHECK FOR EXISTING COURSE (idempotent resume) ──
    let course = await Course.findOne({ title: data.title }).populate("modules");
    let isResuming = false;
    const existingModuleMap = new Map();
    const existingLessonMap = new Map();

    if (!course && !thumbnail && !data.thumbnail) {
        throw new Error("Course thumbnail is required");
    }

    if (course) {
        isResuming = true;
        logger.info(`Course "${data.title}" already exists (id: ${course._id}), resuming creation`);

        Object.assign(course, {
            description: data.description || course.description,
            shortDescription: data.shortDescription || course.shortDescription,
            category: data.category || course.category,
            subCategory: data.subCategory || course.subCategory,
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
            isInternshipEligible: data.isInternshipEligible ?? course.isInternshipEligible,
            projectBased: data.projectBased ?? course.projectBased,
            projects: data.projects || course.projects,
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

        // Build maps of existing modules & lessons
        const existingModules = await Module.find({ course: course._id });
        for (const mod of existingModules) {
            existingModuleMap.set(mod.title, mod);
            const existingLessons = await Lesson.find({ module: mod._id });
            for (const les of existingLessons) {
                existingLessonMap.set(`${mod.title}::${les.title}`, les);
            }
        }
    }

    // ── 4. CREATE COURSE ──
    if (!course) {
        const courseData = {
            title: data.title,
            description: data.description,
            shortDescription: data.shortDescription,
            instructor: instructorId,
            category: data.category,
            subCategory: data.subCategory,
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
            isInternshipEligible: data.isInternshipEligible || false,
            projectBased: data.projectBased || false,
            projects: data.projects || [],
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

    // ── 5. CERTIFICATE ──
    if (data.certificateEnabled && data.certificate && (!course.certificates || course.certificates.length === 0)) {
        try {
            const certData = {
                title: data.certificate.title || `${data.title} Certificate`,
                description: data.certificate.description || "",
                course: course._id,
                instructor: instructorId,
                isTemplate: true,
                status: "active",
                completionPercentage: 100,
                totalLessons: 0,
                completedLessons: 0,
                timeSpent: 0,
                verificationCode: "",
                certificateId: "",
                expiryDate: data.certificate.expiryDate || undefined,
                skills: data.certificate.skills || [],
            };

            const certFile = findFile(files, "certificateImage", "certificate.0");
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
    const existingModuleIds = course.modules?.map(m => m._id || m) || [];

        await createModulesAndLessons({
            modulesData, course, instructorId, courseName, files, errors,
            existingModuleMap, existingLessonMap, existingModuleIds, rollbackCtx
        });

        if (hasVideoRelatedErrors(errors)) {
            throw new Error(`Video component errors: ${errors.filter((err) => /video|trailer|bunny|thumbnail/i.test(String(err || ""))).join(" | ")}`);
        }

    // ── 7. UPDATE TOTALS ──
    await recalculateCourseTotals(course._id);

    // Add course to instructor (only on first creation)
    if (!isResuming) {
        await Instructor.findByIdAndUpdate(instructorId, {
            $push: { courses: course._id },
            $inc: { totalCourses: 1 }
        });
    }

    // ── 8. RETURN POPULATED COURSE ──
    const updatedCourse = await populateFullCourse(Course.findById(course._id));

        return { course: updatedCourse, errors, isResuming };
    } catch (error) {
        await rollbackUploadedMedia(rollbackCtx);
        throw error;
    }
};

/**
 * Save / update a draft course with modules and lessons
 * @param {Object} options
 * @param {string} options.courseId - Existing course ID
 * @param {Object} options.data - Parsed course data
 * @param {Array} options.files - Uploaded files
 * @returns {Object} { course }
 */
export const saveDraftCourseService = async ({ courseId, data, files }) => {
    const rollbackCtx = createMediaRollbackContext();

    try {
    const { modules: modulesData, ...courseFields } = data;

    let course = await Course.findById(courseId);
    if (!course) throw new Error("Course not found");

    const courseName = (courseFields.title || course.title || "untitled").replace(/\s+/g, "_");
    const instructorId = course.instructor;

    // Handle thumbnail update
    const thumbnailFile = findFile(files, "thumbnail", "course.thumbnail");
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
    const trailerFile = findFile(files, "trailerVideo", "course.trailerVideo");
    if (trailerFile) {
        try {
            const result = await uploadCourseTrailer(trailerFile.buffer, courseName);
            courseFields.trailerVideo = result.bunnyVideoId || result.public_id || result.secure_url;
            trackUploadedBunnyVideo(rollbackCtx, result.bunnyVideoId || result.public_id);
        } catch (error) {
            logger.error(`Course trailer update failed: ${error.message}`);
            throw new Error(`Course trailer update failed: ${error.message}`);
        }
    }

    courseFields.status = "draft";
    courseFields.isPublished = false;

    course = await Course.findByIdAndUpdate(courseId, courseFields, { new: true, runValidators: false });

    // Sync modules if provided
    if (modulesData && Array.isArray(modulesData)) {
        const errors = [];

        // Delete old modules and lessons
        await deleteModulesAndLessons(courseId, errors);

        // Create new modules and lessons
        await createModulesAndLessons({
            modulesData, course, instructorId, courseName, files, errors, rollbackCtx
        });

        if (hasVideoRelatedErrors(errors)) {
            throw new Error(`Video component errors: ${errors.filter((err) => /video|trailer|bunny|thumbnail/i.test(String(err || ""))).join(" | ")}`);
        }

        // Recalculate totals
        await recalculateCourseTotals(course._id);

        // Return populated course
        course = await populateFullCourse(Course.findById(courseId));
    }

    return { course };
    } catch (error) {
        await rollbackUploadedMedia(rollbackCtx);
        throw error;
    }
};

/**
 * Create a new draft course without strict validation to allow partial progress saves.
 * @param {Object} options
 * @param {Object} options.data - Parsed course data
 * @param {Array} options.files - Uploaded files
 * @param {string} options.instructorId - Authenticated instructor ID
 * @returns {Object} { course }
 */
export const createDraftCourseService = async ({ data = {}, files, instructorId }) => {
    const rollbackCtx = createMediaRollbackContext();

    try {
    const instructor = await Instructor.findById(instructorId);
    if (!instructor) throw new Error("Instructor not found");

    const { modules: modulesData, ...courseFields } = data || {};
    const courseName = (courseFields.title || `draft_${Date.now()}`).replace(/\s+/g, "_");

    let thumbnail = courseFields.thumbnail || DRAFT_THUMBNAIL_PLACEHOLDER;
    const thumbnailFile = findFile(files, "thumbnail", "course.thumbnail");
    if (thumbnailFile) {
        try {
            const result = await uploadCourseThumbnail(thumbnailFile.buffer, courseName);
            thumbnail = { public_id: result.public_id, secure_url: result.secure_url };
        } catch (error) {
            logger.error(`Draft thumbnail upload failed: ${error.message}`);
        }
    }

    let trailerVideo = courseFields.trailerVideo || undefined;
    const trailerFile = findFile(files, "trailerVideo", "course.trailerVideo");
    if (trailerFile) {
        try {
            const result = await uploadCourseTrailer(trailerFile.buffer, courseName);
            trailerVideo = result.bunnyVideoId || result.public_id || result.secure_url;
            trackUploadedBunnyVideo(rollbackCtx, result.bunnyVideoId || result.public_id);
        } catch (error) {
            logger.error(`Draft trailer upload failed: ${error.message}`);
            throw new Error(`Draft trailer upload failed: ${error.message}`);
        }
    }

    const draftCourse = new Course({
        ...courseFields,
        instructor: instructorId,
        thumbnail,
        trailerVideo,
        status: "draft",
        isPublished: false,
        createdBy: instructorId,
        updatedBy: instructorId,
    });

    await draftCourse.save({ validateBeforeSave: false });

    if (modulesData && Array.isArray(modulesData)) {
        const errors = [];
        await createModulesAndLessons({
            modulesData,
            course: draftCourse,
            instructorId,
            courseName,
            files,
            errors,
            rollbackCtx,
        });

        if (hasVideoRelatedErrors(errors)) {
            throw new Error(`Video component errors: ${errors.filter((err) => /video|trailer|bunny|thumbnail/i.test(String(err || ""))).join(" | ")}`);
        }
        await recalculateCourseTotals(draftCourse._id);
    }

    await Instructor.findByIdAndUpdate(instructorId, {
        $addToSet: { courses: draftCourse._id },
    });

    const course = await populateFullCourse(Course.findById(draftCourse._id));
    return { course };
    } catch (error) {
        await rollbackUploadedMedia(rollbackCtx);
        throw error;
    }
};

/**
 * Update full course structure (course, modules, lessons with media handling)
 * @param {Object} options
 * @param {string} options.courseId
 * @param {Object} options.updateData - Parsed update data
 * @param {Array} options.files - Uploaded files
 * @returns {Object} { course, errors }
 */
export const updateFullCourseService = async ({ courseId, updateData, files }) => {
    const rollbackCtx = createMediaRollbackContext();

    try {
    const course = await Course.findById(courseId);
    if (!course) throw new Error("Course not found");

    const errors = [];
    let requestedStatus;
    const instructorId = course.instructor;

    const createLessonInModule = async ({ moduleDoc, moduleData, lessonData, mIdx, lIdx }) => {
        const moduleName = (moduleData.title || moduleDoc.title || `Module_${mIdx + 1}`).replace(/\s+/g, "_");
        const lessonName = (lessonData.title || `Lesson_${lIdx + 1}`).replace(/\s+/g, "_");
        const lessonType = lessonData.type || "video";

        let lessonThumbnail = null;
        const lessonThumbFile = files?.find(f => f.fieldname === `lesson.${mIdx}.${lIdx}.thumbnail`);
        if (lessonThumbFile) {
            try {
                const result = await updateImage(
                    null,
                    lessonThumbFile.buffer,
                    uploadLessonThumbnail,
                    course.title,
                    moduleData.title || moduleDoc.title,
                    lessonData.title || lessonName
                );
                lessonThumbnail = { public_id: result.public_id, secure_url: result.secure_url };
            } catch (error) {
                logger.error(`Lesson thumbnail upload failed: ${error.message}`);
                errors.push(`Lesson thumbnail: ${error.message}`);
            }
        }

        const lessonDoc = {
            _id: new mongoose.Types.ObjectId(),
            title: lessonData.title,
            description: lessonData.description,
            course: course._id,
            module: moduleDoc._id,
            order: lessonData.order || lIdx + 1,
            type: lessonType,
            isFree: lessonData.isFree || false,
            thumbnail: lessonThumbnail,
            content: {},
            createdBy: instructorId,
            updatedBy: instructorId,
        };

        await createLinkedModel({
            lessonType,
            lesInfo: lessonData,
            lessonDoc,
            targetLesson: null,
            instructorId,
            courseId: course._id,
            moduleId: moduleDoc._id,
            courseName: (course.title || "course").replace(/\s+/g, "_"),
            moduleName,
            lessonName,
            mi: mIdx,
            li: lIdx,
            files,
            errors,
            rollbackCtx,
        });

        const createdLesson = await Lesson.create(lessonDoc);

        // Backfill lesson references on linked models created before lesson document existed.
        if (createdLesson.assignmentId) {
            await Assignment.findByIdAndUpdate(createdLesson.assignmentId, { lesson: createdLesson._id, updatedBy: instructorId });
        }
        if (createdLesson.materialId) {
            await Material.findByIdAndUpdate(createdLesson.materialId, { lesson: createdLesson._id, updatedBy: instructorId });
        }

        await Module.findByIdAndUpdate(moduleDoc._id, {
            $addToSet: { lessons: createdLesson._id },
            $inc: { totalLessons: 1 }
        });

        return createdLesson;
    };

    // ── UPDATE COURSE-LEVEL DATA ──
    if (updateData.course) {
        const courseUpdate = updateData.course;
        requestedStatus = Object.prototype.hasOwnProperty.call(courseUpdate, "status") ? courseUpdate.status : undefined;

        // Handle thumbnail
        const courseThumbnailFile = files?.find(f => f.fieldname === "course.thumbnail");
        if (courseThumbnailFile) {
            const oldPublicId = course.thumbnail?.public_id || null;
            try {
                const result = await updateImage(oldPublicId, courseThumbnailFile.buffer, uploadCourseThumbnail, courseUpdate.title || course.title);
                courseUpdate.thumbnail = { public_id: result.public_id, secure_url: result.secure_url };
            } catch (error) {
                logger.error(`Course thumbnail update failed: ${error.message}`);
                throw new Error("Course thumbnail upload failed");
            }
        }

        // Handle trailer
        const courseTrailerFile = files?.find(f => f.fieldname === "course.trailerVideo");
        if (courseTrailerFile) {
            try {
                if (course.trailerVideo) {
                    const oldTrailerId = extractBunnyVideoId(course.trailerVideo) || course.trailerVideo;
                    await deleteBunnyVideo(oldTrailerId).catch(err =>
                        logger.warn(`Old trailer delete failed: ${err.message}`)
                    );
                }
                const result = await uploadCourseTrailer(courseTrailerFile.buffer, course.title || "course");
                courseUpdate.trailerVideo = result.bunnyVideoId || result.public_id || result.secure_url;
                trackUploadedBunnyVideo(rollbackCtx, result.bunnyVideoId || result.public_id);
            } catch (error) {
                logger.error(`Course trailer update failed: ${error.message}`);
                throw new Error("Course trailer upload failed");
            }
        }

        // Prevent direct update of computed fields
        const restrictedFields = [
            "modules",
            "totalModules",
            "totalLessons",
            "totalDuration",
            "certificates",
            "isPublished",
            "publishedAt",
            "status"
        ];
        restrictedFields.forEach(field => delete courseUpdate[field]);

        Object.assign(course, courseUpdate);

        if (requestedStatus && requestedStatus !== "published") {
            course.status = requestedStatus;
            course.isPublished = false;
            if (requestedStatus !== "archived") {
                course.publishedAt = undefined;
            }
        }

        await course.save({ validateBeforeSave: false });
    }

    // ── UPDATE MODULES & LESSONS ──
    if (updateData.modules && Array.isArray(updateData.modules)) {
        for (let mIdx = 0; mIdx < updateData.modules.length; mIdx++) {
            const moduleData = updateData.modules[mIdx];
            let module;
            let isNewModule = false;

            if (moduleData.id) {
                module = await Module.findById(moduleData.id);
                if (!module) { errors.push(`Module ${moduleData.id} not found`); continue; }
            } else {
                isNewModule = true;
                let moduleThumbnail = null;
                const modThumbFile = files?.find(f => f.fieldname === `module.${mIdx}.thumbnail`);
                if (modThumbFile) {
                    try {
                        const result = await updateImage(
                            null,
                            modThumbFile.buffer,
                            uploadModuleThumbnail,
                            course.title,
                            moduleData.title || `Module_${mIdx + 1}`
                        );
                        moduleThumbnail = { public_id: result.public_id, secure_url: result.secure_url };
                    } catch (error) {
                        logger.error(`Module thumbnail upload failed: ${error.message}`);
                        errors.push(`Module thumbnail: ${error.message}`);
                    }
                }

                module = await Module.create({
                    title: moduleData.title || `Module ${mIdx + 1}`,
                    description: moduleData.description || "",
                    course: course._id,
                    order: moduleData.order || mIdx + 1,
                    objectives: moduleData.objectives || [],
                    isPublished: moduleData.isPublished || false,
                    thumbnail: moduleThumbnail,
                    createdBy: instructorId,
                    updatedBy: instructorId,
                });
            }

            // Module thumbnail
            const modThumbFile = files?.find(f => f.fieldname === `module.${mIdx}.thumbnail`);
            if (modThumbFile && !isNewModule) {
                const oldPublicId = module.thumbnail?.public_id || null;
                try {
                    const result = await updateImage(oldPublicId, modThumbFile.buffer, uploadModuleThumbnail, course.title, moduleData.title || module.title);
                    module.thumbnail = { public_id: result.public_id, secure_url: result.secure_url };
                } catch (error) {
                    logger.error(`Module thumbnail update failed: ${error.message}`);
                    errors.push(`Module thumbnail: ${error.message}`);
                }
            }

            if (moduleData.title) module.title = moduleData.title;
            if (moduleData.description !== undefined) module.description = moduleData.description;
            if (moduleData.order) module.order = moduleData.order;
            if (moduleData.objectives) module.objectives = moduleData.objectives;
            if (moduleData.isPublished !== undefined) module.isPublished = moduleData.isPublished;

            await module.save({ validateBeforeSave: false });

            // ── UPDATE LESSONS ──
            if (moduleData.lessons && Array.isArray(moduleData.lessons)) {
                for (let lIdx = 0; lIdx < moduleData.lessons.length; lIdx++) {
                    const lessonData = moduleData.lessons[lIdx];
                    let lesson = null;

                    if (lessonData.id) {
                        lesson = await Lesson.findById(lessonData.id);
                        if (!lesson) {
                            errors.push(`Lesson ${lessonData.id} not found`);
                            continue;
                        }
                    } else {
                        const fallbackOrder = lessonData.order || lIdx + 1;
                        const fallbackFilters = [{ order: fallbackOrder }];
                        if (lessonData.title) {
                            fallbackFilters.push({ title: lessonData.title });
                        }

                        lesson = await Lesson.findOne({
                            course: course._id,
                            module: module._id,
                            $or: fallbackFilters,
                        });

                        if (!lesson) {
                            try {
                                await createLessonInModule({ moduleDoc: module, moduleData, lessonData, mIdx, lIdx });
                            } catch (error) {
                                logger.error(`Lesson create failed: ${error.message}`);
                                errors.push(`Lesson create failed: ${error.message}`);
                            }
                            continue;
                        }
                    }

                    await Module.findByIdAndUpdate(module._id, { $addToSet: { lessons: lesson._id } });

                    const previousType = lesson.type;
                    const nextType = lessonData.type || lesson.type;

                    const cleanupLinkedByType = async (type) => {
                        if (type === "video" && lesson.videoId) {
                            const video = await Video.findById(lesson.videoId);
                            if (video?.bunnyVideoId) {
                                try {
                                    await deleteBunnyVideo(video.bunnyVideoId).catch(err =>
                                        logger.warn(`Old lesson video delete failed: ${err.message}`)
                                    );
                                } catch (err) {
                                    logger.warn(`Bunny video deletion error: ${err.message}`);
                                }
                            }
                            await Video.findByIdAndDelete(lesson.videoId);
                            lesson.videoId = undefined;
                        }

                        if (type === "assignment" && lesson.assignmentId) {
                            const asg = await Assignment.findById(lesson.assignmentId);
                            if (asg?.requiredFiles?.length) {
                                for (const fileMeta of asg.requiredFiles) {
                                    const fileUrl = fileMeta?.url;
                                    if (fileUrl) {
                                        await deleteRawResource(fileUrl).catch(err =>
                                            logger.warn(`Old assignment file delete failed: ${err.message}`)
                                        );
                                    }
                                }
                            }
                            await Assignment.findByIdAndDelete(lesson.assignmentId);
                            lesson.assignmentId = undefined;
                        }

                        if (type === "live" && lesson.liveClassId) {
                            const live = await LiveClass.findById(lesson.liveClassId);
                            if (live?.streamId) {
                                await deleteLiveStream(live.streamId).catch(err =>
                                    logger.warn(`Old live stream delete failed: ${err.message}`)
                                );
                            }
                            if (live?.bunnyVideoId) {
                                await deleteLiveStream(live.bunnyVideoId).catch(err =>
                                    logger.warn(`Old bunny live stream delete failed: ${err.message}`)
                                );
                            }
                            await LiveClass.findByIdAndDelete(lesson.liveClassId);
                            lesson.liveClassId = undefined;
                        }

                        if (type === "material" && lesson.materialId) {
                            const mat = await Material.findById(lesson.materialId);
                            if (mat?.fileUrl) {
                                await deleteRawResource(mat.fileUrl).catch(err =>
                                    logger.warn(`Old material file delete failed: ${err.message}`)
                                );
                            }
                            await Material.findByIdAndDelete(lesson.materialId);
                            lesson.materialId = undefined;
                        }
                    };

                    if (previousType !== nextType) {
                        try {
                            await cleanupLinkedByType(previousType);
                        } catch (error) {
                            logger.error(`Lesson linked cleanup failed: ${error.message}`);
                            errors.push(`Lesson linked cleanup failed: ${error.message}`);
                        }
                    }

                    // Lesson thumbnail
                    const lessonThumbFile = files?.find(f => f.fieldname === `lesson.${mIdx}.${lIdx}.thumbnail`);
                    if (lessonThumbFile) {
                        const oldPublicId = lesson.thumbnail?.public_id || null;
                        try {
                            const result = await updateImage(oldPublicId, lessonThumbFile.buffer, uploadLessonThumbnail, course.title, moduleData.title || module.title, lessonData.title || lesson.title);
                            lesson.thumbnail = { public_id: result.public_id, secure_url: result.secure_url };
                        } catch (error) {
                            logger.error(`Lesson thumbnail update failed: ${error.message}`);
                            errors.push(`Lesson thumbnail: ${error.message}`);
                        }
                    }

                    if (lessonData.title) lesson.title = lessonData.title;
                    if (lessonData.description !== undefined) lesson.description = lessonData.description;
                    if (lessonData.order) lesson.order = lessonData.order;
                    lesson.type = nextType;
                    if (lessonData.isFree !== undefined) lesson.isFree = lessonData.isFree;

                    await lesson.save({ validateBeforeSave: false });

                    const upsertMissingLinked = async () => {
                        if (lesson.type === "video" && lessonData.video && !lesson.videoId) {
                            const tempLessonDoc = {};
                            await createLinkedModel({
                                lessonType: "video",
                                lesInfo: lessonData,
                                lessonDoc: tempLessonDoc,
                                targetLesson: lesson,
                                instructorId,
                                courseId: course._id,
                                moduleId: module._id,
                                courseName: (course.title || "course").replace(/\s+/g, "_"),
                                moduleName: (moduleData.title || module.title || `Module_${mIdx + 1}`).replace(/\s+/g, "_"),
                                lessonName: (lessonData.title || lesson.title || `Lesson_${lIdx + 1}`).replace(/\s+/g, "_"),
                                mi: mIdx,
                                li: lIdx,
                                files,
                                errors,
                                rollbackCtx,
                            });
                            if (tempLessonDoc.videoId) {
                                lesson.videoId = tempLessonDoc.videoId;
                            }
                        }

                        if (lesson.type === "assignment" && lessonData.assignment && !lesson.assignmentId) {
                            const tempLessonDoc = {};
                            await createLinkedModel({
                                lessonType: "assignment",
                                lesInfo: lessonData,
                                lessonDoc: tempLessonDoc,
                                targetLesson: lesson,
                                instructorId,
                                courseId: course._id,
                                moduleId: module._id,
                                courseName: (course.title || "course").replace(/\s+/g, "_"),
                                moduleName: (moduleData.title || module.title || `Module_${mIdx + 1}`).replace(/\s+/g, "_"),
                                lessonName: (lessonData.title || lesson.title || `Lesson_${lIdx + 1}`).replace(/\s+/g, "_"),
                                mi: mIdx,
                                li: lIdx,
                                files,
                                errors,
                                rollbackCtx,
                            });
                            if (tempLessonDoc.assignmentId) {
                                lesson.assignmentId = tempLessonDoc.assignmentId;
                            }
                        }

                        if (lesson.type === "live" && lessonData.liveClass && !lesson.liveClassId) {
                            const tempLessonDoc = {};
                            await createLinkedModel({
                                lessonType: "live",
                                lesInfo: lessonData,
                                lessonDoc: tempLessonDoc,
                                targetLesson: lesson,
                                instructorId,
                                courseId: course._id,
                                moduleId: module._id,
                                courseName: (course.title || "course").replace(/\s+/g, "_"),
                                moduleName: (moduleData.title || module.title || `Module_${mIdx + 1}`).replace(/\s+/g, "_"),
                                lessonName: (lessonData.title || lesson.title || `Lesson_${lIdx + 1}`).replace(/\s+/g, "_"),
                                mi: mIdx,
                                li: lIdx,
                                files,
                                errors,
                                rollbackCtx,
                            });
                            if (tempLessonDoc.liveClassId) {
                                lesson.liveClassId = tempLessonDoc.liveClassId;
                            }
                        }

                        if (lesson.type === "material" && lessonData.material && !lesson.materialId) {
                            const tempLessonDoc = {};
                            await createLinkedModel({
                                lessonType: "material",
                                lesInfo: lessonData,
                                lessonDoc: tempLessonDoc,
                                targetLesson: lesson,
                                instructorId,
                                courseId: course._id,
                                moduleId: module._id,
                                courseName: (course.title || "course").replace(/\s+/g, "_"),
                                moduleName: (moduleData.title || module.title || `Module_${mIdx + 1}`).replace(/\s+/g, "_"),
                                lessonName: (lessonData.title || lesson.title || `Lesson_${lIdx + 1}`).replace(/\s+/g, "_"),
                                mi: mIdx,
                                li: lIdx,
                                files,
                                errors,
                                rollbackCtx,
                            });
                            if (tempLessonDoc.materialId) {
                                lesson.materialId = tempLessonDoc.materialId;
                            }
                        }
                    };

                    await upsertMissingLinked();

                    // ── UPDATE VIDEO ──
                    if (lesson.type === "video" && lessonData.video && lesson.videoId) {
                        const video = await Video.findById(lesson.videoId);
                        if (video) {
                            if (lessonData.video.title) video.title = lessonData.video.title;
                            if (lessonData.video.description !== undefined) video.description = lessonData.video.description;

                            // Handle single video file upload
                            const videoFile = files?.find(f => f.fieldname === `video.${mIdx}.${lIdx}.0`);
                            if (videoFile) {
                                if (video.bunnyVideoId) {
                                    try {
                                        await deleteBunnyVideo(video.bunnyVideoId).catch(err => logger.warn(`Old video delete failed: ${err.message}`));
                                    } catch (err) {
                                        logger.error(`Bunny video deletion error: ${err.message}`);
                                    }
                                }
                                try {
                                    const result = await uploadVideo(videoFile.buffer, course.title, moduleData.title || module.title, lessonData.title || lesson.title, lessonData.video.title || "video_1");
                                    video.bunnyVideoId = result.bunnyVideoId || result.public_id;
                                    video.url = result.secure_url;
                                    video.duration = Number(result.duration) || Number(lessonData.video.duration) || video.duration || 0;
                                    video.fileSize = result.bytes || 0;
                                    video.status = video.bunnyVideoId ? "available" : (result.status || "processing");
                                    video.thumbnail = result.thumbnail || getVideoThumbnail(result.bunnyVideoId || result.public_id);
                                    trackUploadedBunnyVideo(rollbackCtx, video.bunnyVideoId);
                                } catch (error) {
                                    logger.error(`Video upload failed: ${error.message}`);
                                    errors.push(`Video upload: ${error.message}`);
                                }
                            }

                            // Handle video thumbnail file upload
                            const videoThumbFile = files?.find(f => f.fieldname === `video.${mIdx}.${lIdx}.0.thumb`);
                            if (videoThumbFile) {
                                try {
                                    const result = await uploadLessonThumbnail(videoThumbFile.buffer, course.title, moduleData.title || module.title, lessonData.title || lesson.title);
                                    video.thumbnail = result.secure_url;
                                    trackUploadedRawUrl(rollbackCtx, result.secure_url);
                                    trackUploadedImagePublicId(rollbackCtx, result.public_id);
                                } catch (error) {
                                    logger.error(`Video thumbnail update failed: ${error.message}`);
                                    errors.push(`Video thumbnail: ${error.message}`);
                                }
                            }

                            await video.save({ validateBeforeSave: false });
                        }
                    }

                    // ── UPDATE ASSIGNMENT ──
                    if (lesson.type === "assignment" && lessonData.assignment && lesson.assignmentId) {
                        const asg = await Assignment.findById(lesson.assignmentId);
                        if (asg) {
                            if (lessonData.assignment.title) asg.title = lessonData.assignment.title;
                            if (lessonData.assignment.description !== undefined) asg.description = lessonData.assignment.description;
                            if (lessonData.assignment.instructions !== undefined) asg.instructions = lessonData.assignment.instructions;
                            if (lessonData.assignment.type) asg.type = lessonData.assignment.type;
                            if (lessonData.assignment.maxScore !== undefined) asg.maxScore = Number(lessonData.assignment.maxScore) || asg.maxScore;
                            if (lessonData.assignment.passingScore !== undefined) asg.passingScore = Number(lessonData.assignment.passingScore) || asg.passingScore;
                            if (lessonData.assignment.dueDate !== undefined) asg.dueDate = lessonData.assignment.dueDate || asg.dueDate;
                            if (lessonData.assignment.allowLateSubmission !== undefined) asg.allowLateSubmission = !!lessonData.assignment.allowLateSubmission;
                            if (lessonData.assignment.lateSubmissionPenalty !== undefined) asg.lateSubmissionPenalty = Number(lessonData.assignment.lateSubmissionPenalty) || 0;
                            asg.updatedBy = instructorId;
                            asg.lesson = lesson._id;
                            await asg.save({ validateBeforeSave: false });
                        }
                    }

                    // ── UPDATE LIVE CLASS ──
                    if (lesson.type === "live" && lessonData.liveClass && lesson.liveClassId) {
                        const live = await LiveClass.findById(lesson.liveClassId);
                        if (live) {
                            if (lessonData.liveClass.title) live.title = lessonData.liveClass.title;
                            if (lessonData.liveClass.description !== undefined) live.description = lessonData.liveClass.description;
                            if (lessonData.liveClass.scheduledAt !== undefined) live.scheduledAt = lessonData.liveClass.scheduledAt;
                            if (lessonData.liveClass.duration !== undefined) live.duration = Number(lessonData.liveClass.duration) || live.duration;
                            if (lessonData.liveClass.timezone !== undefined) live.timezone = lessonData.liveClass.timezone;
                            if (lessonData.liveClass.maxParticipants !== undefined) live.maxParticipants = Number(lessonData.liveClass.maxParticipants) || live.maxParticipants;
                            if (lessonData.liveClass.notes !== undefined) live.notes = lessonData.liveClass.notes;
                            live.updatedBy = instructorId;
                            await live.save({ validateBeforeSave: false });
                        }
                    }

                    // ── UPDATE SINGLE MATERIAL LINKED TO LESSON ──
                    if (lesson.type === "material" && lessonData.material && lesson.materialId) {
                        const material = await Material.findById(lesson.materialId);
                        if (material) {
                            if (lessonData.material.title) material.title = lessonData.material.title;
                            if (lessonData.material.description !== undefined) material.description = lessonData.material.description;
                            if (lessonData.material.type) material.type = lessonData.material.type;
                            material.isPublic = !!lesson.isFree;
                            material.accessLevel = lesson.isFree ? "public" : (material.accessLevel || "enrolled_students");
                            material.lesson = lesson._id;
                            material.updatedBy = instructorId;

                            const matFile = files?.find(f => f.fieldname === `material.${mIdx}.${lIdx}.0`);
                            if (matFile) {
                                if (material.fileUrl && material.fileUrl.includes("r2")) {
                                    try {
                                        await deleteRawResource(material.fileUrl).catch(err => logger.warn(`Old material delete failed: ${err.message}`));
                                    } catch (err) {
                                        logger.error(`Material deletion error: ${err.message}`);
                                    }
                                }
                                try {
                                    const resourceType = matFile.mimetype?.startsWith("video") ? "video" : matFile.mimetype?.startsWith("image") ? "image" : "raw";
                                    const result = await uploadMaterialFile(matFile.buffer, course.title, moduleData.title || module.title, lessonData.title || lesson.title, matFile.originalname, resourceType);
                                    material.fileUrl = result.secure_url;
                                    material.fileName = matFile.originalname;
                                    material.fileSize = result.bytes || matFile.size;
                                    material.mimeType = matFile.mimetype;
                                    if (result.pages) material.metadata = { ...material.metadata, pages: result.pages };
                                    if (result.duration) material.metadata = { ...material.metadata, duration: result.duration };
                                } catch (error) {
                                    logger.error(`Material file upload failed: ${error.message}`);
                                    errors.push(`Material file: ${error.message}`);
                                }
                            }

                            await material.save({ validateBeforeSave: false });
                        }
                    }

                    // ── UPDATE MATERIALS ──
                    if (lessonData.materials && Array.isArray(lessonData.materials)) {
                        for (let matIdx = 0; matIdx < lessonData.materials.length; matIdx++) {
                            const materialData = lessonData.materials[matIdx];
                            if (!materialData.id) continue;

                            const material = await Material.findById(materialData.id);
                            if (!material) { errors.push(`Material ${materialData.id} not found`); continue; }

                            if (materialData.title) material.title = materialData.title;
                            if (materialData.description !== undefined) material.description = materialData.description;
                            if (materialData.type) material.type = materialData.type;

                            const matFile = files?.find(f => f.fieldname === `material.${mIdx}.${lIdx}.${matIdx}`);
                            if (matFile) {
                                if (material.fileUrl && material.fileUrl.includes("r2")) {
                                    try { await deleteRawResource(material.fileUrl).catch(err => logger.warn(`Old material delete failed: ${err.message}`)); } catch (err) { logger.error(`Material deletion error: ${err.message}`); }
                                }
                                try {
                                    const result = await uploadMaterialFile(matFile.buffer, course.title, moduleData.title || module.title, materialData.title || material.title);
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

                    await lesson.save({ validateBeforeSave: false });
                }
            }
        }
    }

    // ── UPDATE CERTIFICATES ──
    if (updateData.certificates && Array.isArray(updateData.certificates)) {
        for (let certIdx = 0; certIdx < updateData.certificates.length; certIdx++) {
            const certData = updateData.certificates[certIdx];
            if (!certData.id) continue;

            const cert = await Certificate.findById(certData.id);
            if (!cert) { errors.push(`Certificate ${certData.id} not found`); continue; }

            if (certData.title) cert.title = certData.title;
            if (certData.expiryDate !== undefined) cert.expiryDate = certData.expiryDate;
            if (certData.skills) cert.skills = certData.skills;

            const certFile = files?.find(f => f.fieldname === `certificate.${certIdx}`);
            if (certFile) {
                if (cert.certificateUrl && cert.certificateUrl.includes("r2")) {
                    try { await deleteRawResource(cert.certificateUrl).catch(err => logger.warn(`Old certificate delete failed: ${err.message}`)); } catch (err) { logger.error(`Certificate deletion error: ${err.message}`); }
                }
                try {
                    const result = await uploadCertificateImage(certFile.buffer, course.title);
                    cert.certificateUrl = result.secure_url;
                } catch (error) {
                    logger.error(`Certificate image upload failed: ${error.message}`);
                    errors.push(`Certificate image: ${error.message}`);
                }
            }

            await cert.save({ validateBeforeSave: false });
        }
    }

    await recalculateCourseTotals(courseId);

    if (hasVideoRelatedErrors(errors)) {
        throw new Error(`Video component errors: ${errors.filter((err) => /video|trailer|bunny|thumbnail/i.test(String(err || ""))).join(" | ")}`);
    }

    if (requestedStatus === "published") {
        const publishValidationErrors = await validateCoursePublishReadiness(courseId);
        if (publishValidationErrors.length > 0) {
            throw new Error(`Course is not ready to publish: ${publishValidationErrors.join(" | ")}`);
        }

        await Module.updateMany({ course: courseId }, { isPublished: true, updatedBy: instructorId });
        await Lesson.updateMany({ course: courseId }, { isPublished: true, updatedBy: instructorId });
        await Video.updateMany({ course: courseId }, { isPublished: true, isPublic: true, updatedBy: instructorId });
        await Material.updateMany(
            { course: courseId },
            { status: "published", isPublic: true, accessLevel: "public", updatedBy: instructorId }
        );

        course.status = "published";
        course.isPublished = true;
        if (!course.publishedAt) {
            course.publishedAt = new Date();
        }
        await course.save();
    }

    const updatedCourse = await Course.findById(courseId);
    return { course: updatedCourse, errors };
    } catch (error) {
        await rollbackUploadedMedia(rollbackCtx);
        throw error;
    }
};

/**
 * Delete full course with all modules, lessons, materials, certificates, and media assets
 */
export const deleteFullCourseService = async (courseId) => {
    const course = await Course.findById(courseId);
    if (!course) throw new Error("Course not found");

    const errors = [];

    // Delete course-level assets
    if (course.thumbnail?.public_id) {
        try { await deleteImage(course.thumbnail.public_id); } catch (e) {
            logger.error(`Failed to delete course thumbnail: ${e.message}`);
            errors.push(`Thumbnail deletion: ${e.message}`);
        }
    }

    if (course.trailerVideo) {
        try {
            const trailerId = extractBunnyVideoId(course.trailerVideo) || course.trailerVideo;
            await deleteBunnyVideo(trailerId);
        } catch (e) {
            logger.error(`Failed to delete course trailer: ${e.message}`);
            errors.push(`Trailer deletion: ${e.message}`);
        }
    }

    // Delete certificates
    if (course.certificates?.length > 0) {
        for (const certId of course.certificates) {
            try {
                const cert = await Certificate.findById(certId);
                if (cert?.certificateUrl) {
                    await deleteRawResource(cert.certificateUrl).catch(err =>
                        logger.warn(`Certificate asset delete failed: ${err.message}`)
                    );
                }
                await Certificate.findByIdAndDelete(certId);
            } catch (e) {
                logger.error(`Certificate deletion error: ${e.message}`);
                errors.push(`Certificate: ${e.message}`);
            }
        }
    }

    // Delete all modules, lessons, and linked models
    await deleteModulesAndLessons(courseId, errors);

    // Delete enrollments and reviews
    try { await Enrollment.deleteMany({ course: courseId }); } catch (e) {
        errors.push(`Enrollments: ${e.message}`);
    }
    try { await Review.deleteMany({ course: courseId }); } catch (e) {
        errors.push(`Reviews: ${e.message}`);
    }

    // Delete course
    await Course.findByIdAndDelete(courseId);

    return { deletedCourseId: courseId, errors };
};
