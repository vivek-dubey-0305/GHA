import { LiveClass } from "../models/liveclass.model.js";
import { Course } from "../models/course.model.js";
import { Instructor } from "../models/instructor.model.js";
import { Enrollment } from "../models/enrollment.model.js";
import { Notification } from "../models/notification.model.js";
import { asyncHandler } from "../middlewares/async.middleware.js";
import { errorResponse, successResponse } from "../utils/response.utils.js";
import { getPagination, createPaginationResponse } from "../utils/pagination.utils.js";
import {
    createLiveInput, deleteLiveInput, getLiveInputStatus,
    isLiveInputConnected, getLiveInputDetails,
    getLiveInputRecordings, generateSignedToken, getSignedPlaybackUrls,
    getVideoDetails,
} from "../services/cloudflare-stream.service.js";
import logger from "../configs/logger.config.js";

/**
 * Live Class Controller — Cloudflare Stream Integration
 * ═════════════════════════════════════════════════════
 *
 * Architecture:
 *   - ONE Cloudflare Live Input per instructor (persisted on Instructor doc)
 *   - Each LiveClass doc = one session / lecture
 *   - RTMP creds from instructor's live input, stored on both Instructor + LiveClass
 *   - Signed JWT playback tokens (RS256) via self-signing keys
 *   - Auto-recording: Cloudflare records every live, creates a video UID per session
 *   - Socket.IO rooms for real-time chat, raise-hand, participant count
 *
 * Session types:
 *   lecture      – Instructor → Students (1:N), course-bound, enrollment-gated
 *   doubt        – Instructor → Students (1:N), quick Q&A, course-bound
 *   instant      – Instant session, no prior schedule, instructor or admin created
 *   instructor   – Instructor → Instructor (internal, small group)
 *   business     – Admin ↔ Instructor business call
 */

// ════════════════════════════════════════════
// CONSTANTS & HELPERS
// ════════════════════════════════════════════

const SESSION_TYPES_COURSE_REQUIRED = ["lecture", "doubt"];

/**
 * Ensure instructor has a Cloudflare Live Input.
 * Creates one if missing, then caches on Instructor doc.
 * Returns { cfLiveInputId, rtmpUrl, rtmpKey, srtUrl, webRTCUrl, playbackUrl }
 */
async function ensureInstructorLiveInput(instructor) {
    logger.info(`[ensureInstructorLiveInput] instructor=${instructor._id}, existing cfLiveInputId=${instructor.cfLiveInputId || 'NONE'}, cfRtmpUrl=${instructor.cfRtmpUrl ? 'SET' : 'MISSING'}`);

    // Already has a live input ID? Reuse it — never create a duplicate.
    if (instructor.cfLiveInputId) {
        // If RTMP URL is missing (partial save), re-fetch from Cloudflare API
        if (!instructor.cfRtmpUrl) {
            logger.warn(`[ensureInstructorLiveInput] cfLiveInputId exists but cfRtmpUrl missing — fetching from CF API`);
            try {
                const details = await getLiveInputDetails(instructor.cfLiveInputId);
                instructor.cfRtmpUrl = details.rtmps?.url || `rtmps://live.cloudflare.com:443/live/`;
                instructor.cfRtmpKey = details.rtmps?.streamKey || "";
                instructor.cfSrtUrl = details.srt?.url || "";
                instructor.cfWebRTCUrl = details.webRTC?.url || "";
                await instructor.save({ validateBeforeSave: false });
                logger.info(`[ensureInstructorLiveInput] Recovered RTMP creds from CF for input ${instructor.cfLiveInputId}`);
            } catch (err) {
                logger.error(`[ensureInstructorLiveInput] Failed to recover creds from CF: ${err.message}`);
            }
        }

        const fullInstructor = await Instructor.findById(instructor._id).select("+cfRtmpKey");
        logger.info(`[ensureInstructorLiveInput] Reusing existing live input ${instructor.cfLiveInputId}`);
        return {
            cfLiveInputId: instructor.cfLiveInputId,
            rtmpUrl: instructor.cfRtmpUrl || "",
            rtmpKey: fullInstructor.cfRtmpKey || "",
            srtUrl: instructor.cfSrtUrl || "",
            webRTCUrl: instructor.cfWebRTCUrl || "",
            playbackUrl: `https://${process.env.CLOUDFLARE_STREAM_SUBDOMAIN}/${instructor.cfLiveInputId}/manifest/video.m3u8`,
        };
    }

    // No live input exists — create one
    const label = `${instructor.firstName} ${instructor.lastName} - Live Input`;
    logger.info(`[ensureInstructorLiveInput] Creating NEW CF Live Input for instructor ${instructor._id}: "${label}"`);
    const cfInput = await createLiveInput(label, { requireSignedURLs: true });

    // Save to instructor model
    instructor.cfLiveInputId = cfInput.liveInputId;
    instructor.cfRtmpUrl = cfInput.rtmpUrl;
    instructor.cfRtmpKey = cfInput.rtmpKey;
    instructor.cfSrtUrl = cfInput.srtUrl;
    instructor.cfWebRTCUrl = cfInput.webRTCUrl;
    await instructor.save({ validateBeforeSave: false });

    logger.info(`[ensureInstructorLiveInput] Created CF Live Input ${cfInput.liveInputId} for instructor ${instructor._id}`);

    return {
        cfLiveInputId: cfInput.liveInputId,
        rtmpUrl: cfInput.rtmpUrl,
        rtmpKey: cfInput.rtmpKey,
        srtUrl: cfInput.srtUrl,
        webRTCUrl: cfInput.webRTCUrl,
        playbackUrl: cfInput.playbackUrl,
    };
}

/**
 * Verify playback access for a live class
 */
async function verifyPlaybackAccess(liveClass, req) {
    const isOwnerInstructor =
        req.instructor && liveClass.instructor.toString() === (req.instructor.id || req.instructor._id?.toString());
    const isAdmin = !!req.admin;

    if (isOwnerInstructor || isAdmin) return { allowed: true };

    // Instructor-to-instructor sessions
    if (liveClass.sessionType === "instructor") {
        if (req.instructor) {
            const isInvited = liveClass.invitedInstructors?.some(
                id => id.toString() === req.instructor.id
            );
            return isInvited ? { allowed: true } : { allowed: false, reason: "Not invited to this session" };
        }
        return { allowed: false, reason: "Only instructors can join instructor sessions" };
    }

    // Business sessions
    if (liveClass.sessionType === "business") {
        if (req.instructor) {
            return liveClass.instructor.toString() === req.instructor.id
                ? { allowed: true }
                : { allowed: false, reason: "Not part of this business call" };
        }
        return { allowed: false, reason: "Only admin or the assigned instructor can join" };
    }

    // Public / free preview
    if (liveClass.isPublic || liveClass.isFreePreview) return { allowed: true };

    // Course-bound: check enrollment
    if (req.user && liveClass.course) {
        const courseId = liveClass.course._id || liveClass.course;
        const isEnrolled = await Enrollment.isUserEnrolled(req.user.id, courseId);
        return isEnrolled
            ? { allowed: true }
            : { allowed: false, reason: "You must be enrolled in the course to join this session" };
    }

    return { allowed: false, reason: "Authentication required" };
}

/**
 * Emit Socket.IO event to a live class room
 */
function emitToLiveRoom(req, liveClassId, event, data) {
    const io = req.app.get("io");
    if (io) {
        io.to(`live:${liveClassId}`).emit(event, data);
    }
}

/**
 * Send notifications + Socket.IO broadcast when a session goes live.
 * - Course-bound (lecture/doubt): notify all enrolled students
 * - Instructor sessions: notify invited instructors
 * - Includes a join link: /live-classes/:id/room
 */
