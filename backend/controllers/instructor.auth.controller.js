import { Instructor } from "../models/instructor.model.js";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { asyncHandler } from "../middlewares/async.middleware.js";
import { errorResponse, successResponse } from "../utils/response.utils.js";
import { convertToMilliseconds } from "../utils/time.utils.js";
import logger from "../configs/logger.config.js";

/**
 * Instructor Authentication Controller
 * Handles registration, login, OTP verification & password reset
 */

// @route   POST /api/v1/instructor/register
// @desc    Register a new instructor with email and password
// @access  Public
export const registerInstructor = asyncHandler(async (req, res) => {
    const { firstName, lastName, email, password, confirmPassword, specialization, bio } = req.body;

    logger.info(`Instructor registration attempt: ${email}`);
    logger.info(`Received fields: firstName=${firstName ? 'YES' : 'NO'}, lastName=${lastName ? 'YES' : 'NO'}, email=${email ? 'YES' : 'NO'}, password=${password ? 'YES' : 'NO'}, confirmPassword=${confirmPassword ? 'YES' : 'NO'}, specialization=${specialization ? 'YES' : 'NO'}, bio=${bio ? 'YES' : 'NO'}`);

    // Validation
    if (!firstName || !lastName || !email || !password || !confirmPassword) {
        const missingFields = [];
        if (!firstName) missingFields.push('firstName');
        if (!lastName) missingFields.push('lastName');
        if (!email) missingFields.push('email');
        if (!password) missingFields.push('password');
        if (!confirmPassword) missingFields.push('confirmPassword');
        logger.warn(`Registration failed - Missing required fields: [${missingFields.join(', ')}] for: ${email}`);
        return errorResponse(res, 400, `Missing required fields: ${missingFields.join(', ')}`);
    }

    if (password !== confirmPassword) {
        logger.warn(`Registration failed - Passwords do not match for: ${email}`);
        return errorResponse(res, 400, "Passwords do not match");
    }

    // Check if instructor already exists
    const existingInstructor = await Instructor.findOne({
        $or: [{ email: email.toLowerCase() }]
    });

    if (existingInstructor) {
        logger.warn(`Registration failed - Instructor already exists: ${email}`);
        return errorResponse(res, 409, "Instructor with this email or phone already exists");
    }

    try {
        // Process specialization - convert to lowercase with underscores if provided
        let processedSpecialization = [];
        if (specialization) {
            if (Array.isArray(specialization)) {
                processedSpecialization = specialization.map(s => 
                    s.toLowerCase().replace(/\s+/g, '_')
                );
            } else if (typeof specialization === 'string') {
                // If it's a comma-separated string or single value
                processedSpecialization = specialization
                    .split(',')
                    .map(s => s.trim().toLowerCase().replace(/\s+/g, '_'))
                    .filter(s => s.length > 0);
            }
        }

        // Create new instructor
        const instructor = new Instructor({
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            email: email.toLowerCase(),
            password,
            specialization: processedSpecialization.length > 0 ? processedSpecialization : undefined,
            bio: bio ? bio.trim() : undefined,
            isActive: true,
            isEmailVerified: false,
        });

        // Generate OTP for email verification
        const otp = instructor.generateOTP();
        await instructor.save();

        logger.info(`Instructor registered successfully: ${email}`);

        // Send verification email
        try {
            const { sendOTPEmail } = await import("../services/mail.service.js");
            await sendOTPEmail(instructor.email, otp, `${instructor.firstName} ${instructor.lastName}`, "verify");
            logger.info(`OTP email sent to: ${email}`);
        } catch (emailError) {
            logger.error(`Failed to send registration OTP email: ${emailError.message}`);
            instructor.verificationCode = null;
            instructor.verificationCodeExpires = null;
            await instructor.save({ validateBeforeSave: false });

            return errorResponse(
                res,
                500,
                "Registration successful but failed to send verification email. Please try again."
            );
        }

        return successResponse(res, 201, "Registration successful. Please verify your email with the OTP sent.", {
            email: instructor.email,
            message: "Check your email for the 6-digit OTP",
            otpExpiresIn: "10 minutes"
        });
    } catch (error) {
        logger.error(`Instructor registration error: ${error.message}`);
        return errorResponse(res, 500, "Registration failed. Please try again later.");
    }
});

