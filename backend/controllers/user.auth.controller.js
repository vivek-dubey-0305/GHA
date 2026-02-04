import { User } from "../models/user.model.js";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { asyncHandler } from "../middlewares/async.middleware.js";
import { errorResponse, successResponse } from "../utils/response.utils.js";
import { convertToMilliseconds } from "../utils/time.utils.js";
import { uploadProfilePicture, deleteProfilePicture, updateProfilePicture } from "../services/cloudinary.service.js";
import logger from "../configs/logger.config.js";

/**
 * User (Student) Authentication Controller
 * Handles registration, login, OTP verification, password reset, and profile management
 */

// @route   POST /api/v1/user/register
// @desc    Register a new user with email and password
// @access  Public
export const registerUser = asyncHandler(async (req, res) => {
    const { firstName, lastName, email, password, confirmPassword, phone } = req.body;

    logger.info(`User registration attempt: ${email}`);

    // Validation
    if (!firstName || !lastName || !email || !password || !confirmPassword) {
        logger.warn(`Registration failed - Missing required fields for: ${email}`);
        return errorResponse(res, 400, "All fields are required");
    }

    if (password !== confirmPassword) {
        logger.warn(`Registration failed - Passwords do not match for: ${email}`);
        return errorResponse(res, 400, "Passwords do not match");
    }

    // Check if user already exists
    const existingUser = await User.findOne({
        $or: [{ email: email.toLowerCase() }, { phone: phone || null }]
    });

    if (existingUser) {
        logger.warn(`Registration failed - User already exists: ${email}`);
        return errorResponse(res, 409, "User with this email or phone already exists");
    }

    try {
        // Create new user
        const user = new User({
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            email: email.toLowerCase(),
            password,
            phone: phone ? phone.trim() : null,
            isActive: true,
            isEmailVerified: false,
        });

        // Generate OTP for email verification
        const otp = user.generateOTP();
        await user.save();

        logger.info(`User registered successfully: ${email}`);

        // Send verification email
        try {
            const { sendOTPEmail } = await import("../services/mail.service.js");
            await sendOTPEmail(user.email, otp, `${user.firstName} ${user.lastName}`, "verify");
            logger.info(`OTP email sent to: ${email}`);
        } catch (emailError) {
            logger.error(`Failed to send registration OTP email: ${emailError.message}`);
            // Clear OTP since email failed
            user.verificationCode = null;
            user.verificationCodeExpires = null;
            await user.save({ validateBeforeSave: false });

            return errorResponse(
                res,
                500,
                "Registration successful but failed to send verification email. Please try again."
            );
        }

        return successResponse(res, 201, "Registration successful. Please verify your email with the OTP sent.", {
            email: user.email,
            message: "Check your email for the 6-digit OTP",
            otpExpiresIn: "10 minutes"
        });
    } catch (error) {
        logger.error(`User registration error: ${error.message}`);
        return errorResponse(res, 500, "Registration failed. Please try again later.");
    }
});

