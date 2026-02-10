import mongoose from "mongoose";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { convertToMilliseconds } from "../utils/time.utils.js";

// Instructor Schema - Production Grade with Security Features
const instructorSchema = new mongoose.Schema({
    // Basic Information
    firstName: {
        type: String,
        required: [true, "First name is required"],
        trim: true,
        maxlength: [50, "First name cannot exceed 50 characters"],
        minlength: [2, "First name must be at least 2 characters"]
    },
    lastName: {
        type: String,
        required: [true, "Last name is required"],
        trim: true,
        maxlength: [50, "Last name cannot exceed 50 characters"],
        minlength: [2, "Last name must be at least 2 characters"]
    },
    email: {
        type: String,
        required: [true, "Email is required"],
        unique: true,
        lowercase: true,
        trim: true,
        set: v => v.toLowerCase().trim(),
        match: [
            /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
            "Please enter a valid email address"
        ]
    },
    phone: {
        type: String,
        // required: [true, "Phone number is required"],
        unique: true,
        sparse: true, // Allows multiple null values while maintaining uniqueness for non-null values
        trim: true,
        match: [
            /^[\+]?[(]?[0-9]{1,3}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,4}[-\s\.]?[0-9]{1,9}$/,
            "Please enter a valid phone number"
        ]
    },
    password: {
        type: String,
        required: [true, "Password is required"],
        minlength: [8, "Password must be at least 8 characters"],
        match: [
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/,
            "Password must include uppercase, lowercase, number, and special character"
        ],
        select: false
    },
    profilePicture: {
        public_id: {
            type: String,
            // required: true
        },
        secure_url: {
            type: String,
            // required: true
        }
    },
    bio: {
        type: String,
        maxlength: [500, "Bio cannot exceed 500 characters"],
        default: null
    },
    dateOfBirth: {
        type: Date,
        // required: [true, "Date of birth is required"]
    },
    gender: {
        type: String,
        enum: ["Male", "Female", "Other"],
        // required: true
    },
    address: {
        street: String,
        city: String,
        state: String,
        postalCode: String,
        country: String
    },

    // Professional Information
    specialization: [{
        type: String,
        enum: [
            "web_development",
            "mobile_app_development",
            "data_science",
            "artificial_intelligence",
            "cloud_computing",
            "cybersecurity",
            "devops",
            "machine_learning",
            "blockchain",
            "design",
            "business",
            "soft_skills",
            "other"
        ]
    }],
    qualifications: [{
        degree: String,
        institution: String,
        yearOfCompletion: Number,
        certificationId: String
    }],
    yearsOfExperience: {
        type: Number,
        default: 0,
        min: 0
    },
    totalStudentsTeaching: {
        type: Number,
        default: 0
    },
    totalCourses: {
        type: Number,
        default: 0
    },
    totalLiveClasses: {
        type: Number,
        default: 0
    },

    // Account Status
    isEmailVerified: {
        type: Boolean,
        default: false
    },
    isPhoneVerified: {
        type: Boolean,
        default: false
    },
    isDocumentsVerified: {
        type: Boolean,
        default: false // For qualification verification
    },
    isKYCVerified: {
        type: Boolean,
        default: false
    },
    isActive: {
        type: Boolean,
        default: true
    },
    isSuspended: {
        type: Boolean,
        default: false
    },
    suspensionReason: String,
    suspendedAt: Date,

    // Course Management (References only)
    courses: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Course"
    }],

    // Zoom Integration for Live Classes
    zoomIntegration: {
        zoomUserId: String,
        zoomAccessToken: String, // Encrypted in production
        zoomRefreshToken: String, // Encrypted in production
        isConnected: {
            type: Boolean,
            default: false
        },
        connectedAt: Date
    },

    // Live Classes (References)
    liveClasses: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "LiveClass"
    }],

    // Video Packages (References)
    videoPackages: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "VideoPackage"
    }],

    // Rating and Reviews
    rating: {
        averageRating: {
            type: Number,
            default: 0,
            min: 0,
            max: 5
        },
        totalReviews: {
            type: Number,
            default: 0
        },
        ratingBreakdown: {
            fivestar: { type: Number, default: 0 },
            fourstar: { type: Number, default: 0 },
            threestar: { type: Number, default: 0 },
            twostar: { type: Number, default: 0 },
            onestar: { type: Number, default: 0 }
        }
    },

    // Session and Security
    sessions: [{
        refreshTokenHash: {
            type: String,
            required: true
        },
        device: String,
        ip: String,
        userAgent: String,
        lastActive: {
            type: Date,
            default: Date.now
        },
        createdAt: {
            type: Date,
            default: Date.now
        }
    }],

    // Password Security
    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
    loginAttempts: {
        type: Number,
        default: 0
    },
    lockUntil: Date,
    lastLogin: Date,
    lastLoginIP: String,

    // OTP / Verification
    verificationCode: {
        type: String,
        default: null,
        select: false
    },
    verificationCodeExpires: {
        type: Date,
        default: null
    },
    isOtpVerified: {
        type: Boolean,
        default: false
    },
    otpAttempts: {
        type: Number,
        default: 0
    },
    otpLastSentAt: Date,

    // Instructor Preferences
    preferences: {
        emailNotifications: {
            type: Boolean,
            default: true
        },
        classReminders: {
            type: Boolean,
            default: true
        },
        studentUpdates: {
            type: Boolean,
            default: true
        },
        language: {
            type: String,
            default: "en"
        },
        timezone: {
            type: String,
            default: "UTC"
        }
    },

    // Bank Details for Admin Payments (Encrypted in production)
    bankDetails: {
        accountHolderName: String,
        accountNumber: String, // Encrypted
        ifscCode: String,
        bankName: String,
        accountType: {
            type: String,
            enum: ["savings", "current"],
            default: "savings"
        }
    },

    // Payment and Earnings (Admin Tracked)
    earnings: {
        totalEarnings: {
            type: Number,
            default: 0
        },
        pendingPayment: {
            type: Number,
            default: 0
        },
        paidAmount: {
            type: Number,
            default: 0
        },
        currency: {
            type: String,
            default: "USD"
        }
    },

    // Payment History (Admin initiated only)
    paymentHistory: [{
        paymentId: {
            type: String,
            unique: true,
            sparse: true
        },
        amount: Number,
        currency: String,
        paymentMethod: {
            type: String,
            enum: ["bank_transfer", "check", "wire_transfer"],
            default: "bank_transfer"
        },
        paymentStatus: {
            type: String,
            enum: ["pending", "processed", "failed", "cancelled"],
            default: "pending"
        },
        initiatedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Admin"
        },
        transactionId: String,
        paymentDate: Date,
        remarks: String,
        processedAt: Date
    }],

    // Soft Delete
    deletedAt: Date,
    deletionReason: String,

    // Audit Fields
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Admin"
    },
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Admin"
    }
}, {
    timestamps: true,
    collection: "instructors"
});