// @route   POST /api/v1/instructor/login
// @desc    Step 1: Verify credentials and send OTP
// @access  Public
export const loginInstructor = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    logger.info(`Instructor login attempt: ${email}`);

    // Validation
    if (!email || !password) {
        logger.warn(`Login failed - Missing email or password for: ${email}`);
        return errorResponse(res, 400, "Email and password are required");
    }

    // Find instructor and select password field
    const instructor = await Instructor.findOne({ email: email.toLowerCase() }).select("+password");

    if (!instructor) {
        logger.warn(`Login failed - Instructor not found: ${email}`);
        return errorResponse(res, 401, "Invalid email or password");
    }

    // Check if instructor is active
    if (!instructor.isActive) {
        logger.warn(`Login failed - Instructor account inactive: ${email}`);
        return errorResponse(res, 403, "Instructor account is inactive");
    }

    // Check if email is verified
    if (!instructor.isEmailVerified) {
        logger.warn(`Login failed - Email not verified: ${email}`);
        return errorResponse(res, 403, "Please verify your email before logging in");
    }

    // Check if instructor is suspended
    if (instructor.isSuspended) {
        logger.warn(`Login failed - Instructor suspended: ${email}`);
        return errorResponse(res, 403, `Instructor account is suspended. Reason: ${instructor.suspensionReason || "Not specified"}`);
    }

    // Check if account is locked
    if (instructor.isLocked) {
        const lockTimeRemaining = Math.ceil((instructor.lockUntil - Date.now()) / 60000);
        logger.warn(`Login failed - Account locked for: ${email} (${lockTimeRemaining} min remaining)`);
        return errorResponse(
            res,
            429,
            `Account locked. Try again in ${lockTimeRemaining} minutes`
        );
    }

    // Verify password
    const isPasswordValid = await instructor.comparePassword(password);

    if (!isPasswordValid) {
        logger.warn(`Login failed - Invalid password for: ${email}`);
        await Instructor.failLogin(instructor._id);
        const updatedInstructor = await Instructor.findById(instructor._id);
        const remainingAttempts = 5 - updatedInstructor.loginAttempts;
        logger.warn(`Login attempt ${updatedInstructor.loginAttempts}/5 for ${email}. ${remainingAttempts} attempts remaining.`);
        
        if (remainingAttempts <= 0) {
            logger.warn(`Account locked after 5 failed attempts: ${email}`);
            return errorResponse(res, 429, "Account locked due to too many failed login attempts. Try again in 2 hours.");
        }
        
        return errorResponse(res, 401, `Invalid email or password. Attempts remaining: ${remainingAttempts}`);
    }

    // Generate OTP
    const otp = instructor.generateOTP();
    await instructor.save({ validateBeforeSave: false });

    // Send OTP via email
    try {
        const { sendOTPEmail } = await import("../services/mail.service.js");
        await sendOTPEmail(instructor.email, otp, `${instructor.firstName} ${instructor.lastName}`, "login");
        logger.info(`Login OTP sent to: ${email}`);
    } catch (error) {
        logger.error(`Failed to send login OTP email to: ${email} - ${error.message}`);

        instructor.verificationCode = null;
        instructor.verificationCodeExpires = null;
        await instructor.save({ validateBeforeSave: false });

        return errorResponse(
            res,
            500,
            "Failed to send OTP email. Please try again later."
        );
    }

    return successResponse(res, 200, "OTP sent to email. Verify to login.", {
        email: instructor.email,
        message: "Check your email for the 6-digit OTP",
        otpExpiresIn: "10 minutes"
    });
});

