import mongoose from "mongoose";

// Video Schema - Single video per lesson (1:1 relationship)
// Uses a direct lesson-to-video structure without video arrays.
const videoSchema = new mongoose.Schema({
    // Relationships
    instructor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Instructor",
        required: [true, "Video must belong to an instructor"]
    },
    course: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Course",
        required: [true, "Video must belong to a course"]
    },
    lesson: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Lesson",
        required: [true, "Video must belong to a lesson"]
    },

    // Video Details
    title: {
        type: String,
        required: [true, "Video title is required"],
        trim: true,
        maxlength: [100, "Title cannot exceed 100 characters"],
        minlength: [3, "Title must be at least 3 characters"]
    },
    description: {
        type: String,
        trim: true,
        maxlength: [1000, "Description cannot exceed 1000 characters"]
    },

    // Bunny Stream Upload
    bunnyVideoId: {
        type: String, // Bunny Stream GUID — primary identifier for playback/delete
        default: ""
    },
    url: {
        type: String, // Signed HLS playback URL (regenerated on access)
        default: ""
    },
    thumbnail: {
        type: String, // Bunny auto-generated or custom R2 thumbnail URL
        default: ""
    },

    // Video Metadata
    duration: {
        type: Number, // in seconds
        default: 0,
        min: 0
    },
    fileSize: {
        type: Number, // in bytes
        min: 0,
        default: 0
    },

    // Upload Status
    status: {
        type: String,
        enum: ["uploading", "processing", "available", "deleted"],
        default: "uploading"
    },
    uploadedAt: {
        type: Date,
        default: Date.now
    },

    // Engagement Metrics
    views: {
        type: Number,
        default: 0,
        min: 0
    },
    likes: {
        type: Number,
        default: 0,
        min: 0
    },

    // Visibility
    isPublished: {
        type: Boolean,
        default: true
    },
    isPublic: {
        type: Boolean,
        default: true
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
    collection: "videos"
});

// Indexes for performance
videoSchema.index({ instructor: 1, isPublished: 1 });
videoSchema.index({ course: 1 });
videoSchema.index({ lesson: 1 }, { unique: true }); // One video per lesson
videoSchema.index({ isPublished: 1, createdAt: -1 });
videoSchema.index({ status: 1 });
videoSchema.index({ views: -1 });
videoSchema.index({ createdAt: -1 });

// Static methods
videoSchema.statics.findByLesson = function(lessonId) {
    return this.findOne({ lesson: lessonId });
};

export const Video = mongoose.model("Video", videoSchema);
