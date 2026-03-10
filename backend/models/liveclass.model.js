import mongoose from "mongoose";

/**
 * Live Class Schema — Cloudflare Stream Integration
 * ══════════════════════════════════════════════════
 *
 * Session types:
 *   lecture      – Instructor → Students (1:N), course-bound, enrollment-gated
 *   doubt        – Instructor → Students (1:N), quick Q&A, course-bound
 *   instant      – Instant session, no prior schedule
 *   instructor   – Instructor → Instructor (internal, small group)
 *   business     – Admin ↔ Instructor business call
 *
 * Architecture:
 *   - One Cloudflare Live Input per instructor (reused for all sessions)
 *   - Instructor's RTMP credentials persist in Instructor model
 *   - Each LiveClass doc = one session/lecture (recording is per-session)
 *   - Signed JWT tokens (RS256) for secure playback
 *   - Auto-recording enabled on live input
 */

const liveClassSchema = new mongoose.Schema({
    // ═══════════ RELATIONSHIPS ═══════════
    instructor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Instructor",
        required: [true, "Live class must belong to an instructor"],
    },
    course: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Course",
        default: null, // null for instant/instructor/business sessions
    },
    lesson: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Lesson",
        default: null,
    },

    // ═══════════ SESSION TYPE ═══════════
    sessionType: {
        type: String,
        enum: ["lecture", "doubt", "instant", "instructor", "business"],
        default: "lecture",
    },

    // ═══════════ CLASS DETAILS ═══════════
    title: {
        type: String,
        required: [true, "Class title is required"],
        trim: true,
        maxlength: [200, "Title cannot exceed 200 characters"],
        minlength: [3, "Title must be at least 3 characters"],
    },
    description: {
        type: String,
        trim: true,
        maxlength: [2000, "Description cannot exceed 2000 characters"],
    },

    // ═══════════ SCHEDULING ═══════════
    scheduledAt: {
        type: Date,
        required: [true, "Scheduled time is required"],
    },
    duration: {
        type: Number, // minutes
        default: 60,
        min: [5, "Duration must be at least 5 minutes"],
        max: [480, "Duration cannot exceed 8 hours"],
    },
    timezone: {
        type: String,
        default: "Asia/Kolkata",
    },
    autoEndEnabled: {
        type: Boolean,
        default: true,
    },

    // ═══════════ CLOUDFLARE STREAM ═══════════
    // The Live Input UID is the instructor's persistent input (stored on Instructor model too)
    cfLiveInputId: {
        type: String, // Instructor's CF Live Input UID
    },
    // Per-session recording video UID (populated after stream ends)
    cfVideoUID: {
        type: String, // The recorded video UID from this specific session
    },
    // RTMP ingest creds (from instructor's live input — stored here for convenience)
    rtmpUrl: {
        type: String,
        select: false,
    },
    rtmpKey: {
        type: String,
        select: false,
    },
    srtUrl: {
        type: String,
        select: false,
    },
    webRTCUrl: {
        type: String,
        select: false,
    },
    playbackUrl: String,
    thumbnailUrl: String,
    requireSignedURLs: {
        type: Boolean,
        default: true,
    },

    // ═══════════ PARTICIPANTS ═══════════
    maxParticipants: {
        type: Number,
        default: 500,
        min: 1,
        max: 10000,
    },
    actualParticipants: {
        type: Number,
        default: 0,
        min: 0,
    },
    peakParticipants: {
        type: Number,
        default: 0,
    },
    registeredParticipants: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            refPath: "registeredParticipants.role",
        },
        role: {
            type: String,
            enum: ["User", "Instructor", "Admin"],
            default: "User",
        },
        registeredAt: {
            type: Date,
            default: Date.now,
        },
        joinedAt: Date,
        leftAt: Date,
        attended: {
            type: Boolean,
            default: false,
        },
    }],

    // Instructor-to-instructor: invited instructors
    invitedInstructors: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Instructor",
    }],
    // Doubt sessions: invited specific students
    invitedStudents: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    }],
    // Admin who created/joined business sessions
    invitedAdmin: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Admin",
    },

    // ═══════════ STATUS ═══════════
    status: {
        type: String,
        enum: ["scheduled", "live", "completed", "cancelled"],
        default: "scheduled",
    },

    // ═══════════ RECORDING ═══════════
    recordingStatus: {
        type: String,
        enum: ["none", "recording", "processing", "ready", "failed"],
        default: "none",
    },
    recordingAvailable: {
        type: Boolean,
        default: false,
    },
    recordingDuration: Number, // seconds

    // ═══════════ TIMESTAMPS ═══════════
    startedAt: Date,
    endedAt: Date,

    // ═══════════ CHAT / INTERACTIONS ═══════════
    chatEnabled: {
        type: Boolean,
        default: true,
    },
    raiseHandEnabled: {
        type: Boolean,
        default: true,
    },
    questionsEnabled: {
        type: Boolean,
        default: true,
    },
    // Chat messages stored as array (for small sessions) — large sessions use Socket only
    chatMessages: [{
        sender: {
            type: mongoose.Schema.Types.ObjectId,
            refPath: "chatMessages.senderRole",
        },
        senderRole: {
            type: String,
            enum: ["User", "Instructor", "Admin"],
        },
        senderName: String,
        message: {
            type: String,
            maxlength: 500,
        },
        type: {
            type: String,
            enum: ["chat", "question", "answer", "system", "emoji", "raise_hand"],
            default: "chat",
        },
        timestamp: {
            type: Date,
            default: Date.now,
        },
        pinned: {
            type: Boolean,
            default: false,
        },
    }],
    // Raised hands queue
    raisedHands: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            refPath: "raisedHands.role",
        },
        role: {
            type: String,
            enum: ["User", "Instructor"],
        },
        name: String,
        raisedAt: {
            type: Date,
            default: Date.now,
        },
        resolved: {
            type: Boolean,
            default: false,
        },
    }],

    // ═══════════ ADDITIONAL INFO ═══════════
    notes: {
        type: String,
        trim: true,
        maxlength: 2000,
    },
    tags: [String],
    isPublic: {
        type: Boolean,
        default: false,
    },
    isFreePreview: {
        type: Boolean,
        default: false,
    },
    materials: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Material",
    }],

    // ═══════════ AUDIT ═══════════
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        refPath: "createdByRole",
    },
    createdByRole: {
        type: String,
        enum: ["Instructor", "Admin"],
        default: "Instructor",
    },
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        refPath: "updatedByRole",
    },
    updatedByRole: {
        type: String,
        enum: ["Instructor", "Admin"],
    },
    cancellationReason: String,
}, {
    timestamps: true,
    collection: "liveclasses",
});