// @route   POST /api/v1/instructor/verify-otp
// @desc    Step 2: Verify OTP and set tokens
// @access  Public
export const verifyOtp = asyncHandler(async (req, res) => {
    const { email, otp } = req.body;

    logger.info(`Instructor OTP verification attempt: ${email}`);

    // Validation
    if (!email || !otp) {
        logger.warn(`OTP verification failed - Missing email or OTP for: ${email}`);
        return errorResponse(res, 400, "Email and OTP are required");
    }

    if (otp.length !== 6 || isNaN(otp)) {
        logger.warn(`OTP verification failed - Invalid OTP format for: ${email}`);
        return errorResponse(res, 400, "OTP must be a 6-digit number");
    }

    const instructor = await Instructor.findOne({ email: email.toLowerCase() }).select("+verificationCode +verificationCodeExpires +otpAttempts");

    if (!instructor) {
        logger.warn(`OTP verification failed - Instructor not found: ${email}`);
        return errorResponse(res, 401, "Invalid email");
    }

    if (instructor.otpAttempts >= 5) {
        logger.warn(`OTP verification failed - Too many attempts for: ${email}`);
        return errorResponse(res, 429, "Too many OTP attempts. Please request a new OTP.");
    }

    if (!instructor.verificationCode || !instructor.verificationCodeExpires) {
        logger.warn(`OTP verification failed - OTP not found for: ${email}`);
        return errorResponse(res, 400, "OTP not found. Request a new OTP");
    }

    if (Date.now() > instructor.verificationCodeExpires) {
        logger.warn(`OTP verification failed - OTP expired for: ${email}`);
        instructor.verificationCode = null;
        instructor.verificationCodeExpires = null;
        await instructor.save({ validateBeforeSave: false });
        return errorResponse(res, 401, "OTP expired. Request a new OTP");
    }

    const isOtpValid = instructor.verifyOTP(otp);

    if (!isOtpValid) {
        logger.warn(`OTP verification failed - Invalid OTP for: ${email}`);
        instructor.otpAttempts += 1;
        await instructor.save({ validateBeforeSave: false });
        return errorResponse(res, 401, "Invalid OTP");
    }

    // Generate access and refresh tokens
    const accessToken = jwt.sign(
        { id: instructor._id, email: instructor.email, role: "instructor" },
        process.env.JWT_ACCESS_TOKEN_SECRET,
        { expiresIn: process.env.JWT_ACCESS_TOKEN_EXPIRES_IN || "15m" }
    );

    const refreshToken = jwt.sign(
        { id: instructor._id, role: "instructor" },
        process.env.JWT_REFRESH_TOKEN_SECRET || "your_refresh_secret",
        { expiresIn: process.env.JWT_REFRESH_TOKEN_EXPIRES_IN || "30d" }
    );

    // Clear OTP and add session
    instructor.clearOTP();
    instructor.addSession(refreshToken, {
        device: req.headers['user-agent'] || 'Unknown',
        ip: req.ip || req.connection.remoteAddress,
        userAgent: req.headers['user-agent']
    });
    instructor.lastLogin = Date.now();
    instructor.lastLoginIP = req.ip || req.connection.remoteAddress;
    instructor.loginAttempts = 0;
    instructor.lockUntil = undefined;
    instructor.isEmailVerified = true;

    await instructor.save({ validateBeforeSave: false });

    logger.info(`Instructor logged in successfully: ${email}`);

    // Set cookies
    const accessTokenExpiry = process.env.JWT_ACCESS_TOKEN_EXPIRES_IN || "15m";
    const refreshTokenExpiry = process.env.JWT_REFRESH_TOKEN_EXPIRES_IN || "30d";

    const accessTokenExpiryMs = convertToMilliseconds(accessTokenExpiry);
    const refreshTokenExpiryMs = convertToMilliseconds(refreshTokenExpiry);

    logger.info(`Setting cookies for instructor: ${email} (accessToken expires in ${accessTokenExpiry}, refreshToken expires in ${refreshTokenExpiry})`);

    res.cookie("accessToken", accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
        maxAge: accessTokenExpiryMs
    });

    res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
        maxAge: refreshTokenExpiryMs
    });

    logger.info(`Cookies set successfully for: ${email}`);

    // Send welcome email asynchronously
    try {
        const { sendWelcomeEmail } = await import("../services/mail.service.js");
        sendWelcomeEmail(instructor.email, `${instructor.firstName} ${instructor.lastName}`, "instructor").catch(error => {
            logger.error(`Failed to send welcome email: ${error.message}`);
        });
    } catch (error) {
        logger.error(`Error importing mail service: ${error.message}`);
    }

    return successResponse(res, 200, "Login successful", {
        instructor: {
            id: instructor._id,
            firstName: instructor.firstName,
            lastName: instructor.lastName,
            email: instructor.email,
            isActive: instructor.isActive
        },
        expiresIn: accessTokenExpiry,
        cookies: {
            accessToken: "Set",
            refreshToken: "Set"
        }
    });
});

