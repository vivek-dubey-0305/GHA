import { Course } from "../models/course.model.js";
import { Module } from "../models/module.model.js";
import { Lesson } from "../models/lesson.model.js";
import { Instructor } from "../models/instructor.model.js";
import { Enrollment } from "../models/enrollment.model.js";
import { Review } from "../models/review.model.js";
import { Assignment } from "../models/assignment.model.js";
import { VideoPackage } from "../models/videopackage.model.js";
import { LiveClass } from "../models/liveclass.model.js";
import { Material } from "../models/material.model.js";
import { Certificate } from "../models/certificate.model.js";
import mongoose from "mongoose";
import { asyncHandler } from "../middlewares/async.middleware.js";
import { errorResponse, successResponse } from "../utils/response.utils.js";
import { getPagination, createPaginationResponse } from "../utils/pagination.utils.js";
import {
    uploadCourseThumbnail, uploadModuleThumbnail,
    uploadLessonThumbnail, uploadAssignmentThumbnail,
    uploadMaterialFile, uploadCertificateImage,
    uploadAssignmentFile,
    updateImage, deleteImage, deleteRawResource
} from "../services/r2.service.js";
import {
    uploadVideoPackageVideo, uploadCourseTrailer,
    deleteVideo as deleteBunnyVideo, createLiveStream,
    getVideoThumbnail, generateSignedPlaybackUrl
} from "../services/bunny.service.js";
import logger from "../configs/logger.config.js";

/**
 * Course Controller
 * Handles course CRUD for instructors and public course browsing
 */

// ========================= PUBLIC ROUTES =========================

// @route   GET /api/v1/courses
// @desc    Get all published courses (public)
// @access  Public
export const getPublicCourses = asyncHandler(async (req, res) => {
    const { page, limit, skip } = getPagination(req.query, 12);
    const { category, level, language, sort: sortBy, search, minPrice, maxPrice } = req.query;

    const filter = { status: "published", isPublished: true };
    if (category) filter.category = category;
    if (level) filter.level = level;
    if (language) filter.language = language;
    if (minPrice || maxPrice) {
        filter.price = {};
        if (minPrice) filter.price.$gte = Number(minPrice);
        if (maxPrice) filter.price.$lte = Number(maxPrice);
    }
    if (search) {
        filter.$or = [
            { title: { $regex: search, $options: "i" } },
            { description: { $regex: search, $options: "i" } },
            { tags: { $in: [new RegExp(search, "i")] } }
        ];
    }

    let sortOption = { createdAt: -1 };
    if (sortBy === "popular") sortOption = { enrolledCount: -1 };
    else if (sortBy === "rating") sortOption = { rating: -1 };
    else if (sortBy === "price-low") sortOption = { price: 1 };
    else if (sortBy === "price-high") sortOption = { price: -1 };
    else if (sortBy === "newest") sortOption = { publishedAt: -1 };

    const total = await Course.countDocuments(filter);
    const courses = await Course.find(filter)
        .populate("instructor", "firstName lastName profilePicture rating")
        .select("-modules")
        .sort(sortOption)
        .skip(skip)
        .limit(limit);

    successResponse(res, 200, "Courses retrieved successfully", {
        courses,
        pagination: createPaginationResponse(total, page, limit)
    });
});

// @route   GET /api/v1/courses/:id
// @desc    Get course details (public)
// @access  Public
export const getCourseDetails = asyncHandler(async (req, res) => {
    const course = await Course.findById(req.params.id)
        .populate("instructor", "firstName lastName profilePicture bio rating totalStudentsTeaching totalCourses")
        .populate({
            path: "modules",
            match: { isPublished: true },
            options: { sort: { order: 1 } },
            populate: {
                path: "lessons",
                match: { isPublished: true },
                options: { sort: { order: 1 } },
                select: "title type isFree order videoPackageId assignmentId liveClassId materialId content",
                populate: [
                    { path: "videoPackageId" },
                    { path: "assignmentId" },
                    { path: "liveClassId" },
                    { path: "materialId" }
                ]
            }
        });

    if (!course) return errorResponse(res, 404, "Course not found");
    if (course.status !== "published" && !req.instructor && !req.admin) {
        return errorResponse(res, 404, "Course not found");
    }

    successResponse(res, 200, "Course details retrieved successfully", course);
});

