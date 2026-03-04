import mongoose from "mongoose";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { convertToMilliseconds } from "../utils/time.utils.js";

// Admin Schema with robust security mechanisms
const adminSchema = new mongoose.Schema({
    // Basic Information
    name: {
        type: String,
        required: [true, "Admin name is required"],
        trim: true,
        maxlength: [50, "Name cannot exceed 50 characters"],
        minlength: [2, "Name must be at least 2 characters"]
    },
    email: {
        type: String,
        required: [true, "Admin email is required"],
        unique: true,
        lowercase: true,
        trim: true,
        set: v => v.toLowerCase().trim(), // Normalize to lowercase and trim
        match: [
            /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
            "Please enter a valid email address"
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
        select: false // Exclude from queries by default for security
    },

    // Security and Permissions
    permissions: [{
        type: String,
        enum: [
            "manage_users",
            "manage_courses",
            "manage_instructors",
            "manage_payments",
            "view_analytics",
            "system_settings",
            "delete_data"
        ],
        default: []
    }],
    isActive: {
        type: Boolean,
        default: true
    },
    isSuperAdmin: {
        type: Boolean,
        default: false // Only one super admin for ultimate control
    },

    // Session and Device Tracking
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

    // Security Tracking
    passwordChangedAt: Date,
    passwordResetToken: String, // Now stores hashed token
    passwordResetExpires: Date,
    loginAttempts: {
        type: Number,
        default: 0
    },
    lockUntil: Date, // Account lock after failed attempts
    lastLogin: Date,
    lastLoginIP: String,

    // OTP / Verification Code for Login
    verificationCode: {
        type: String,
        default: null,
        select: false // Exclude from queries by default for security
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

    // Soft Delete
    deletedAt: Date,
    deletionReason: String,

    // Audit Fields
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Admin" // Reference to admin who created this account
    },
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Admin"
    }
}, {
    timestamps: true, // Adds createdAt and updatedAt
    collection: "admins" // Explicit collection name
});

// Indexes for performance and security
adminSchema.index({ email: 1 }, { unique: true });
adminSchema.index({ createdAt: -1 });
adminSchema.index({ isActive: 1 });
adminSchema.index({ deletedAt: 1 }); // For soft delete queries
adminSchema.index({ verificationCodeExpires: 1 }, { expireAfterSeconds: 0 }); // Auto-delete OTP after expiry

// Virtual for account lock status
adminSchema.virtual("isLocked").get(function() {
    return !!(this.lockUntil && this.lockUntil > Date.now());
});

// Pre-save middleware for password hashing
adminSchema.pre("save", async function() {
    // Only hash if password is modified or new
    if (!this.isModified("password")) {
        return;
    }

    try {
        // Hash password with cost of 12
        const saltRounds = 12;
        this.password = await bcrypt.hash(this.password, saltRounds);

        // Update passwordChangedAt when password changes
        this.passwordChangedAt = Date.now() - 1000; // Subtract 1s to ensure JWT issued before is invalid
    } catch (error) {
        throw error;
    }
});

// Pre-find middleware for soft delete
adminSchema.pre(/^find/, function() {
    this.where({ deletedAt: { $exists: false } });
});

// Pre-findOneAndDelete middleware to prevent super admin deletion
adminSchema.pre("findOneAndDelete", function() {
    if (this._conditions.isSuperAdmin) {
        throw new Error("Cannot delete super admin");
    }
});

// Instance method to compare passwords
adminSchema.methods.comparePassword = async function(candidatePassword) {
    try {
        return await bcrypt.compare(candidatePassword, this.password);
    } catch (error) {
        throw error;
    }
};

// Instance method for password change check
adminSchema.methods.changedPasswordAfter = function(JWTTimestamp) {
    if (this.passwordChangedAt) {
        const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
        return JWTTimestamp < changedTimestamp;
    }
    return false;
};

// Instance method to create password reset token (secure hashed storage)
adminSchema.methods.createPasswordResetToken = function() {
    const rawToken = crypto.randomBytes(32).toString("hex");

    this.passwordResetToken = crypto
        .createHash("sha256")
        .update(rawToken)
        .digest("hex");

    this.passwordResetExpires = Date.now() + convertToMilliseconds(process.env.PASSWORD_RESET_EXPIRES_IN); // Use environment variable
    return rawToken; // Return raw token to email, store hash in DB
};