// @route   POST /api/v1/instructor/logout
// @desc    Logout and clear tokens
// @access  Private
export const logoutInstructor = asyncHandler(async (req, res) => {
    const instructorId = req.instructor?.id;

    logger.info(`Instructor logout attempt: ${instructorId}`);

    if (!instructorId) {
        logger.warn(`Logout failed - Instructor not authenticated`);
        return errorResponse(res, 401, "Unauthorized");
    }

    const instructor = await Instructor.findById(instructorId);
    if (instructor) {
        instructor.clearAllSessions();
        await instructor.save({ validateBeforeSave: false });
        logger.info(`Instructor logged out successfully: ${instructorId}`);
    }

    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");

    return successResponse(res, 200, "Logout successful", {
        message: "All sessions cleared and cookies removed"
    });
});

// @route   POST /api/v1/instructor/resend-otp
// @desc    Resend OTP if expired or not received
// @access  Public
export const resendOtp = asyncHandler(async (req, res) => {
    const { email } = req.body;

    logger.info(`Instructor OTP resend attempt: ${email}`);

    if (!email) {
        logger.warn(`OTP resend failed - Email not provided`);
        return errorResponse(res, 400, "Email is required");
    }

    const instructor = await Instructor.findOne({ email: email.toLowerCase() });

    if (!instructor) {
        logger.warn(`OTP resend failed - Instructor not found: ${email}`);
        return errorResponse(res, 401, "Invalid email");
    }

    if (instructor.otpLastSentAt && Date.now() - instructor.otpLastSentAt < 60 * 1000) {
        const waitTime = Math.ceil((60 * 1000 - (Date.now() - instructor.otpLastSentAt)) / 1000);
        logger.warn(`OTP resend failed - Rate limited for: ${email}`);
        return errorResponse(res, 429, `Please wait ${waitTime} seconds before requesting a new OTP`);
    }

    instructor.otpAttempts = 0;

    const otp = instructor.generateOTP();
    await instructor.save({ validateBeforeSave: false });

    try {
        const { sendOTPEmail } = await import("../services/mail.service.js");
        await sendOTPEmail(instructor.email, otp, `${instructor.firstName} ${instructor.lastName}`, "login");
        logger.info(`Resend OTP email sent to: ${email}`);
    } catch (error) {
        logger.error(`Failed to resend OTP email to: ${email} - ${error.message}`);

        instructor.verificationCode = null;
        instructor.verificationCodeExpires = null;
        await instructor.save({ validateBeforeSave: false });

        return errorResponse(res, 500, "Failed to send OTP email. Please try again later.");
    }

    return successResponse(res, 200, "OTP resent to email", {
        email: instructor.email,
        otpExpiresIn: "10 minutes"
    });
});

// @route   GET /api/v1/instructor/profile
// @desc    Get current instructor profile
// @access  Private
export const getInstructorProfile = asyncHandler(async (req, res) => {
    const instructorId = req.instructor?.id;

    logger.info(`Instructor profile fetch attempt: ${instructorId}`);

    if (!instructorId) {
        logger.warn(`Profile fetch failed - Instructor not authenticated`);
        return errorResponse(res, 401, "Unauthorized");
    }

    const instructor = await Instructor.findById(instructorId);

    if (!instructor) {
        logger.warn(`Profile fetch failed - Instructor not found: ${instructorId}`);
        return errorResponse(res, 404, "Instructor not found");
    }

    logger.info(`Instructor profile fetched successfully: ${instructorId}`);
    return successResponse(res, 200, "Instructor profile retrieved", instructor);
});


