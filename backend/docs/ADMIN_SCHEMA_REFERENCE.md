/**
 * ADMIN SCHEMA - COMPLETE REFERENCE
 * 
 * This file documents the complete admin schema with all fields,
 * validations, indexes, and methods.
 */

// ============================================================================
// ADMIN SCHEMA STRUCTURE
// ============================================================================

const adminSchemaStructure = {
    // ── Basic Information ──
    name: {
        type: String,
        required: true,
        minlength: 2,
        maxlength: 50,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        match: /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/
    },
    password: {
        type: String,
        required: true,
        minlength: 8,
        select: false,
        match: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/
    },

    // ── Permissions & Status ──
    permissions: [String], // e.g., "manage_users", "manage_courses"
    isActive: { type: Boolean, default: true },
    isSuperAdmin: { type: Boolean, default: false },

    // ── Sessions ──
    sessions: [{
        refreshTokenHash: String,
        device: String,
        ip: String,
        userAgent: String,
        lastActive: Date,
        createdAt: { type: Date, default: Date.now }
    }],

    // ── Security: Password Reset ──
    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,

    // ── Security: Login Attempts ──
    loginAttempts: { type: Number, default: 0 },
    lockUntil: Date, // Locked after 5 failed attempts (2 hours)
    lastLogin: Date,
    lastLoginIP: String,

    // ── OTP / Verification Code (NEW) ──
    verificationCode: {
        type: String,
        default: null,
        select: false // Not returned in queries
    },
    verificationCodeExpires: {
        type: Date,
        default: null,
        index: { expireAfterSeconds: 0 } // TTL index: auto-delete after expiry
    },
    isOtpVerified: { type: Boolean, default: false },

    // ── Access & Refresh Tokens (NEW) ──
    accessToken: {
        type: String,
        default: null,
        select: false // Not returned in queries
    },
    accessTokenExpires: { type: Date, default: null },
    refreshToken: {
        type: String,
        default: null,
        select: false // Not returned in queries
    },
    refreshTokenExpires: { type: Date, default: null },

    // ── Soft Delete ──
    deletedAt: Date,
    deletionReason: String,

    // ── Audit ──
    createdBy: { type: ObjectId, ref: "Admin" },
    updatedBy: { type: ObjectId, ref: "Admin" },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
};

// ============================================================================
// DATABASE INDEXES
// ============================================================================

const indexes = {
    email: "unique", // Fast email lookup, prevents duplicates
    createdAt: "descending", // Sort admins by creation date
    isActive: "ascending", // Filter active admins
    deletedAt: "ascending", // Soft delete queries
    verificationCodeExpires: "TTL index", // Auto-delete expired OTPs after 10 minutes
    verificationCode: "ascending" // Find OTP by code
};

// ============================================================================
// INSTANCE METHODS
// ============================================================================

const instanceMethods = {
    // Password Methods
    comparePassword(candidatePassword) {
        // Compare plaintext password with hashed password
        // Returns: boolean
    },
    
    changedPasswordAfter(JWTTimestamp) {
        // Check if password was changed after JWT was issued
        // Returns: boolean
    },

    // OTP Methods (NEW)
    generateOTP() {
        // Generate 6-digit random OTP
        // Sets: verificationCode, verificationCodeExpires (10 min), isOtpVerified = false
        // Returns: otp (6-digit string)
        // Usage: otp = admin.generateOTP(); await admin.save();
    },

    verifyOTP(providedOTP) {
        // Verify if provided OTP matches stored code
        // Check: code match, expiry time
        // Returns: boolean
        // Note: Auto-clears expired OTP from DB
    },

    clearOTP() {
        // Clear OTP after successful verification
        // Sets: verificationCode = null, verificationCodeExpires = null, isOtpVerified = true
        // Returns: void
        // Usage: admin.clearOTP(); await admin.save();
    },

    // Token Methods (NEW)
    setTokens(accessToken, refreshToken) {
        // Store access and refresh tokens with expiry times
        // Sets: accessToken, accessTokenExpires (15 min), refreshToken, refreshTokenExpires (7 days)
        // Returns: void
        // Usage: admin.setTokens(token1, token2); await admin.save();
    },

    clearTokens() {
        // Clear tokens on logout
        // Sets: accessToken = null, accessTokenExpires = null, refreshToken = null, refreshTokenExpires = null, isOtpVerified = false
        // Returns: void
        // Usage: admin.clearTokens(); await admin.save();
    },

    createPasswordResetToken() {
        // Create reset token for password recovery
        // Sets: passwordResetToken (hashed), passwordResetExpires (15 min)
        // Returns: raw token (to send via email)
    },

    resetLoginAttempts() {
        // Reset failed login counter and unlock account
        // Sets: loginAttempts = 0, lockUntil = undefined
        // Returns: Promise
    },

    toJSON() {
        // Transform output to exclude sensitive fields
        // Excludes: password, passwordResetToken, verificationCode, accessToken, refreshToken, sessions
        // Returns: sanitized admin object
    }
};