// @route   GET /api/v1/courses/:id/reviews
// @desc    Get course reviews (public)
// @access  Public
export const getCourseReviews = asyncHandler(async (req, res) => {
    const { page, limit, skip } = getPagination(req.query, 10);
    const { verifiedOnly } = req.query;

    const filter = { course: req.params.id, isApproved: true };
    if (verifiedOnly === "true") filter.isVerified = true;

    const total = await Review.countDocuments(filter);
    const reviews = await Review.find(filter)
        .populate("user", "firstName lastName profilePicture")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

    const ratingStats = await Review.getCourseRating(req.params.id);

    successResponse(res, 200, "Reviews retrieved successfully", {
        reviews,
        ratingStats: ratingStats[0] || null,
        pagination: createPaginationResponse(total, page, limit)
    });
});

// ========================= INSTRUCTOR ROUTES =========================

// @route   POST /api/v1/courses
// @desc    Create a new course (with thumbnail via form-data)
// @access  Private (Instructor)
export const createCourse = asyncHandler(async (req, res) => {
    const courseData = req.body;
    courseData.instructor = req.instructor.id;
    courseData.createdBy = req.instructor.id;

    // Parse JSON arrays from form-data
    if (typeof courseData.learningOutcomes === "string") courseData.learningOutcomes = JSON.parse(courseData.learningOutcomes);
    if (typeof courseData.prerequisites === "string") courseData.prerequisites = JSON.parse(courseData.prerequisites);
    if (typeof courseData.targetAudience === "string") courseData.targetAudience = JSON.parse(courseData.targetAudience);
    if (typeof courseData.tags === "string") courseData.tags = JSON.parse(courseData.tags);

    // Handle thumbnail upload via form-data
    if (req.file) {
        const courseName = courseData.title.replace(/\s+/g, "_");
        try {
            const uploadResult = await uploadCourseThumbnail(req.file.buffer, courseName);
            courseData.thumbnail = {
                public_id: uploadResult.public_id,
                secure_url: uploadResult.secure_url
            };
        } catch (error) {
            logger.error(`Course thumbnail upload failed: ${error.message}`);
            return errorResponse(res, 400, "Course thumbnail is required and upload failed");
        }
    } else {
        return errorResponse(res, 400, "Course thumbnail is required");
    }

    const course = await Course.create(courseData);

    // Add course reference to instructor
    await Instructor.findByIdAndUpdate(req.instructor.id, {
        $push: { courses: course._id },
        $inc: { totalCourses: 1 }
    });

    successResponse(res, 201, "Course created successfully", course);
});