// @route   POST /api/v1/instructor/forgot-password
// @desc    Request password reset link
// @access  Public
export const forgotPassword = asyncHandler(async (req, res) => {
    const { email } = req.body;

    logger.info(`Instructor forgot password attempt: ${email}`);

    if (!email) {
        logger.warn(`Forgot password failed - Email not provided`);
        return errorResponse(res, 400, "Email is required");
    }

    const instructor = await Instructor.findOne({ email: email.toLowerCase() });

    if (!instructor) {
        logger.warn(`Forgot password - Instructor not found: ${email}`);
        return successResponse(res, 200, "If the email exists, a reset link has been sent", {
            email,
            message: "Check your email for the password reset link"
        });
    }

    const resetToken = instructor.createPasswordResetToken();
    await instructor.save({ validateBeforeSave: false });

    const resetUrl = `${process.env.FRONTEND_URL || "http://localhost:5173"}/instructor/reset?token=${resetToken}`;

    try {
        const { sendPasswordResetEmail } = await import("../services/mail.service.js");
        await sendPasswordResetEmail(
            instructor.email,
            resetUrl,
            `${instructor.firstName} ${instructor.lastName}`,
            process.env.PASSWORD_RESET_EXPIRES_IN || "5m"
        );

        logger.info(`Password reset email sent to: ${email}`);
    } catch (error) {
        logger.error(`Failed to send password reset email to: ${email} - ${error.message}`);

        instructor.passwordResetToken = null;
        instructor.passwordResetExpires = null;
        await instructor.save({ validateBeforeSave: false });

        return errorResponse(
            res,
            500,
            "Failed to send reset email. Please try again later."
        );
    }

    return successResponse(res, 200, "If the email exists, a reset link has been sent", {
        email,
        message: "Check your email for the password reset link",
        expiresIn: process.env.PASSWORD_RESET_EXPIRES_IN || "5 minutes"
    });
});

// @route   POST /api/v1/instructor/reset-password
// @desc    Reset password with token
// @access  Public
export const resetPassword = asyncHandler(async (req, res) => {
    const { token, password, confirmPassword } = req.body;

    logger.info(`Instructor password reset attempt`);

    if (!token) {
        logger.warn(`Password reset failed - Reset token not provided`);
        return errorResponse(res, 400, "Reset token is required");
    }

    if (!password || !confirmPassword) {
        logger.warn(`Password reset failed - Password fields missing`);
        return errorResponse(res, 400, "Password and confirmation are required");
    }

    if (password !== confirmPassword) {
        logger.warn(`Password reset failed - Passwords do not match`);
        return errorResponse(res, 400, "Passwords do not match");
    }

    const hashedToken = crypto
        .createHash("sha256")
        .update(token)
        .digest("hex");

    const instructor = await Instructor.findOne({
        passwordResetToken: hashedToken,
        passwordResetExpires: { $gt: Date.now() }
    });

    if (!instructor) {
        logger.warn(`Password reset failed - Invalid or expired token`);
        return errorResponse(res, 400, "Invalid or expired reset token");
    }

    instructor.password = password;
    instructor.passwordResetToken = null;
    instructor.passwordResetExpires = null;
    instructor.passwordChangedAt = Date.now();
    instructor.clearAllSessions();

    await instructor.save();

    logger.info(`Instructor password reset successfully: ${instructor.email}`);

    return successResponse(res, 200, "Password reset successful. Please login with your new password", {
        message: "You can now login with your new password",
        redirectTo: "/instructor/login"
    });
});

