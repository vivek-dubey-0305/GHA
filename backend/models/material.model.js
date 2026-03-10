import mongoose from "mongoose";

// Material Schema - Production Grade for Course Materials
const materialSchema = new mongoose.Schema({
    // Relationships
    instructor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Instructor",
        required: [true, "Material must belong to an instructor"]
    },
    course: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Course",
        required: [true, "Material must belong to a course"]
    },
    module: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Module"
    },
    lesson: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Lesson"
    },

    // Material Details
    title: {
        type: String,
        required: [true, "Material title is required"],
        trim: true,
        maxlength: [100, "Title cannot exceed 100 characters"],
        minlength: [2, "Title must be at least 2 characters"]
    },
    description: {
        type: String,
        trim: true,
        maxlength: [500, "Description cannot exceed 500 characters"]
    },

    // Material Type and Content
    type: {
        type: String,
        required: [true, "Material type is required"],
        enum: [
            "document", "presentation", "spreadsheet", "pdf", "image",
            "video", "audio", "link", "code", "quiz", "assignment", "other"
        ]
    },
    fileUrl: {
        type: String,
        required: function() {
            return ["document", "presentation", "spreadsheet", "pdf", "image", "video", "audio", "code"].includes(this.type);
        }
    },
    externalLink: {
        type: String,
        required: function() {
            return this.type === "link";
        }
    },
    content: {
        type: String,
        required: function() {
            return ["quiz", "assignment", "code"].includes(this.type);
        }
    },

    // File Metadata
    fileName: String,
    fileSize: {
        type: Number, // in bytes
        min: 0
    },
    mimeType: String,
    thumbnail: String,

    // Access Control
    isPublic: {
        type: Boolean,
        default: false
    },
    accessLevel: {
        type: String,
        enum: ["enrolled_students", "instructor_only", "public"],
        default: "enrolled_students"
    },

    // Download/Usage Stats
    downloadCount: {
        type: Number,
        default: 0,
        min: 0
    },
    viewCount: {
        type: Number,
        default: 0,
        min: 0
    },
    lastAccessedAt: Date,

    // Ordering and Organization
    order: {
        type: Number,
        default: 0
    },
    tags: [String],

    // Status
    status: {
        type: String,
        enum: ["draft", "published", "archived"],
        default: "draft"
    },

    // Additional Metadata
    metadata: {
        pages: Number, // for PDFs/documents
        duration: Number, // for videos/audio in seconds
        language: String,
        difficulty: {
            type: String,
            enum: ["beginner", "intermediate", "advanced"]
        }
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
    collection: "materials"
});

// Indexes for performance
materialSchema.index({ instructor: 1, status: 1 });
materialSchema.index({ course: 1, type: 1 });
materialSchema.index({ module: 1 });
materialSchema.index({ lesson: 1 });
materialSchema.index({ type: 1, status: 1 });
materialSchema.index({ downloadCount: -1 });
materialSchema.index({ createdAt: -1 });

// Pre-save middleware
materialSchema.pre("save", function() {
    if (this.isModified("status") && this.status === "published") {
        // Could add validation here
    }
});

// Instance methods
materialSchema.methods.incrementDownload = function() {
    this.downloadCount += 1;
    this.lastAccessedAt = new Date();
    return this.save();
};

materialSchema.methods.incrementView = function() {
    this.viewCount += 1;
    this.lastAccessedAt = new Date();
    return this.save();
};

materialSchema.methods.publish = function() {
    this.status = "published";
    return this.save();
};

materialSchema.methods.archive = function() {
    this.status = "archived";
    return this.save();
};

// Static methods
materialSchema.statics.getCourseMaterials = function(courseId, type = null) {
    const query = { course: courseId, status: "published" };
    if (type) query.type = type;

    return this.find(query)
        .populate("instructor", "firstName lastName")
        .sort({ order: 1, createdAt: -1 });
};

materialSchema.statics.getMaterialStats = function(instructorId) {
    return this.aggregate([
        { $match: { instructor: new mongoose.Types.ObjectId(instructorId) } },
        {
            $group: {
                _id: "$type",
                count: { $sum: 1 },
                totalDownloads: { $sum: "$downloadCount" },
                totalViews: { $sum: "$viewCount" }
            }
        },
        { $sort: { count: -1 } }
    ]);
};

materialSchema.statics.searchMaterials = function(instructorId, searchTerm, type = null) {
    const query = {
        instructor: instructorId,
        $or: [
            { title: { $regex: searchTerm, $options: "i" } },
            { description: { $regex: searchTerm, $options: "i" } },
            { tags: { $in: [new RegExp(searchTerm, "i")] } }
        ]
    };

    if (type) query.type = type;

    return this.find(query)
        .populate("course", "title")
        .sort({ createdAt: -1 });
};

const Material = mongoose.model("Material", materialSchema);

export { Material };