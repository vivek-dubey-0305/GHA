import mongoose from "mongoose";

const OBJECTIVE_ASSESSMENT_TYPES = ["mcq", "true_false", "matching"];

const normalizeString = (value = "") => String(value || "").trim();

const normalizeOptionList = (list = []) => {
    if (!Array.isArray(list)) return [];
    return list
        .map((item) => normalizeString(item))
        .filter(Boolean);
};

const assignmentSchema = new mongoose.Schema({
    // Assignment Information
    title: {
        type: String,
        required: [true, "Assignment title is required"],
        trim: true,
        maxlength: [100, "Title cannot exceed 100 characters"],
        minlength: [3, "Title must be at least 3 characters"]
    },
    description: {
        type: String,
        required: [true, "Assignment description is required"],
        trim: true,
        maxlength: [2000, "Description cannot exceed 2000 characters"],
        minlength: [10, "Description must be at least 10 characters"]
    },

    // Media Assets
    thumbnail: {
        public_id: {
            type: String
        },
        secure_url: {
            type: String
        }
    },

    // Relationships
    course: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Course",
        required: [true, "Assignment must belong to a course"]
    },
    lesson: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Lesson" // Optional - assignment can be standalone or part of lesson
    },
    instructor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Instructor",
        required: [true, "Assignment must have an instructor"]
    },

    // Assignment Settings
    type: {
        type: String,
        enum: ["text", "file", "url", "mixed"],
        default: "text"
    },
    assessmentType: {
        type: String,
        enum: ["mcq", "true_false", "matching", "coding", "subjective"],
        default: "subjective"
    },
    gradingType: {
        type: String,
        enum: ["auto", "manual"],
        default: "manual"
    },
    questions: [{
        questionId: {
            type: String,
            trim: true,
        },
        type: {
            type: String,
            enum: ["mcq", "true_false", "matching"],
            default: "mcq",
        },
        question: {
            type: String,
            trim: true,
            maxlength: 2000,
        },
        options: [{
            type: String,
            trim: true,
            maxlength: 500,
        }],
        correctAnswer: {
            type: String,
            trim: true,
            maxlength: 500,
        },
        correctAnswers: [{
            type: String,
            trim: true,
            maxlength: 500,
        }],
        pairs: [{
            term: {
                type: String,
                trim: true,
                maxlength: 500,
            },
            correctOption: {
                type: String,
                trim: true,
                maxlength: 500,
            },
            options: [{
                type: String,
                trim: true,
                maxlength: 500,
            }],
        }],
        marks: {
            type: Number,
            min: 0,
            default: 1,
        },
    }],
    testCases: [{
        input: String,
        expectedOutput: String,
        weight: {
            type: Number,
            min: 0,
            default: 1,
        },
    }],
    maxScore: {
        type: Number,
        required: [true, "Maximum score is required"],
        min: [1, "Max score must be at least 1"],
        max: [100, "Max score cannot exceed 100"]
    },
    passingScore: {
        type: Number,
        min: 0,
        max: 100,
        validate: {
            validator: function(value) {
                return value <= this.maxScore;
            },
            message: "Passing score cannot exceed maximum score"
        }
    },

    // Time Constraints
    dueDate: {
        type: Date,
        required: [true, "Due date is required"],
        validate: {
            validator: function(value) {
                return value > new Date();
            },
            message: "Due date must be in the future"
        }
    },
    allowLateSubmission: {
        type: Boolean,
        default: false
    },
    lateSubmissionPenalty: {
        type: Number, // percentage
        min: 0,
        max: 100,
        default: 0
    },
    estimatedDurationMinutes: {
        type: Number,
        min: 0,
        default: 0,
    },

    // Submission Requirements
    instructions: {
        type: String,
        trim: true,
        maxlength: 1000
    },
    requiredFiles: [{
        name: String,
        type: {
            type: String,
            enum: ["pdf", "doc", "docx", "txt", "zip", "image"]
        },
        maxSize: Number, // in MB
        required: Boolean
    }],
    wordLimit: {
        min: Number,
        max: Number
    },

    // Assignment Status
    isPublished: {
        type: Boolean,
        default: false
    },
    publishedAt: Date,

    // Analytics
    totalSubmissions: {
        type: Number,
        default: 0,
        min: 0
    },
    averageScore: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
    },

    // Rubrics (optional)
    rubrics: [{
        criterion: {
            type: String,
            required: true,
            trim: true,
            maxlength: 100
        },
        description: String,
        maxPoints: {
            type: Number,
            required: true,
            min: 0
        }
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
    collection: "assignments"
});

// Indexes for performance
assignmentSchema.index({ course: 1, lesson: 1 });
assignmentSchema.index({ instructor: 1, isPublished: 1 });
assignmentSchema.index({ dueDate: 1 });
assignmentSchema.index({ course: 1, isPublished: 1, dueDate: 1 });
assignmentSchema.index({ createdAt: -1 });
assignmentSchema.index({ assessmentType: 1, gradingType: 1 });