// @route   POST /api/v1/instructor/verify-reset-token
// @desc    Verify if reset token is valid
// @access  Public
export const verifyResetToken = asyncHandler(async (req, res) => {
    const { token } = req.body;

    logger.info(`Instructor reset token verification attempt`);

    if (!token) {
        logger.warn(`Token verification failed - Reset token not provided`);
        return errorResponse(res, 400, "Reset token is required");
    }

    const hashedToken = crypto
        .createHash("sha256")
        .update(token)
        .digest("hex");

    const instructor = await Instructor.findOne({
        passwordResetToken: hashedToken,
        passwordResetExpires: { $gt: Date.now() }
    });

    if (!instructor) {
        logger.warn(`Token verification failed - Invalid or expired token`);
        return errorResponse(res, 400, "Invalid or expired reset token");
    }

    const timeRemaining = instructor.passwordResetExpires - Date.now();
    const minutesRemaining = Math.ceil(timeRemaining / 60000);

    logger.info(`Reset token verified successfully`);

    return successResponse(res, 200, "Reset token is valid", {
        valid: true,
        expiresIn: `${minutesRemaining} minutes`,
        message: "You can now reset your password"
    });
});

// @route   POST /api/v1/instructor/refresh-token
// @desc    Refresh access token using refresh token
// @access  Private
export const refreshAccessToken = asyncHandler(async (req, res) => {
    const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;

    logger.info(`Instructor token refresh attempt`);

    if (!refreshToken) {
        logger.warn(`Token refresh failed - Refresh token not found`);
        return errorResponse(res, 401, "Refresh token not found");
    }

    try {
        const decoded = jwt.verify(
            refreshToken,
            process.env.JWT_REFRESH_TOKEN_SECRET || "your_refresh_secret"
        );

        const instructor = await Instructor.findById(decoded.id);

        if (!instructor) {
            logger.warn(`Token refresh failed - Instructor not found: ${decoded.id}`);
            return errorResponse(res, 401, "Instructor not found");
        }

        if (!instructor.verifyAndRemoveRefreshToken(refreshToken)) {
            logger.warn(`Token refresh failed - Invalid refresh token for instructor: ${decoded.id}`);
            return errorResponse(res, 401, "Invalid refresh token");
        }

        const newAccessToken = jwt.sign(
            { id: instructor._id, email: instructor.email, role: "instructor" },
            process.env.JWT_ACCESS_TOKEN_SECRET,
            { expiresIn: process.env.JWT_ACCESS_TOKEN_EXPIRES_IN || "15m" }
        );

        const newRefreshToken = jwt.sign(
            { id: instructor._id, role: "instructor" },
            process.env.JWT_REFRESH_TOKEN_SECRET,
            { expiresIn: process.env.JWT_REFRESH_TOKEN_EXPIRES_IN || "30d" }
        );

        const sessionHash = instructor.hashToken(newRefreshToken);
        const maxSessions = 5;

        const updatedInstructor = await Instructor.findByIdAndUpdate(
            decoded.id,
            {
                $push: {
                    sessions: {
                        $each: [{
                            refreshTokenHash: sessionHash,
                            device: req.headers['user-agent'] || 'Unknown',
                            ip: req.ip || req.connection.remoteAddress,
                            userAgent: req.headers['user-agent'],
                            lastActive: new Date()
                        }],
                        $slice: -maxSessions
                    }
                }
            },
            { new: true, runValidators: false }
        );

        if (!updatedInstructor) {
            logger.warn(`Token refresh failed - Could not update instructor: ${decoded.id}`);
            return errorResponse(res, 401, "Failed to update instructor");
        }

        res.cookie("accessToken", newAccessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
            maxAge: convertToMilliseconds(process.env.JWT_ACCESS_TOKEN_EXPIRES_IN || "15m")
        });

        res.cookie("refreshToken", newRefreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
            maxAge: convertToMilliseconds(process.env.JWT_REFRESH_TOKEN_EXPIRES_IN || "30d")
        });

        logger.info(`Instructor token refreshed successfully: ${decoded.id}`);

        return successResponse(res, 200, "Tokens refreshed", {
            instructor: {
                id: updatedInstructor._id,
                firstName: updatedInstructor.firstName,
                lastName: updatedInstructor.lastName,
                email: updatedInstructor.email,
                isActive: updatedInstructor.isActive
            },
            expiresIn: process.env.JWT_ACCESS_TOKEN_EXPIRES_IN || "15m",
            cookies: {
                accessToken: "Set",
                refreshToken: "Set"
            }
        });
    } catch (error) {
        logger.error(`Token refresh error: ${error.message}`);
        return errorResponse(res, 401, "Invalid or expired refresh token");
    }
});