// Instance method to generate and set OTP (6-digit verification code)
adminSchema.methods.generateOTP = function() {
    const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
    this.verificationCode = otp;
    this.verificationCodeExpires = Date.now() + convertToMilliseconds(process.env.OTP_EXPIRES_IN); // Use environment variable
    this.isOtpVerified = false;
    this.otpLastSentAt = Date.now();
    return otp; // Return OTP to send via email
};

// Instance method to verify OTP (pure function - no side effects)
adminSchema.methods.verifyOTP = function(providedOTP) {
    if (!this.verificationCode || !this.verificationCodeExpires) {
        return false;
    }

    // Check if OTP has expired
    if (Date.now() > this.verificationCodeExpires) {
        return false; // Don't mutate here - let caller decide what to do
    }

    // Check if provided OTP matches
    return this.verificationCode === providedOTP;
};

// Instance method to clear OTP after successful verification
adminSchema.methods.clearOTP = function() {
    this.verificationCode = null;
    this.verificationCodeExpires = null;
    this.isOtpVerified = true;
    this.otpAttempts = 0; // Reset attempts on success
};

// Instance method to hash a token
adminSchema.methods.hashToken = function(token) {
    return crypto.createHash("sha256").update(token).digest("hex");
};

// Instance method to add a session with hashed refresh token
adminSchema.methods.addSession = function(refreshToken, deviceInfo = {}) {
    const hash = this.hashToken(refreshToken);

    // Limit sessions to prevent unbounded growth (max 5 devices)
    const MAX_SESSIONS = 5;
    if (this.sessions.length >= MAX_SESSIONS) {
        this.sessions.shift(); // Remove oldest session
    }

    this.sessions.push({
        refreshTokenHash: hash,
        device: deviceInfo.device,
        ip: deviceInfo.ip,
        userAgent: deviceInfo.userAgent,
        lastActive: new Date()
    });
};

// Instance method to verify and remove a refresh token
adminSchema.methods.verifyAndRemoveRefreshToken = function(refreshToken) {
    const hash = this.hashToken(refreshToken);
    const sessionIndex = this.sessions.findIndex(session => session.refreshTokenHash === hash);
    if (sessionIndex === -1) return false;
    
    this.sessions.splice(sessionIndex, 1); // Remove the session
    return true;
};

// Instance method to clear all sessions (logout from all devices)
adminSchema.methods.clearAllSessions = function() {
    this.sessions = [];
    this.isOtpVerified = false;
};

// Static method for atomic login attempt increment (prevents race conditions)
adminSchema.statics.failLogin = async function(adminId) {
    return this.findByIdAndUpdate(
        adminId,
        {
            $inc: { loginAttempts: 1 },
            $set: {
                lockUntil: Date.now() + convertToMilliseconds(process.env.ACCOUNT_LOCK_DURATION) // Use environment variable
            }
        },
        { new: true }
    );
};

// Instance method to reset login attempts on successful login
adminSchema.methods.resetLoginAttempts = function() {
    this.loginAttempts = 0;
    this.lockUntil = undefined;
    this.save({ validateBeforeSave: false });
};

// Static method to find active admins only
adminSchema.statics.findActive = function() {
    return this.find({ isActive: true });
};

// Transform output to exclude sensitive fields
adminSchema.methods.toJSON = function() {
    const adminObject = this.toObject();
    delete adminObject.password;
    delete adminObject.passwordResetToken;
    delete adminObject.passwordResetExpires;
    delete adminObject.loginAttempts;
    delete adminObject.lockUntil;
    delete adminObject.sessions; // Optionally exclude sessions for public views
    delete adminObject.verificationCode;
    delete adminObject.otpAttempts;
    delete adminObject.otpLastSentAt;
    return adminObject;
};

// Export the model
// Note: For separate databases, this model should be created with a specific connection
// e.g., const Admin = connection.model("Admin", adminSchema);
const Admin = mongoose.model("Admin", adminSchema);

export { Admin };