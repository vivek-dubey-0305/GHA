import mongoose from "mongoose";

const moduleSchema = new mongoose.Schema({
    // Module Information
    title: {
        type: String,
        required: [true, "Module title is required"],
        trim: true,
        maxlength: [100, "Title cannot exceed 100 characters"],
        minlength: [2, "Title must be at least 2 characters"]
    },
    description: {
        type: String,
        trim: true,
        maxlength: [500, "Description cannot exceed 500 characters"]
    },

    // Relationships
    course: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Course",
        required: [true, "Module must belong to a course"]
    },

    // Ordering
    order: {
        type: Number,
        required: [true, "Module order is required"],
        min: [1, "Order must be at least 1"]
    },

    // Content Structure
    lessons: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Lesson"
    }],
    totalLessons: {
        type: Number,
        default: 0,
        min: 0
    },
    totalDuration: {
        type: Number, // in minutes
        default: 0,
        min: 0
    },

    // Module Status
    isPublished: {
        type: Boolean,
        default: false
    },
    publishedAt: Date,

    // Learning Objectives
    objectives: [{
        type: String,
        trim: true,
        maxlength: 200
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
    collection: "modules"
});

// Indexes for performance
moduleSchema.index({ course: 1, order: 1 }, { unique: true });
moduleSchema.index({ course: 1, isPublished: 1 });
moduleSchema.index({ createdAt: -1 });

// Compound index for efficient queries
moduleSchema.index({ course: 1, order: 1, isPublished: 1 });

// Pre-save middleware to update publishedAt
moduleSchema.pre("save", function(next) {
    if (this.isModified("isPublished") && this.isPublished && !this.publishedAt) {
        this.publishedAt = new Date();
    }
    next();
});

// Static method to find published modules for a course
moduleSchema.statics.findPublishedByCourse = function(courseId) {
    return this.find({ course: courseId, isPublished: true }).sort({ order: 1 });
};

// Static method to reorder modules
moduleSchema.statics.reorderModules = async function(courseId, moduleOrders) {
    const bulkOps = moduleOrders.map(({ moduleId, order }) => ({
        updateOne: {
            filter: { _id: moduleId, course: courseId },
            update: { order }
        }
    }));

    return this.bulkWrite(bulkOps);
};

// Instance method to get next module
moduleSchema.methods.getNextModule = function() {
    return mongoose.model("Module").findOne({
        course: this.course,
        order: { $gt: this.order },
        isPublished: true
    }).sort({ order: 1 });
};

// Instance method to get previous module
moduleSchema.methods.getPreviousModule = function() {
    return mongoose.model("Module").findOne({
        course: this.course,
        order: { $lt: this.order },
        isPublished: true
    }).sort({ order: -1 });
};

const Module = mongoose.model("Module", moduleSchema);

export { Module };