// @route   POST /api/v1/user/login
// @desc    Step 1: Verify credentials and send OTP
// @access  Public
export const loginUser = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    logger.info(`User login attempt: ${email}`);

    // Validation
    if (!email || !password) {
        logger.warn(`Login failed - Missing email or password for: ${email}`);
        return errorResponse(res, 400, "Email and password are required");
    }

    // Find user and select password field
    const user = await User.findOne({ email: email.toLowerCase() }).select("+password");

    if (!user) {
        logger.warn(`Login failed - User not found: ${email}`);
        return errorResponse(res, 401, "Invalid email or password");
    }

    // Check if user is active
    if (!user.isActive) {
        logger.warn(`Login failed - User account inactive: ${email}`);
        return errorResponse(res, 403, "User account is inactive");
    }

    // Check if email is verified
    if (!user.isEmailVerified) {
        logger.warn(`Login failed - Email not verified: ${email}`);
        return errorResponse(res, 403, "Please verify your email before logging in");
    }

    // Check if account is locked
    if (user.isLocked) {
        const lockTimeRemaining = Math.ceil((user.lockUntil - Date.now()) / 60000);
        logger.warn(`Login failed - Account locked for: ${email} (${lockTimeRemaining} min remaining)`);
        return errorResponse(
            res,
            429,
            `Account locked. Try again in ${lockTimeRemaining} minutes`
        );
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
        logger.warn(`Login failed - Invalid password for: ${email}`);
        // Increment failed login attempts
        await User.failLogin(user._id);
        return errorResponse(res, 401, "Invalid email or password");
    }

    // Generate OTP
    const otp = user.generateOTP();
    await user.save({ validateBeforeSave: false });

    // Send OTP via email
    try {
        const { sendOTPEmail } = await import("../services/mail.service.js");
        await sendOTPEmail(user.email, otp, `${user.firstName} ${user.lastName}`, "login");
        logger.info(`Login OTP sent to: ${email}`);
    } catch (error) {
        logger.error(`Failed to send login OTP email to: ${email} - ${error.message}`);

        // Clear the OTP since email failed
        user.verificationCode = null;
        user.verificationCodeExpires = null;
        await user.save({ validateBeforeSave: false });

        return errorResponse(
            res,
            500,
            "Failed to send OTP email. Please try again later."
        );
    }

    return successResponse(res, 200, "OTP sent to email. Verify to login.", {
        email: user.email,
        message: "Check your email for the 6-digit OTP",
        otpExpiresIn: "10 minutes"
    });
});

// @route   POST /api/v1/user/verify-otp
// @desc    Step 2: Verify OTP and set tokens
// @access  Public
export const verifyOtp = asyncHandler(async (req, res) => {
    const { email, otp } = req.body;

    logger.info(`User OTP verification attempt: ${email}`);

    // Validation
    if (!email || !otp) {
        logger.warn(`OTP verification failed - Missing email or OTP for: ${email}`);
        return errorResponse(res, 400, "Email and OTP are required");
    }

    if (otp.length !== 6 || isNaN(otp)) {
        logger.warn(`OTP verification failed - Invalid OTP format for: ${email}`);
        return errorResponse(res, 400, "OTP must be a 6-digit number");
    }

    // Find user with verification code
    const user = await User.findOne({ email: email.toLowerCase() }).select("+verificationCode +verificationCodeExpires +otpAttempts");

    if (!user) {
        logger.warn(`OTP verification failed - User not found: ${email}`);
        return errorResponse(res, 401, "Invalid email");
    }

    // Check OTP attempt limit
    if (user.otpAttempts >= 5) {
        logger.warn(`OTP verification failed - Too many attempts for: ${email}`);
        return errorResponse(res, 429, "Too many OTP attempts. Please request a new OTP.");
    }

    // Check if OTP is set
    if (!user.verificationCode || !user.verificationCodeExpires) {
        logger.warn(`OTP verification failed - OTP not found for: ${email}`);
        return errorResponse(res, 400, "OTP not found. Request a new OTP");
    }

    // Check if OTP has expired
    if (Date.now() > user.verificationCodeExpires) {
        logger.warn(`OTP verification failed - OTP expired for: ${email}`);
        user.verificationCode = null;
        user.verificationCodeExpires = null;
        await user.save({ validateBeforeSave: false });
        return errorResponse(res, 401, "OTP expired. Request a new OTP");
    }

    // Verify OTP
    const isOtpValid = user.verifyOTP(otp);

    if (!isOtpValid) {
        logger.warn(`OTP verification failed - Invalid OTP for: ${email}`);
        user.otpAttempts += 1;
        await user.save({ validateBeforeSave: false });
        return errorResponse(res, 401, "Invalid OTP");
    }

    // Generate access and refresh tokens
    const accessToken = jwt.sign(
        { id: user._id, email: user.email, role: "user" },
        process.env.JWT_ACCESS_TOKEN_SECRET,
        { expiresIn: process.env.JWT_ACCESS_TOKEN_EXPIRES_IN || "15m" }
    );

    const refreshToken = jwt.sign(
        { id: user._id, role: "user" },
        process.env.JWT_REFRESH_TOKEN_SECRET || "your_refresh_secret",
        { expiresIn: process.env.JWT_REFRESH_TOKEN_EXPIRES_IN || "30d" }
    );

    // Clear OTP and add session
    user.clearOTP();
    user.addSession(refreshToken, {
        device: req.headers['user-agent'] || 'Unknown',
        ip: req.ip || req.connection.remoteAddress,
        userAgent: req.headers['user-agent']
    });
    user.lastLogin = Date.now();
    user.lastLoginIP = req.ip || req.connection.remoteAddress;
    user.loginAttempts = 0;
    user.lockUntil = undefined;
    user.isEmailVerified = true; // Mark email as verified on first successful login

    await user.save({ validateBeforeSave: false });

    logger.info(`User logged in successfully: ${email}`);

    // Set cookies
    const accessTokenExpiry = process.env.JWT_ACCESS_TOKEN_EXPIRES_IN || "15m";
    const refreshTokenExpiry = process.env.JWT_REFRESH_TOKEN_EXPIRES_IN || "30d";

    const accessTokenExpiryMs = convertToMilliseconds(accessTokenExpiry);
    const refreshTokenExpiryMs = convertToMilliseconds(refreshTokenExpiry);

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

    // Send welcome email asynchronously
    try {
        const { sendWelcomeEmail } = await import("../services/mail.service.js");
        sendWelcomeEmail(user.email, `${user.firstName} ${user.lastName}`, "student").catch(error => {
            logger.error(`Failed to send welcome email: ${error.message}`);
        });
    } catch (error) {
        logger.error(`Error importing mail service: ${error.message}`);
    }

    return successResponse(res, 200, "Login successful", {
        user: {
            id: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            isActive: user.isActive
        },
        expiresIn: accessTokenExpiry,
        cookies: {
            accessToken: "Set",
            refreshToken: "Set"
        }
    });
});