async function notifyLiveStart(req, liveClass) {
    const io = req.app.get("io");
    const instructorDoc = await Instructor.findById(liveClass.instructor).select("firstName lastName").lean();
    const hostName = instructorDoc ? `${instructorDoc.firstName} ${instructorDoc.lastName}` : "Instructor";
    const joinData = {
        liveClassId: liveClass._id,
        title: liveClass.title,
        sessionType: liveClass.sessionType,
        hostName,
        status: "live",
    };

    // ── Broadcast to the live room (anyone already in it) ──
    emitToLiveRoom(req, liveClass._id, "session_started", joinData);

    // ── Course-bound => notify enrolled students ──
    if (liveClass.course && ["lecture", "doubt"].includes(liveClass.sessionType)) {
        const courseId = liveClass.course._id || liveClass.course;

        // For doubt sessions with specific invited students, only notify them
        const enrollments = liveClass.invitedStudents?.length
            ? await Enrollment.find({ course: courseId, user: { $in: liveClass.invitedStudents }, status: { $in: ["active", "completed"] } }).select("user").lean()
            : await Enrollment.find({ course: courseId, status: { $in: ["active", "completed"] } }).select("user").lean();

        const notifs = enrollments.map(e => ({
            recipient: e.user,
            recipientRole: "User",
            type: "live_class_started",
            title: `🔴 ${hostName} is LIVE: ${liveClass.title}`,
            message: `A live ${liveClass.sessionType} session has started. Join now!`,
            data: joinData,
        }));

        if (notifs.length) {
            await Notification.insertMany(notifs).catch(err => logger.error(`Notification insert failed: ${err.message}`));
        }

        // Socket.IO push to each student's notification room
        if (io) {
            enrollments.forEach(e => {
                io.to(`notifications:User:${e.user}`).emit("live_class_started", joinData);
            });
        }
    }

    // ── Instructor sessions => notify invited instructors ──
    if (liveClass.invitedInstructors?.length) {
        const notifs = liveClass.invitedInstructors.map(iid => ({
            recipient: iid,
            recipientRole: "Instructor",
            type: "live_class_invite",
            title: `🔴 ${hostName} is LIVE: ${liveClass.title}`,
            message: `You are invited to join a live ${liveClass.sessionType} session.`,
            data: joinData,
        }));
        await Notification.insertMany(notifs).catch(err => logger.error(`Instructor notif failed: ${err.message}`));

        if (io) {
            liveClass.invitedInstructors.forEach(iid => {
                io.to(`notifications:Instructor:${iid}`).emit("live_class_started", joinData);
            });
        }
    }

    // ── Business sessions => notify admin ──
    if (liveClass.sessionType === "business" && liveClass.invitedAdmin) {
        await Notification.create({
            recipient: liveClass.invitedAdmin,
            recipientRole: "Admin",
            type: "live_class_started",
            title: `🔴 ${hostName} is LIVE: ${liveClass.title}`,
            message: "Business call session has started.",
            data: joinData,
        }).catch(err => logger.error(`Admin notif failed: ${err.message}`));

        if (io) {
            io.to(`notifications:Admin:${liveClass.invitedAdmin}`).emit("live_class_started", joinData);
        }
    }
}

// ════════════════════════════════════════════
// PUBLIC ROUTES
// ════════════════════════════════════════════

// @route   GET /api/v1/live-classes/upcoming
// @desc    Get upcoming public live classes
// @access  Public
export const getUpcomingClasses = asyncHandler(async (req, res) => {
    const { page, limit, skip } = getPagination(req.query, 10);

    const filter = {
        scheduledAt: { $gte: new Date() },
        status: "scheduled",
        isPublic: true,
        sessionType: { $in: ["lecture", "doubt"] },
    };

    const total = await LiveClass.countDocuments(filter);
    const classes = await LiveClass.find(filter)
        .populate("instructor", "firstName lastName profilePicture")
        .populate("course", "title thumbnail")
        .sort({ scheduledAt: 1 })
        .skip(skip)
        .limit(limit)
        .lean();

    // Strip sensitive fields
    classes.forEach(c => {
        delete c.rtmpUrl;
        delete c.rtmpKey;
        delete c.srtUrl;
        delete c.webRTCUrl;
        delete c.chatMessages;
    });

    successResponse(res, 200, "Upcoming classes retrieved", {
        liveClasses: classes,
        pagination: createPaginationResponse(total, page, limit),
    });
});

// ════════════════════════════════════════════
// INSTRUCTOR ROUTES
// ════════════════════════════════════════════

