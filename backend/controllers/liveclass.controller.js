import { LiveClass } from "../models/liveclass.model.js";
import { Course } from "../models/course.model.js";
import { Instructor } from "../models/instructor.model.js";
import { Enrollment } from "../models/enrollment.model.js";
import { asyncHandler } from "../middlewares/async.middleware.js";
import { errorResponse, successResponse } from "../utils/response.utils.js";
import { getPagination, createPaginationResponse } from "../utils/pagination.utils.js";
import {
    createLiveStream, deleteLiveStream, getLiveStreamStatus,
    generateSignedPlaybackUrl, refreshPlaybackUrl
} from "../services/bunny.service.js";
import logger from "../configs/logger.config.js";

/**
 * Live Class Controller
 * Handles live class CRUD and management for instructors
 */

// @route   GET /api/v1/live-classes
// @desc    Get upcoming public live classes
// @access  Public
export const getUpcomingClasses = asyncHandler(async (req, res) => {
    const { page, limit, skip } = getPagination(req.query, 10);

    const filter = {
        scheduledAt: { $gte: new Date() },
        status: "scheduled",
        isPublic: true
    };

    const total = await LiveClass.countDocuments(filter);
    const classes = await LiveClass.find(filter)
        .populate("instructor", "firstName lastName profilePicture")
        .populate("course", "title thumbnail")
        .sort({ scheduledAt: 1 })
        .skip(skip)
        .limit(limit);

    successResponse(res, 200, "Upcoming classes retrieved", {
        liveClasses: classes,
        pagination: createPaginationResponse(total, page, limit)
    });
});

// @route   GET /api/v1/live-classes/:id
// @desc    Get live class details (with signed playback URL for enrolled users)
// @access  Private (Enrolled user / Instructor owner / Admin)
export const getLiveClass = asyncHandler(async (req, res) => {
    const liveClass = await LiveClass.findById(req.params.id)
        .populate("instructor", "firstName lastName profilePicture")
        .populate("course", "title thumbnail")
        .populate("materials", "title type fileUrl");

    if (!liveClass) return errorResponse(res, 404, "Live class not found");

    const result = liveClass.toObject();

    // Security: Only provide a fresh signed playback URL if the requester
    // is the instructor/admin owner OR an enrolled user.
    const isOwner = req.instructor && liveClass.instructor._id.toString() === req.instructor.id;
    const isAdmin = !!req.admin;
    let isEnrolled = false;

    if (req.user) {
        isEnrolled = await Enrollment.isUserEnrolled(req.user.id, liveClass.course._id || liveClass.course);
    }

    if (isOwner || isAdmin || isEnrolled || liveClass.isPublic) {
        // Generate a fresh signed playback URL
        result.playbackUrl = generateSignedPlaybackUrl(liveClass.bunnyVideoId, 14400);
    } else {
        // Strip sensitive playback info for non-enrolled users
        delete result.playbackUrl;
        delete result.bunnyVideoId;
    }

    // RTMP credentials are only for the instructor (select: false in model, but just in case)
    if (!isOwner) {
        delete result.rtmpUrl;
        delete result.rtmpKey;
    }

    successResponse(res, 200, "Live class retrieved successfully", result);
});

// @route   POST /api/v1/live-classes
// @desc    Create a live class (with Bunny Stream Live — returns RTMP creds for OBS)
// @access  Private (Instructor)
export const createLiveClass = asyncHandler(async (req, res) => {
    const classData = req.body;

    // Verify course ownership
    const course = await Course.findById(classData.courseId);
    if (!course || course.instructor.toString() !== req.instructor.id) {
        return errorResponse(res, 403, "You can only create live classes for your own courses");
    }

    // Create Bunny live stream
    const streamTitle = classData.title || "Untitled Live Class";
    let bunnyStream;
    try {
        bunnyStream = await createLiveStream(streamTitle);
    } catch (error) {
        logger.error(`Bunny live stream creation failed: ${error.message}`);
        return errorResponse(res, 500, "Failed to create live stream. Please try again.");
    }

    classData.instructor = req.instructor.id;
    classData.course = classData.courseId;
    classData.createdBy = req.instructor.id;
    delete classData.courseId;

    // Set Bunny Stream fields
    classData.bunnyVideoId = bunnyStream.videoId;
    classData.rtmpUrl = bunnyStream.rtmpUrl;
    classData.rtmpKey = bunnyStream.rtmpKey;
    classData.playbackUrl = bunnyStream.playbackUrl;

    // Remove any Zoom fields if accidentally passed
    delete classData.zoomMeetingId;
    delete classData.zoomJoinUrl;
    delete classData.zoomStartUrl;
    delete classData.zoomPassword;

    const liveClass = await LiveClass.create(classData);

    // Add to instructor's live classes
    await Instructor.findByIdAndUpdate(req.instructor.id, {
        $push: { liveClasses: liveClass._id },
        $inc: { totalLiveClasses: 1 }
    });

    // Return the full live class including RTMP creds for the instructor
    const result = await LiveClass.findById(liveClass._id).select("+rtmpUrl +rtmpKey");

    successResponse(res, 201, "Live class created successfully. Use the RTMP URL and key in OBS to stream.", result);
});

