import mongoose from "mongoose";

// Video Package Schema - Production Grade for Pre-recorded Content
const videoPackageSchema = new mongoose.Schema({
    // Relationships
    instructor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Instructor",
        required: [true, "Video package must belong to an instructor"]
    },
    course: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Course",
        required: [true, "Video package must belong to a course"]
    },

    // Package Details
    packageName: {
        type: String,
        required: [true, "Package name is required"],
        trim: true,
        maxlength: [100, "Package name cannot exceed 100 characters"],
        minlength: [3, "Package name must be at least 3 characters"]
    },
    description: {
        type: String,
        trim: true,
        maxlength: [1000, "Description cannot exceed 1000 characters"]
    },

    // Videos in Package (stored on Bunny Stream)
    videos: [{
        videoId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true
        },
        bunnyVideoId: {
            type: String,    // Bunny Stream GUID — primary identifier for playback/delete
            default: ""
        },
        title: {
            type: String,
            required: true,
            trim: true,
            maxlength: 100
        },
        description: {
            type: String,
            trim: true,
            maxlength: 500
        },
        duration: {
            type: Number, // in seconds
            default: 0,
            min: 0
        },
        fileSize: {
            type: Number, // in bytes
            min: 0
        },
        uploadedAt: {
            type: Date,
            default: Date.now
        },
        url: {
            type: String,  // Signed HLS playback URL (regenerated on access)
            default: ""
        },
        thumbnail: {
            type: String,  // Bunny auto-generated or custom R2 thumbnail URL
            default: ""
        },
        status: {
            type: String,
            enum: ["uploading", "processing", "available", "deleted"],
            default: "uploading"
        },
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
        order: {
            type: Number,
            default: 0
        }
    }],

    // Package Stats
    totalVideos: {
        type: Number,
        default: 0,
        min: 0
    },
    totalDuration: {
        type: Number, // in seconds
        default: 0,
        min: 0
    },
    totalSize: {
        type: Number, // in bytes
        default: 0,
        min: 0
    },

    // Status and Visibility
    isPublished: {
        type: Boolean,
        default: false
    },
    isPublic: {
        type: Boolean,
        default: false
    },

    // Pricing (if applicable)
    price: {
        type: Number,
        min: 0,
        default: 0
    },
    currency: {
        type: String,
        default: "USD",
        enum: ["USD", "EUR", "GBP", "INR"]
    },

    // Tags and Categories
    tags: [String],
    category: {
        type: String,
        enum: [
            "lecture", "tutorial", "workshop", "demo", "interview",
            "webinar", "other"
        ],
        default: "tutorial"
    },

    // Engagement Metrics
    totalViews: {
        type: Number,
        default: 0,
        min: 0
    },
    totalLikes: {
        type: Number,
        default: 0,
        min: 0
    },
    averageRating: {
        type: Number,
        default: 0,
        min: 0,
        max: 5
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
    collection: "videopackages"
});

// Indexes for performance
videoPackageSchema.index({ instructor: 1, isPublished: 1 });
videoPackageSchema.index({ course: 1 });
videoPackageSchema.index({ isPublished: 1, createdAt: -1 });
videoPackageSchema.index({ "videos.status": 1 });
videoPackageSchema.index({ totalViews: -1 });
videoPackageSchema.index({ createdAt: -1 });

// Pre-save middleware to update stats
videoPackageSchema.pre("save", function() {
    if (this.isModified("videos")) {
        this.totalVideos = this.videos.length;
        this.totalDuration = this.videos.reduce((sum, video) => sum + (video.duration || 0), 0);
        this.totalSize = this.videos.reduce((sum, video) => sum + (video.fileSize || 0), 0);
    }
});

// Instance methods
videoPackageSchema.methods.addVideo = function(videoData) {
    const order = this.videos.length > 0 ? Math.max(...this.videos.map(v => v.order || 0)) + 1 : 1;

    this.videos.push({
        videoId: videoData.videoId,
        bunnyVideoId: videoData.bunnyVideoId || "",
        title: videoData.title,
        description: videoData.description,
        duration: videoData.duration,
        fileSize: videoData.fileSize,
        url: videoData.url,
        thumbnail: videoData.thumbnail,
        status: videoData.status || "uploading",
        order: order
    });

    return this.save();
};

videoPackageSchema.methods.updateVideoStatus = function(videoId, status) {
    const video = this.videos.find(v => v.videoId.toString() === videoId.toString());
    if (video) {
        video.status = status;
        if (status === "available") {
            video.uploadedAt = new Date();
        }
    }
    return this.save();
};

videoPackageSchema.methods.incrementViews = function(videoId) {
    const video = this.videos.find(v => v.videoId.toString() === videoId.toString());
    if (video) {
        video.views += 1;
        this.totalViews += 1;
    }
    return this.save();
};

videoPackageSchema.methods.publish = function() {
    this.isPublished = true;
    return this.save();
};

videoPackageSchema.methods.unpublish = function() {
    this.isPublished = false;
    return this.save();
};

// Static methods
videoPackageSchema.statics.getPublishedPackages = function(instructorId, limit = 20) {
    return this.find({
        instructor: instructorId,
        isPublished: true
    })
    .populate("course", "title")
    .sort({ createdAt: -1 })
    .limit(limit);
};

videoPackageSchema.statics.getPackageStats = function(instructorId) {
    return this.aggregate([
        { $match: { instructor: mongoose.Types.ObjectId(instructorId) } },
        {
            $group: {
                _id: null,
                totalPackages: { $sum: 1 },
                publishedPackages: {
                    $sum: { $cond: [{ $eq: ["$isPublished", true] }, 1, 0] }
                },
                totalVideos: { $sum: "$totalVideos" },
                totalDuration: { $sum: "$totalDuration" },
                totalViews: { $sum: "$totalViews" }
            }
        }
    ]);
};

const VideoPackage = mongoose.model("VideoPackage", videoPackageSchema);

export { VideoPackage };