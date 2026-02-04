import { Admin } from "../models/admin.model.js";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { asyncHandler } from "../middlewares/async.middleware.js";
import { errorResponse, successResponse } from "../utils/response.utils.js";
import { convertToMilliseconds } from "../utils/time.utils.js";

// @route   POST /api/v1/admin/login
// @desc    Step 1: Verify credentials and send OTP
// @access  Public
export const loginAdmin = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
        return errorResponse(res, 400, "Email and password are required");
    }

    // Find admin and select password field
    const admin = await Admin.findOne({ email: email.toLowerCase() }).select("+password");
console.log("Adming founr : ", admin)
    if (!admin) {
        return errorResponse(res, 401, "Invalid email or password");
    }

    // Check if admin is active
    if (!admin.isActive) {
        return errorResponse(res, 403, "Admin account is inactive");
    }

    // Check if account is locked
    if (admin.isLocked) {
        const lockTimeRemaining = Math.ceil((admin.lockUntil - Date.now()) / 60000);
        return errorResponse(
            res,
            429,
            `Account locked. Try again in ${lockTimeRemaining} minutes`
        );
    }

    // Verify password
    const isPasswordValid = await admin.comparePassword(password);

    if (!isPasswordValid) {
        // Increment failed login attempts
        await Admin.failLogin(admin._id);
        return errorResponse(res, 401, "Invalid email or password");
    }

    // Generate OTP
    const otp = admin.generateOTP();
    await admin.save({ validateBeforeSave: false });

    // Send OTP via email
    try {
        const { sendOTPEmail } = await import("../services/mail.service.js");

        await sendOTPEmail(admin.email, otp, admin.name, "login");

        console.log(`📧 OTP sent successfully to ${admin.email}`);
    } catch (error) {
        console.error("Mail sending failed:", error.message);

        // Clear the OTP since email failed
        admin.verificationCode = null;
        admin.verificationCodeExpires = null;
        await admin.save({ validateBeforeSave: false });

        return errorResponse(
            res,
            500,
            "Failed to send OTP email. Please try again later."
        );
    }
 

    return successResponse(res, 200, "OTP sent to email. Verify to login.", {
        email: admin.email,
        message: "Check your email for the 6-digit OTP",
        otpExpiresIn: "10 minutes"
    });
});