// @route   PUT /api/v1/live-classes/:id
// @desc    Update a live class
// @access  Private (Instructor - owner)
export const updateLiveClass = asyncHandler(async (req, res) => {
    const liveClass = await LiveClass.findById(req.params.id);
    if (!liveClass) return errorResponse(res, 404, "Live class not found");

    if (liveClass.instructor.toString() !== req.instructor.id) {
        return errorResponse(res, 403, "You can only update your own live classes");
    }

    const updateData = req.body;
    updateData.updatedBy = req.instructor.id;

    const updated = await LiveClass.findByIdAndUpdate(req.params.id, updateData, {
        new: true, runValidators: true
    });

    successResponse(res, 200, "Live class updated successfully", updated);
});

// @route   DELETE /api/v1/live-classes/:id
// @desc    Delete (cancel) a live class and its Bunny stream
// @access  Private (Instructor - owner)
export const deleteLiveClass = asyncHandler(async (req, res) => {
    const liveClass = await LiveClass.findById(req.params.id);
    if (!liveClass) return errorResponse(res, 404, "Live class not found");

    if (liveClass.instructor.toString() !== req.instructor.id) {
        return errorResponse(res, 403, "You can only delete your own live classes");
    }

    if (liveClass.status === "in_progress") {
        return errorResponse(res, 400, "Cannot delete a live class that is in progress");
    }

    // Delete the Bunny stream/recording
    if (liveClass.bunnyVideoId) {
        try {
            await deleteLiveStream(liveClass.bunnyVideoId);
        } catch (e) {
            logger.error(`Failed to delete Bunny stream ${liveClass.bunnyVideoId}: ${e.message}`);
        }
    }

    await Instructor.findByIdAndUpdate(req.instructor.id, {
        $pull: { liveClasses: liveClass._id },
        $inc: { totalLiveClasses: -1 }
    });

    await LiveClass.findByIdAndDelete(req.params.id);

    successResponse(res, 200, "Live class deleted successfully");
});

// @route   PATCH /api/v1/live-classes/:id/start
// @desc    Start a live class (instructor should already be streaming via OBS)
// @access  Private (Instructor - owner)
export const startLiveClass = asyncHandler(async (req, res) => {
    const liveClass = await LiveClass.findById(req.params.id).select("+rtmpUrl +rtmpKey");
    if (!liveClass) return errorResponse(res, 404, "Live class not found");

    if (liveClass.instructor.toString() !== req.instructor.id) {
        return errorResponse(res, 403, "You can only start your own live classes");
    }

    const started = await liveClass.startClass();

    // Mark recording as active
    started.recordingStatus = "recording";
    await started.save({ validateBeforeSave: false });

    successResponse(res, 200, "Live class started successfully. Make sure OBS is streaming.", {
        ...started.toObject(),
        rtmpUrl: liveClass.rtmpUrl,
        rtmpKey: liveClass.rtmpKey,
    });
});

// @route   PATCH /api/v1/live-classes/:id/end
// @desc    End a live class (Bunny auto-saves the recording)
// @access  Private (Instructor - owner)
export const endLiveClass = asyncHandler(async (req, res) => {
    const liveClass = await LiveClass.findById(req.params.id);
    if (!liveClass) return errorResponse(res, 404, "Live class not found");

    if (liveClass.instructor.toString() !== req.instructor.id) {
        return errorResponse(res, 403, "You can only end your own live classes");
    }

    // End the class — model method handles recording status
    const ended = await liveClass.endClass(req.body);

    // After ending, generate a fresh signed playback URL for the recording
    if (ended.bunnyVideoId) {
        ended.recordingUrl = generateSignedPlaybackUrl(ended.bunnyVideoId, 86400); // 24h token
        await ended.save({ validateBeforeSave: false });
    }

    successResponse(res, 200, "Live class ended successfully. Recording will be available shortly (Bunny auto-saves it).", ended);
});