// @route   POST /api/v1/courses/full
// @desc    Create a full course with modules, lessons, and linked models in one shot
// @access  Private (Instructor)
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
    const thumbFile = req.files?.find(f => f.fieldname === "thumbnail") || (req.file?.fieldname === "thumbnail" ? req.file : null);
    if (thumbFile) {
        try {
            const result = await uploadCourseThumbnail(thumbFile.buffer, courseName);
            thumbnail = { public_id: result.public_id, secure_url: result.secure_url };
        } catch (e) {
            logger.error(`Course thumbnail upload failed: ${e.message}`);
            return errorResponse(res, 400, "Course thumbnail upload failed");
        }
    }
    if (!thumbnail && !data.thumbnail) {
        // Defer check — will validate only for new courses after existence check
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
    const existingModuleMap = new Map();
    const existingLessonMap = new Map();

    // Thumbnail is required only for new courses
    if (!course && !thumbnail && !data.thumbnail) return errorResponse(res, 400, "Course thumbnail is required");

    if (course) {
        isResuming = true;
        logger.info(`Course "${data.title}" already exists (id: ${course._id}), resuming creation for missing parts`);

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

        let moduleDoc = existingModuleMap.get(modInfo.title);
        if (moduleDoc) {
            totalModules++;
            if (!moduleIds.some(id => id.toString() === moduleDoc._id.toString())) {
                moduleIds.push(moduleDoc._id);
            }
        } else {
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
                continue;
            }
        }

        const lessonIds = moduleDoc.lessons?.map(l => l._id || l) || [];

        const lessonsData = modInfo.lessons || [];
        for (let li = 0; li < lessonsData.length; li++) {
            const lesInfo = lessonsData[li];
            const lessonName = (lesInfo.title || `Lesson_${li + 1}`).replace(/\s+/g, "_");
            const lessonType = lesInfo.type || "video";

            const existingLesson = existingLessonMap.get(`${modInfo.title}::${lesInfo.title}`);
            if (existingLesson) {
                totalLessons++;
                if (!lessonIds.some(id => id.toString() === existingLesson._id.toString())) {
                    lessonIds.push(existingLesson._id);
                }

                const needsLinkedModel =
                    (lessonType === "video" && lesInfo.videoPackage && !existingLesson.videoPackageId) ||
                    (lessonType === "assignment" && lesInfo.assignment && !existingLesson.assignmentId) ||
                    (lessonType === "live" && lesInfo.liveClass && !existingLesson.liveClassId) ||
                    (lessonType === "material" && lesInfo.material && !existingLesson.materialId);

                if (!needsLinkedModel) continue;
            }

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

            const targetLesson = existingLesson || null;

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
                            // Upload video to Bunny Stream instead of R2
                            const vidResult = await uploadVideoPackageVideo(vidFile.buffer, courseName, moduleName, lessonName, videoEntry.title || `video_${vi}`);
                            videoEntry.bunnyVideoId = vidResult.bunnyVideoId || vidResult.public_id;
                            videoEntry.url = vidResult.secure_url;
                            videoEntry.duration = vidResult.duration || videoEntry.duration || 0;
                            videoEntry.fileSize = vidResult.bytes || 0;
                            videoEntry.status = vidResult.status || "processing";
                            // Bunny auto-generates thumbnail; use it unless a custom one is uploaded
                            videoEntry.thumbnail = vidResult.thumbnail || getVideoThumbnail(vidResult.bunnyVideoId || vidResult.public_id);
                        }

                        // Check for custom thumbnail upload (still goes to R2 for images)
                        const vidThumbFile = req.files?.find(f => f.fieldname === `module_${mi}_lesson_${li}_video_${vi}_thumb`);
                        if (vidThumbFile) {
                            const { uploadLessonThumbnail: uploadLesThumb } = await import("../services/r2.service.js");
                            const thumbResult = await uploadLesThumb(vidThumbFile.buffer, courseName, moduleName, lessonName);
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
                    // Create a Bunny live stream for this class
                    const streamTitle = lesInfo.liveClass.title || lesInfo.title || `Live_${mi}_${li}`;
                    const bunnyStream = await createLiveStream(streamTitle);

                    const lcData = {
                        ...lesInfo.liveClass,
                        instructor: instructorId,
                        course: course._id,
                        createdBy: instructorId,
                        // Bunny Stream Live fields
                        bunnyVideoId: bunnyStream.videoId,
                        rtmpUrl: bunnyStream.rtmpUrl,
                        rtmpKey: bunnyStream.rtmpKey,
                        playbackUrl: bunnyStream.playbackUrl,
                    };
                    // Remove any leftover Zoom fields if provided
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
    const allModules = await Module.find({ course: course._id });
    const allLessons = await Lesson.find({ course: course._id });
    const allModuleIds = allModules.map(m => m._id);
    const freeLessons = allLessons.filter(l => l.isFree);
    const previewLessonIds = freeLessons.map(l => l._id);

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
        .populate("instructor", "firstName lastName profilePicture")
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

    if (!isResuming) {
        await Instructor.findByIdAndUpdate(instructorId, {
            $push: { courses: course._id },
            $inc: { totalCourses: 1 }
        });
    }

    if (errors.length > 0) {
        logger.error(`Course creation completed with ${errors.length} error(s): ${errors.join("; ")}`);
        return errorResponse(res, 207, `Course created with ${errors.length} error(s). Fix and retry to complete.`, {
            course: updatedCourse,
            errors,
        });
    }

    successResponse(res, 201, isResuming ? "Course updated successfully (resumed)" : "Full course created successfully", updatedCourse);
});

