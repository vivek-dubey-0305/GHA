import mongoose from "mongoose";

const lessonSchema = new mongoose.Schema({
    // Lesson Information
    title: {
        type: String,
        required: [true, "Lesson title is required"],
        trim: true,
        maxlength: [100, "Title cannot exceed 100 characters"],
        minlength: [2, "Title must be at least 2 characters"]
    },
    description: {
        type: String,
        trim: true,
        maxlength: [1000, "Description cannot exceed 1000 characters"]
    },

    // Relationships
    course: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Course",
        required: [true, "Lesson must belong to a course"]
    },
    module: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Module",
        required: [true, "Lesson must belong to a module"]
    },

    // Ordering
    order: {
        type: Number,
        required: [true, "Lesson order is required"],
        min: [1, "Order must be at least 1"]
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

    // Lesson Type and Content
    type: {
        type: String,
        required: [true, "Lesson type is required"],
        enum: ["video", "article", "assignment", "live", "material"],
        default: "video"
    },

    // Content based on type — uses references to actual models
    content: {
        // For article lessons only
        articleContent: {
            type: String,
            validate: {
                validator: function(value) {
                    if (this.type === "article" && (!value || value.trim().length < 10)) return false;
                    return true;
                },
                message: "Article content must be at least 10 characters for article lessons"
            }
        },
    },

    // === MODEL REFERENCES (one per lesson type) ===

    // type = "video" → Video model
    videoId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Video"
    },

    // type = "assignment" → Assignment model
    assignmentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Assignment"
    },

    // type = "live" → LiveClass model
    liveClassId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "LiveClass"
    },

    // type = "material" → Material model
    materialId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Material"
    },

    // Lesson Settings
    isFree: {
        type: Boolean,
        default: false
    },
    isPublished: {
        type: Boolean,
        default: false
    },
    publishedAt: Date,

    // Learning Resources — materials referenced via materialId
    // Additional materials can be linked separately

    // Engagement Metrics
    viewCount: {
        type: Number,
        default: 0,
        min: 0
    },
    completionCount: {
        type: Number,
        default: 0,
        min: 0
    },

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
    collection: "lessons"
});

// Indexes for performance
lessonSchema.index({ course: 1, module: 1, order: 1 }, { unique: true });
lessonSchema.index({ course: 1, isPublished: 1 });
lessonSchema.index({ module: 1, order: 1 });
lessonSchema.index({ type: 1, isPublished: 1 });
lessonSchema.index({ createdAt: -1 });

// Compound indexes for common queries
lessonSchema.index({ course: 1, module: 1, order: 1, isPublished: 1 });

// Pre-save middleware to update publishedAt
lessonSchema.pre("save", function() {
    if (this.isModified("isPublished") && this.isPublished && !this.publishedAt) {
        this.publishedAt = new Date();
    }
});

// Static method to find published lessons for a module
lessonSchema.statics.findPublishedByModule = function(moduleId) {
    return this.find({ module: moduleId, isPublished: true }).sort({ order: 1 });
};

// Static method to find published lessons for a course
lessonSchema.statics.findPublishedByCourse = function(courseId) {
    return this.find({ course: courseId, isPublished: true }).sort({ module: 1, order: 1 });
};

// Static method to reorder lessons
lessonSchema.statics.reorderLessons = async function(moduleId, lessonOrders) {
    const bulkOps = lessonOrders.map(({ lessonId, order }) => ({
        updateOne: {
            filter: { _id: lessonId, module: moduleId },
            update: { order }
        }
    }));

    return this.bulkWrite(bulkOps);
};

// Instance method to get next lesson
lessonSchema.methods.getNextLesson = function() {
    return mongoose.model("Lesson").findOne({
        course: this.course,
        $or: [
            { module: this.module, order: { $gt: this.order } },
            { module: { $ne: this.module } }
        ],
        isPublished: true
    }).sort({ module: 1, order: 1 });
};

// Instance method to get previous lesson
lessonSchema.methods.getPreviousLesson = function() {
    return mongoose.model("Lesson").findOne({
        course: this.course,
        $or: [
            { module: this.module, order: { $lt: this.order } },
            { module: { $ne: this.module } }
        ],
        isPublished: true
    }).sort({ module: -1, order: -1 });
};

// Virtual for estimated read time (for articles)
lessonSchema.virtual("estimatedReadTime").get(function() {
    if (this.type === "article" && this.content.articleContent) {
        const wordsPerMinute = 200;
        const wordCount = this.content.articleContent.split(/\s+/).length;
        return Math.ceil(wordCount / wordsPerMinute);
    }
    return null;
});

const Lesson = mongoose.model("Lesson", lessonSchema);

export { Lesson };