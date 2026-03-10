import mongoose from "mongoose";

const progressSchema = new mongoose.Schema({
    // Relationships
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: [true, "Progress must belong to a user"]
    },
    course: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Course",
        required: [true, "Progress must belong to a course"]
    },
    lesson: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Lesson",
        required: [true, "Progress must belong to a lesson"]
    },

    // Progress Status
    status: {
        type: String,
        enum: ["not-started", "in-progress", "completed"],
        default: "not-started"
    },

    // Progress Metrics
    progressPercentage: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
    },

    // Time Tracking
    timeSpent: {
        type: Number, // in seconds
        default: 0,
        min: 0
    },
    lastAccessedAt: {
        type: Date,
        default: Date.now
    },
    completedAt: Date,

    // Lesson-specific Progress
    videoProgress: {
        currentTime: {
            type: Number, // in seconds
            default: 0,
            min: 0
        },
        totalDuration: {
            type: Number, // in seconds
            min: 0
        }
    },

    // Assignment Progress (if lesson is assignment)
    assignmentSubmitted: {
        type: Boolean,
        default: false
    },
    assignmentScore: {
        type: Number,
        min: 0,
        max: 100
    },
    assignmentFeedback: {
        type: String,
        trim: true,
        maxlength: 1000
    },

    // Quiz/Assessment Progress (future extension)
    quizAttempts: {
        type: Number,
        default: 0,
        min: 0
    },
    quizScore: {
        type: Number,
        min: 0,
        max: 100
    }
}, {
    timestamps: true,
    collection: "progress"
});

// Indexes for performance
progressSchema.index({ user: 1, course: 1 }, { unique: true }); // One progress per user-course
progressSchema.index({ user: 1, lesson: 1 }, { unique: true }); // One progress per user-lesson
progressSchema.index({ course: 1, status: 1 });
progressSchema.index({ user: 1, status: 1 });
progressSchema.index({ lastAccessedAt: -1 });
progressSchema.index({ completedAt: -1 });

// Compound indexes for analytics
progressSchema.index({ user: 1, course: 1, status: 1 });
progressSchema.index({ course: 1, lesson: 1, status: 1 });

// Pre-save middleware to update timestamps
progressSchema.pre("save", function() {
    if (this.isModified("status") && this.status === "completed" && !this.completedAt) {
        this.completedAt = new Date();
    }

    if (this.isModified()) {
        this.lastAccessedAt = new Date();
    }
});

// Static method to get course progress for a user
progressSchema.statics.getCourseProgress = function(userId, courseId) {
    return this.aggregate([
        { $match: { user: new mongoose.Types.ObjectId(userId), course: new mongoose.Types.ObjectId(courseId) } },
        {
            $group: {
                _id: null,
                totalLessons: { $sum: 1 },
                completedLessons: {
                    $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] }
                },
                totalTimeSpent: { $sum: "$timeSpent" },
                averageProgress: { $avg: "$progressPercentage" }
            }
        },
        {
            $project: {
                completionPercentage: {
                    $multiply: [{ $divide: ["$completedLessons", "$totalLessons"] }, 100]
                },
                completedLessons: 1,
                totalLessons: 1,
                totalTimeSpent: 1,
                averageProgress: { $round: ["$averageProgress", 1] }
            }
        }
    ]);
};

// Static method to get user progress across all courses
progressSchema.statics.getUserProgress = function(userId) {
    return this.aggregate([
        { $match: { user: new mongoose.Types.ObjectId(userId) } },
        {
            $group: {
                _id: "$course",
                totalLessons: { $sum: 1 },
                completedLessons: {
                    $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] }
                },
                totalTimeSpent: { $sum: "$timeSpent" },
                lastAccessed: { $max: "$lastAccessedAt" }
            }
        },
        {
            $lookup: {
                from: "courses",
                localField: "_id",
                foreignField: "_id",
                as: "course"
            }
        },
        { $unwind: "$course" },
        {
            $project: {
                course: { title: 1, thumbnail: 1 },
                completionPercentage: {
                    $multiply: [{ $divide: ["$completedLessons", "$totalLessons"] }, 100]
                },
                completedLessons: 1,
                totalLessons: 1,
                totalTimeSpent: 1,
                lastAccessed: 1
            }
        },
        { $sort: { lastAccessed: -1 } }
    ]);
};

// Instance method to mark as completed
progressSchema.methods.markCompleted = function() {
    this.status = "completed";
    this.progressPercentage = 100;
    this.completedAt = new Date();
    return this.save();
};

// Instance method to update progress
progressSchema.methods.updateProgress = function(progressData) {
    if (progressData.progressPercentage !== undefined) {
        this.progressPercentage = Math.min(100, Math.max(0, progressData.progressPercentage));
        this.status = this.progressPercentage === 100 ? "completed" : "in-progress";
    }

    if (progressData.timeSpent !== undefined) {
        this.timeSpent = progressData.timeSpent;
    }

    if (progressData.videoProgress) {
        this.videoProgress = { ...this.videoProgress, ...progressData.videoProgress };
    }

    this.lastAccessedAt = new Date();
    return this.save();
};

const Progress = mongoose.model("Progress", progressSchema);

export { Progress };