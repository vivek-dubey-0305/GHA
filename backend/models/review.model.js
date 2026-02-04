import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema({
    // Relationships
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: [true, "Review must belong to a user"]
    },
    course: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Course",
        required: [true, "Review must belong to a course"]
    },

    // Review Content
    rating: {
        type: Number,
        required: [true, "Rating is required"],
        min: [1, "Rating must be at least 1"],
        max: [5, "Rating cannot exceed 5"]
    },
    title: {
        type: String,
        required: [true, "Review title is required"],
        trim: true,
        maxlength: [100, "Title cannot exceed 100 characters"],
        minlength: [5, "Title must be at least 5 characters"]
    },
    comment: {
        type: String,
        required: [true, "Review comment is required"],
        trim: true,
        maxlength: [1000, "Comment cannot exceed 1000 characters"],
        minlength: [10, "Comment must be at least 10 characters"]
    },

    // Review Metadata
    isVerified: {
        type: Boolean,
        default: false // Verified if user completed the course
    },
    helpful: {
        type: Number,
        default: 0,
        min: 0
    },
    reported: {
        type: Boolean,
        default: false
    },

    // Moderation
    isApproved: {
        type: Boolean,
        default: true
    },
    moderatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Admin"
    },
    moderationReason: {
        type: String,
        trim: true,
        maxlength: 200
    }
}, {
    timestamps: true,
    collection: "reviews"
});

// Indexes for performance
reviewSchema.index({ user: 1, course: 1 }, { unique: true }); // One review per user per course
reviewSchema.index({ course: 1, rating: -1 });
reviewSchema.index({ course: 1, createdAt: -1 });
reviewSchema.index({ isApproved: 1, reported: 1 });
reviewSchema.index({ user: 1 });

// Compound indexes
reviewSchema.index({ course: 1, isApproved: 1, rating: -1 });
reviewSchema.index({ course: 1, isVerified: 1, createdAt: -1 });

// Pre-save middleware to validate review eligibility
reviewSchema.pre("save", async function(next) {
    if (this.isNew) {
        // Check if user is enrolled and has made progress
        const Enrollment = mongoose.model("Enrollment");
        const enrollment = await Enrollment.findOne({
            user: this.user,
            course: this.course,
            status: "active"
        });

        if (!enrollment) {
            return next(new Error("User must be enrolled in the course to leave a review"));
        }

        // Check if user has completed at least some lessons (optional)
        const Progress = mongoose.model("Progress");
        const progressCount = await Progress.countDocuments({
            user: this.user,
            course: this.course,
            status: "completed"
        });

        this.isVerified = progressCount > 0;
    }
    next();
});

// Post-save middleware to update course rating
reviewSchema.post("save", async function() {
    const Course = mongoose.model("Course");
    await Course.findById(this.course).then(course => {
        if (course) course.updateRating();
    });
});

// Static method to get course reviews
reviewSchema.statics.getCourseReviews = function(courseId, options = {}) {
    const { limit = 10, skip = 0, sort = "-createdAt", verifiedOnly = false } = options;

    let query = { course: courseId, isApproved: true };
    if (verifiedOnly) query.isVerified = true;

    return this.find(query)
        .populate("user", "name avatar")
        .sort(sort)
        .limit(limit)
        .skip(skip);
};

// Static method to get user reviews
reviewSchema.statics.getUserReviews = function(userId, options = {}) {
    const { limit = 10, skip = 0, sort = "-createdAt" } = options;

    return this.find({ user: userId, isApproved: true })
        .populate("course", "title thumbnail rating")
        .sort(sort)
        .limit(limit)
        .skip(skip);
};

// Static method to get average rating for course
reviewSchema.statics.getCourseRating = function(courseId) {
    return this.aggregate([
        { $match: { course: mongoose.Types.ObjectId(courseId), isApproved: true } },
        {
            $group: {
                _id: null,
                averageRating: { $avg: "$rating" },
                totalReviews: { $sum: 1 },
                ratingDistribution: {
                    $push: "$rating"
                }
            }
        },
        {
            $project: {
                averageRating: { $round: ["$averageRating", 1] },
                totalReviews: 1,
                ratingDistribution: {
                    1: { $size: { $filter: { input: "$ratingDistribution", cond: { $eq: ["$$this", 1] } } } },
                    2: { $size: { $filter: { input: "$ratingDistribution", cond: { $eq: ["$$this", 2] } } } },
                    3: { $size: { $filter: { input: "$ratingDistribution", cond: { $eq: ["$$this", 3] } } } },
                    4: { $size: { $filter: { input: "$ratingDistribution", cond: { $eq: ["$$this", 4] } } } },
                    5: { $size: { $filter: { input: "$ratingDistribution", cond: { $eq: ["$$this", 5] } } } }
                }
            }
        }
    ]);
};

// Instance method to mark as helpful
reviewSchema.methods.markHelpful = function() {
    this.helpful += 1;
    return this.save();
};

// Instance method to report review
reviewSchema.methods.report = function(reason) {
    this.reported = true;
    this.moderationReason = reason;
    return this.save();
};

const Review = mongoose.model("Review", reviewSchema);

export { Review };