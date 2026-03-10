/**
 * Centralized Authentication Service
 * Shared logic for Admin, Instructor and User auth controllers.
 * Each controller remains a thin wrapper that:
 *   1. Finds the entity and does role-specific validation
 *   2. Calls the appropriate service function below
 */
import jwt from "jsonwebtoken";
import crypto from "crypto";
import logger from "../configs/logger.config.js";
import { convertToMilliseconds } from "../utils/time.utils.js";
import { errorResponse, successResponse } from "../utils/response.utils.js";

const MAX_SESSIONS = 5;

// ─── Cookie helpers ────────────────────────────────────────────────

export const setAuthCookies = (res, accessToken, refreshToken) => {
    const opts = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
    };
    res.cookie("accessToken", accessToken, {
        ...opts,
        maxAge: convertToMilliseconds(process.env.JWT_ACCESS_TOKEN_EXPIRES_IN || "15m"),
    });
    res.cookie("refreshToken", refreshToken, {
        ...opts,
        maxAge: convertToMilliseconds(process.env.JWT_REFRESH_TOKEN_EXPIRES_IN || "30d"),
    });
};

// ─── Token helpers ─────────────────────────────────────────────────

export const generateTokenPair = (id, email, role) => {
    const accessToken = jwt.sign(
        { id, email, role },
        process.env.JWT_ACCESS_TOKEN_SECRET,
        { expiresIn: process.env.JWT_ACCESS_TOKEN_EXPIRES_IN || "15m" }
    );
    const refreshToken = jwt.sign(
        { id, role },
        process.env.JWT_REFRESH_TOKEN_SECRET || "your_refresh_secret",
        { expiresIn: process.env.JWT_REFRESH_TOKEN_EXPIRES_IN || "30d" }
    );
    return { accessToken, refreshToken };
};

// ─── OTP helpers ───────────────────────────────────────────────────

/**
 * Generate an OTP for entity, save, and send via email.
 * @param {Object} entity - Mongoose document (Admin / Instructor / User)
 * @param {string} name   - Display name for the email greeting
 * @param {string} type   - Email type: "login" | "verify"
 */
export const generateAndSendOtp = async (entity, name, type = "login") => {
    const otp = entity.generateOTP();
    await entity.save({ validateBeforeSave: false });

    const { sendOTPEmail } = await import("./mail.service.js");
    await sendOTPEmail(entity.email, otp, name, type);
    return otp;
};

// ─── Core auth flows ───────────────────────────────────────────────

/**
 * After a successful OTP check: set session, issue tokens, set cookies,
 * send welcome email, return success response.
 *
 * @param {Object}   entity      - Mongoose document
 * @param {string}   role        - "admin" | "instructor" | "user"
 * @param {Object}   req         - Express request
 * @param {Object}   res         - Express response
 * @param {Function} getData     - (entity) => extra response payload object
 * @param {Object}   [options]   - { setEmailVerified: true }
 */
export const issueTokensAndRespond = async (entity, role, req, res, getData, options = {}) => {
    const { accessToken, refreshToken } = generateTokenPair(entity._id, entity.email, role);

    entity.clearOTP();
    entity.addSession(refreshToken, {
        device: req.headers["user-agent"] || "Unknown",
        ip: req.ip || req.connection.remoteAddress,
        userAgent: req.headers["user-agent"],
    });
    entity.lastLogin = Date.now();
    entity.lastLoginIP = req.ip || req.connection.remoteAddress;
    entity.loginAttempts = 0;
    entity.lockUntil = undefined;
    if (options.setEmailVerified) entity.isEmailVerified = true;

    await entity.save({ validateBeforeSave: false });

    setAuthCookies(res, accessToken, refreshToken);

    // Welcome email — fire and forget
    try {
        const { sendWelcomeEmail } = await import("./mail.service.js");
        sendWelcomeEmail(entity.email, options.nameForEmail || entity.email, role).catch(e => {
            logger.error(`Failed to send welcome email: ${e.message}`);
        });
    } catch { /* non-critical */ }

    const expiry = process.env.JWT_ACCESS_TOKEN_EXPIRES_IN || "15m";
    return successResponse(res, 200, "Login successful", {
        ...getData(entity),
        expiresIn: expiry,
        cookies: { accessToken: "Set", refreshToken: "Set" },
    });
};

/**
 * Logout: clear all sessions from DB and clear cookies.
 */
export const logoutService = async (entity, res) => {
    entity.clearAllSessions();
    await entity.save({ validateBeforeSave: false });
    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");
    return successResponse(res, 200, "Logout successful", {
        message: "All sessions cleared and cookies removed",
    });
};

/**
 * Resend OTP with 60-second cooldown.
 */