// Indexes for performance and security
instructorSchema.index({ email: 1 }, { unique: true });
instructorSchema.index({ phone: 1 }, { unique: true, sparse: true });
instructorSchema.index({ createdAt: -1 });
instructorSchema.index({ isActive: 1 });
instructorSchema.index({ isEmailVerified: 1 });
instructorSchema.index({ deletedAt: 1 });
instructorSchema.index({ "courses": 1 });
instructorSchema.index({ "liveClasses": 1 });
instructorSchema.index({ "videoPackages": 1 });
instructorSchema.index({ "paymentHistory.paymentId": 1 });
instructorSchema.index({ verificationCodeExpires: 1 }, { expireAfterSeconds: 0 });

// Virtual for account lock status
instructorSchema.virtual("isLocked").get(function() {
    return !!(this.lockUntil && this.lockUntil > Date.now());
});

// Virtual for full name
instructorSchema.virtual("fullName").get(function() {
    return `${this.firstName} ${this.lastName}`.trim();
});

// Pre-save middleware for password hashing
instructorSchema.pre("save", async function() {
    if (!this.isModified("password")) {
        return;
    }

    try {
        const saltRounds = 12;
        this.password = await bcrypt.hash(this.password, saltRounds);
        this.passwordChangedAt = Date.now() - 1000;
    } catch (error) {
        throw error;
    }
});

// Pre-find middleware for soft delete
instructorSchema.pre(/^find/, function() {
    this.where({ deletedAt: { $exists: false } });
});

// Instance method to compare passwords
instructorSchema.methods.comparePassword = async function(candidatePassword) {
    try {
        return await bcrypt.compare(candidatePassword, this.password);
    } catch (error) {
        throw error;
    }
};

// Instance method for password change check
instructorSchema.methods.changedPasswordAfter = function(JWTTimestamp) {
    if (this.passwordChangedAt) {
        const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
        return JWTTimestamp < changedTimestamp;
    }
    return false;
};

// Instance method to create password reset token
instructorSchema.methods.createPasswordResetToken = function() {
    const rawToken = crypto.randomBytes(32).toString("hex");

    this.passwordResetToken = crypto
        .createHash("sha256")
        .update(rawToken)
        .digest("hex");

    this.passwordResetExpires = Date.now() + convertToMilliseconds(process.env.PASSWORD_RESET_EXPIRES_IN);
    return rawToken;
};

// Instance method to generate OTP
instructorSchema.methods.generateOTP = function() {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    this.verificationCode = otp;
    this.verificationCodeExpires = Date.now() + convertToMilliseconds(process.env.OTP_EXPIRES_IN);
    this.isOtpVerified = false;
    this.otpLastSentAt = Date.now();
    return otp;
};

// Instance method to verify OTP
instructorSchema.methods.verifyOTP = function(providedOTP) {
    if (!this.verificationCode || !this.verificationCodeExpires) {
        return false;
    }

    if (Date.now() > this.verificationCodeExpires) {
        return false;
    }

    return this.verificationCode === providedOTP;
};