// ═══════════ INDEXES ═══════════
liveClassSchema.index({ instructor: 1, status: 1 });
liveClassSchema.index({ course: 1, status: 1 });
liveClassSchema.index({ scheduledAt: 1 });
liveClassSchema.index({ status: 1, scheduledAt: 1 });
liveClassSchema.index({ sessionType: 1, status: 1 });
liveClassSchema.index({ "registeredParticipants.user": 1 });
liveClassSchema.index({ createdAt: -1 });
liveClassSchema.index({ cfLiveInputId: 1 });

// ═══════════ PRE-SAVE ═══════════
liveClassSchema.pre("save", function () {
    if (this.isModified("status") && this.status === "completed" && !this.endedAt) {
        this.endedAt = new Date();
    }
    // Track peak participants
    const currentCount = this.registeredParticipants.filter(p => p.joinedAt && !p.leftAt).length;
    if (currentCount > this.peakParticipants) {
        this.peakParticipants = currentCount;
    }
});

// ═══════════ INSTANCE METHODS ═══════════

liveClassSchema.methods.startClass = function () {
    if (this.status !== "scheduled") {
        throw new Error("Class can only be started from scheduled status");
    }
    this.status = "live";
    this.startedAt = new Date();
    this.recordingStatus = "recording";
    return this.save();
};

liveClassSchema.methods.endClass = function () {
    if (this.status !== "live") {
        throw new Error("Class can only be ended if currently live");
    }
    this.status = "completed";
    this.endedAt = new Date();
    this.recordingStatus = "processing";
    this.recordingAvailable = false;
    return this.save();
};

liveClassSchema.methods.cancelClass = function (reason) {
    if (this.status === "completed") {
        throw new Error("Cannot cancel a completed class");
    }
    this.status = "cancelled";
    this.cancellationReason = reason || "No reason provided";
    this.endedAt = new Date();
    return this.save();
};

liveClassSchema.methods.registerParticipant = function (userId, role = "User") {
    const existing = this.registeredParticipants.find(
        p => p.user.toString() === userId.toString()
    );
    if (existing) {
        throw new Error("Already registered for this session");
    }
    if (this.registeredParticipants.length >= this.maxParticipants) {
        throw new Error("Session is at maximum capacity");
    }
    this.registeredParticipants.push({
        user: userId,
        role,
        registeredAt: new Date(),
    });
    return this.save();
};

liveClassSchema.methods.markJoined = function (userId) {
    const participant = this.registeredParticipants.find(
        p => p.user.toString() === userId.toString()
    );
    if (participant) {
        participant.joinedAt = new Date();
        participant.attended = true;
        this.actualParticipants = this.registeredParticipants.filter(p => p.attended).length;
    }
    return this.save();
};

liveClassSchema.methods.markLeft = function (userId) {
    const participant = this.registeredParticipants.find(
        p => p.user.toString() === userId.toString()
    );
    if (participant) {
        participant.leftAt = new Date();
    }
    return this.save();
};

// ═══════════ STATIC METHODS ═══════════

liveClassSchema.statics.getUpcomingClasses = function (instructorId, limit = 10) {
    return this.find({
        instructor: instructorId,
        scheduledAt: { $gte: new Date() },
        status: "scheduled",
    })
        .populate("course", "title")
        .sort({ scheduledAt: 1 })
        .limit(limit);
};

liveClassSchema.statics.getClassStats = function (instructorId) {
    return this.aggregate([
        { $match: { instructor: new mongoose.Types.ObjectId(instructorId) } },
        {
            $group: {
                _id: null,
                totalClasses: { $sum: 1 },
                completedClasses: {
                    $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] },
                },
                liveNow: {
                    $sum: { $cond: [{ $eq: ["$status", "live"] }, 1, 0] },
                },
                totalParticipants: { $sum: "$actualParticipants" },
                averageParticipants: { $avg: "$actualParticipants" },
                peakParticipants: { $max: "$peakParticipants" },
            },
        },
    ]);
};

const LiveClass = mongoose.model("LiveClass", liveClassSchema);

export { LiveClass };