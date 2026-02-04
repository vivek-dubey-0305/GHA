import mongoose from "mongoose";

const submissionSchema = new mongoose.Schema({
    // Relationships
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: [true, "Submission must belong to a user"]
    },
    assignment: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Assignment",
        required: [true, "Submission must belong to an assignment"]
    },
    course: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Course",
        required: [true, "Submission must belong to a course"]
    },

    // Submission Content
    content: {
        text: {
            type: String,
            trim: true,
            maxlength: 10000
        },
        files: [{
            name: String,
            url: String, // Cloudinary URL
            type: String,
            size: Number // in bytes
        }],
        links: [{
            title: String,
            url: String,
            validate: {
                validator: function(v) {
                    return /^https?:\/\/.+/.test(v);
                },
                message: "Invalid URL format"
            }
        }]
    },

    // Submission Status
    status: {
        type: String,
        enum: ["draft", "submitted", "graded", "returned"],
        default: "draft"
    },

    // Timestamps
    submittedAt: Date,
    gradedAt: Date,

    // Grading
    score: {
        type: Number,
        min: 0,
        max: 100
    },
    maxScore: {
        type: Number,
        required: true,
        min: 0
    },
    grade: {
        type: String,
        enum: ["A+", "A", "B+", "B", "C+", "C", "D", "F", "Pass", "Fail"]
    },
    isPassed: {
        type: Boolean,
        default: false
    },

    // Feedback
    instructorFeedback: {
        type: String,
        trim: true,
        maxlength: 2000
    },
    rubricScores: [{
        criterion: String,
        score: {
            type: Number,
            min: 0
        },
        maxPoints: {
            type: Number,
            min: 0
        },
        feedback: {
            type: String,
            trim: true,
            maxlength: 500
        }
    }],

    // Submission Attempts
    attemptNumber: {
        type: Number,
        default: 1,
        min: 1
    },
    isLate: {
        type: Boolean,
        default: false
    },
    latePenalty: {
        type: Number, // percentage deducted
        min: 0,
        max: 100,
        default: 0
    },

    // Audit Fields
    submittedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    gradedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Instructor"
    }
}, {
    timestamps: true,
    collection: "submissions"
});

// Indexes for performance
submissionSchema.index({ user: 1, assignment: 1 }, { unique: true }); // One submission per user per assignment
submissionSchema.index({ assignment: 1, status: 1 });
submissionSchema.index({ course: 1, status: 1 });
submissionSchema.index({ gradedBy: 1, gradedAt: -1 });
submissionSchema.index({ submittedAt: -1 });
submissionSchema.index({ status: 1, submittedAt: -1 });

// Compound indexes
submissionSchema.index({ user: 1, course: 1, status: 1 });
submissionSchema.index({ assignment: 1, submittedAt: -1, status: 1 });

// Pre-save middleware to calculate derived fields
submissionSchema.pre("save", function(next) {
    if (this.isModified("status") && this.status === "submitted" && !this.submittedAt) {
        this.submittedAt = new Date();
    }

    if (this.isModified("score") && this.score !== undefined) {
        this.isPassed = this.score >= (this.maxScore * 0.6); // 60% passing threshold
    }

    next();
});

// Static method to get assignment submissions
submissionSchema.statics.getAssignmentSubmissions = function(assignmentId, options = {}) {
    const { status, limit = 20, skip = 0, sort = "-submittedAt" } = options;

    let query = { assignment: assignmentId };
    if (status) query.status = status;

    return this.find(query)
        .populate("user", "name email avatar")
        .sort(sort)
        .limit(limit)
        .skip(skip);
};

// Static method to get user submissions
submissionSchema.statics.getUserSubmissions = function(userId, options = {}) {
    const { courseId, status, limit = 20, skip = 0, sort = "-submittedAt" } = options;

    let query = { user: userId };
    if (courseId) query.course = courseId;
    if (status) query.status = status;

    return this.find(query)
        .populate("assignment", "title dueDate maxScore")
        .populate("course", "title")
        .sort(sort)
        .limit(limit)
        .skip(skip);
};

// Static method to get submission statistics
submissionSchema.statics.getSubmissionStats = function(assignmentId) {
    return this.aggregate([
        { $match: { assignment: mongoose.Types.ObjectId(assignmentId) } },
        {
            $group: {
                _id: null,
                totalSubmissions: { $sum: 1 },
                submittedCount: {
                    $sum: { $cond: [{ $eq: ["$status", "submitted"] }, 1, 0] }
                },
                gradedCount: {
                    $sum: { $cond: [{ $eq: ["$status", "graded"] }, 1, 0] }
                },
                averageScore: { $avg: "$score" },
                passRate: {
                    $avg: { $cond: [{ $eq: ["$isPassed", true] }, 1, 0] }
                },
                lateSubmissions: {
                    $sum: { $cond: [{ $eq: ["$isLate", true] }, 1, 0] }
                }
            }
        },
        {
            $project: {
                totalSubmissions: 1,
                submittedCount: 1,
                gradedCount: 1,
                averageScore: { $round: ["$averageScore", 1] },
                passRate: { $multiply: ["$passRate", 100] },
                lateSubmissions: 1
            }
        }
    ]);
};

// Instance method to grade submission
submissionSchema.methods.grade = function(score, feedback, gradedBy, rubricScores = []) {
    this.score = score;
    this.instructorFeedback = feedback;
    this.gradedBy = gradedBy;
    this.gradedAt = new Date();
    this.status = "graded";
    this.rubricScores = rubricScores;

    // Calculate grade based on score percentage
    const percentage = (score / this.maxScore) * 100;
    if (percentage >= 90) this.grade = "A+";
    else if (percentage >= 80) this.grade = "A";
    else if (percentage >= 70) this.grade = "B+";
    else if (percentage >= 60) this.grade = "B";
    else if (percentage >= 50) this.grade = "C+";
    else if (percentage >= 40) this.grade = "C";
    else this.grade = "F";

    this.isPassed = percentage >= 60;

    return this.save();
};

// Instance method to return for revision
submissionSchema.methods.returnForRevision = function(feedback, gradedBy) {
    this.instructorFeedback = feedback;
    this.gradedBy = gradedBy;
    this.status = "returned";
    this.gradedAt = new Date();
    return this.save();
};

// Instance method to resubmit
submissionSchema.methods.resubmit = function(content) {
    this.content = content;
    this.status = "submitted";
    this.submittedAt = new Date();
    this.attemptNumber += 1;
    return this.save();
};

const Submission = mongoose.model("Submission", submissionSchema);

export { Submission };