// @route   GET /api/v1/live-classes/my
// @desc    Get instructor's own live classes
// @access  Private (Instructor)
export const getMyLiveClasses = asyncHandler(async (req, res) => {
    const { page, limit, skip } = getPagination(req.query, 10);
    const { status, sessionType } = req.query;

    // Show sessions the instructor owns OR is invited to
    const filter = {
        $or: [
            { instructor: req.instructor.id },
            { invitedInstructors: req.instructor.id },
        ],
    };
    if (status) filter.status = status;
    if (sessionType) filter.sessionType = sessionType;

    const total = await LiveClass.countDocuments(filter);
    const classes = await LiveClass.find(filter)
        .populate("instructor", "firstName lastName email profilePicture")
        .populate("course", "title thumbnail")
        .populate("invitedInstructors", "firstName lastName email")
        .sort({ scheduledAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

    // Tag each class with the current instructor's role
    const enriched = classes.map(lc => ({
        ...lc,
        isOwner: lc.instructor?._id?.toString() === req.instructor.id || lc.instructor?.toString() === req.instructor.id,
    }));

    successResponse(res, 200, "Live classes retrieved", {
        liveClasses: enriched,
        pagination: createPaginationResponse(total, page, limit),
    });
});

// @route   GET /api/v1/live-classes/available-instructors
// @desc    Get all instructors available for live sessions
// @access  Private (Instructor)
export const getAvailableInstructors = asyncHandler(async (req, res) => {
    const instructors = await Instructor.find({
        _id: { $ne: req.instructor.id },
        isActive: true,
        isSuspended: false,
    })
        .select("firstName lastName email profilePicture specialization")
        .lean();

    successResponse(res, 200, "Available instructors retrieved", { instructors });
});

// @route   GET /api/v1/live-classes/stream-credentials
// @desc    Get instructor's persistent RTMP/OBS credentials
// @access  Private (Instructor)
export const getStreamCredentials = asyncHandler(async (req, res) => {
    const instructor = await Instructor.findById(req.instructor.id).select("+cfRtmpKey");
    if (!instructor) return errorResponse(res, 404, "Instructor not found");

    const creds = await ensureInstructorLiveInput(instructor);

    successResponse(res, 200, "Stream credentials retrieved", {
        cfLiveInputId: creds.cfLiveInputId,
        rtmpUrl: creds.rtmpUrl,
        rtmpKey: creds.rtmpKey,
        srtUrl: creds.srtUrl,
        webRTCUrl: creds.webRTCUrl,
        obsConfig: {
            service: "Custom...",
            server: creds.rtmpUrl,
            streamKey: creds.rtmpKey,
            instructions: "OBS → Settings → Stream → Service: Custom → paste Server & Stream Key",
        },
    });
});

// @route   GET /api/v1/live-classes/:id
// @desc    Get live class details (with signed playback for authorized users)
// @access  Private (Multi-role)
export const getLiveClass = asyncHandler(async (req, res) => {
    const liveClass = await LiveClass.findById(req.params.id)
        .populate("instructor", "firstName lastName profilePicture email")
        .populate("course", "title thumbnail")
        .populate("materials", "title type fileUrl")
        .populate("invitedInstructors", "firstName lastName email profilePicture");

    if (!liveClass) return errorResponse(res, 404, "Live class not found");

    const result = liveClass.toObject();
    const access = await verifyPlaybackAccess(liveClass, req);

    if (access.allowed) {
        const playbackUid = liveClass.cfVideoUID || liveClass.cfLiveInputId;
        if (playbackUid) {
            try {
                const urls = await getSignedPlaybackUrls(playbackUid, { expiresInSec: 14400 });
                result.signedPlayback = urls;
            } catch (err) {
                logger.error(`getLiveClass signed playback failed for ${playbackUid}: ${err.message}`);
            }
        }
    } else {
        delete result.playbackUrl;
        delete result.cfLiveInputId;
        delete result.cfVideoUID;
    }

    // RTMP creds only for the owner instructor
    const isOwner = req.instructor && liveClass.instructor._id.toString() === req.instructor.id;
    if (!isOwner) {
        delete result.rtmpUrl;
        delete result.rtmpKey;
        delete result.srtUrl;
        delete result.webRTCUrl;
    }

    // Don't send full chat history in detail response
    delete result.chatMessages;

    successResponse(res, 200, "Live class retrieved", result);
});

// @route   POST /api/v1/live-classes
// @desc    Create a live class (uses instructor's persistent live input)
// @access  Private (Instructor)
export const createLiveClassByInstructor = asyncHandler(async (req, res) => {
    const data = req.body;
    const sessionType = data.sessionType || "lecture";
    const instructor = await Instructor.findById(req.instructor.id);
    if (!instructor) return errorResponse(res, 404, "Instructor not found");

    // Validate course requirement for lecture/doubt
    if (SESSION_TYPES_COURSE_REQUIRED.includes(sessionType)) {
        if (!data.courseId) {
            return errorResponse(res, 400, "Course is required for lecture/doubt sessions");
        }
        const course = await Course.findById(data.courseId);
        if (!course || course.instructor.toString() !== req.instructor.id) {
            return errorResponse(res, 403, "You can only create live classes for your own courses");
        }
        data.course = data.courseId;
    }

    // Validate invited instructors
    if (sessionType === "instructor" && data.invitedInstructorIds?.length) {
        const validInstructors = await Instructor.find({
            _id: { $in: data.invitedInstructorIds },
            isActive: true,
        }).select("_id");
        data.invitedInstructors = validInstructors.map(i => i._id);
    }

    // Ensure instructor has CF live input (creates if needed)
    let cfCreds;
    try {
        cfCreds = await ensureInstructorLiveInput(instructor);
    } catch (error) {
        logger.error(`CF live input setup failed: ${error.message}`);
        return errorResponse(res, 500, "Failed to setup live stream. Please try again.");
    }

    const liveClassData = {
        instructor: req.instructor.id,
        course: data.course || null,
        lesson: data.lessonId || null,
        sessionType,
        title: data.title,
        description: data.description,
        scheduledAt: data.scheduledAt || new Date(),
        duration: data.duration || 60,
        timezone: data.timezone || "Asia/Kolkata",
        autoEndEnabled: data.autoEndEnabled !== false,
        cfLiveInputId: cfCreds.cfLiveInputId,
        rtmpUrl: cfCreds.rtmpUrl,
        rtmpKey: cfCreds.rtmpKey,
        srtUrl: cfCreds.srtUrl,
        webRTCUrl: cfCreds.webRTCUrl,
        playbackUrl: cfCreds.playbackUrl,
        requireSignedURLs: true,
        maxParticipants: data.maxParticipants || 500,
        invitedInstructors: data.invitedInstructors || [],
        isPublic: data.isPublic || false,
        isFreePreview: data.isFreePreview || false,
        chatEnabled: data.chatEnabled !== false,
        raiseHandEnabled: data.raiseHandEnabled !== false,
        questionsEnabled: data.questionsEnabled !== false,
        notes: data.notes,
        tags: data.tags || [],
        createdBy: req.instructor.id,
        createdByRole: "Instructor",
    };

    const liveClass = await LiveClass.create(liveClassData);

    // Update instructor stats
    await Instructor.findByIdAndUpdate(req.instructor.id, {
        $push: { liveClasses: liveClass._id },
        $inc: { totalLiveClasses: 1 },
    });

    const result = await LiveClass.findById(liveClass._id).select("+rtmpUrl +rtmpKey +srtUrl +webRTCUrl");

    successResponse(res, 201, "Live class created. Use your OBS credentials to stream.", result);
});

// @route   POST /api/v1/live-classes/instant
// @desc    Create an instant live session (starts immediately)
// @access  Private (Instructor)
export const createInstantSession = asyncHandler(async (req, res) => {
    const data = req.body;
    const instructor = await Instructor.findById(req.instructor.id);
    if (!instructor) return errorResponse(res, 404, "Instructor not found");

    // Validate purpose/sessionType
    const validPurposes = ["doubt", "instant", "instructor"];
    const sessionType = validPurposes.includes(data.sessionType) ? data.sessionType : "instant";

    // For doubt sessions — validate selected students
    if (sessionType === "doubt" && !data.courseId) {
        return errorResponse(res, 400, "Course is required for doubt-solving sessions");
    }

    // For instructor sessions — validate invited instructors
    if (sessionType === "instructor" && (!data.invitedInstructorIds || !data.invitedInstructorIds.length)) {
        return errorResponse(res, 400, "Select at least one instructor for an instructor call");
    }

    let cfCreds;
    try {
        cfCreds = await ensureInstructorLiveInput(instructor);
    } catch (error) {
        logger.error(`CF instant session setup failed: ${error.message}`);
        return errorResponse(res, 500, "Failed to create instant session.");
    }

    // Validate invited instructors if provided
    let invitedInstructors = [];
    if (data.invitedInstructorIds?.length) {
        const valid = await Instructor.find({ _id: { $in: data.invitedInstructorIds }, isActive: true }).select("_id");
        invitedInstructors = valid.map(i => i._id);
    }

    // Create as "scheduled" — NOT live. Instructor must connect OBS first.
    const liveClass = await LiveClass.create({
        instructor: req.instructor.id,
        course: data.courseId || null,
        sessionType,
        title: data.title || (sessionType === "doubt" ? "Doubt Session" : sessionType === "instructor" ? "Instructor Call" : "Instant Session"),
        description: data.description,
        scheduledAt: new Date(),
        duration: data.duration || 60,
        autoEndEnabled: data.autoEndEnabled !== false,
        cfLiveInputId: cfCreds.cfLiveInputId,
        rtmpUrl: cfCreds.rtmpUrl,
        rtmpKey: cfCreds.rtmpKey,
        srtUrl: cfCreds.srtUrl,
        webRTCUrl: cfCreds.webRTCUrl,
        playbackUrl: cfCreds.playbackUrl,
        requireSignedURLs: true,
        maxParticipants: data.maxParticipants || 500,
        invitedInstructors,
        invitedStudents: data.invitedStudentIds || [],
        isPublic: false,
        chatEnabled: data.chatEnabled !== false,
        raiseHandEnabled: data.raiseHandEnabled !== false,
        createdBy: req.instructor.id,
        createdByRole: "Instructor",
    });

    await Instructor.findByIdAndUpdate(req.instructor.id, {
        $push: { liveClasses: liveClass._id },
        $inc: { totalLiveClasses: 1 },
    });

    successResponse(res, 201, "Session created. Connect OBS and click Go Live when ready.", {
        _id: liveClass._id,
        status: liveClass.status,
        sessionType: liveClass.sessionType,
        title: liveClass.title,
        cfLiveInputId: liveClass.cfLiveInputId,
        rtmpUrl: cfCreds.rtmpUrl,
        rtmpKey: cfCreds.rtmpKey,
        srtUrl: cfCreds.srtUrl,
    });
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

    if (liveClass.status === "live") {
        return errorResponse(res, 400, "Cannot update a live session that is currently streaming");
    }

    const updateData = req.body;
    updateData.updatedBy = req.instructor.id;
    updateData.updatedByRole = "Instructor";

    // Prevent changing critical fields
    delete updateData.cfLiveInputId;
    delete updateData.rtmpUrl;
    delete updateData.rtmpKey;
    delete updateData.instructor;
    delete updateData.status;

    const updated = await LiveClass.findByIdAndUpdate(req.params.id, updateData, {
        new: true,
        runValidators: true,
    });

    successResponse(res, 200, "Live class updated", updated);
});

// @route   DELETE /api/v1/live-classes/:id
// @desc    Delete a live class
// @access  Private (Instructor - owner)
export const deleteLiveClassByInstructor = asyncHandler(async (req, res) => {
    const liveClass = await LiveClass.findById(req.params.id);
    if (!liveClass) return errorResponse(res, 404, "Live class not found");

    if (liveClass.instructor.toString() !== req.instructor.id) {
        return errorResponse(res, 403, "You can only delete your own live classes");
    }

    if (liveClass.status === "live") {
        return errorResponse(res, 400, "Cannot delete a session that is currently live. End it first.");
    }

    // Do NOT delete the CF live input — it belongs to the instructor, reused for all sessions

    await Instructor.findByIdAndUpdate(req.instructor.id, {
        $pull: { liveClasses: liveClass._id },
        $inc: { totalLiveClasses: -1 },
    });

    await LiveClass.findByIdAndDelete(req.params.id);
    successResponse(res, 200, "Live class deleted");
});

// @route   PATCH /api/v1/live-classes/:id/start
// @desc    Start a live class — verifies OBS/encoder is connected to Cloudflare first
// @access  Private (Instructor - owner)
export const startLiveClass = asyncHandler(async (req, res) => {
    const liveClass = await LiveClass.findById(req.params.id).select("+rtmpUrl +rtmpKey +srtUrl +webRTCUrl");
    if (!liveClass) return errorResponse(res, 404, "Live class not found");

    if (liveClass.instructor.toString() !== req.instructor.id) {
        return errorResponse(res, 403, "You can only start your own live classes");
    }

    if (liveClass.status !== "scheduled") {
        return errorResponse(res, 400, `Cannot start a session with status "${liveClass.status}"`);
    }

    // ── Verify OBS is actually connected to Cloudflare ──
    if (!liveClass.cfLiveInputId) {
        return errorResponse(res, 400, "No Cloudflare live input configured for this session");
    }

    let cfStatus;
    try {
        cfStatus = await isLiveInputConnected(liveClass.cfLiveInputId);
    } catch (err) {
        logger.error(`CF status check failed for ${liveClass.cfLiveInputId}: ${err.message}`);
        return errorResponse(res, 502, "Could not verify stream connection with Cloudflare. Try again.");
    }

    if (!cfStatus.connected) {
        return errorResponse(res, 409, "OBS is not connected. Please start streaming in OBS first, then click Go Live.", {
            cfStatus: cfStatus.status,
            instructions: "1. Open OBS  2. Go to Settings → Stream  3. Paste your RTMP URL & Key  4. Click Start Streaming  5. Then click Go Live here",
        });
    }

    // ── OBS verified — mark live ──
    try {
        await liveClass.startClass();
    } catch (e) {
        return errorResponse(res, 400, e.message);
    }

    // Schedule auto-end
    if (liveClass.autoEndEnabled && liveClass.duration) {
        const autoEndMs = liveClass.duration * 60 * 1000;
        setTimeout(async () => {
            try {
                const current = await LiveClass.findById(liveClass._id);
                if (current && current.status === "live") {
                    await current.endClass();
                    logger.info(`Auto-ended live class ${liveClass._id} after ${liveClass.duration}m`);
                    emitToLiveRoom(req, liveClass._id, "session_ended", {
                        liveClassId: liveClass._id,
                        reason: "auto_end",
                    });
                }
            } catch (err) {
                logger.error(`Auto-end failed for ${liveClass._id}: ${err.message}`);
            }
        }, autoEndMs);
    }

    // ── Notify all relevant participants ──
    await notifyLiveStart(req, liveClass);

    // ── Update in-memory broadcast tracking for late joiners ──
    const io = req.app.get("io");
    if (io?.activeBroadcasts) {
        io.activeBroadcasts.set(liveClass._id.toString(), { 
            startedAt: liveClass.startedAt, 
            startedBy: req.instructor.id 
        });
    }

    // ── Emit broadcast_started Socket.IO event to update UI for all connected instructors ──
    emitToLiveRoom(req, liveClass._id, "broadcast_started", {
        liveClassId: liveClass._id,
        startedAt: liveClass.startedAt,
        instructorId: req.instructor.id,
    });

    successResponse(res, 200, "You are LIVE! Stream is active.", {
        _id: liveClass._id,
        status: "live",
        startedAt: liveClass.startedAt,
    });
});

// @route   PATCH /api/v1/live-classes/:id/end
// @desc    End a live class
// @access  Private (Instructor - owner)
export const endLiveClass = asyncHandler(async (req, res) => {
    const liveClass = await LiveClass.findById(req.params.id);
    if (!liveClass) return errorResponse(res, 404, "Live class not found");

    if (liveClass.instructor.toString() !== req.instructor.id) {
        return errorResponse(res, 403, "You can only end your own live classes");
    }

    try {
        await liveClass.endClass();
    } catch (e) {
        return errorResponse(res, 400, e.message);
    }

    // Notify participants
    emitToLiveRoom(req, liveClass._id, "session_ended", {
        liveClassId: liveClass._id,
        reason: "instructor_ended",
    });

    // Emit broadcast_stopped to update UI for all connected participants
    emitToLiveRoom(req, liveClass._id, "broadcast_stopped", {
        liveClassId: liveClass._id,
    });

    // ── Clear from active broadcasts tracking ──
    const io = req.app.get("io");
    if (io?.activeBroadcasts) {
        io.activeBroadcasts.delete(liveClass._id.toString());
    }

    successResponse(res, 200, "Live class ended. Recording will be available shortly.", liveClass);
});

// @route   GET /api/v1/live-classes/:id/rtmp
// @desc    Get RTMP/ingest credentials
// @access  Private (Instructor - owner)
export const getRtmpCredentials = asyncHandler(async (req, res) => {
    const liveClass = await LiveClass.findById(req.params.id).select("+rtmpUrl +rtmpKey +srtUrl +webRTCUrl");
    if (!liveClass) return errorResponse(res, 404, "Live class not found");

    if (liveClass.instructor.toString() !== req.instructor.id) {
        return errorResponse(res, 403, "You can only view credentials for your own live classes");
    }

    successResponse(res, 200, "Ingest credentials retrieved", {
        rtmpUrl: liveClass.rtmpUrl,
        rtmpKey: liveClass.rtmpKey,
        srtUrl: liveClass.srtUrl,
        webRTCUrl: liveClass.webRTCUrl,
        cfLiveInputId: liveClass.cfLiveInputId,
        obsConfig: {
            service: "Custom...",
            server: liveClass.rtmpUrl,
            streamKey: liveClass.rtmpKey,
        },
    });
});

// @route   GET /api/v1/live-classes/:id/recording
// @desc    Get recording status and signed URL
// @access  Private (Instructor/Admin)
export const getRecordingStatus = asyncHandler(async (req, res) => {
    const liveClass = await LiveClass.findById(req.params.id);
    if (!liveClass) return errorResponse(res, 404, "Live class not found");

    if (liveClass.instructor.toString() !== req.instructor?.id && !req.admin) {
        return errorResponse(res, 403, "Access denied");
    }

    if (!liveClass.cfLiveInputId) {
        return errorResponse(res, 400, "No Cloudflare live input associated");
    }

    try {
        const recordings = await getLiveInputRecordings(liveClass.cfLiveInputId);

        if (recordings.length > 0) {
            const latest = recordings[0];
            const readyToStream = latest.readyToStream || latest.status?.state === "ready";

            if (readyToStream && liveClass.recordingStatus !== "ready") {
                liveClass.cfVideoUID = latest.uid;
                liveClass.recordingStatus = "ready";
                liveClass.recordingAvailable = true;
                liveClass.recordingDuration = latest.duration || 0;
                await liveClass.save({ validateBeforeSave: false });
            }

            const signedUrls = readyToStream
                ? await getSignedPlaybackUrls(latest.uid, { expiresInSec: 86400 })
                : null;

            return successResponse(res, 200, "Recording status retrieved", {
                recordingStatus: liveClass.recordingStatus,
                recordingAvailable: readyToStream,
                recordingDuration: latest.duration,
                cfVideoUID: latest.uid,
                signedPlayback: signedUrls,
                recordings: recordings.map(r => ({
                    uid: r.uid,
                    duration: r.duration,
                    readyToStream: r.readyToStream,
                    created: r.created,
                })),
            });
        }

        successResponse(res, 200, "No recordings available yet", {
            recordingStatus: liveClass.recordingStatus,
            recordingAvailable: false,
            recordings: [],
        });
    } catch (error) {
        logger.error(`Error getting recording status: ${error.message}`);
        return errorResponse(res, 500, "Failed to check recording status");
    }
});

// ════════════════════════════════════════════
// USER (STUDENT) ROUTES
// ════════════════════════════════════════════

// @route   POST /api/v1/live-classes/:id/join
// @desc    Join/register for a live class (returns signed playback token)
// @access  Private (User - enrolled in course)
export const joinLiveClass = asyncHandler(async (req, res) => {
    const liveClass = await LiveClass.findById(req.params.id)
        .populate("course", "title");
    if (!liveClass) return errorResponse(res, 404, "Live class not found");

    // Enrollment check for course-bound sessions
    if (SESSION_TYPES_COURSE_REQUIRED.includes(liveClass.sessionType) && !liveClass.isFreePreview) {
        if (!liveClass.course) {
            return errorResponse(res, 400, "This session has no associated course");
        }
        const isEnrolled = await Enrollment.isUserEnrolled(req.user.id, liveClass.course._id);
        if (!isEnrolled) {
            return errorResponse(res, 403, "You must be enrolled in the course to join this live class");
        }
    }

    // Register + markJoined atomically to avoid Mongoose VersionError
    const alreadyRegistered = liveClass.registeredParticipants.some(
        p => p.user.toString() === req.user.id
    );

    if (!alreadyRegistered) {
        if (liveClass.registeredParticipants.length >= liveClass.maxParticipants) {
            return errorResponse(res, 400, "Session is at maximum capacity");
        }
        await LiveClass.findByIdAndUpdate(req.params.id, {
            $push: { registeredParticipants: { user: req.user.id, role: "User", registeredAt: new Date(), joinedAt: new Date(), attended: true } },
            $inc: { actualParticipants: 1 },
        });
    } else {
        await LiveClass.updateOne(
            { _id: req.params.id, "registeredParticipants.user": req.user.id },
            { $set: { "registeredParticipants.$.joinedAt": new Date(), "registeredParticipants.$.attended": true } }
        );
    }

    // Generate signed playback (8 hours)
    const playbackUid = liveClass.cfVideoUID || liveClass.cfLiveInputId;
    const signedUrls = playbackUid
        ? await getSignedPlaybackUrls(playbackUid, { expiresInSec: 28800 })
        : null;

    // Notify room about new participant
    emitToLiveRoom(req, liveClass._id, "participant_joined", {
        userId: req.user.id,
        name: req.user.name || req.user.firstName,
        role: "User",
        count: liveClass.registeredParticipants.filter(p => p.attended).length,
    });

    successResponse(res, 200, "Joined live class", {
        liveClassId: liveClass._id,
        title: liveClass.title,
        status: liveClass.status,
        scheduledAt: liveClass.scheduledAt,
        chatEnabled: liveClass.chatEnabled,
        raiseHandEnabled: liveClass.raiseHandEnabled,
        questionsEnabled: liveClass.questionsEnabled,
        signedPlayback: signedUrls,
    });
});

// @route   POST /api/v1/live-classes/:id/leave
// @desc    Mark user as left
// @access  Private (User)
export const leaveLiveClass = asyncHandler(async (req, res) => {
    const liveClass = await LiveClass.findById(req.params.id);
    if (!liveClass) return errorResponse(res, 404, "Live class not found");

    await liveClass.markLeft(req.user.id);

    emitToLiveRoom(req, liveClass._id, "participant_left", {
        userId: req.user.id,
        count: liveClass.registeredParticipants.filter(p => p.attended && !p.leftAt).length,
    });

    successResponse(res, 200, "Left live class");
});

// ════════════════════════════════════════════
// CHAT / INTERACTIONS
// ════════════════════════════════════════════

// @route   POST /api/v1/live-classes/:id/chat
// @desc    Send a chat message
// @access  Private (Any authenticated participant)
export const sendChatMessage = asyncHandler(async (req, res) => {
    const liveClass = await LiveClass.findById(req.params.id);
    if (!liveClass) return errorResponse(res, 404, "Live class not found");

    if (!liveClass.chatEnabled) {
        return errorResponse(res, 400, "Chat is disabled for this session");
    }

    if (liveClass.status !== "live") {
        return errorResponse(res, 400, "Chat is only available during live sessions");
    }

    const { message, type, skipBroadcast } = req.body;
    if (!message || !message.trim()) {
        return errorResponse(res, 400, "Message cannot be empty");
    }

    const senderId = req.user?.id || req.instructor?.id || req.admin?.id;
    const senderRole = req.user ? "User" : req.instructor ? "Instructor" : "Admin";
    const senderName = req.user?.name || req.user?.firstName ||
        (req.instructorData ? `${req.instructorData.firstName} ${req.instructorData.lastName}` : 
         req.instructor ? `${req.instructor.firstName || ''} ${req.instructor.lastName || ''}`.trim() || req.instructor.email : "Admin");

    const chatMsg = {
        sender: senderId,
        senderRole,
        senderName,
        message: message.trim(),
        type: type || "chat",
        timestamp: new Date(),
    };

    // Save to DB (limited to last 500 messages per session)
    liveClass.chatMessages.push(chatMsg);
    if (liveClass.chatMessages.length > 500) {
        liveClass.chatMessages = liveClass.chatMessages.slice(-500);
    }
    await liveClass.save({ validateBeforeSave: false });

    // Broadcast via Socket.IO (skip if already broadcast via socket client)
    if (!skipBroadcast) {
        emitToLiveRoom(req, liveClass._id, "chat_message", chatMsg);
    }

    successResponse(res, 201, "Message sent", chatMsg);
});

// @route   GET /api/v1/live-classes/:id/chat
// @desc    Get chat history
// @access  Private (Any authenticated participant)
export const getChatHistory = asyncHandler(async (req, res) => {
    const liveClass = await LiveClass.findById(req.params.id)
        .select("chatMessages chatEnabled");
    if (!liveClass) return errorResponse(res, 404, "Live class not found");

    const limit = Math.min(parseInt(req.query.limit) || 50, 200);
    const messages = liveClass.chatMessages.slice(-limit);

    successResponse(res, 200, "Chat history retrieved", { messages });
});

// @route   POST /api/v1/live-classes/:id/raise-hand
// @desc    Raise hand in a live session
// @access  Private (User/Instructor)
export const raiseHand = asyncHandler(async (req, res) => {
    const liveClass = await LiveClass.findById(req.params.id);
    if (!liveClass) return errorResponse(res, 404, "Live class not found");

    if (!liveClass.raiseHandEnabled) {
        return errorResponse(res, 400, "Raise hand is disabled for this session");
    }

    if (liveClass.status !== "live") {
        return errorResponse(res, 400, "Can only raise hand during live sessions");
    }

    const userId = req.user?.id || req.instructor?.id;
    const role = req.user ? "User" : "Instructor";
    const name = req.user?.name || req.user?.firstName ||
        (req.instructorData ? `${req.instructorData.firstName} ${req.instructorData.lastName}` :
         `${req.instructor?.firstName || ""} ${req.instructor?.lastName || ""}`.trim());

    // Check if already raised
    const alreadyRaised = liveClass.raisedHands.find(
        h => h.user.toString() === userId && !h.resolved
    );
    if (alreadyRaised) {
        return errorResponse(res, 400, "Your hand is already raised");
    }

    liveClass.raisedHands.push({ user: userId, role, name, raisedAt: new Date() });
    await liveClass.save({ validateBeforeSave: false });

    emitToLiveRoom(req, liveClass._id, "hand_raised", { userId, name, role });

    successResponse(res, 200, "Hand raised");
});

// @route   PATCH /api/v1/live-classes/:id/lower-hand/:userId
// @desc    Lower / resolve a raised hand (instructor/admin action)
// @access  Private (Instructor-owner / Admin)
export const lowerHand = asyncHandler(async (req, res) => {
    const liveClass = await LiveClass.findById(req.params.id);
    if (!liveClass) return errorResponse(res, 404, "Live class not found");

    const isOwner = req.instructor && liveClass.instructor.toString() === req.instructor.id;
    if (!isOwner && !req.admin) {
        return errorResponse(res, 403, "Only the session owner or admin can lower hands");
    }

    const hand = liveClass.raisedHands.find(
        h => h.user.toString() === req.params.userId && !h.resolved
    );
    if (hand) {
        hand.resolved = true;
        await liveClass.save({ validateBeforeSave: false });
    }

    emitToLiveRoom(req, liveClass._id, "hand_lowered", { userId: req.params.userId });

    successResponse(res, 200, "Hand lowered");
});

// @route   POST /api/v1/live-classes/:id/pin-message
// @desc    Pin a chat message (instructor/admin)
// @access  Private (Instructor-owner / Admin)
export const pinMessage = asyncHandler(async (req, res) => {
    const liveClass = await LiveClass.findById(req.params.id);
    if (!liveClass) return errorResponse(res, 404, "Live class not found");

    const isOwner = req.instructor && liveClass.instructor.toString() === req.instructor.id;
    if (!isOwner && !req.admin) {
        return errorResponse(res, 403, "Only the session owner or admin can pin messages");
    }

    const { messageIndex } = req.body;
    if (messageIndex !== undefined && liveClass.chatMessages[messageIndex]) {
        // Unpin all others first
        liveClass.chatMessages.forEach(m => { m.pinned = false; });
        liveClass.chatMessages[messageIndex].pinned = true;
        await liveClass.save({ validateBeforeSave: false });

        emitToLiveRoom(req, liveClass._id, "message_pinned", {
            message: liveClass.chatMessages[messageIndex],
        });
    }

    successResponse(res, 200, "Message pinned");
});

// @route   PATCH /api/v1/live-classes/:id/toggle-chat
// @desc    Enable/disable chat during a live session
// @access  Private (Instructor-owner)
export const toggleChat = asyncHandler(async (req, res) => {
    const liveClass = await LiveClass.findById(req.params.id);
    if (!liveClass) return errorResponse(res, 404, "Live class not found");

    if (liveClass.instructor.toString() !== req.instructor.id) {
        return errorResponse(res, 403, "Only the session owner can toggle chat");
    }

    liveClass.chatEnabled = !liveClass.chatEnabled;
    await liveClass.save({ validateBeforeSave: false });

    emitToLiveRoom(req, liveClass._id, "chat_toggled", { chatEnabled: liveClass.chatEnabled });

    successResponse(res, 200, `Chat ${liveClass.chatEnabled ? "enabled" : "disabled"}`, {
        chatEnabled: liveClass.chatEnabled,
    });
});

// @route   GET /api/v1/live-classes/:id/participants
// @desc    Get current participants list
// @access  Private (Instructor-owner / Admin)
export const getParticipants = asyncHandler(async (req, res) => {
    const liveClass = await LiveClass.findById(req.params.id)
        .populate("registeredParticipants.user", "name firstName lastName email profilePicture");
    if (!liveClass) return errorResponse(res, 404, "Live class not found");

    const isOwner = req.instructor && liveClass.instructor.toString() === req.instructor.id;
    if (!isOwner && !req.admin) {
        return errorResponse(res, 403, "Only the session owner or admin can view participants");
    }

    const online = liveClass.registeredParticipants.filter(p => p.joinedAt && !p.leftAt);
    const total = liveClass.registeredParticipants.length;

    successResponse(res, 200, "Participants retrieved", {
        total,
        online: online.length,
        peak: liveClass.peakParticipants,
        participants: liveClass.registeredParticipants,
    });
});

// ════════════════════════════════════════════
// TEST / DEBUG: Signed Playback URL
// ════════════════════════════════════════════

// @route   GET /api/v1/live-classes/:id/test-playback
// @desc    Generate and return a signed playback URL for testing
// @access  Private (Instructor)
export const testSignedPlayback = asyncHandler(async (req, res) => {
    const liveClass = await LiveClass.findById(req.params.id);
    if (!liveClass) return errorResponse(res, 404, "Live class not found");

    const playbackUid = liveClass.cfVideoUID || liveClass.cfLiveInputId;
    if (!playbackUid) {
        return errorResponse(res, 400, "No Cloudflare live input ID found on this session");
    }

    try {
        const signedUrls = await getSignedPlaybackUrls(playbackUid, { expiresInSec: 3600 });
        successResponse(res, 200, "Signed playback URLs generated", {
            playbackUid,
            ...signedUrls,
        });
    } catch (err) {
        logger.error(`Test playback token generation failed: ${err.message}`);
        return errorResponse(res, 500, `Token generation failed: ${err.message}`);
    }
});

// ════════════════════════════════════════════
// INSTRUCTOR-TO-INSTRUCTOR ROUTES
// ════════════════════════════════════════════

// @route   POST /api/v1/live-classes/:id/join-instructor
// @desc    Instructor joins an instructor-to-instructor session
// @access  Private (Instructor)
export const joinAsInstructor = asyncHandler(async (req, res) => {
    logger.info(`[joinAsInstructor] liveClassId=${req.params.id}, instructorId=${req.instructor.id}`);
    const liveClass = await LiveClass.findById(req.params.id);
    if (!liveClass) return errorResponse(res, 404, "Live class not found");

    logger.info(`[joinAsInstructor] LiveClass found: status=${liveClass.status}, cfLiveInputId=${liveClass.cfLiveInputId || 'NONE'}, cfVideoUID=${liveClass.cfVideoUID || 'NONE'}`);

    const isOwner = liveClass.instructor.toString() === req.instructor.id;
    const isInvited = liveClass.invitedInstructors?.some(
        id => id.toString() === req.instructor.id
    );

    if (!isOwner && !isInvited) {
        return errorResponse(res, 403, "You are not invited to this session");
    }

    // Register + markJoined atomically to avoid Mongoose VersionError
    const alreadyRegistered = liveClass.registeredParticipants.some(
        p => p.user.toString() === req.instructor.id
    );

    if (!alreadyRegistered) {
        if (liveClass.registeredParticipants.length >= liveClass.maxParticipants) {
            return errorResponse(res, 400, "Session is at maximum capacity");
        }
        await LiveClass.findByIdAndUpdate(req.params.id, {
            $push: { registeredParticipants: { user: req.instructor.id, role: "Instructor", registeredAt: new Date(), joinedAt: new Date(), attended: true } },
            $inc: { actualParticipants: 1 },
        });
    } else {
        await LiveClass.updateOne(
            { _id: req.params.id, "registeredParticipants.user": req.instructor.id },
            { $set: { "registeredParticipants.$.joinedAt": new Date(), "registeredParticipants.$.attended": true } }
        );
        await LiveClass.findByIdAndUpdate(req.params.id, {
            actualParticipants: liveClass.registeredParticipants.filter(p => p.attended).length + (liveClass.registeredParticipants.find(p => p.user.toString() === req.instructor.id)?.attended ? 0 : 1),
        });
    }

    const playbackUid = liveClass.cfVideoUID || liveClass.cfLiveInputId;
    logger.info(`[joinAsInstructor] Playback UID resolved: ${playbackUid} (cfVideoUID=${liveClass.cfVideoUID || 'NONE'}, cfLiveInputId=${liveClass.cfLiveInputId || 'NONE'})`);

    let signedUrls = null;
    if (playbackUid) {
        try {
            signedUrls = await getSignedPlaybackUrls(playbackUid, { expiresInSec: 14400 });
            logger.info(`[joinAsInstructor] ✅ Signed HLS URL generated: ${signedUrls.hls?.substring(0, 100)}...`);
        } catch (err) {
            logger.error(`[joinAsInstructor] ❌ Signed playback generation FAILED for ${playbackUid}: ${err.message}`);
        }
    } else {
        logger.warn(`[joinAsInstructor] ⚠️ No playbackUid — cfLiveInputId and cfVideoUID are both empty for liveClass ${liveClass._id}`);
    }

    // NOTE: Do NOT emit participant_joined here — the socket's join_live_class
    // event already broadcasts this. Emitting from both causes duplicate entries.

    const responseData = {
        liveClassId: liveClass._id,
        title: liveClass.title,
        status: liveClass.status,
        chatEnabled: liveClass.chatEnabled,
        isHost: isOwner,
        instructorName: req.instructorData ? `${req.instructorData.firstName} ${req.instructorData.lastName}` : null,
        signedPlayback: signedUrls,
    };
    logger.info(`[joinAsInstructor] Response: hasSignedPlayback=${!!signedUrls}, hasHls=${!!signedUrls?.hls}, status=${liveClass.status}`);

    successResponse(res, 200, "Joined session", responseData);
});

// ════════════════════════════════════════════
// ADMIN ROUTES
// ════════════════════════════════════════════

// @route   GET /api/v1/live-classes/admin/all
// @desc    Get all live classes (admin view)
// @access  Private (Admin)
export const getAllLiveClassesAdmin = asyncHandler(async (req, res) => {
    const { page, limit, skip } = getPagination(req.query, 20);
    const { status, sessionType, instructorId, courseId } = req.query;

    const filter = {};
    if (status) filter.status = status;
    if (sessionType) filter.sessionType = sessionType;
    if (instructorId) filter.instructor = instructorId;
    if (courseId) filter.course = courseId;

    const total = await LiveClass.countDocuments(filter);
    const classes = await LiveClass.find(filter)
        .populate("instructor", "firstName lastName email profilePicture")
        .populate("course", "title")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

    successResponse(res, 200, "All live classes retrieved", {
        liveClasses: classes,
        pagination: createPaginationResponse(total, page, limit),
    });
});

// @route   GET /api/v1/live-classes/admin/:id
// @desc    Get single live class (admin view with full details)
// @access  Private (Admin)
export const getLiveClassAdmin = asyncHandler(async (req, res) => {
    const liveClass = await LiveClass.findById(req.params.id)
        .select("+rtmpUrl +rtmpKey +srtUrl +webRTCUrl")
        .populate("instructor", "firstName lastName email profilePicture")
        .populate("course", "title")
        .populate("materials", "title type fileUrl")
        .populate("invitedInstructors", "firstName lastName email")
        .populate("registeredParticipants.user", "name email");

    if (!liveClass) return errorResponse(res, 404, "Live class not found");

    const playbackUid = liveClass.cfVideoUID || liveClass.cfLiveInputId;
    let signedUrls = null;
    if (playbackUid) {
        signedUrls = await getSignedPlaybackUrls(playbackUid, { expiresInSec: 14400 });
    }

    const result = liveClass.toObject();
    result.signedPlayback = signedUrls;

    successResponse(res, 200, "Live class details retrieved", result);
});

// @route   POST /api/v1/live-classes/admin
// @desc    Admin creates a live class (business call, instant, or on behalf of instructor)
// @access  Private (Admin)
export const createLiveClassByAdmin = asyncHandler(async (req, res) => {
    const data = req.body;

    if (!data.instructorId) {
        return errorResponse(res, 400, "Instructor ID is required");
    }

    const instructor = await Instructor.findById(data.instructorId);
    if (!instructor) {
        return errorResponse(res, 404, "Instructor not found");
    }

    let cfCreds;
    try {
        cfCreds = await ensureInstructorLiveInput(instructor);
    } catch (error) {
        logger.error(`Admin CF live input setup failed: ${error.message}`);
        return errorResponse(res, 500, "Failed to create live stream");
    }

    const sessionType = data.sessionType || "business";
    const isInstant = data.instant === true;

    const liveClass = await LiveClass.create({
        instructor: data.instructorId,
        course: data.courseId || null,
        sessionType,
        title: data.title || "Business Call",
        description: data.description,
        scheduledAt: isInstant ? new Date() : data.scheduledAt,
        duration: data.duration || 30,
        timezone: data.timezone || "Asia/Kolkata",
        autoEndEnabled: data.autoEndEnabled !== false,
        cfLiveInputId: cfCreds.cfLiveInputId,
        rtmpUrl: cfCreds.rtmpUrl,
        rtmpKey: cfCreds.rtmpKey,
        srtUrl: cfCreds.srtUrl,
        webRTCUrl: cfCreds.webRTCUrl,
        playbackUrl: cfCreds.playbackUrl,
        requireSignedURLs: true,
        maxParticipants: data.maxParticipants || 10,
        invitedInstructors: data.invitedInstructorIds || [],
        invitedAdmin: req.admin.id,
        isPublic: false,
        chatEnabled: data.chatEnabled !== false,
        status: isInstant ? "live" : "scheduled",
        startedAt: isInstant ? new Date() : undefined,
        recordingStatus: isInstant ? "recording" : "none",
        createdBy: req.admin.id,
        createdByRole: "Admin",
    });

    await Instructor.findByIdAndUpdate(data.instructorId, {
        $push: { liveClasses: liveClass._id },
        $inc: { totalLiveClasses: 1 },
    });

    const result = await LiveClass.findById(liveClass._id).select("+rtmpUrl +rtmpKey +srtUrl +webRTCUrl");

    successResponse(res, 201, isInstant ? "Instant session created and is LIVE" : "Live session scheduled", result);
});

// @route   PUT /api/v1/live-classes/admin/:id
// @desc    Admin updates a live class
// @access  Private (Admin)
export const updateLiveClassByAdmin = asyncHandler(async (req, res) => {
    const liveClass = await LiveClass.findById(req.params.id);
    if (!liveClass) return errorResponse(res, 404, "Live class not found");

    const updateData = req.body;
    updateData.updatedBy = req.admin.id;
    updateData.updatedByRole = "Admin";

    delete updateData.cfLiveInputId;
    delete updateData.rtmpUrl;
    delete updateData.rtmpKey;

    const updated = await LiveClass.findByIdAndUpdate(req.params.id, updateData, {
        new: true,
        runValidators: true,
    })
        .populate("instructor", "firstName lastName email")
        .populate("course", "title");

    successResponse(res, 200, "Live class updated by admin", updated);
});

// @route   DELETE /api/v1/live-classes/admin/:id
// @desc    Admin deletes a live class
// @access  Private (Admin)
export const deleteLiveClassByAdmin = asyncHandler(async (req, res) => {
    const liveClass = await LiveClass.findById(req.params.id);
    if (!liveClass) return errorResponse(res, 404, "Live class not found");

    await Instructor.findByIdAndUpdate(liveClass.instructor, {
        $pull: { liveClasses: liveClass._id },
        $inc: { totalLiveClasses: -1 },
    });

    await LiveClass.findByIdAndDelete(req.params.id);
    successResponse(res, 200, "Live class deleted by admin");
});

// @route   PATCH /api/v1/live-classes/admin/:id/end
// @desc    Admin force-ends a live class
// @access  Private (Admin)
export const endLiveClassByAdmin = asyncHandler(async (req, res) => {
    const liveClass = await LiveClass.findById(req.params.id);
    if (!liveClass) return errorResponse(res, 404, "Live class not found");

    try {
        await liveClass.endClass();
    } catch (e) {
        return errorResponse(res, 400, e.message);
    }

    emitToLiveRoom(req, liveClass._id, "session_ended", {
        liveClassId: liveClass._id,
        reason: "admin_ended",
    });

    successResponse(res, 200, "Live class ended by admin", liveClass);
});

// @route   PATCH /api/v1/live-classes/admin/:id/cancel
// @desc    Admin cancels a live class
// @access  Private (Admin)
export const cancelLiveClassByAdmin = asyncHandler(async (req, res) => {
    const liveClass = await LiveClass.findById(req.params.id);
    if (!liveClass) return errorResponse(res, 404, "Live class not found");

    try {
        await liveClass.cancelClass(req.body.reason || "Cancelled by admin");
    } catch (e) {
        return errorResponse(res, 400, e.message);
    }

    emitToLiveRoom(req, liveClass._id, "session_cancelled", {
        liveClassId: liveClass._id,
        reason: req.body.reason,
    });

    successResponse(res, 200, "Live class cancelled by admin", liveClass);
});

// @route   POST /api/v1/live-classes/admin/:id/join
// @desc    Admin joins a live class (gets signed playback)
// @access  Private (Admin)
export const joinAsAdmin = asyncHandler(async (req, res) => {
    const liveClass = await LiveClass.findById(req.params.id);
    if (!liveClass) return errorResponse(res, 404, "Live class not found");

    try {
        await liveClass.registerParticipant(req.admin.id, "Admin");
    } catch (e) {
        if (!e.message.includes("Already registered")) {
            return errorResponse(res, 400, e.message);
        }
    }

    await liveClass.markJoined(req.admin.id);

    const playbackUid = liveClass.cfVideoUID || liveClass.cfLiveInputId;
    const signedUrls = playbackUid
        ? await getSignedPlaybackUrls(playbackUid, { expiresInSec: 14400 })
        : null;

    emitToLiveRoom(req, liveClass._id, "participant_joined", {
        userId: req.admin.id,
        name: "Admin",
        role: "Admin",
    });

    successResponse(res, 200, "Admin joined live session", {
        liveClassId: liveClass._id,
        title: liveClass.title,
        status: liveClass.status,
        chatEnabled: liveClass.chatEnabled,
        signedPlayback: signedUrls,
    });
});

// @route   GET /api/v1/live-classes/admin/stats
// @desc    Get live class statistics
// @access  Private (Admin)
export const getLiveClassStats = asyncHandler(async (req, res) => {
    const stats = await LiveClass.aggregate([
        {
            $group: {
                _id: null,
                totalClasses: { $sum: 1 },
                scheduled: { $sum: { $cond: [{ $eq: ["$status", "scheduled"] }, 1, 0] } },
                liveNow: { $sum: { $cond: [{ $eq: ["$status", "live"] }, 1, 0] } },
                completed: { $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] } },
                cancelled: { $sum: { $cond: [{ $eq: ["$status", "cancelled"] }, 1, 0] } },
                totalParticipants: { $sum: "$actualParticipants" },
                avgParticipants: { $avg: "$actualParticipants" },
                peakParticipants: { $max: "$peakParticipants" },
            },
        },
    ]);

    const byType = await LiveClass.aggregate([
        { $group: { _id: "$sessionType", count: { $sum: 1 } } },
    ]);

    successResponse(res, 200, "Live class stats", {
        overview: stats[0] || {},
        bySessionType: byType,
    });
});

