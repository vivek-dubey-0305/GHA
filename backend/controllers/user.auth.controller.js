import { User } from "../models/user.model.js";
import logger from "../configs/logger.config.js";
import { asyncHandler } from "../middlewares/async.middleware.js";
import { errorResponse, successResponse } from "../utils/response.utils.js";
import {
    generateAndSendOtp,
    issueTokensAndRespond,
    logoutService,
    resendOtpService,
    forgotPasswordService,
    resetPasswordService,
    verifyResetTokenService,
    refreshTokenService,
    getSessionsService,
    logoutSessionService,
    logoutAllSessionsService,
    changePasswordService,
    validateOtpRequest,
} from "../services/auth.service.js";

const getUserData = (u) => ({
    user: { id: u._id, firstName: u.firstName, lastName: u.lastName, email: u.email, isActive: u.isActive },
});

// @route   POST /api/v1/user/register
export const registerUser = asyncHandler(async (req, res) => {
    const { firstName, lastName, email, password, confirmPassword, phone } = req.body;
    logger.info(`User registration attempt: ${email}`);

    if (!firstName || !lastName || !email || !password || !confirmPassword) {
        return errorResponse(res, 400, "All fields are required");
    }
    if (password !== confirmPassword) return errorResponse(res, 400, "Passwords do not match");

    const existing = await User.findOne({
        $or: [{ email: email.toLowerCase() }, { phone: phone || null }],
    });
    if (existing) return errorResponse(res, 409, "User with this email or phone already exists");

    try {
        const user = new User({
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            email: email.toLowerCase(),
            password,
            phone: phone ? phone.trim() : null,
            isActive: true,
            // TEMPORARY: Mark email as verified to skip OTP (nodemailer not working in production)
            isEmailVerified: true,
        });

        // Save user to database first
        await user.save();

        // COMMENTED OUT: OTP verification temporarily disabled (nodemailer issues)
        // await generateAndSendOtp(user, `${firstName} ${lastName}`, "verify");

        // TEMPORARY: Issue tokens and set cookies directly instead of OTP
        return issueTokensAndRespond(user, "user", req, res, getUserData, {
            setEmailVerified: true,
            nameForEmail: `${firstName} ${lastName}`,
        });
    } catch (e) {
        logger.error(`User registration error: ${e.message}`);
        return errorResponse(res, 500, "Registration failed. Please try again later.");
    }
});

// @route   POST /api/v1/user/login
export const loginUser = asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    logger.info(`User login attempt: ${email}`);
    if (!email || !password) return errorResponse(res, 400, "Email and password are required");

    const user = await User.findOne({ email: email.toLowerCase() }).select("+password");
    if (!user) return errorResponse(res, 401, "Invalid email or password");
    if (!user.isActive) return errorResponse(res, 403, "User account is inactive");
    // COMMENTED OUT: Email verification check temporarily disabled (OTP/nodemailer not working)
    // if (!user.isEmailVerified) return errorResponse(res, 403, "Please verify your email before logging in");

    if (user.isLocked) {
        const wait = Math.ceil((user.lockUntil - Date.now()) / 60_000);
        return errorResponse(res, 429, `Account locked. Try again in ${wait} minutes`);
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
        await User.failLogin(user._id);
        return errorResponse(res, 401, "Invalid email or password");
    }

    // COMMENTED OUT: OTP generation temporarily disabled (nodemailer not working in production)
    // try {
    //     await generateAndSendOtp(user, `${user.firstName} ${user.lastName}`, "login");
    // } catch {
    //     user.verificationCode = null;
    //     user.verificationCodeExpires = null;
    //     await user.save({ validateBeforeSave: false });
    //     return errorResponse(res, 500, "Failed to send OTP email. Please try again later.");
    // }

    // TEMPORARY: Issue tokens and set cookies directly instead of OTP
    return issueTokensAndRespond(user, "user", req, res, getUserData, {
        setEmailVerified: true,
        nameForEmail: `${user.firstName} ${user.lastName}`,
    });
});