// @route   GET /api/v1/instructor/sessions
// @desc    Get all active instructor sessions
// @access  Private
export const getInstructorSessions = asyncHandler(async (req, res) => {
    const instructor = await Instructor.findById(req.instructor.id).select("sessions");

    if (!instructor) {
        return errorResponse(res, 404, "Instructor not found");
    }

    return successResponse(res, 200, "Active sessions retrieved", {
        sessions: instructor.sessions.map(s => ({
            id: s._id,
            device: s.device || "Unknown Device",
            ip: s.ip || "Unknown IP",
            lastActive: s.lastActive || new Date(),
            createdAt: s.createdAt
        }))
    });
});

// @route   POST /api/v1/instructor/logout-session
// @desc    Logout from a specific session
// @access  Private
export const logoutSession = asyncHandler(async (req, res) => {
    const { sessionId } = req.body;

    if (!sessionId) {
        return errorResponse(res, 400, "Session ID is required");
    }

    const instructor = await Instructor.findById(req.instructor.id);

    if (!instructor) {
        return errorResponse(res, 404, "Instructor not found");
    }

    const sessionRemoved = instructor.sessions.findByIdAndDelete(sessionId);

    if (!sessionRemoved) {
        return errorResponse(res, 404, "Session not found");
    }

    await instructor.save({ validateBeforeSave: false });

    logger.info(`Session revoked for instructor: ${req.instructor.id}`);

    return successResponse(res, 200, "Session revoked successfully");
});

// @route   POST /api/v1/instructor/logout-all-sessions
// @desc    Logout from all sessions except current one
// @access  Private
export const logoutAllSessions = asyncHandler(async (req, res) => {
    const currentRefreshToken = req.cookies?.refreshToken || req.body?.refreshToken;

    const instructor = await Instructor.findById(req.instructor.id);

    if (!instructor) {
        return errorResponse(res, 404, "Instructor not found");
    }

    const currentSessionHash = instructor.hashToken(currentRefreshToken);
    const sessionsBeforeRemoval = instructor.sessions.length;

    instructor.sessions = instructor.sessions.filter(
        s => s.refreshTokenHash === currentSessionHash
    );

    await instructor.save({ validateBeforeSave: false });

    logger.info(`All other sessions logged out for instructor: ${req.instructor.id}`);

    return successResponse(res, 200, "All other sessions logged out", {
        sessionsRevoked: sessionsBeforeRemoval - instructor.sessions.length,
        sessionsActive: instructor.sessions.length
    });
});

// @route   POST /api/v1/instructor/change-password
// @desc    Change password while logged in
// @access  Private
export const changePassword = asyncHandler(async (req, res) => {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    logger.info(`Password change attempt for instructor: ${req.instructor.id}`);

    if (!currentPassword || !newPassword || !confirmPassword) {
        logger.warn(`Password change failed - Missing required fields for instructor: ${req.instructor.id}`);
        return errorResponse(res, 400, "All password fields are required");
    }

    if (newPassword !== confirmPassword) {
        logger.warn(`Password change failed - New passwords do not match for instructor: ${req.instructor.id}`);
        return errorResponse(res, 400, "New passwords do not match");
    }

    if (currentPassword === newPassword) {
        logger.warn(`Password change failed - New password same as current for instructor: ${req.instructor.id}`);
        return errorResponse(res, 400, "New password must be different from current password");
    }

    const instructor = await Instructor.findById(req.instructor.id).select("+password");

    if (!instructor) {
        return errorResponse(res, 404, "Instructor not found");
    }

    const isPasswordValid = await instructor.comparePassword(currentPassword);

    if (!isPasswordValid) {
        logger.warn(`Password change failed - Incorrect current password for instructor: ${req.instructor.id}`);
        return errorResponse(res, 401, "Current password is incorrect");
    }

    instructor.password = newPassword;
    instructor.passwordChangedAt = Date.now();
    instructor.clearAllSessions();

    await instructor.save();

    logger.info(`Password changed successfully for instructor: ${req.instructor.id}`);

    return successResponse(res, 200, "Password changed successfully. Please login again.");
});