// @route   PUT /api/v1/courses/:id
// @desc    Update a course (with optional thumbnail via form-data)
// @access  Private (Instructor - owner)
export const updateCourse = asyncHandler(async (req, res) => {
    const course = await Course.findById(req.params.id);
    if (!course) return errorResponse(res, 404, "Course not found");

    if (course.instructor.toString() !== req.instructor.id) {
        return errorResponse(res, 403, "You can only update your own courses");
    }

    const updateData = req.body;
    updateData.updatedBy = req.instructor.id;

    // Parse JSON arrays from form-data
    if (typeof updateData.learningOutcomes === "string") updateData.learningOutcomes = JSON.parse(updateData.learningOutcomes);
    if (typeof updateData.prerequisites === "string") updateData.prerequisites = JSON.parse(updateData.prerequisites);
    if (typeof updateData.targetAudience === "string") updateData.targetAudience = JSON.parse(updateData.targetAudience);
    if (typeof updateData.tags === "string") updateData.tags = JSON.parse(updateData.tags);

    // Handle thumbnail upload
    if (req.file) {
        const courseName = (updateData.title || course.title).replace(/\s+/g, "_");
        const oldPublicId = course.thumbnail?.public_id || null;

        try {
            const uploadResult = await updateImage(
                oldPublicId, req.file.buffer, uploadCourseThumbnail, courseName
            );
            updateData.thumbnail = {
                public_id: uploadResult.public_id,
                secure_url: uploadResult.secure_url
            };
        } catch (error) {
            logger.error(`Course thumbnail update failed: ${error.message}`);
        }
    }

    const updated = await Course.findByIdAndUpdate(req.params.id, updateData, {
        new: true,
        runValidators: true
    });

    successResponse(res, 200, "Course updated successfully", updated);
});

// @route   DELETE /api/v1/courses/:id
// @desc    Delete a course
// @access  Private (Instructor - owner)
export const deleteCourse = asyncHandler(async (req, res) => {
    const course = await Course.findById(req.params.id);
    if (!course) return errorResponse(res, 404, "Course not found");

    if (course.instructor.toString() !== req.instructor.id) {
        return errorResponse(res, 403, "You can only delete your own courses");
    }

    // Check for active enrollments
    const activeEnrollments = await Enrollment.countDocuments({
        course: req.params.id,
        status: "active"
    });
    if (activeEnrollments > 0) {
        return errorResponse(res, 400, `Cannot delete course with ${activeEnrollments} active enrollments. Archive instead.`);
    }

    // Delete thumbnail from R2
    if (course.thumbnail?.public_id) {
        await deleteImage(course.thumbnail.public_id);
    }

    // Remove course reference from instructor
    await Instructor.findByIdAndUpdate(req.instructor.id, {
        $pull: { courses: course._id },
        $inc: { totalCourses: -1 }
    });

    await Course.findByIdAndDelete(req.params.id);

    successResponse(res, 200, "Course deleted successfully");
});

// @route   PATCH /api/v1/courses/:id/publish
// @desc    Publish/unpublish a course
// @access  Private (Instructor - owner)
export const togglePublishCourse = asyncHandler(async (req, res) => {
    const course = await Course.findById(req.params.id);
    if (!course) return errorResponse(res, 404, "Course not found");

    if (course.instructor.toString() !== req.instructor.id) {
        return errorResponse(res, 403, "You can only publish your own courses");
    }

    if (!course.isPublished) {
        // Validate course has minimum content before publishing
        if (course.totalModules === 0) {
            return errorResponse(res, 400, "Course must have at least one module to publish");
        }
        if (course.totalLessons === 0) {
            return errorResponse(res, 400, "Course must have at least one lesson to publish");
        }

        course.status = "published";
        course.isPublished = true;
        course.publishedAt = new Date();
    } else {
        course.status = "draft";
        course.isPublished = false;
    }

    await course.save();

    successResponse(res, 200, `Course ${course.isPublished ? "published" : "unpublished"} successfully`, course);
});

// @route   GET /api/v1/courses/:id/stats
// @desc    Get course analytics
// @access  Private (Instructor - owner)
export const getCourseStats = asyncHandler(async (req, res) => {
    const course = await Course.findById(req.params.id);
    if (!course) return errorResponse(res, 404, "Course not found");

    if (course.instructor.toString() !== req.instructor.id) {
        return errorResponse(res, 403, "You can only view stats for your own courses");
    }

    const [enrollmentCount, activeCount, completedCount, reviewCount, ratingStats] = await Promise.all([
        Enrollment.countDocuments({ course: req.params.id }),
        Enrollment.countDocuments({ course: req.params.id, status: "active" }),
        Enrollment.countDocuments({ course: req.params.id, status: "completed" }),
        Review.countDocuments({ course: req.params.id }),
        Review.getCourseRating(req.params.id)
    ]);

    successResponse(res, 200, "Course stats retrieved successfully", {
        course: { title: course.title, status: course.status },
        enrollments: { total: enrollmentCount, active: activeCount, completed: completedCount },
        reviews: { total: reviewCount, ratingStats: ratingStats[0] || null },
        revenue: course.enrolledCount * (course.discountPrice || course.price)
    });
});