// @route   POST /api/v1/admin/verify-otp
// @desc    Step 2: Verify OTP and set tokens
// @access  Public
export const verifyOtp = asyncHandler(async (req, res) => {
    const { email, otp } = req.body;

    // Validation
    if (!email || !otp) {
        return errorResponse(res, 400, "Email and OTP are required");
    }

    if (otp.length !== 6 || isNaN(otp)) {
        return errorResponse(res, 400, "OTP must be a 6-digit number");
    }

    // Find admin with verification code
    const admin = await Admin.findOne({ email: email.toLowerCase() }).select("+verificationCode +verificationCodeExpires +otpAttempts");

    if (!admin) {
        return errorResponse(res, 401, "Invalid email");
    }

    // Check OTP attempt limit
    if (admin.otpAttempts >= 5) {
        return errorResponse(res, 429, "Too many OTP attempts. Please request a new OTP.");
    }

    // Check if OTP is set
    if (!admin.verificationCode || !admin.verificationCodeExpires) {
        return errorResponse(res, 400, "OTP not found. Request a new OTP");
    }

    // Check if OTP has expired first
    if (Date.now() > admin.verificationCodeExpires) {
        // Clean up expired OTP
        admin.verificationCode = null;
        admin.verificationCodeExpires = null;
        await admin.save({ validateBeforeSave: false });
        return errorResponse(res, 401, "OTP expired. Request a new OTP");
    }

    // Verify OTP (now pure function)
    const isOtpValid = admin.verifyOTP(otp);

    if (!isOtpValid) {
        // Increment attempts
        admin.otpAttempts += 1;
        await admin.save({ validateBeforeSave: false });
        return errorResponse(res, 401, "Invalid OTP");
    }

    // Generate access and refresh tokens
    const accessToken = jwt.sign(
        { id: admin._id, email: admin.email, role: "admin" },
        process.env.JWT_ACCESS_TOKEN_SECRET,
        { expiresIn: process.env.JWT_ACCESS_TOKEN_EXPIRES_IN || "15m" }
    );

    const refreshToken = jwt.sign(
        { id: admin._id, role: "admin" },
        process.env.JWT_REFRESH_TOKEN_SECRET || "your_refresh_secret",
        { expiresIn: process.env.JWT_REFRESH_TOKEN_EXPIRES_IN || "30d" }
    );

    // Clear OTP and add session
    admin.clearOTP();
    admin.addSession(refreshToken, {
        device: req.headers['user-agent'] || 'Unknown',
        ip: req.ip || req.connection.remoteAddress,
        userAgent: req.headers['user-agent']
    });
    admin.lastLogin = Date.now();
    admin.loginAttempts = 0;
    admin.lockUntil = undefined;

    await admin.save({ validateBeforeSave: false });

    // Set cookies
    const accessTokenExpiry = process.env.JWT_ACCESS_TOKEN_EXPIRES_IN || "15m";
    const refreshTokenExpiry = process.env.JWT_REFRESH_TOKEN_EXPIRES_IN || "30d";

    // Convert expiry strings to milliseconds for cookies
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

    // Send welcome email asynchronously (don't block response)
    try {
        const { sendWelcomeEmail } = await import("../services/mail.service.js");
        sendWelcomeEmail(admin.email, admin.name, "admin").catch(error => {
            console.error("Failed to send welcome email:", error.message);
        });
    } catch (error) {
        console.error("Error importing mail service:", error.message);
    }

    return successResponse(res, 200, "Login successful", {
        admin: {
            id: admin._id,
            name: admin.name,
            email: admin.email,
            isSuperAdmin: admin.isSuperAdmin,
            isActive: admin.isActive
        },
        expiresIn: accessTokenExpiry,
        cookies: {
            accessToken: "Set",
            refreshToken: "Set"
        }
    });
});

// @route   POST /api/v1/admin/logout
// @desc    Logout and clear tokens
// @access  Private
export const logoutAdmin = asyncHandler(async (req, res) => {
    const adminId = req.admin?.id;

    if (!adminId) {
        return errorResponse(res, 401, "Unauthorized");
    }

    // Clear all sessions from database
    const admin = await Admin.findById(adminId);
    if (admin) {
        admin.clearAllSessions();
        await admin.save({ validateBeforeSave: false });
    }

    // Clear cookies
    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");

    return successResponse(res, 200, "Logout successful", {
        message: "All sessions cleared and cookies removed"
    });
});

// @route   POST /api/v1/admin/resend-otp
// @desc    Resend OTP if expired or not received
// @access  Public
export const resendOtp = asyncHandler(async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return errorResponse(res, 400, "Email is required");
    }

    const admin = await Admin.findOne({ email: email.toLowerCase() });

    if (!admin) {
        return errorResponse(res, 401, "Invalid email");
    }

    // Check cooldown (60 seconds)
    if (admin.otpLastSentAt && Date.now() - admin.otpLastSentAt < 60 * 1000) {
        const waitTime = Math.ceil((60 * 1000 - (Date.now() - admin.otpLastSentAt)) / 1000);
        return errorResponse(res, 429, `Please wait ${waitTime} seconds before requesting a new OTP`);
    }

    // Reset OTP attempts on resend
    admin.otpAttempts = 0;

    // Generate new OTP
    const otp = admin.generateOTP();
    await admin.save({ validateBeforeSave: false });

    // Send OTP via email
    try {
        const { sendOTPEmail } = await import("../services/mail.service.js");

        await sendOTPEmail(admin.email, otp, admin.name, "login");

        console.log(`📧 OTP resent to ${admin.email}`);
    } catch (error) {
        console.error("Mail sending failed:", error);

        // Clear the OTP since email failed
        admin.verificationCode = null;
        admin.verificationCodeExpires = null;
        await admin.save({ validateBeforeSave: false });

        return errorResponse(res, 500, "Failed to send OTP email. Please try again later.");
    }

    return successResponse(res, 200, "OTP resent to email", {
        email: admin.email,
        otpExpiresIn: "10 minutes"
    });
});