// ============================================================================
// STATIC METHODS
// ============================================================================

const staticMethods = {
    failLogin(adminId) {
        // Increment failed login attempts
        // Locks account after 5 attempts (2 hours)
        // Sets: loginAttempts += 1, lockUntil = Date.now() + 2 hours
        // Returns: updated admin object
        // Usage: await Admin.failLogin(adminId);
    },

    findActive() {
        // Find only active admins (soft delete aware)
        // Returns: Query object (must call .exec() or await)
        // Usage: await Admin.findActive();
    }
};

// ============================================================================
// OTP WORKFLOW - AUTO-DELETION
// ============================================================================

const otpAutoDeleteWorkflow = {
    scenario1: {
        description: "OTP Expired (10 minutes passed)",
        process: [
            "1. MongoDB TTL index detects verificationCodeExpires < now",
            "2. MongoDB automatically deletes the OTP document field",
            "3. Entire record is NOT deleted, just the OTP field",
            "4. verificationCode becomes null",
            "5. verificationCodeExpires becomes null"
        ],
        result: "OTP must be regenerated via /resend-otp"
    },

    scenario2: {
        description: "OTP Successfully Verified",
        process: [
            "1. Admin calls POST /verify-otp with correct OTP",
            "2. verifyOTP() checks expiry and code match",
            "3. clearOTP() called to remove OTP fields",
            "4. admin.verificationCode = null",
            "5. admin.verificationCodeExpires = null",
            "6. isOtpVerified = true",
            "7. await admin.save() persists changes"
        ],
        result: "OTP cleared, tokens generated, login successful"
    },

    mongoDBTTLIndex: {
        field: "verificationCodeExpires",
        description: "MongoDB automatically deletes documents when TTL expires",
        how: "index: { expireAfterSeconds: 0 } - expires immediately after date",
        benefits: [
            "No manual cleanup needed",
            "Automatic memory management",
            "Prevents storing expired OTPs"
        ]
    }
};

// ============================================================================
// LOGIN FLOW WITH OTP
// ============================================================================

const loginFlow = {
    step1: {
        endpoint: "POST /api/v1/admin/login",
        input: { email: String, password: String },
        process: [
            "1. Find admin by email",
            "2. Check if admin is active",
            "3. Check if account is locked (lockUntil)",
            "4. Compare password with hashed password",
            "5. If invalid: Admin.failLogin() - increment attempts",
            "6. If valid: generateOTP() - create 6-digit code",
            "7. Save OTP with 10-minute expiry",
            "8. Send OTP to email"
        ],
        output: {
            message: "OTP sent to email",
            email: String,
            otpExpiresIn: "10 minutes"
        }
    },

    step2: {
        endpoint: "POST /api/v1/admin/verify-otp",
        input: { email: String, otp: String },
        process: [
            "1. Find admin by email with verificationCode selected",
            "2. Verify OTP: check code match AND expiry",
            "3. If expired: auto-delete OTP from DB",
            "4. If invalid: return error",
            "5. If valid:",
            "   - clearOTP(): remove OTP fields",
            "   - Generate JWT accessToken (15 min)",
            "   - Generate JWT refreshToken (7 days)",
            "   - setTokens(): store in database",
            "   - Reset loginAttempts = 0",
            "   - Unlock account (lockUntil = undefined)",
            "   - Set lastLogin = now",
            "   - await admin.save()"
        ],
        output: {
            admin: { id, name, email, isSuperAdmin },
            tokens: { accessToken, refreshToken, expiresIn: "15m" },
            cookies: { accessToken: "Set", refreshToken: "Set" }
        },
        cookiesSet: {
            accessToken: {
                value: String,
                httpOnly: true,
                secure: true,
                sameSite: "strict",
                maxAge: "15 minutes"
            },
            refreshToken: {
                value: String,
                httpOnly: true,
                secure: true,
                sameSite: "strict",
                maxAge: "7 days"
            }
        }
    }
};