// Instance method to clear OTP
instructorSchema.methods.clearOTP = function() {
    this.verificationCode = null;
    this.verificationCodeExpires = null;
    this.isOtpVerified = true;
    this.otpAttempts = 0;
};

// Instance method to hash token
instructorSchema.methods.hashToken = function(token) {
    return crypto.createHash("sha256").update(token).digest("hex");
};

// Instance method to add session
instructorSchema.methods.addSession = function(refreshToken, deviceInfo = {}) {
    const hash = this.hashToken(refreshToken);
    const MAX_SESSIONS = 5;

    if (this.sessions.length >= MAX_SESSIONS) {
        this.sessions.shift();
    }

    this.sessions.push({
        refreshTokenHash: hash,
        device: deviceInfo.device,
        ip: deviceInfo.ip,
        userAgent: deviceInfo.userAgent,
        lastActive: new Date()
    });
};

// Instance method to verify and remove refresh token
instructorSchema.methods.verifyAndRemoveRefreshToken = function(refreshToken) {
    const hash = this.hashToken(refreshToken);
    const sessionIndex = this.sessions.findIndex(session => session.refreshTokenHash === hash);
    if (sessionIndex === -1) return false;
    
    this.sessions.splice(sessionIndex, 1);
    return true;
};

// Instance method to clear all sessions
instructorSchema.methods.clearAllSessions = function() {
    this.sessions = [];
};

// Static method for atomic login attempt increment
instructorSchema.statics.failLogin = async function(instructorId) {
    // First increment attempts
    const instructor = await this.findByIdAndUpdate(
        instructorId,
        {
            $inc: { loginAttempts: 1 }
        },
        { new: true }
    );

    // Only lock account if attempts >= 5
    const MAX_LOGIN_ATTEMPTS = 5;
    if (instructor.loginAttempts >= MAX_LOGIN_ATTEMPTS) {
        const LOCK_DURATION = process.env.ACCOUNT_LOCK_DURATION || '2h';
        return this.findByIdAndUpdate(
            instructorId,
            {
                $set: {
                    lockUntil: Date.now() + convertToMilliseconds(LOCK_DURATION)
                }
            },
            { new: true }
        );
    }

    return instructor;
};

// Instance method to reset login attempts
instructorSchema.methods.resetLoginAttempts = function() {
    this.loginAttempts = 0;
    this.lockUntil = undefined;
    this.save({ validateBeforeSave: false });
};

// Instance method to update instructor rating
instructorSchema.methods.updateRating = function(newRating) {
    if (newRating < 1 || newRating > 5) {
        throw new Error("Rating must be between 1 and 5");
    }

    const totalRating = this.rating.averageRating * this.rating.totalReviews + newRating;
    this.rating.totalReviews += 1;
    this.rating.averageRating = totalRating / this.rating.totalReviews;

    // Update rating breakdown
    if (newRating === 5) this.rating.ratingBreakdown.fivestar += 1;
    else if (newRating === 4) this.rating.ratingBreakdown.fourstar += 1;
    else if (newRating === 3) this.rating.ratingBreakdown.threestar += 1;
    else if (newRating === 2) this.rating.ratingBreakdown.twostar += 1;
    else if (newRating === 1) this.rating.ratingBreakdown.onestar += 1;
};

// Static methods for related data
instructorSchema.statics.getInstructorCourses = function(instructorId) {
    return this.findById(instructorId)
        .populate({
            path: 'courses',
            select: 'title description category level price isPublished enrollmentCount'
        });
};

instructorSchema.statics.getInstructorLiveClasses = function(instructorId) {
    return this.findById(instructorId)
        .populate({
            path: 'liveClasses',
            select: 'title description scheduledAt duration status actualParticipants',
            populate: { path: 'course', select: 'title' }
        });
};

instructorSchema.statics.getInstructorVideoPackages = function(instructorId) {
    return this.findById(instructorId)
        .populate({
            path: 'videoPackages',
            select: 'packageName description totalVideos totalDuration isPublished',
            populate: { path: 'course', select: 'title' }
        });
};

// Transform output to exclude sensitive fields
instructorSchema.methods.toJSON = function() {
    const instructorObject = this.toObject();
    delete instructorObject.password;
    delete instructorObject.passwordResetToken;
    delete instructorObject.passwordResetExpires;
    delete instructorObject.loginAttempts;
    delete instructorObject.lockUntil;
    delete instructorObject.sessions;
    delete instructorObject.verificationCode;
    delete instructorObject.otpAttempts;
    delete instructorObject.otpLastSentAt;
    // Don't expose sensitive payment/bank details
    if (instructorObject.bankDetails) {
        delete instructorObject.bankDetails.accountNumber;
    }
    if (instructorObject.zoomIntegration) {
        delete instructorObject.zoomIntegration.zoomAccessToken;
        delete instructorObject.zoomIntegration.zoomRefreshToken;
    }
    return instructorObject;
};

// Export the model
const Instructor = mongoose.model("Instructor", instructorSchema);

export { Instructor };