export const resendOtpService = async (entity, name, res) => {
    if (entity.otpLastSentAt && Date.now() - entity.otpLastSentAt < 60_000) {
        const wait = Math.ceil((60_000 - (Date.now() - entity.otpLastSentAt)) / 1000);
        return errorResponse(res, 429, `Please wait ${wait} seconds before requesting a new OTP`);
    }
    entity.otpAttempts = 0;
    try {
        await generateAndSendOtp(entity, name, "login");
    } catch (e) {
        entity.verificationCode = null;
        entity.verificationCodeExpires = null;
        await entity.save({ validateBeforeSave: false });
        return errorResponse(res, 500, "Failed to send OTP email. Please try again later.");
    }
    return successResponse(res, 200, "OTP resent to email", {
        email: entity.email,
        otpExpiresIn: "10 minutes",
    });
};

/**
 * Forgot password — generate reset token and send reset email.
 * @param {Object} entity       - Entity (or null if not found — return generic to avoid enumeration)
 * @param {string} resetPath    - e.g. "/admin/reset", "/instructor/reset", "/reset"
 * @param {string} name         - Display name for the email
 * @param {Object} res
 */
export const forgotPasswordService = async (entity, resetPath, name, res) => {
    if (!entity) {
        return successResponse(res, 200, "If the email exists, a reset link has been sent", {
            message: "Check your email for the password reset link",
        });
    }

    const resetToken = entity.createPasswordResetToken();
    await entity.save({ validateBeforeSave: false });

    const resetUrl = `${process.env.FRONTEND_URL || "http://localhost:5173"}${resetPath}?token=${resetToken}`;

    try {
        const { sendPasswordResetEmail } = await import("./mail.service.js");
        await sendPasswordResetEmail(
            entity.email,
            resetUrl,
            name,
            process.env.PASSWORD_RESET_EXPIRES_IN || "5m"
        );
    } catch (e) {
        entity.passwordResetToken = null;
        entity.passwordResetExpires = null;
        await entity.save({ validateBeforeSave: false });
        return errorResponse(res, 500, "Failed to send reset email. Please try again later.");
    }

    return successResponse(res, 200, "If the email exists, a reset link has been sent", {
        message: "Check your email for the password reset link",
        expiresIn: process.env.PASSWORD_RESET_EXPIRES_IN || "5 minutes",
    });
};

/**
 * Reset password using a signed token.
 * @param {Model}  Model       - Mongoose Model class
 * @param {string} token       - Plain reset token from request
 * @param {string} password
 * @param {string} confirmPassword
 * @param {string} redirectTo  - e.g. "/admin/login"
 * @param {Object} res
 */
export const resetPasswordService = async (Model, token, password, confirmPassword, redirectTo, res) => {
    if (!token) return errorResponse(res, 400, "Reset token is required");
    if (!password || !confirmPassword) return errorResponse(res, 400, "Password and confirmation are required");
    if (password !== confirmPassword) return errorResponse(res, 400, "Passwords do not match");

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
    const entity = await Model.findOne({
        passwordResetToken: hashedToken,
        passwordResetExpires: { $gt: Date.now() },
    });

    if (!entity) return errorResponse(res, 400, "Invalid or expired reset token");

    entity.password = password;
    entity.passwordResetToken = null;
    entity.passwordResetExpires = null;
    entity.passwordChangedAt = Date.now();
    entity.clearAllSessions();
    await entity.save();

    return successResponse(res, 200, "Password reset successful. Please login with your new password", {
        message: "You can now login with your new password",
        redirectTo,
    });
};

/**
 * Verify that a password reset token is still valid.
 */
export const verifyResetTokenService = async (Model, token, res) => {
    if (!token) return errorResponse(res, 400, "Reset token is required");

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
    const entity = await Model.findOne({
        passwordResetToken: hashedToken,
        passwordResetExpires: { $gt: Date.now() },
    });

    if (!entity) return errorResponse(res, 400, "Invalid or expired reset token");

    const minutesRemaining = Math.ceil((entity.passwordResetExpires - Date.now()) / 60_000);
    return successResponse(res, 200, "Reset token is valid", {
        valid: true,
        expiresIn: `${minutesRemaining} minutes`,
        message: "You can now reset your password",
    });
};

/**
 * Refresh access and refresh tokens using the stored refresh token.
 * @param {Model}  Model    - Mongoose Model class
 * @param {string} role     - "admin" | "instructor" | "user"
 * @param {Object} req
 * @param {Object} res
 * @param {Function} getData - (entity) => response payload object
 */