// ════════════════════════════════════════════
// SHARED — ATTENDANCE
// ════════════════════════════════════════════

// @route   POST /api/v1/live-classes/:id/attendance
// @desc    Mark attendance (instructor owner or admin)
// @access  Private (Instructor / Admin)
export const markAttendance = asyncHandler(async (req, res) => {
    const { userId } = req.body;
    const liveClass = await LiveClass.findById(req.params.id);
    if (!liveClass) return errorResponse(res, 404, "Live class not found");

    const isOwner = req.instructor && liveClass.instructor.toString() === req.instructor.id;
    const isAdmin = !!req.admin;

    if (!isOwner && !isAdmin) {
        return errorResponse(res, 403, "Only the class owner or admin can mark attendance");
    }

    await liveClass.markJoined(userId);
    successResponse(res, 200, "Attendance marked");
});

// ════════════════════════════════════════════
// OBS AUTO-CONFIGURATION
// ════════════════════════════════════════════

// @route   GET /api/v1/live-classes/obs-config
// @desc    Get OBS auto-config data for the instructor
// @access  Private (Instructor)
export const getObsConfig = asyncHandler(async (req, res) => {
    const instructor = await Instructor.findById(req.instructor.id);
    if (!instructor) return errorResponse(res, 404, "Instructor not found");

    const creds = await ensureInstructorLiveInput(instructor);

    // OBS WebSocket protocol config for auto-launch
    const obsConfig = {
        // Stream settings for OBS
        stream: {
            type: "rtmp_custom",
            server: creds.rtmpUrl,
            key: creds.rtmpKey,
        },
        // Output settings optimized for Cloudflare Stream
        output: {
            mode: "Advanced",
            encoder: "x264",
            rateControl: "CBR",
            bitrate: 4500,   // 4.5 Mbps for 1080p
            keyintSec: 2,
            preset: "veryfast",
            profile: "high",
        },
        video: {
            baseResolution: "1920x1080",
            outputResolution: "1920x1080",
            fpsType: 0,
            fpsCommon: 30,
        },
        audio: {
            sampleRate: 48000,
            channelSetup: "Stereo",
            bitrate: 128,
        },
        // WebSocket commands for obs-websocket plugin
        websocketCommands: {
            setStreamSettings: {
                requestType: "SetStreamServiceSettings",
                requestData: {
                    streamServiceType: "rtmp_custom",
                    streamServiceSettings: {
                        server: creds.rtmpUrl,
                        key: creds.rtmpKey,
                    },
                },
            },
            startStreaming: {
                requestType: "StartStream",
            },
            stopStreaming: {
                requestType: "StopStream",
            },
        },
    };

    successResponse(res, 200, "OBS configuration retrieved", obsConfig);
});