// ============================================================================
// TOKEN VALIDITY PERIODS
// ============================================================================

const tokenValidity = {
    verificationCode: {
        duration: "10 minutes",
        autoDeletion: "MongoDB TTL index",
        purpose: "Email OTP verification"
    },

    accessToken: {
        duration: "15 minutes",
        storage: "httpOnly Cookie + Database",
        purpose: "Short-lived authentication for API requests",
        regeneration: "Via refresh token endpoint"
    },

    refreshToken: {
        duration: "7 days",
        storage: "httpOnly Cookie + Database",
        purpose: "Long-lived token to refresh access token",
        security: "Stored in DB for revocation capability"
    },

    passwordResetToken: {
        duration: "15 minutes",
        storage: "Database (hashed)",
        purpose: "Password recovery links"
    }
};

// ============================================================================
// FIELD EXCLUSION FROM QUERIES
// ============================================================================

const fieldExclusions = {
    byDefault: [
        "password",
        "verificationCode",
        "accessToken",
        "refreshToken"
    ],
    inToJSON: [
        "password",
        "passwordResetToken",
        "verificationCode",
        "accessToken",
        "refreshToken",
        "sessions"
    ],
    reason: "Security - prevent sensitive fields from being exposed in API responses"
};

// ============================================================================
// EXAMPLE USAGE IN CODE
// ============================================================================

const exampleUsage = `
// LOGIN ENDPOINT
app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    
    // Find admin with password field
    const admin = await Admin.findOne({ email }).select('+password');
    
    // Verify password
    const isValid = await admin.comparePassword(password);
    if (!isValid) {
        await Admin.failLogin(admin._id);
        return res.status(401).send("Invalid password");
    }
    
    // Generate OTP
    const otp = admin.generateOTP();
    await admin.save();
    
    // Send OTP via email
    await sendOtpEmail(email, otp);
    
    res.json({ message: "OTP sent" });
});

// VERIFY OTP ENDPOINT
app.post('/verify-otp', async (req, res) => {
    const { email, otp } = req.body;
    
    const admin = await Admin.findOne({ email }).select('+verificationCode +verificationCodeExpires');
    
    // Verify OTP
    const isValid = admin.verifyOTP(otp);
    if (!isValid) {
        return res.status(401).send("Invalid OTP");
    }
    
    // Generate tokens
    const accessToken = jwt.sign({ id: admin._id }, 'secret', { expiresIn: '15m' });
    const refreshToken = jwt.sign({ id: admin._id }, 'refresh_secret', { expiresIn: '7d' });
    
    // Clear OTP and set tokens
    admin.clearOTP();
    admin.setTokens(accessToken, refreshToken);
    admin.lastLogin = new Date();
    admin.loginAttempts = 0;
    admin.lockUntil = undefined;
    
    await admin.save();
    
    // Set cookies
    res.cookie('accessToken', accessToken, { httpOnly: true, maxAge: 15 * 60 * 1000 });
    res.cookie('refreshToken', refreshToken, { httpOnly: true, maxAge: 7 * 24 * 60 * 60 * 1000 });
    
    res.json({ accessToken, refreshToken });
});

// LOGOUT ENDPOINT
app.post('/logout', async (req, res) => {
    const adminId = req.admin.id;
    
    const admin = await Admin.findByIdAndUpdate(
        adminId,
        {
            $set: {
                accessToken: null,
                refreshToken: null,
                isOtpVerified: false
            }
        }
    );
    
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');
    
    res.json({ message: "Logged out" });
});
`;

module.exports = {
    adminSchemaStructure,
    indexes,
    instanceMethods,
    staticMethods,
    otpAutoDeleteWorkflow,
    loginFlow,
    tokenValidity,
    fieldExclusions,
    exampleUsage
};
