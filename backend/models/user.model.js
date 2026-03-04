import mongoose from "mongoose";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { convertToMilliseconds } from "../utils/time.utils.js";

// User Schema - Production Grade with Security Features
const userSchema = new mongoose.Schema({
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
        sparse: true, // Allow null but enforce uniqueness for non-null values
        unique: true,
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
    dateOfBirth: {
        type: Date,
        sparse: true
    },
    gender: {
        type: String,
        enum: ["Male", "Female", "Other", "Prefer not to say"],
        default: null
    },
    address: {
        street: String,
        city: String,
        state: String,
        postalCode: String,
        country: String
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
    // isKYCVerified: {
    //     type: Boolean,
    //     default: false // Know Your Customer verification for payment
    // },
    isActive: {
        type: Boolean,
        default: true
    },

    // Enrollment Information (Virtual - handled by Enrollment model)
    // enrolledCourses moved to separate Enrollment collection

    // NOTE: Payment information (card details, bank details, UPI, wallet) removed
    // for PCI DSS compliance. All payment data handled via centralised Payment gateway.
    // Wallet balance tracked in separate Wallet collection.
    // Transaction history tracked in separate Payment collection.

    // Security Fields
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

    // Preferences
    preferences: {
        emailNotifications: {
            type: Boolean,
            default: true
        },
        smsNotifications: {
            type: Boolean,
            default: false
        },
        courseUpdates: {
            type: Boolean,
            default: true
        },
        promotionalEmails: {
            type: Boolean,
            default: true
        },
        language: {
            type: String,
            default: "en"
        }
    },

    // Course Learning Progress
    learningProgress: {
        totalCoursesEnrolled: {
            type: Number,
            default: 0
        },
        totalCoursesCompleted: {
            type: Number,
            default: 0
        },
        totalLearningHours: {
            type: Number,
            default: 0
        },
        certificates: {
            type: Number,
            default: 0
        },
        averageRating: {
            type: Number,
            default: 0,
            min: 0,
            max: 5
        }
    },

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
    collection: "users"
});

// Indexes for performance and security
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ phone: 1 }, { unique: true, sparse: true });
userSchema.index({ createdAt: -1 });
userSchema.index({ isActive: 1 });
userSchema.index({ isEmailVerified: 1 });
userSchema.index({ deletedAt: 1 });
userSchema.index({ verificationCodeExpires: 1 }, { expireAfterSeconds: 0 });

// Virtual for account lock status
userSchema.virtual("isLocked").get(function() {
    return !!(this.lockUntil && this.lockUntil > Date.now());
});

// Pre-save middleware for password hashing
userSchema.pre("save", async function() {
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
userSchema.pre(/^find/, function() {
    this.where({ deletedAt: { $exists: false } });
});

// Instance method to compare passwords
userSchema.methods.comparePassword = async function(candidatePassword) {
    try {
        return await bcrypt.compare(candidatePassword, this.password);
    } catch (error) {
        throw error;
    }
};

// Instance method for password change check
userSchema.methods.changedPasswordAfter = function(JWTTimestamp) {
    if (this.passwordChangedAt) {
        const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
        return JWTTimestamp < changedTimestamp;
    }
    return false;
};

// Instance method to create password reset token
userSchema.methods.createPasswordResetToken = function() {
    const rawToken = crypto.randomBytes(32).toString("hex");

    this.passwordResetToken = crypto
        .createHash("sha256")
        .update(rawToken)
        .digest("hex");

    this.passwordResetExpires = Date.now() + convertToMilliseconds(process.env.PASSWORD_RESET_EXPIRES_IN);
    return rawToken;
};

// Instance method to generate OTP
userSchema.methods.generateOTP = function() {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    this.verificationCode = otp;
    this.verificationCodeExpires = Date.now() + convertToMilliseconds(process.env.OTP_EXPIRES_IN);
    this.isOtpVerified = false;
    this.otpLastSentAt = Date.now();
    return otp;
};

// Instance method to verify OTP
userSchema.methods.verifyOTP = function(providedOTP) {
    if (!this.verificationCode || !this.verificationCodeExpires) {
        return false;
    }

    if (Date.now() > this.verificationCodeExpires) {
        return false;
    }

    return this.verificationCode === providedOTP;
};

// Instance method to clear OTP
userSchema.methods.clearOTP = function() {
    this.verificationCode = null;
    this.verificationCodeExpires = null;
    this.isOtpVerified = true;
    this.otpAttempts = 0;
};

// Instance method to hash token
userSchema.methods.hashToken = function(token) {
    return crypto.createHash("sha256").update(token).digest("hex");
};

// Instance method to add session
userSchema.methods.addSession = function(refreshToken, deviceInfo = {}) {
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
userSchema.methods.verifyAndRemoveRefreshToken = function(refreshToken) {
    const hash = this.hashToken(refreshToken);
    const sessionIndex = this.sessions.findIndex(session => session.refreshTokenHash === hash);
    if (sessionIndex === -1) return false;
    
    this.sessions.splice(sessionIndex, 1);
    return true;
};

// Instance method to clear all sessions
userSchema.methods.clearAllSessions = function() {
    this.sessions = [];
};

// Static method for atomic login attempt increment
userSchema.statics.failLogin = async function(userId) {
    return this.findByIdAndUpdate(
        userId,
        {
            $inc: { loginAttempts: 1 },
            $set: {
                lockUntil: Date.now() + convertToMilliseconds(process.env.ACCOUNT_LOCK_DURATION)
            }
        },
        { new: true }
    );
};

// Instance method to reset login attempts
userSchema.methods.resetLoginAttempts = function() {
    this.loginAttempts = 0;
    this.lockUntil = undefined;
    this.save({ validateBeforeSave: false });
};

// Transform output to exclude sensitive fields
userSchema.methods.toJSON = function() {
    const userObject = this.toObject();
    delete userObject.password;
    delete userObject.passwordResetToken;
    delete userObject.passwordResetExpires;
    delete userObject.loginAttempts;
    delete userObject.lockUntil;
    delete userObject.sessions;
    delete userObject.verificationCode;
    delete userObject.otpAttempts;
    delete userObject.otpLastSentAt;
    return userObject;
};

// Export the model
const User = mongoose.model("User", userSchema);

export { User };