// ════════════════════════════════════════════
// STREAM STATUS POLLING
// ════════════════════════════════════════════

// @route   GET /api/v1/live-classes/:id/stream-status
// @desc    Check if OBS/encoder is connected to Cloudflare for this session
// @access  Private (Instructor - owner)
export const checkStreamStatus = asyncHandler(async (req, res) => {
    const liveClass = await LiveClass.findById(req.params.id).select("cfLiveInputId instructor status").lean();
    if (!liveClass) return errorResponse(res, 404, "Live class not found");

    if (liveClass.instructor.toString() !== req.instructor.id) {
        return errorResponse(res, 403, "Access denied");
    }

    if (!liveClass.cfLiveInputId) {
        return successResponse(res, 200, "No live input", { connected: false, cfStatus: "no_input" });
    }

    try {
        const result = await isLiveInputConnected(liveClass.cfLiveInputId);
        return successResponse(res, 200, "Stream status checked", {
            connected: result.connected,
            cfStatus: result.status,
            sessionStatus: liveClass.status,
        });
    } catch (err) {
        logger.error(`Stream status check failed: ${err.message}`);
        return successResponse(res, 200, "Status check failed", {
            connected: false,
            cfStatus: "error",
            error: err.message,
        });
    }
});

// @route   GET /api/v1/live-classes/check-connection
// @desc    Check if instructor's OBS is connected (no specific session)
// @access  Private (Instructor)
export const checkInstructorConnection = asyncHandler(async (req, res) => {
    const instructor = await Instructor.findById(req.instructor.id).select("cfLiveInputId").lean();
    if (!instructor || !instructor.cfLiveInputId) {
        return successResponse(res, 200, "No live input configured", { connected: false, cfStatus: "no_input" });
    }

    try {
        const result = await isLiveInputConnected(instructor.cfLiveInputId);
        return successResponse(res, 200, "Connection status", {
            connected: result.connected,
            cfStatus: result.status,
        });
    } catch (err) {
        return successResponse(res, 200, "Check failed", { connected: false, cfStatus: "error" });
    }
});