export const refreshTokenService = async (Model, role, req, res, getData) => {
    const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;
    if (!refreshToken) return errorResponse(res, 401, "Refresh token not found");

    try {
        const decoded = jwt.verify(
            refreshToken,
            process.env.JWT_REFRESH_TOKEN_SECRET || "your_refresh_secret"
        );

        const entity = await Model.findById(decoded.id);
        if (!entity) return errorResponse(res, 401, `${role} not found`);

        if (!entity.verifyAndRemoveRefreshToken(refreshToken)) {
            return errorResponse(res, 401, "Invalid refresh token");
        }

        const { accessToken: newAccessToken, refreshToken: newRefreshToken } = generateTokenPair(
            entity._id, entity.email, role
        );

        // Atomic session push with max-session cap
        await Model.findByIdAndUpdate(
            decoded.id,
            {
                $push: {
                    sessions: {
                        $each: [{
                            refreshTokenHash: entity.hashToken(newRefreshToken),
                            device: req.headers["user-agent"] || "Unknown",
                            ip: req.ip || req.connection.remoteAddress,
                            userAgent: req.headers["user-agent"],
                            lastActive: new Date(),
                        }],
                        $slice: -MAX_SESSIONS,
                    },
                },
            },
            { new: true, runValidators: false }
        );

        setAuthCookies(res, newAccessToken, newRefreshToken);

        const expiry = process.env.JWT_ACCESS_TOKEN_EXPIRES_IN || "15m";
        return successResponse(res, 200, "Tokens refreshed", {
            ...getData(entity),
            expiresIn: expiry,
            cookies: { accessToken: "Set", refreshToken: "Set" },
        });
    } catch {
        return errorResponse(res, 401, "Invalid or expired refresh token");
    }
};

/**
 * Get all active sessions for an entity.
 */
export const getSessionsService = async (entity, res) => {
    return successResponse(res, 200, "Active sessions retrieved", {
        sessions: entity.sessions.map(s => ({
            id: s._id,
            device: s.device || "Unknown Device",
            ip: s.ip || "Unknown IP",
            lastActive: s.lastActive || new Date(),
            createdAt: s.createdAt,
        })),
    });
};

/**
 * Revoke a specific session by ID.
 */
export const logoutSessionService = async (entity, sessionId, res) => {
    if (!sessionId) return errorResponse(res, 400, "Session ID is required");

    const sessionRemoved = entity.sessions.findByIdAndDelete(sessionId);
    if (!sessionRemoved) return errorResponse(res, 404, "Session not found");

    await entity.save({ validateBeforeSave: false });
    return successResponse(res, 200, "Session revoked successfully");
};

/**
 * Revoke all sessions except the current one.
 */
export const logoutAllSessionsService = async (entity, currentRefreshToken, res) => {
    const currentSessionHash = entity.hashToken(currentRefreshToken);
    const before = entity.sessions.length;
    entity.sessions = entity.sessions.filter(s => s.refreshTokenHash === currentSessionHash);
    await entity.save({ validateBeforeSave: false });

    return successResponse(res, 200, "All other sessions logged out", {
        sessionsRevoked: before - entity.sessions.length,
        sessionsActive: entity.sessions.length,
    });
};

/**
 * Change password while logged in.
 * Throws an Error string on failure so the controller can return errorResponse.
 */
export const changePasswordService = async (entity, currentPassword, newPassword, confirmPassword) => {
    if (!currentPassword || !newPassword || !confirmPassword) throw new Error("All password fields are required");
    if (newPassword !== confirmPassword) throw new Error("New passwords do not match");
    if (currentPassword === newPassword) throw new Error("New password must be different from current password");

    const isPasswordValid = await entity.comparePassword(currentPassword);
    if (!isPasswordValid) throw new Error("Current password is incorrect");

    entity.password = newPassword;
    entity.passwordChangedAt = Date.now();
    entity.clearAllSessions();
    await entity.save();
};

/**
 * Shared OTP entry validation (shared between verifyOtp handlers).
 * Returns an error response or null if valid.
 */
export const validateOtpRequest = async (entity, otp, res) => {
    if (!entity) return errorResponse(res, 401, "Invalid email");
    if (entity.otpAttempts >= 5) return errorResponse(res, 429, "Too many OTP attempts. Please request a new OTP.");
    if (!entity.verificationCode || !entity.verificationCodeExpires) return errorResponse(res, 400, "OTP not found. Request a new OTP");

    if (Date.now() > entity.verificationCodeExpires) {
        entity.verificationCode = null;
        entity.verificationCodeExpires = null;
        await entity.save({ validateBeforeSave: false });
        return errorResponse(res, 401, "OTP expired. Request a new OTP");
    }

    const isOtpValid = entity.verifyOTP(otp);
    if (!isOtpValid) {
        entity.otpAttempts += 1;
        await entity.save({ validateBeforeSave: false });
        return errorResponse(res, 401, "Invalid OTP");
    }
    return null; // all good
};