// @route   POST /api/v1/user/logout
// @desc    Logout and clear tokens
// @access  Private
export const logoutUser = asyncHandler(async (req, res) => {
    const userId = req.user?.id;

    logger.info(`User logout attempt: ${userId}`);

    if (!userId) {
        logger.warn(`Logout failed - User not authenticated`);
        return errorResponse(res, 401, "Unauthorized");
    }

    // Clear all sessions from database
    const user = await User.findById(userId);
    if (user) {
        user.clearAllSessions();
        await user.save({ validateBeforeSave: false });
        logger.info(`User logged out successfully: ${userId}`);
    }

    // Clear cookies
    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");

    return successResponse(res, 200, "Logout successful", {
        message: "All sessions cleared and cookies removed"
    });
});

// @route   POST /api/v1/user/resend-otp
// @desc    Resend OTP if expired or not received
// @access  Public
export const resendOtp = asyncHandler(async (req, res) => {
    const { email } = req.body;

    logger.info(`User OTP resend attempt: ${email}`);

    if (!email) {
        logger.warn(`OTP resend failed - Email not provided`);
        return errorResponse(res, 400, "Email is required");
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
        logger.warn(`OTP resend failed - User not found: ${email}`);
        return errorResponse(res, 401, "Invalid email");
    }

    // Check cooldown (60 seconds)
    if (user.otpLastSentAt && Date.now() - user.otpLastSentAt < 60 * 1000) {
        const waitTime = Math.ceil((60 * 1000 - (Date.now() - user.otpLastSentAt)) / 1000);
        logger.warn(`OTP resend failed - Rate limited for: ${email}`);
        return errorResponse(res, 429, `Please wait ${waitTime} seconds before requesting a new OTP`);
    }

    // Reset OTP attempts on resend
    user.otpAttempts = 0;

    // Generate new OTP
    const otp = user.generateOTP();
    await user.save({ validateBeforeSave: false });

    // Send OTP via email
    try {
        const { sendOTPEmail } = await import("../services/mail.service.js");
        await sendOTPEmail(user.email, otp, `${user.firstName} ${user.lastName}`, "login");
        logger.info(`Resend OTP email sent to: ${email}`);
    } catch (error) {
        logger.error(`Failed to resend OTP email to: ${email} - ${error.message}`);

        user.verificationCode = null;
        user.verificationCodeExpires = null;
        await user.save({ validateBeforeSave: false });

        return errorResponse(res, 500, "Failed to send OTP email. Please try again later.");
    }

    return successResponse(res, 200, "OTP resent to email", {
        email: user.email,
        otpExpiresIn: "10 minutes"
    });
});