// Pre-save middleware to set passing score default
assignmentSchema.pre("save", function() {
    if (this.isModified("isPublished") && this.isPublished && !this.publishedAt) {
        this.publishedAt = new Date();
    }

    if (!this.passingScore) {
        this.passingScore = Math.round(this.maxScore * 0.6); // 60% default
    }

    if (OBJECTIVE_ASSESSMENT_TYPES.includes(this.assessmentType) && this.gradingType !== "auto") {
        this.gradingType = "auto";
    }

    if (!OBJECTIVE_ASSESSMENT_TYPES.includes(this.assessmentType) && this.gradingType === "auto") {
        this.gradingType = "manual";
    }

    if (OBJECTIVE_ASSESSMENT_TYPES.includes(this.assessmentType)) {
        const safeQuestions = Array.isArray(this.questions) ? this.questions : [];

        if (safeQuestions.length === 0) {
            throw new Error("Objective assignments require at least one question");
        }

        for (const [index, rawQuestion] of safeQuestions.entries()) {
            const question = rawQuestion || {};
            const questionType = question.type || this.assessmentType;
            const questionText = normalizeString(question.question);
            if (!questionText) {
                throw new Error(`Question ${index + 1} text is required`);
            }

            if (questionType === "mcq") {
                const options = normalizeOptionList(question.options);
                if (options.length < 2) {
                    throw new Error(`Question ${index + 1} must include at least 2 options`);
                }

                const normalizedCorrectAnswers = normalizeOptionList(question.correctAnswers);
                const singleCorrect = normalizeString(question.correctAnswer);
                const effectiveCorrectAnswers = normalizedCorrectAnswers.length > 0
                    ? normalizedCorrectAnswers
                    : (singleCorrect ? [singleCorrect] : []);

                if (effectiveCorrectAnswers.length === 0) {
                    throw new Error(`Question ${index + 1} must include at least one correct answer`);
                }

                if (effectiveCorrectAnswers.some((answer) => !options.includes(answer))) {
                    throw new Error(`Question ${index + 1} has correct answers not present in options`);
                }
            }

            if (questionType === "true_false") {
                const correct = normalizeString(question.correctAnswer).toLowerCase();
                if (!["true", "false"].includes(correct)) {
                    throw new Error(`Question ${index + 1} must have correctAnswer as true or false`);
                }
            }

            if (questionType === "matching") {
                const pairs = Array.isArray(question.pairs) ? question.pairs : [];
                if (pairs.length === 0) {
                    throw new Error(`Question ${index + 1} must include matching pairs`);
                }

                for (const [pairIndex, pair] of pairs.entries()) {
                    const term = normalizeString(pair?.term);
                    const correctOption = normalizeString(pair?.correctOption);
                    const options = normalizeOptionList(pair?.options);
                    if (!term || !correctOption) {
                        throw new Error(`Question ${index + 1}, pair ${pairIndex + 1} must include term and correctOption`);
                    }
                    if (options.length > 0 && !options.includes(correctOption)) {
                        throw new Error(`Question ${index + 1}, pair ${pairIndex + 1} correctOption must exist in options`);
                    }
                }
            }
        }
    }
});

// Static method to find active assignments for a course
assignmentSchema.statics.findActiveByCourse = function(courseId) {
    return this.find({
        course: courseId,
        isPublished: true,
        dueDate: { $gte: new Date() }
    }).sort({ dueDate: 1 });
};

// Static method to find overdue assignments
assignmentSchema.statics.findOverdue = function(courseId) {
    return this.find({
        course: courseId,
        isPublished: true,
        dueDate: { $lt: new Date() }
    });
};

// Instance method to calculate total rubric points
assignmentSchema.methods.getTotalRubricPoints = function() {
    return this.rubrics.reduce((total, rubric) => total + rubric.maxPoints, 0);
};

// Instance method to check if assignment is overdue
assignmentSchema.methods.isOverdue = function() {
    return new Date() > this.dueDate;
};

// Instance method to update analytics
assignmentSchema.methods.updateAnalytics = async function() {
    const Submission = mongoose.model("Submission");

    const result = await Submission.aggregate([
        { $match: { assignment: this._id, status: "graded" } },
        {
            $group: {
                _id: null,
                totalSubmissions: { $sum: 1 },
                averageScore: { $avg: "$score" }
            }
        }
    ]);

    if (result.length > 0) {
        this.totalSubmissions = result[0].totalSubmissions;
        this.averageScore = Math.round(result[0].averageScore * 100) / 100;
    }

    return this.save();
};

const Assignment = mongoose.model("Assignment", assignmentSchema);

export { Assignment };