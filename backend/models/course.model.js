import mongoose from "mongoose";
import { CATEGORY_MAP } from "../utils/categories.utils.js";

const courseSchema = new mongoose.Schema({
    // Basic Course Information
    title: {
        type: String,
        required: [true, "Course title is required"],
        trim: true,
        maxlength: [100, "Title cannot exceed 100 characters"],
        minlength: [3, "Title must be at least 3 characters"],
        unique: true
    },
    description: {
        type: String,
        required: [true, "Course description is required"],
        trim: true,
        maxlength: [2000, "Description cannot exceed 2000 characters"],
        minlength: [10, "Description must be at least 10 characters"]
    },
    shortDescription: {
        type: String,
        trim: true,
        maxlength: [300, "Short description cannot exceed 300 characters"]
    },

    // Instructor Information
    instructor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Instructor",
        required: [true, "Course must have an instructor"]
    },

    // Course Metadata
        category: {
        type: String,
        required: [true, "Course category is required"],
        enum: Object.keys(CATEGORY_MAP)
        },

        subCategory: {
        type: String,
        required: [true, "Course subcategory is required"],
        validate: {
            validator: function(value) {
            return CATEGORY_MAP[this.category]?.includes(value);
            },
            message: "Invalid subcategory for selected category"
        }
        },
    level: {
        type: String,
        required: [true, "Course level is required"],
        enum: ["beginner", "intermediate", "advanced"],
        default: "beginner"
    },
    language: {
        type: String,
        required: [true, "Course language is required"],
        default: "English"
    },

    // Pricing and Enrollment
    price: {
        type: Number,
        required: [true, "Course price is required"],
        min: [0, "Price cannot be negative"],
        max: [10000, "Price cannot exceed $10,000"]
    },
    currency: {
        type: String,
        default: "USD",
        enum: ["USD", "EUR", "GBP", "INR"]
    },
    discountPrice: {
        type: Number,
        min: 0,
        validate: {
            validator: function(value) {
                return value <= this.price;
            },
            message: "Discount price cannot be higher than original price"
        }
    },
    discountValidUntil: Date,

    // Course Content Structure
    modules: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Module"
    }],
    totalModules: {
        type: Number,
        default: 0,
        min: 0
    },
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

    // Media Assets
    thumbnail: {
        public_id: {
            type: String,
            required: [true, "Course thumbnail public_id is required"]
        },
        secure_url: {
            type: String,
            required: [true, "Course thumbnail secure_url is required"]
        }
    },
    //!! trailerVideo not stroing yet --> save to amazons3 cloudwatch CDN and store the URL here
    trailerVideo: {
        type: String, // R2 URL or YouTube ID
    },
    previewLessons: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Lesson"
    }],

    // Course Status and Visibility
    status: {
        type: String,
        enum: ["draft", "published", "archived"],
        default: "draft"
    },
    isPublished: {
        type: Boolean,
        default: false
    },
    publishedAt: Date,

    // Enrollment and Analytics]
    enrolledCount: {
        type: Number,
        default: 0,
        min: 0
    },
    maxStudents: {
        type: Number,
        min: 1,
        max: 10000
    },
    rating: {
        type: Number,
        default: 0,
        min: 0,
        max: 5
    },
    totalReviews: {
        type: Number,
        default: 0,
        min: 0
    },

    // Learning Outcomes and Requirements
    learningOutcomes: [{
        type: String,
        trim: true,
        maxlength: 200
    }],
    prerequisites: [{
        type: String,
        trim: true,
        maxlength: 200
    }],
    targetAudience: [{
        type: String,
        trim: true,
        maxlength: 200
    }],

    // SEO and Marketing
    tags: [{
        type: String,
        trim: true,
        lowercase: true,
        maxlength: 50
    }],
    seoTitle: {
        type: String,
        trim: true,
        maxlength: 60
    },
    seoDescription: {
        type: String,
        trim: true,
        maxlength: 160
    },

    // Settings
    isFree: {
        type: Boolean,
        default: false
    },
    allowPreview: {
        type: Boolean,
        default: true
    },
    certificateEnabled: {
        type: Boolean,
        default: true
    },
    isInternshipEligible: {
        type: Boolean,
        default: false
    },
    projectBased: {
        type: Boolean,
        default: false
    },
    projects: [{
        title: {
            type: String,
            trim: true,
            maxlength: 200
        },
        description: {
            type: String,
            trim: true,
            maxlength: 700
        }
    }],


    // Certificates (references to Certificate model)
    // When certificateEnabled is true, certificates are created and linked here
    certificates: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Certificate"
    }],

    // Audit Fields [!! not yet stored yet]
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
    collection: "courses"
});

// Indexes for performance
courseSchema.index({ instructor: 1, status: 1 });
courseSchema.index({ category: 1, level: 1, rating: -1 });
courseSchema.index({ title: "text", description: "text", tags: "text" });
courseSchema.index({ isPublished: 1, publishedAt: -1 });
courseSchema.index({ price: 1, discountPrice: 1 });
courseSchema.index({ enrolledCount: -1 });
courseSchema.index({ createdAt: -1 });

// Virtual for current price (handles discounts)
courseSchema.virtual("currentPrice").get(function() {
    if (this.discountPrice && this.discountValidUntil && this.discountValidUntil > new Date()) {
        return this.discountPrice;
    }
    return this.price;
});

// Virtual for duration in hours
courseSchema.virtual("durationHours").get(function() {
    return Math.round((this.totalDuration / 60) * 10) / 10;
});

// Pre-save middleware to update publishedAt
courseSchema.pre("save", function() {
    if (this.isModified("status") && this.status === "published" && !this.publishedAt) {
        this.publishedAt = new Date();
        this.isPublished = true;
    }
});

// Static method to find published courses
courseSchema.statics.findPublished = function() {
    return this.find({ status: "published", isPublished: true });
};

// Static method to find courses by category
courseSchema.statics.findByCategory = function(category) {
    return this.find({ category, status: "published", isPublished: true });
};

// Instance method to calculate average rating
courseSchema.methods.updateRating = async function() {
    const Review = mongoose.model("Review");
    const result = await Review.aggregate([
        { $match: { course: this._id } },
        { $group: { _id: null, avgRating: { $avg: "$rating" }, count: { $sum: 1 } } }
    ]);

    if (result.length > 0) {
        this.rating = Math.round(result[0].avgRating * 10) / 10;
        this.totalReviews = result[0].count;
    } else {
        this.rating = 0;
        this.totalReviews = 0;
    }

    return this.save();
};

// Transform output to include virtuals
courseSchema.methods.toJSON = function() {
    const courseObject = this.toObject({ virtuals: true });
    return courseObject;
};

const Course = mongoose.model("Course", courseSchema);

export { Course };