// @route   GET /api/v1/user/profile
// @desc    Get current user profile
// @access  Private
export const getUserProfile = asyncHandler(async (req, res) => {
    const userId = req.user?.id;

    logger.info(`User profile fetch attempt: ${userId}`);

    if (!userId) {
        logger.warn(`Profile fetch failed - User not authenticated`);
        return errorResponse(res, 401, "Unauthorized");
    }

    const user = await User.findById(userId);

    if (!user) {
        logger.warn(`Profile fetch failed - User not found: ${userId}`);
        return errorResponse(res, 404, "User not found");
    }

    logger.info(`User profile fetched successfully: ${userId}`);
    return successResponse(res, 200, "User profile retrieved", user);
});

// @route   POST /api/v1/user/upload-profile-picture
// @desc    Upload or update profile picture to Cloudinary
// @access  Private
export const uploadProfilePictureUser = asyncHandler(async (req, res) => {
    const userId = req.user?.id;

    logger.info(`User profile picture upload attempt: ${userId}`);

    if (!userId) {
        logger.warn(`Profile picture upload failed - User not authenticated`);
        return errorResponse(res, 401, "Unauthorized");
    }

    if (!req.file) {
        logger.warn(`Profile picture upload failed - No file provided for: ${userId}`);
        return errorResponse(res, 400, "No file provided");
    }

    try {
        const user = await User.findById(userId);

        if (!user) {
            logger.warn(`Profile picture upload failed - User not found: ${userId}`);
            return errorResponse(res, 404, "User not found");
        }

        const userName = `${user.firstName}_${user.lastName}`;
        const oldPublicId = user.profilePicture ? user.profilePicture.split('/').pop().split('.')[0] : null;

        logger.info(`Uploading profile picture for user: ${userName} (${userId})`);

        // Upload to Cloudinary
        const uploadResult = await updateProfilePicture(
            req.file,
            "student",
            userName,
            oldPublicId
        );

        // Update user profile picture URL
        user.profilePicture = uploadResult.url;
        await user.save({ validateBeforeSave: false });

        logger.info(`Profile picture updated successfully for user: ${userId}`);

        return successResponse(res, 200, "Profile picture uploaded successfully", {
            profilePicture: uploadResult.url,
            cloudinaryId: uploadResult.cloudinaryId,
            size: uploadResult.size
        });
    } catch (error) {
        logger.error(`Profile picture upload error for user ${userId}: ${error.message}`);
        return errorResponse(res, 500, "Failed to upload profile picture. Please try again.");
    }
});