// ════════════════════════════════════════════
// ENROLLED STUDENTS — for doubt session selection
// ════════════════════════════════════════════

// @route   GET /api/v1/live-classes/enrolled-students/:courseId
// @desc    Get students enrolled in a specific course (for doubt session invite)
// @access  Private (Instructor)
export const getEnrolledStudents = asyncHandler(async (req, res) => {
    const { courseId } = req.params;

    // Verify instructor owns the course
    const course = await Course.findById(courseId).select("instructor title").lean();
    if (!course) return errorResponse(res, 404, "Course not found");
    if (course.instructor.toString() !== req.instructor.id) {
        return errorResponse(res, 403, "You can only view students for your own courses");
    }

    const enrollments = await Enrollment.find({
        course: courseId,
        status: { $in: ["active", "completed"] },
    })
        .populate("user", "name firstName lastName email profilePicture")
        .select("user enrolledAt")
        .lean();

    const students = enrollments.map(e => ({
        _id: e.user._id,
        name: e.user.name || `${e.user.firstName || ""} ${e.user.lastName || ""}`.trim(),
        email: e.user.email,
        profilePicture: e.user.profilePicture,
        enrolledAt: e.enrolledAt,
    }));

    successResponse(res, 200, "Enrolled students retrieved", { students, courseTitle: course.title });
});

// ════════════════════════════════════════════
// ADMIN BUSINESS CALL REQUEST
// ════════════════════════════════════════════

// @route   POST /api/v1/live-classes/request-admin-call
// @desc    Instructor requests a business call with admin
// @access  Private (Instructor)
export const requestAdminCall = asyncHandler(async (req, res) => {
    const { title, description } = req.body;
    const instructor = await Instructor.findById(req.instructor.id).select("firstName lastName").lean();
    if (!instructor) return errorResponse(res, 404, "Instructor not found");

    const io = req.app.get("io");
    const requestData = {
        type: "admin_call_request",
        instructorId: req.instructor.id,
        instructorName: `${instructor.firstName} ${instructor.lastName}`,
        title: title || "Business Call Request",
        description: description || "",
        requestedAt: new Date(),
    };

    // Broadcast to all admin notification rooms
    if (io) {
        io.emit("admin_call_request", requestData);
    }

    successResponse(res, 200, "Business call request sent to admin. They will create the session.");
});