// @route   POST /api/v1/live-classes/:id/register
// @desc    Register for a live class (returns signed playback URL)
// @access  Private (User - enrolled in course)
export const registerForClass = asyncHandler(async (req, res) => {
    const liveClass = await LiveClass.findById(req.params.id);
    if (!liveClass) return errorResponse(res, 404, "Live class not found");

    // Verify enrollment in course
    const isEnrolled = await Enrollment.isUserEnrolled(req.user.id, liveClass.course);
    if (!isEnrolled && !liveClass.isPublic) {
        return errorResponse(res, 403, "You must be enrolled in the course to join this live class");
    }

    if (liveClass.registeredParticipants.length >= liveClass.maxParticipants) {
        return errorResponse(res, 400, "Class is full");
    }

    try {
        await liveClass.registerParticipant(req.user.id);

        // Generate a signed playback URL for this enrolled user
        const playbackUrl = generateSignedPlaybackUrl(liveClass.bunnyVideoId, 28800); // 8-hour token

        successResponse(res, 200, "Registered for live class successfully", {
            playbackUrl,
            scheduledAt: liveClass.scheduledAt,
            status: liveClass.status
        });
    } catch (error) {
        return errorResponse(res, 400, error.message);
    }
});

// @route   POST /api/v1/live-classes/:id/attendance
// @desc    Mark attendance for a live class
// @access  Private (Instructor - owner)
export const markAttendance = asyncHandler(async (req, res) => {
    const { userId } = req.body;
    const liveClass = await LiveClass.findById(req.params.id);
    if (!liveClass) return errorResponse(res, 404, "Live class not found");

    if (liveClass.instructor.toString() !== req.instructor.id) {
        return errorResponse(res, 403, "You can only mark attendance for your own classes");
    }

    await liveClass.markAttendance(userId);

    successResponse(res, 200, "Attendance marked successfully");
});

// @route   GET /api/v1/live-classes/:id/rtmp
// @desc    Get RTMP credentials for OBS (instructor only)
// @access  Private (Instructor - owner)
export const getRtmpCredentials = asyncHandler(async (req, res) => {
    const liveClass = await LiveClass.findById(req.params.id).select("+rtmpUrl +rtmpKey");
    if (!liveClass) return errorResponse(res, 404, "Live class not found");

    if (liveClass.instructor.toString() !== req.instructor.id) {
        return errorResponse(res, 403, "You can only view RTMP credentials for your own live classes");
    }

    successResponse(res, 200, "RTMP credentials retrieved", {
        rtmpUrl: liveClass.rtmpUrl,
        rtmpKey: liveClass.rtmpKey,
        bunnyVideoId: liveClass.bunnyVideoId,
        instructions: "In OBS: Settings → Stream → Service: Custom → Server: <rtmpUrl> → Stream Key: <rtmpKey>"
    });
});

// @route   GET /api/v1/live-classes/:id/recording-status
// @desc    Check recording status from Bunny after a live class ends
// @access  Private (Instructor - owner)
export const getRecordingStatus = asyncHandler(async (req, res) => {
    const liveClass = await LiveClass.findById(req.params.id);
    if (!liveClass) return errorResponse(res, 404, "Live class not found");

    if (liveClass.instructor.toString() !== req.instructor.id) {
        return errorResponse(res, 403, "You can only check recordings for your own live classes");
    }

    if (!liveClass.bunnyVideoId) {
        return errorResponse(res, 400, "No Bunny video associated with this live class");
    }

    try {
        const status = await getLiveStreamStatus(liveClass.bunnyVideoId);

        // Auto-update the model if Bunny says the recording is ready
        if (status.isAvailable && liveClass.recordingStatus !== "completed") {
            liveClass.recordingStatus = "completed";
            liveClass.recordingAvailable = true;
            liveClass.recordingDuration = status.duration || 0;
            liveClass.recordingUrl = generateSignedPlaybackUrl(liveClass.bunnyVideoId, 86400);
            await liveClass.save({ validateBeforeSave: false });
        }

        successResponse(res, 200, "Recording status retrieved", {
            recordingStatus: liveClass.recordingStatus,
            recordingAvailable: liveClass.recordingAvailable,
            recordingDuration: status.duration,
            encodeProgress: status.encodeProgress,
            isAvailable: status.isAvailable,
            recordingUrl: liveClass.recordingAvailable
                ? generateSignedPlaybackUrl(liveClass.bunnyVideoId, 86400)
                : null
        });
    } catch (error) {
        logger.error(`Error checking recording status: ${error.message}`);
        return errorResponse(res, 500, "Failed to check recording status");
    }
});
