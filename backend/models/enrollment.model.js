import mongoose from "mongoose";

const enrollmentSchema = new mongoose.Schema({  
    // Relationships
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: [true, "Enrollment must belong to a user"]
    },
    course: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Course",
        required: [true, "Enrollment must belong to a course"]
    },
    payment: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Payment",
        required: [true, "Enrollment must have a payment"]
    },

    // Enrollment Details
    enrolledAt: {
        type: Date,
        default: Date.now
    },
    status: {
        type: String,
        enum: ["active", "completed", "cancelled", "refunded", "expired"],
        default: "active"
    },

    // Progress Tracking
    progressPercentage: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
    },
    completedLessons: {
        type: Number,
        default: 0,
        min: 0
    },
    totalLessons: {
        type: Number,
        required: true,
        min: 0
    },
    // Module-wise progress tracking
    progressModules: [{
        moduleId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Module"
        },
        completedAt: Date,
        status: {
            type: String,
            enum: ["not_started", "in_progress", "completed"],
            default: "not_started"
        }
    }],

    // Time Tracking
    timeSpent: {
        type: Number, // in minutes
        default: 0,
        min: 0
    },
    lastAccessedAt: Date,
    completedAt: Date,

    // Access Control
    expiryDate: Date, // For limited-time access
    isLifetime: {
        type: Boolean,
        default: true
    },

    // Certificate
    certificateIssued: {
        type: Boolean,
        default: false
    },
    certificateId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Certificate"
    },

    // Refund/Dispute
    refundRequested: {
        type: Boolean,
        default: false
    },
    refundAmount: {
        type: Number,
        min: 0
    },
    refundReason: {
        type: String,
        trim: true,
        maxlength: 500
    },
    refundProcessedAt: Date,

    // Audit Fields
    enrolledBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User" // In case admin enrolls user
    }
}, {
    timestamps: true,
    collection: "enrollments"
});

// Indexes for performance
enrollmentSchema.index({ user: 1, course: 1 }, { unique: true }); // One enrollment per user per course
enrollmentSchema.index({ course: 1, status: 1 });
enrollmentSchema.index({ user: 1, status: 1 });
enrollmentSchema.index({ payment: 1 });
enrollmentSchema.index({ enrolledAt: -1 });
enrollmentSchema.index({ lastAccessedAt: -1 });
enrollmentSchema.index({ completedAt: -1 });
enrollmentSchema.index({ "progressModules.moduleId": 1 });
enrollmentSchema.index({ "progressModules.status": 1 });

// Compound indexes
enrollmentSchema.index({ user: 1, status: 1, enrolledAt: -1 });
enrollmentSchema.index({ course: 1, enrolledAt: -1, status: 1 });

// Pre-save middleware to set expiry date
enrollmentSchema.pre("save", function() {
    if (this.isModified("enrolledAt") && !this.isLifetime) {
        // Set expiry to 1 year from enrollment if not lifetime
        this.expiryDate = new Date(this.enrolledAt.getTime() + 365 * 24 * 60 * 60 * 1000);
    }
});

// Static method to get user enrollments
enrollmentSchema.statics.getUserEnrollments = function(userId, options = {}) {
    const { status = "active", limit = 20, skip = 0 } = options;

    return this.find({ user: userId, status })
        .populate("course", "title thumbnail instructor rating durationHours")
        .sort({ enrolledAt: -1 })
        .limit(limit)
        .skip(skip);
};

// Static method to get course enrollments
enrollmentSchema.statics.getCourseEnrollments = function(courseId, options = {}) {
    const { status = "active", limit = 50, skip = 0 } = options;

    return this.find({ course: courseId, status })
        .populate("user", "name email avatar")
        .sort({ enrolledAt: -1 })
        .limit(limit)
        .skip(skip);
};

// Static method to get enrollment stats for a course
enrollmentSchema.statics.getCourseStats = function(courseId) {
    return this.aggregate([
        { $match: { course: mongoose.Types.ObjectId(courseId) } },
        {
            $group: {
                _id: "$status",
                count: { $sum: 1 },
                totalRevenue: { $sum: "$payment.amount" }, // Assuming payment has amount
                averageProgress: { $avg: "$progressPercentage" },
                totalTimeSpent: { $sum: "$timeSpent" }
            }
        }
    ]);
};

// Static method to check if user is enrolled
enrollmentSchema.statics.isUserEnrolled = function(userId, courseId) {
    return this.exists({
        user: userId,
        course: courseId,
        status: { $in: ["active", "completed"] }
    });
};

// Instance method to mark as completed
enrollmentSchema.methods.markCompleted = function() {
    this.status = "completed";
    this.progressPercentage = 100;
    this.completedAt = new Date();
    return this.save();
};

// Instance method to update progress
enrollmentSchema.methods.updateProgress = function(progressData) {
    if (progressData.progressPercentage !== undefined) {
        this.progressPercentage = Math.min(100, Math.max(0, progressData.progressPercentage));
    }

    if (progressData.completedLessons !== undefined) {
        this.completedLessons = progressData.completedLessons;
    }

    if (progressData.timeSpent !== undefined) {
        this.timeSpent += progressData.timeSpent;
    }

    // Update module progress
    if (progressData.moduleId && progressData.moduleStatus) {
        const moduleProgress = this.progressModules.find(
            mp => mp.moduleId.toString() === progressData.moduleId.toString()
        );
        if (moduleProgress) {
            moduleProgress.status = progressData.moduleStatus;
            if (progressData.moduleStatus === "completed" && !moduleProgress.completedAt) {
                moduleProgress.completedAt = new Date();
            }
        } else {
            this.progressModules.push({
                moduleId: progressData.moduleId,
                status: progressData.moduleStatus,
                completedAt: progressData.moduleStatus === "completed" ? new Date() : undefined
            });
        }
    }

    this.lastAccessedAt = new Date();

    // Auto-complete if progress reaches 100%
    if (this.progressPercentage >= 100 && this.status === "active") {
        this.status = "completed";
        this.completedAt = new Date();
    }

    return this.save();
};

// Instance method to request refund
enrollmentSchema.methods.requestRefund = function(amount, reason) {
    this.refundRequested = true;
    this.refundAmount = amount;
    this.refundReason = reason;
    return this.save();
};

// Instance method to process refund
enrollmentSchema.methods.processRefund = function() {
    this.status = "refunded";
    this.refundProcessedAt = new Date();
    return this.save();
};

// Instance method to check if expired
enrollmentSchema.methods.isExpired = function() {
    return !this.isLifetime && this.expiryDate && new Date() > this.expiryDate;
};

const Enrollment = mongoose.model("Enrollment", enrollmentSchema);

export { Enrollment };