// @route   POST /api/v1/user/verify-otp
export const verifyOtp = asyncHandler(async (req, res) => {
    const { email, otp } = req.body;
    logger.info(`User OTP verification attempt: ${email}`);
    if (!email || !otp) return errorResponse(res, 400, "Email and OTP are required");
    if (otp.length !== 6 || isNaN(otp)) return errorResponse(res, 400, "OTP must be a 6-digit number");

    const user = await User.findOne({ email: email.toLowerCase() })
        .select("+verificationCode +verificationCodeExpires +otpAttempts");

    const otpError = await validateOtpRequest(user, otp, res);
    if (otpError) return otpError;

    return issueTokensAndRespond(user, "user", req, res, getUserData, {
        setEmailVerified: true,
        nameForEmail: `${user.firstName} ${user.lastName}`,
    });
});

// @route   POST /api/v1/user/logout
export const logoutUser = asyncHandler(async (req, res) => {
    if (!req.user?.id) return errorResponse(res, 401, "Unauthorized");
    const user = await User.findById(req.user.id);
    if (user) return logoutService(user, res);
    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");
    return successResponse(res, 200, "Logout successful");
});

// @route   POST /api/v1/user/resend-otp
export const resendOtp = asyncHandler(async (req, res) => {
    const { email } = req.body;
    if (!email) return errorResponse(res, 400, "Email is required");
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return errorResponse(res, 401, "Invalid email");
    return resendOtpService(user, `${user.firstName} ${user.lastName}`, res);
});

// @route   GET /api/v1/user/profile
export const getUserProfile = asyncHandler(async (req, res) => {
    if (!req.user?.id) return errorResponse(res, 401, "Unauthorized");
    const user = await User.findById(req.user.id);
    if (!user) return errorResponse(res, 404, "User not found");
    return successResponse(res, 200, "User profile retrieved", user);
});

// @route   POST /api/v1/user/forgot-password
export const forgotPassword = asyncHandler(async (req, res) => {
    const { email } = req.body;
    if (!email) return errorResponse(res, 400, "Email is required");
    const user = await User.findOne({ email: email.toLowerCase() });
    const name = user ? `${user.firstName} ${user.lastName}` : "";
    return forgotPasswordService(user, "/reset", name, res);
});

// @route   POST /api/v1/user/reset-password
export const resetPassword = asyncHandler(async (req, res) => {
    const { token, password, confirmPassword } = req.body;
    return resetPasswordService(User, token, password, confirmPassword, "/login", res);
});

// @route   POST /api/v1/user/verify-reset-token
export const verifyResetToken = asyncHandler(async (req, res) => {
    return verifyResetTokenService(User, req.body.token, res);
});

// @route   POST /api/v1/user/refresh-token
export const refreshAccessToken = asyncHandler(async (req, res) => {
    return refreshTokenService(User, "user", req, res, getUserData);
});

// @route   GET /api/v1/user/sessions
export const getUserSessions = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user.id).select("sessions");
    if (!user) return errorResponse(res, 404, "User not found");
    return getSessionsService(user, res);
});

// @route   POST /api/v1/user/logout-session
export const logoutSession = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user.id);
    if (!user) return errorResponse(res, 404, "User not found");
    return logoutSessionService(user, req.body.sessionId, res);
});

// @route   POST /api/v1/user/logout-all-sessions
export const logoutAllSessions = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user.id);
    if (!user) return errorResponse(res, 404, "User not found");
    const currentRefreshToken = req.cookies?.refreshToken || req.body?.refreshToken;
    return logoutAllSessionsService(user, currentRefreshToken, res);
});

// @route   POST /api/v1/user/change-password
export const changePassword = asyncHandler(async (req, res) => {
    const { currentPassword, newPassword, confirmPassword } = req.body;
    logger.info(`Password change attempt for user: ${req.user.id}`);
    const user = await User.findById(req.user.id).select("+password");
    if (!user) return errorResponse(res, 404, "User not found");
    try {
        await changePasswordService(user, currentPassword, newPassword, confirmPassword);
        return successResponse(res, 200, "Password changed successfully. Please login again.");
    } catch (e) {
        return errorResponse(res, e.message === "Current password is incorrect" ? 401 : 400, e.message);
    }
});