// @route   GET /api/v1/admin/profile
// @desc    Get current admin profile
// @access  Private
export const getAdminProfile = asyncHandler(async (req, res) => {
    const adminId = req.admin?.id;

    if (!adminId) {
        return errorResponse(res, 401, "Unauthorized");
    }

    const admin = await Admin.findById(adminId);

    if (!admin) {
        return errorResponse(res, 404, "Admin not found");
    }

    return successResponse(res, 200, "Admin profile retrieved", admin);
});

// @route   POST /api/v1/admin/refresh-token
// @desc    Refresh access token using refresh token
// @access  Private
export const refreshAccessToken = asyncHandler(async (req, res) => {
    const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;
    console.log("Refresh token received:", refreshToken);

    if (!refreshToken) {
        console.log("Returning null due to missing refresh token")
        return errorResponse(res, 401, "Refresh token not found");
    }

    try {
        const decoded = jwt.verify(
            refreshToken,
            process.env.JWT_REFRESH_TOKEN_SECRET || "your_refresh_secret"
        );

        console.log("Decoded token:\n", decoded)

        const admin = await Admin.findById(decoded.id);

        console.log("Admin forund: ", Boolean(admin))

        if (!admin) {
            return errorResponse(res, 401, "Admin not found");
        }

        // Verify refresh token against stored hash
        if (!admin.verifyAndRemoveRefreshToken(refreshToken)) {
            return errorResponse(res, 401, "Invalid refresh token");
        }

        console.log("Generating new access token")
        // Generate new tokens
        const newAccessToken = jwt.sign(
            { id: admin._id, email: admin.email},
            process.env.JWT_ACCESS_TOKEN_SECRET,
            { expiresIn: "15m" }
        );

        console.log("New Acccess TOken : ", newAccessToken)
        const newRefreshToken = jwt.sign(
            { id: admin._id, },
            process.env.JWT_REFRESH_TOKEN_SECRET,
            { expiresIn: process.env.JWT_REFRESH_TOKEN_EXPIRES_IN || "30d" }
        );

        // Add new session
        admin.addSession(newRefreshToken, {
            device: req.headers['user-agent'] || 'Unknown',
            ip: req.ip || req.connection.remoteAddress,
            userAgent: req.headers['user-agent']
        });

        // Use atomic findByIdAndUpdate to avoid concurrency issues
        const adminSessionHash = admin.hashToken(newRefreshToken);
        const maxSessions = 5;

        const updatedAdmin = await Admin.findByIdAndUpdate(
            decoded.id,
            {
                $push: {
                    sessions: {
                        $each: [{
                            refreshTokenHash: adminSessionHash,
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

        if (!updatedAdmin) {
            return errorResponse(res, 401, "Failed to update admin");
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

        return successResponse(res, 200, "Tokens refreshed", {
            admin: {
                id: updatedAdmin._id,
                name: updatedAdmin.name,
                email: updatedAdmin.email,
                isSuperAdmin: updatedAdmin.isSuperAdmin,
                isActive: updatedAdmin.isActive
            },
            expiresIn: process.env.JWT_ACCESS_TOKEN_EXPIRES_IN || "15m",
            cookies: {
                accessToken: "Set",
                refreshToken: "Set"
            }
        });
    } catch (error) {
        console.error("Refresh token error:", error);
        return errorResponse(res, 401, "Invalid or expired refresh token");
    }
});

// @route   POST /api/v1/admin/forgot-password
// @desc    Request password reset link
// @access  Public
export const forgotPassword = asyncHandler(async (req, res) => {
    const { email } = req.body;

    // Validation
    if (!email) {
        return errorResponse(res, 400, "Email is required");
    }

    // Find admin by email
    const admin = await Admin.findOne({ email: email.toLowerCase() });

    if (!admin) {
        // Don't reveal if email exists (security best practice)
        return successResponse(res, 200, "If the email exists, a reset link has been sent", {
            email,
            message: "Check your email for the password reset link"
        });
    }

    // Generate password reset token
    const resetToken = admin.createPasswordResetToken();
    await admin.save({ validateBeforeSave: false });

    // Create reset URL (frontend URL)
    const resetUrl = `${process.env.FRONTEND_URL || "http://localhost:5173"}/admin/reset?token=${resetToken}`;

    // Send reset email
    try {
        const { sendPasswordResetEmail } = await import("../services/mail.service.js");

        await sendPasswordResetEmail(
            admin.email,
            resetUrl,
            admin.name,
            process.env.PASSWORD_RESET_EXPIRES_IN || "5m"
        );

        console.log(`📧 Password reset email sent to ${admin.email}`);
    } catch (error) {
        console.error("Mail sending failed:", error.message);

        // Clear the reset token since email failed
        admin.passwordResetToken = null;
        admin.passwordResetExpires = null;
        await admin.save({ validateBeforeSave: false });

        return errorResponse(
            res,
            500,
            "Failed to send reset email. Please try again later."
        );
    }

    // Return generic success (don't reveal if email exists)
    return successResponse(res, 200, "If the email exists, a reset link has been sent", {
        email,
        message: "Check your email for the password reset link",
        expiresIn: process.env.PASSWORD_RESET_EXPIRES_IN || "5 minutes"
    });
});

// @route   POST /api/v1/admin/reset-password
// @desc    Reset password with token
// @access  Public
export const resetPassword = asyncHandler(async (req, res) => {
    const { token, password, confirmPassword } = req.body;

    // Validation
    if (!token) {
        return errorResponse(res, 400, "Reset token is required");
    }

    if (!password || !confirmPassword) {
        return errorResponse(res, 400, "Password and confirmation are required");
    }

    if (password !== confirmPassword) {
        return errorResponse(res, 400, "Passwords do not match");
    }

    // Hash token to find admin
    const hashedToken = crypto
        .createHash("sha256")
        .update(token)
        .digest("hex");

    // Find admin by reset token and check expiry
    const admin = await Admin.findOne({
        passwordResetToken: hashedToken,
        passwordResetExpires: { $gt: Date.now() }
    });

    if (!admin) {
        return errorResponse(res, 400, "Invalid or expired reset token");
    }

    // Set new password
    admin.password = password;
    admin.passwordResetToken = null;
    admin.passwordResetExpires = null;
    admin.passwordChangedAt = Date.now();

    // Clear all sessions for security (user must login again)
    admin.clearAllSessions();

    await admin.save();

    return successResponse(res, 200, "Password reset successful. Please login with your new password", {
        message: "You can now login with your new password",
        redirectTo: "/admin/login"
    });
});

// @route   POST /api/v1/admin/verify-reset-token
// @desc    Verify if reset token is valid
// @access  Public
export const verifyResetToken = asyncHandler(async (req, res) => {
    const { token } = req.body;

    if (!token) {
        return errorResponse(res, 400, "Reset token is required");
    }

    // Hash token
    const hashedToken = crypto
        .createHash("sha256")
        .update(token)
        .digest("hex");

    // Find admin by reset token and check expiry
    const admin = await Admin.findOne({
        passwordResetToken: hashedToken,
        passwordResetExpires: { $gt: Date.now() }
    });

    if (!admin) {
        return errorResponse(res, 400, "Invalid or expired reset token");
    }

    // Calculate time remaining
    const timeRemaining = admin.passwordResetExpires - Date.now();
    const minutesRemaining = Math.ceil(timeRemaining / 60000);

    return successResponse(res, 200, "Reset token is valid", {
        valid: true,
        expiresIn: `${minutesRemaining} minutes`,
        message: "You can now reset your password"
    });
});
