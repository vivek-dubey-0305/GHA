import { VideoPackage } from "../models/videopackage.model.js";
import { Course } from "../models/course.model.js";
import { Instructor } from "../models/instructor.model.js";
import { Enrollment } from "../models/enrollment.model.js";
import { asyncHandler } from "../middlewares/async.middleware.js";
import { errorResponse, successResponse } from "../utils/response.utils.js";
import { getPagination, createPaginationResponse } from "../utils/pagination.utils.js";
import { deleteVideo as deleteBunnyVideo, generateSignedPlaybackUrl, getVideoThumbnail } from "../services/bunny.service.js";
import logger from "../configs/logger.config.js";

/**
 * Video Package Controller
 * Handles video package CRUD and management for instructors
 */

// @route   GET /api/v1/video-packages
// @desc    Get all published video packages (public)
// @access  Public
export const getPublicVideoPackages = asyncHandler(async (req, res) => {
    const { page, limit, skip } = getPagination(req.query, 10);

    const filter = { status: "published" };

    if (req.query.courseId) filter.course = req.query.courseId;
    if (req.query.instructorId) filter.instructor = req.query.instructorId;

    const total = await VideoPackage.countDocuments(filter);
    const packages = await VideoPackage.find(filter)
        .populate("instructor", "firstName lastName profilePicture")
        .populate("course", "title thumbnail")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

    successResponse(res, 200, "Video packages retrieved", {
        videoPackages: packages,
        pagination: createPaginationResponse(total, page, limit)
    });
});

// @route   GET /api/v1/video-packages/:id
// @desc    Get video package details (with signed playback URLs for enrolled users)
// @access  Public/Private
export const getVideoPackage = asyncHandler(async (req, res) => {
    const pkg = await VideoPackage.findById(req.params.id)
        .populate("instructor", "firstName lastName profilePicture")
        .populate("course", "title thumbnail");

    if (!pkg) return errorResponse(res, 404, "Video package not found");

    const result = pkg.toObject();

    // Check if requester is enrolled/owner/admin
    const isOwner = req.instructor && pkg.instructor._id.toString() === req.instructor.id;
    const isAdmin = !!req.admin;
    let isEnrolled = false;

    if (req.user) {
        isEnrolled = await Enrollment.isUserEnrolled(req.user.id, pkg.course._id || pkg.course);
    }

    // For enrolled users, owner, or admin: generate fresh signed playback URLs
    if (isOwner || isAdmin || isEnrolled || pkg.isPublic) {
        result.videos = result.videos.map(v => ({
            ...v,
            url: v.bunnyVideoId ? generateSignedPlaybackUrl(v.bunnyVideoId) : v.url,
            thumbnail: v.bunnyVideoId ? getVideoThumbnail(v.bunnyVideoId) : v.thumbnail,
        }));
    } else {
        // Strip video URLs for non-enrolled users — show metadata only
        result.videos = result.videos.map(v => ({
            ...v,
            url: "",          // No playback for non-enrolled
            thumbnail: v.bunnyVideoId ? getVideoThumbnail(v.bunnyVideoId) : v.thumbnail,
        }));
    }

    successResponse(res, 200, "Video package retrieved successfully", result);
});

// @route   POST /api/v1/video-packages
// @desc    Create a video package
// @access  Private (Instructor)
export const createVideoPackage = asyncHandler(async (req, res) => {
    const pkgData = req.body;

    // Verify course ownership if courseId provided
    if (pkgData.courseId) {
        const course = await Course.findById(pkgData.courseId);
        if (!course || course.instructor.toString() !== req.instructor.id) {
            return errorResponse(res, 403, "You can only create video packages for your own courses");
        }
        pkgData.course = pkgData.courseId;
        delete pkgData.courseId;
    }

    pkgData.instructor = req.instructor.id;

    const pkg = await VideoPackage.create(pkgData);

    // Add to instructor's video packages
    await Instructor.findByIdAndUpdate(req.instructor.id, {
        $push: { videoPackages: pkg._id }
    });

    successResponse(res, 201, "Video package created successfully", pkg);
});

// @route   PUT /api/v1/video-packages/:id
// @desc    Update a video package
// @access  Private (Instructor - owner)
export const updateVideoPackage = asyncHandler(async (req, res) => {
    const pkg = await VideoPackage.findById(req.params.id);
    if (!pkg) return errorResponse(res, 404, "Video package not found");

    if (pkg.instructor.toString() !== req.instructor.id) {
        return errorResponse(res, 403, "You can only update your own video packages");
    }

    const updated = await VideoPackage.findByIdAndUpdate(req.params.id, req.body, {
        new: true, runValidators: true
    });

    successResponse(res, 200, "Video package updated successfully", updated);
});

