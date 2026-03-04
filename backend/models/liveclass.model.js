import mongoose from "mongoose";

// Live Class Schema - Production Grade with Bunny Stream Live Integration
const liveClassSchema = new mongoose.Schema({
    // Relationships
    instructor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Instructor",
        required: [true, "Live class must belong to an instructor"]
    },
    course: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Course",
        required: [true, "Live class must belong to a course"]
    },

    // Class Details
    title: {
        type: String,
        required: [true, "Class title is required"],
        trim: true,
        maxlength: [100, "Title cannot exceed 100 characters"],
        minlength: [3, "Title must be at least 3 characters"]
    },
    description: {
        type: String,
        trim: true,
        maxlength: [1000, "Description cannot exceed 1000 characters"]
    },

    // Scheduling
    scheduledAt: {
        type: Date,
        required: [true, "Scheduled time is required"]
    },
    duration: {
        type: Number, // in minutes
        required: [true, "Duration is required"],
        min: [15, "Duration must be at least 15 minutes"],
        max: [480, "Duration cannot exceed 8 hours"]
    },
    timezone: {
        type: String,
        default: "UTC"
    },

    // Bunny Stream Live Integration
    bunnyVideoId: {
        type: String,
        required: [true, "Bunny video ID is required"]
    },
    rtmpUrl: {
        type: String,
        select: false // Only for instructor (OBS ingest)
    },
    rtmpKey: {
        type: String,
        select: false // Only for instructor (OBS stream key — sensitive)
    },
    playbackUrl: {
        type: String,
        required: [true, "Playback URL is required"]
    },

    // Capacity and Attendance
    maxParticipants: {
        type: Number,
        default: 500,
        min: 1,
        max: 10000
    },
    actualParticipants: {
        type: Number,
        default: 0,
        min: 0
    },
    registeredParticipants: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },
        registeredAt: {
            type: Date,
            default: Date.now
        },
        attended: {
            type: Boolean,
            default: false
        }
    }],

    // Status
    status: {
        type: String,
        enum: ["scheduled", "in_progress", "completed", "cancelled"],
        default: "scheduled"
    },

    // Recording (Bunny auto-saves recordings after live ends)
    recordingUrl: String,
    recordingStatus: {
        type: String,
        enum: ["not_recorded", "recording", "processing", "completed", "failed"],
        default: "not_recorded"
    },
    recordingAvailable: {
        type: Boolean,
        default: false
    },
    recordingDuration: Number, // in seconds

    // Timestamps
    startedAt: Date,
    endedAt: Date,

    // Additional Info
    notes: {
        type: String,
        trim: true,
        maxlength: 1000
    },
    tags: [String],
    isPublic: {
        type: Boolean,
        default: false
    },

    // Materials (references to Material model)
    materials: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Material"
    }],

    // Audit Fields
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Instructor"
    },
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Instructor"
    }
}, {
    timestamps: true,
    collection: "liveclasses"
});

// Indexes for performance
liveClassSchema.index({ instructor: 1, status: 1 });
liveClassSchema.index({ course: 1 });
liveClassSchema.index({ scheduledAt: 1 });
liveClassSchema.index({ status: 1, scheduledAt: 1 });
liveClassSchema.index({ "registeredParticipants.user": 1 });
liveClassSchema.index({ createdAt: -1 });

// Pre-save middleware
liveClassSchema.pre("save", function() {
    if (this.isModified("status") && this.status === "completed" && !this.endedAt) {
        this.endedAt = new Date();
    }
});

// Instance methods
liveClassSchema.methods.startClass = function() {
    if (this.status !== "scheduled") {
        throw new Error("Class can only be started if scheduled");
    }
    this.status = "in_progress";
    this.startedAt = new Date();
    return this.save();
};

liveClassSchema.methods.endClass = function(recordingData = {}) {
    if (this.status !== "in_progress") {
        throw new Error("Class can only be ended if in progress");
    }
    this.status = "completed";
    this.endedAt = new Date();

    // Bunny auto-saves recordings after live stream ends.
    // The recording is at the same bunnyVideoId — we just mark it accordingly.
    if (this.bunnyVideoId) {
        this.recordingStatus = "processing"; // Bunny is encoding the recording
        this.recordingAvailable = false;     // Will become true once Bunny finishes encoding
    }

    // Allow manual override if recording data is provided
    if (recordingData.recordingUrl) {
        this.recordingUrl = recordingData.recordingUrl;
        this.recordingStatus = "completed";
        this.recordingAvailable = true;
        this.recordingDuration = recordingData.duration;
    }

    return this.save();
};

liveClassSchema.methods.registerParticipant = function(userId) {
    if (this.registeredParticipants.some(p => p.user.toString() === userId.toString())) {
        throw new Error("User already registered");
    }

    this.registeredParticipants.push({
        user: userId,
        registeredAt: new Date()
    });

    return this.save();
};

liveClassSchema.methods.markAttendance = function(userId) {
    const participant = this.registeredParticipants.find(p => p.user.toString() === userId.toString());
    if (participant) {
        participant.attended = true;
        this.actualParticipants += 1;
    }
    return this.save();
};

// Static methods
liveClassSchema.statics.getUpcomingClasses = function(instructorId, limit = 10) {
    return this.find({
        instructor: instructorId,
        scheduledAt: { $gte: new Date() },
        status: "scheduled"
    })
    .populate("course", "title")
    .sort({ scheduledAt: 1 })
    .limit(limit);
};

liveClassSchema.statics.getClassStats = function(instructorId) {
    return this.aggregate([
        { $match: { instructor: mongoose.Types.ObjectId(instructorId) } },
        {
            $group: {
                _id: null,
                totalClasses: { $sum: 1 },
                completedClasses: {
                    $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] }
                },
                totalParticipants: { $sum: "$actualParticipants" },
                averageParticipants: { $avg: "$actualParticipants" }
            }
        }
    ]);
};

const LiveClass = mongoose.model("LiveClass", liveClassSchema);

export { LiveClass };