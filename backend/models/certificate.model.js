import mongoose from "mongoose";
import crypto from "crypto";
const certificateSchema = new mongoose.Schema({
    // Certificate Information
    certificateId: {
        type: String,
        unique: true,
        sparse:true,
        required: function() { return !this.isTemplate; }
    },
    title: {
        type: String,
        required: [true, "Certificate title is required"],
        trim: true,
        maxlength: [100, "Title cannot exceed 100 characters"]
    },

    // Relationships
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: function() { return !this.isTemplate; } // Not required for templates
    },
    course: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Course",
        required: [true, "Certificate must belong to a course"]
    },
    instructor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Instructor",
        required: [true, "Certificate must have an instructor"]
    },

    // Is this a template certificate?
    isTemplate: {
        type: Boolean,
        default: false
    },

    // Certificate Details
    issuedAt: {
        type: Date,
        default: Date.now
    },
    expiryDate: Date, // Optional expiry

    // Achievement Metrics
    completionPercentage: {
        type: Number,
        required: true,
        min: 0,
        max: 100
    },
    totalLessons: {
        type: Number,
        required: true,
        min: 0
    },
    completedLessons: {
        type: Number,
        required: true,
        min: 0
    },
    timeSpent: {
        type: Number, // in hours
        required: true,
        min: 0
    },

    // Certificate Status
    status: {
        type: String,
        enum: ["active", "revoked", "expired"],
        default: "active"
    },
    revokedAt: Date,
    revokedReason: {
        type: String,
        trim: true,
        maxlength: 500
    },

    // Certificate Assets
    certificateUrl: {
        type: String, // R2 URL for PDF/image
        required: true
    },
    shareableUrl: {
        type: String,
        unique: true,
        sparse:true,
        required: function() { return !this.isTemplate; }
    },

    // Verification
    verificationCode: {
        type: String,
        unique: true,
        required: function() { return !this.isTemplate; }
    },

    // Skills/Competencies Earned
    skills: [{
        type: String,
        trim: true,
        maxlength: 50
    }],

    // Grade (optional)
    grade: {
        type: String,
        enum: ["A+", "A", "B+", "B", "C+", "C", "D", "F", "Pass", "Fail"],
        validate: {
            validator: function(value) {
                // Only allow grades if course has assessments
                return true; // For now, allow any grade
            }
        }
    },

    // Audit Fields
    issuedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Instructor"
    },
    revokedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Admin"
    }
}, {
    timestamps: true,
    collection: "certificates"
});

// Indexes for performance
certificateSchema.index({ user: 1, course: 1 }, { unique: true }); // One certificate per user per course
// certificateSchema.index({ certificateId: 1 }, { unique: true });
// certificateSchema.index({ verificationCode: 1 }, { unique: true });
// certificateSchema.index({ shareableUrl: 1 }, { unique: true });
certificateSchema.index({ issuedAt: -1 });
certificateSchema.index({ status: 1, issuedAt: -1 });

// Compound indexes
certificateSchema.index({ user: 1, status: 1 });
certificateSchema.index({ course: 1, issuedAt: -1 });

// Pre-save middleware to generate unique IDs
certificateSchema.pre("save", async function() {
    if (this.isNew) {
        // Generate certificate ID
        const timestamp = Date.now().toString(36);
        const random = Math.random().toString(36).substr(2, 5);
        this.certificateId = `CERT-${timestamp}-${random}`.toUpperCase();

        // Generate verification code
        // const crypto = await import("crypto");
        this.verificationCode = crypto.randomBytes(16).toString("hex");

        // Generate shareable URL
        this.shareableUrl = `cert/${this.verificationCode}`;
    }
});

// Static method to verify certificate
certificateSchema.statics.verifyCertificate = function(verificationCode) {
    return this.findOne({
        verificationCode,
        status: "active",
        $or: [
            { expiryDate: { $exists: false } },
            { expiryDate: { $gte: new Date() } }
        ]
    }).populate("user", "name").populate("course", "title");
};

// Static method to get user certificates
certificateSchema.statics.getUserCertificates = function(userId) {
    return this.find({ user: userId, status: "active" })
        .populate("course", "title thumbnail instructor")
        .sort({ issuedAt: -1 });
};

// Static method to get course certificates
certificateSchema.statics.getCourseCertificates = function(courseId) {
    return this.find({ course: courseId, status: "active" })
        .populate("user", "name avatar")
        .sort({ issuedAt: -1 });
};

// Instance method to revoke certificate
certificateSchema.methods.revoke = function(reason, revokedBy) {
    this.status = "revoked";
    this.revokedAt = new Date();
    this.revokedReason = reason;
    this.revokedBy = revokedBy;
    return this.save();
};

// Instance method to check if expired
certificateSchema.methods.isExpired = function() {
    return this.expiryDate && new Date() > this.expiryDate;
};

// Instance method to get shareable link
certificateSchema.methods.getShareableLink = function(baseUrl) {
    return `${baseUrl}/certificates/${this.shareableUrl}`;
};

const Certificate = mongoose.model("Certificate", certificateSchema);

export { Certificate };