// @route   DELETE /api/v1/video-packages/:id
// @desc    Delete a video package (also deletes videos from Bunny Stream)
// @access  Private (Instructor - owner)
export const deleteVideoPackage = asyncHandler(async (req, res) => {
    const pkg = await VideoPackage.findById(req.params.id);
    if (!pkg) return errorResponse(res, 404, "Video package not found");

    if (pkg.instructor.toString() !== req.instructor.id) {
        return errorResponse(res, 403, "You can only delete your own video packages");
    }

    // Delete all videos from Bunny Stream
    for (const video of (pkg.videos || [])) {
        if (video.bunnyVideoId) {
            try {
                await deleteBunnyVideo(video.bunnyVideoId);
            } catch (e) {
                logger.error(`Failed to delete Bunny video ${video.bunnyVideoId}: ${e.message}`);
            }
        }
    }

    await Instructor.findByIdAndUpdate(req.instructor.id, {
        $pull: { videoPackages: pkg._id }
    });

    await VideoPackage.findByIdAndDelete(req.params.id);

    successResponse(res, 200, "Video package deleted successfully");
});

// @route   POST /api/v1/video-packages/:id/videos
// @desc    Add a video to a package
// @access  Private (Instructor - owner)
export const addVideo = asyncHandler(async (req, res) => {
    const pkg = await VideoPackage.findById(req.params.id);
    if (!pkg) return errorResponse(res, 404, "Video package not found");

    if (pkg.instructor.toString() !== req.instructor.id) {
        return errorResponse(res, 403, "You can only add videos to your own packages");
    }

    const videoData = req.body;
    const updated = await pkg.addVideo(videoData);

    successResponse(res, 201, "Video added successfully", updated);
});

// @route   PUT /api/v1/video-packages/:id/videos/:videoId/status
// @desc    Update video status in package
// @access  Private (Instructor - owner)
export const updateVideoStatus = asyncHandler(async (req, res) => {
    const pkg = await VideoPackage.findById(req.params.id);
    if (!pkg) return errorResponse(res, 404, "Video package not found");

    if (pkg.instructor.toString() !== req.instructor.id) {
        return errorResponse(res, 403, "You can only update your own video packages");
    }

    await pkg.updateVideoStatus(req.params.videoId, req.body.status);

    successResponse(res, 200, "Video status updated successfully");
});

// @route   PATCH /api/v1/video-packages/:id/views/:videoId
// @desc    Increment video views
// @access  Private (User)
export const incrementVideoViews = asyncHandler(async (req, res) => {
    const pkg = await VideoPackage.findById(req.params.id);
    if (!pkg) return errorResponse(res, 404, "Video package not found");

    await pkg.incrementViews(req.params.videoId);

    successResponse(res, 200, "Video view recorded");
});

// @route   PATCH /api/v1/video-packages/:id/publish
// @desc    Publish a video package
// @access  Private (Instructor - owner)
export const publishVideoPackage = asyncHandler(async (req, res) => {
    const pkg = await VideoPackage.findById(req.params.id);
    if (!pkg) return errorResponse(res, 404, "Video package not found");

    if (pkg.instructor.toString() !== req.instructor.id) {
        return errorResponse(res, 403, "You can only publish your own video packages");
    }

    await pkg.publish();

    successResponse(res, 200, "Video package published successfully");
});

// @route   PATCH /api/v1/video-packages/:id/unpublish
// @desc    Unpublish a video package
// @access  Private (Instructor - owner)
export const unpublishVideoPackage = asyncHandler(async (req, res) => {
    const pkg = await VideoPackage.findById(req.params.id);
    if (!pkg) return errorResponse(res, 404, "Video package not found");

    if (pkg.instructor.toString() !== req.instructor.id) {
        return errorResponse(res, 403, "You can only unpublish your own video packages");
    }

    await pkg.unpublish();

    successResponse(res, 200, "Video package unpublished successfully");
});

// @route   GET /api/v1/video-packages/:id/signed-url/:videoId
// @desc    Get a fresh signed playback URL for a specific video (enrollment required)
// @access  Private (Enrolled user / Instructor owner / Admin)
export const getSignedVideoUrl = asyncHandler(async (req, res) => {
    const pkg = await VideoPackage.findById(req.params.id);
    if (!pkg) return errorResponse(res, 404, "Video package not found");

    const video = pkg.videos.find(v => v.videoId.toString() === req.params.videoId || v.bunnyVideoId === req.params.videoId);
    if (!video) return errorResponse(res, 404, "Video not found in package");

    // Access control
    const isOwner = req.instructor && pkg.instructor.toString() === req.instructor.id;
    const isAdmin = !!req.admin;
    let isEnrolled = false;

    if (req.user) {
        isEnrolled = await Enrollment.isUserEnrolled(req.user.id, pkg.course);
    }

    if (!isOwner && !isAdmin && !isEnrolled && !pkg.isPublic) {
        return errorResponse(res, 403, "You must be enrolled in the course to watch this video");
    }

    if (!video.bunnyVideoId) {
        return errorResponse(res, 400, "Video has no Bunny Stream ID");
    }

    const playbackUrl = generateSignedPlaybackUrl(video.bunnyVideoId, 14400);

    successResponse(res, 200, "Signed video URL generated", {
        playbackUrl,
        thumbnailUrl: getVideoThumbnail(video.bunnyVideoId),
        videoId: video.videoId,
        bunnyVideoId: video.bunnyVideoId,
        title: video.title,
        duration: video.duration,
    });
});