// @route   POST /api/v1/user/forgot-password
// @desc    Request password reset link
// @access  Public
export const forgotPassword = asyncHandler(async (req, res) => {
    const { email } = req.body;

    logger.info(`User forgot password attempt: ${email}`);

    if (!email) {
        logger.warn(`Forgot password failed - Email not provided`);
        return errorResponse(res, 400, "Email is required");
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
        logger.warn(`Forgot password - User not found: ${email}`);
        // Don't reveal if email exists (security best practice)
        return successResponse(res, 200, "If the email exists, a reset link has been sent", {
            email,
            message: "Check your email for the password reset link"
        });
    }

    // Generate password reset token
    const resetToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });

    const resetUrl = `${process.env.FRONTEND_URL || "http://localhost:5173"}/reset?token=${resetToken}`;

    try {
        const { sendPasswordResetEmail } = await import("../services/mail.service.js");
        await sendPasswordResetEmail(
            user.email,
            resetUrl,
            `${user.firstName} ${user.lastName}`,
            process.env.PASSWORD_RESET_EXPIRES_IN || "5m"
        );

        logger.info(`Password reset email sent to: ${email}`);
    } catch (error) {
        logger.error(`Failed to send password reset email to: ${email} - ${error.message}`);

        user.passwordResetToken = null;
        user.passwordResetExpires = null;
        await user.save({ validateBeforeSave: false });

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

// @route   POST /api/v1/user/reset-password
// @desc    Reset password with token
// @access  Public
export const resetPassword = asyncHandler(async (req, res) => {
    const { token, password, confirmPassword } = req.body;

    logger.info(`User password reset attempt`);

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

    const user = await User.findOne({
        passwordResetToken: hashedToken,
        passwordResetExpires: { $gt: Date.now() }
    });

    if (!user) {
        logger.warn(`Password reset failed - Invalid or expired token`);
        return errorResponse(res, 400, "Invalid or expired reset token");
    }

    user.password = password;
    user.passwordResetToken = null;
    user.passwordResetExpires = null;
    user.passwordChangedAt = Date.now();
    user.clearAllSessions();

    await user.save();

    logger.info(`User password reset successfully: ${user.email}`);

    return successResponse(res, 200, "Password reset successful. Please login with your new password", {
        message: "You can now login with your new password",
        redirectTo: "/login"
    });
});

// @route   POST /api/v1/user/verify-reset-token
// @desc    Verify if reset token is valid
// @access  Public
export const verifyResetToken = asyncHandler(async (req, res) => {
    const { token } = req.body;

    logger.info(`User reset token verification attempt`);

    if (!token) {
        logger.warn(`Token verification failed - Reset token not provided`);
        return errorResponse(res, 400, "Reset token is required");
    }

    const hashedToken = crypto
        .createHash("sha256")
        .update(token)
        .digest("hex");

    const user = await User.findOne({
        passwordResetToken: hashedToken,
        passwordResetExpires: { $gt: Date.now() }
    });

    if (!user) {
        logger.warn(`Token verification failed - Invalid or expired token`);
        return errorResponse(res, 400, "Invalid or expired reset token");
    }

    const timeRemaining = user.passwordResetExpires - Date.now();
    const minutesRemaining = Math.ceil(timeRemaining / 60000);

    logger.info(`Reset token verified successfully`);

    return successResponse(res, 200, "Reset token is valid", {
        valid: true,
        expiresIn: `${minutesRemaining} minutes`,
        message: "You can now reset your password"
    });
});

// @route   POST /api/v1/user/refresh-token
// @desc    Refresh access token using refresh token
// @access  Private
export const refreshAccessToken = asyncHandler(async (req, res) => {
    const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;

    logger.info(`User token refresh attempt`);

    if (!refreshToken) {
        logger.warn(`Token refresh failed - Refresh token not found`);
        return errorResponse(res, 401, "Refresh token not found");
    }

    try {
        const decoded = jwt.verify(
            refreshToken,
            process.env.JWT_REFRESH_TOKEN_SECRET || "your_refresh_secret"
        );

        const user = await User.findById(decoded.id);

        if (!user) {
            logger.warn(`Token refresh failed - User not found: ${decoded.id}`);
            return errorResponse(res, 401, "User not found");
        }

        if (!user.verifyAndRemoveRefreshToken(refreshToken)) {
            logger.warn(`Token refresh failed - Invalid refresh token for user: ${decoded.id}`);
            return errorResponse(res, 401, "Invalid refresh token");
        }

        // Generate new tokens
        const newAccessToken = jwt.sign(
            { id: user._id, email: user.email, role: "user" },
            process.env.JWT_ACCESS_TOKEN_SECRET,
            { expiresIn: process.env.JWT_ACCESS_TOKEN_EXPIRES_IN || "15m" }
        );

        const newRefreshToken = jwt.sign(
            { id: user._id, role: "user" },
            process.env.JWT_REFRESH_TOKEN_SECRET,
            { expiresIn: process.env.JWT_REFRESH_TOKEN_EXPIRES_IN || "30d" }
        );

        // Add new session
        const sessionHash = user.hashToken(newRefreshToken);
        const maxSessions = 5;

        const updatedUser = await User.findByIdAndUpdate(
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

        if (!updatedUser) {
            logger.warn(`Token refresh failed - Could not update user: ${decoded.id}`);
            return errorResponse(res, 401, "Failed to update user");
        }

        // Set new cookies
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

        logger.info(`User token refreshed successfully: ${decoded.id}`);

        return successResponse(res, 200, "Tokens refreshed", {
            user: {
                id: updatedUser._id,
                firstName: updatedUser.firstName,
                lastName: updatedUser.lastName,
                email: updatedUser.email,
                isActive: updatedUser.isActive
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
