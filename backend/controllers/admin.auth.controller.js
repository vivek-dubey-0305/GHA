import { Admin } from "../models/admin.model.js";
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

// Profile data shape for admin token/refresh responses
const getAdminData = (admin) => ({
    admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        isSuperAdmin: admin.isSuperAdmin,
        isActive: admin.isActive,
    },
});

// @route   POST /api/v1/admin/login
// @desc    Step 1: Verify credentials and send OTP
export const loginAdmin = asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) return errorResponse(res, 400, "Email and password are required");

    const admin = await Admin.findOne({ email: email.toLowerCase() }).select("+password");
    if (!admin) return errorResponse(res, 401, "Invalid email or password");
    if (!admin.isActive) return errorResponse(res, 403, "Admin account is inactive");

    if (admin.isLocked) {
        const wait = Math.ceil((admin.lockUntil - Date.now()) / 60_000);
        return errorResponse(res, 429, `Account locked. Try again in ${wait} minutes`);
    }

    const isPasswordValid = await admin.comparePassword(password);
    if (!isPasswordValid) {
        await Admin.failLogin(admin._id);
        return errorResponse(res, 401, "Invalid email or password");
    }

    try {
        await generateAndSendOtp(admin, admin.name, "login");
    } catch {
        admin.verificationCode = null;
        admin.verificationCodeExpires = null;
        await admin.save({ validateBeforeSave: false });
        return errorResponse(res, 500, "Failed to send OTP email. Please try again later.");
    }

    return successResponse(res, 200, "OTP sent to email. Verify to login.", {
        email: admin.email,
        message: "Check your email for the 6-digit OTP",
        otpExpiresIn: "10 minutes",
    });
});

// @route   POST /api/v1/admin/verify-otp
// @desc    Step 2: Verify OTP and issue tokens
export const verifyOtp = asyncHandler(async (req, res) => {
    const { email, otp } = req.body;
    if (!email || !otp) return errorResponse(res, 400, "Email and OTP are required");
    if (otp.length !== 6 || isNaN(otp)) return errorResponse(res, 400, "OTP must be a 6-digit number");

    const admin = await Admin.findOne({ email: email.toLowerCase() })
        .select("+verificationCode +verificationCodeExpires +otpAttempts");

    const otpError = await validateOtpRequest(admin, otp, res);
    if (otpError) return otpError;

    // Admin does NOT set isEmailVerified (already trusted) or lastLoginIP
    return issueTokensAndRespond(admin, "admin", req, res, getAdminData, {
        nameForEmail: admin.name,
    });
});

// @route   POST /api/v1/admin/logout
export const logoutAdmin = asyncHandler(async (req, res) => {
    if (!req.admin?.id) return errorResponse(res, 401, "Unauthorized");
    const admin = await Admin.findById(req.admin.id);
    if (admin) return logoutService(admin, res);
    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");
    return successResponse(res, 200, "Logout successful");
});

// @route   POST /api/v1/admin/resend-otp
export const resendOtp = asyncHandler(async (req, res) => {
    const { email } = req.body;
    if (!email) return errorResponse(res, 400, "Email is required");
    const admin = await Admin.findOne({ email: email.toLowerCase() });
    if (!admin) return errorResponse(res, 401, "Invalid email");
    return resendOtpService(admin, admin.name, res);
});

// @route   GET /api/v1/admin/profile
export const getAdminProfile = asyncHandler(async (req, res) => {
    if (!req.admin?.id) return errorResponse(res, 401, "Unauthorized");
    const admin = await Admin.findById(req.admin.id);
    if (!admin) return errorResponse(res, 404, "Admin not found");
    return successResponse(res, 200, "Admin profile retrieved", admin);
});

// @route   POST /api/v1/admin/refresh-token
export const refreshAccessToken = asyncHandler(async (req, res) => {
    return refreshTokenService(Admin, "admin", req, res, getAdminData);
});

// @route   POST /api/v1/admin/forgot-password
export const forgotPassword = asyncHandler(async (req, res) => {
    const { email } = req.body;
    if (!email) return errorResponse(res, 400, "Email is required");
    const admin = await Admin.findOne({ email: email.toLowerCase() });
    return forgotPasswordService(admin, "/admin/reset", admin?.name || "", res);
});

// @route   POST /api/v1/admin/reset-password
export const resetPassword = asyncHandler(async (req, res) => {
    const { token, password, confirmPassword } = req.body;
    return resetPasswordService(Admin, token, password, confirmPassword, "/admin/login", res);
});

// @route   POST /api/v1/admin/verify-reset-token
export const verifyResetToken = asyncHandler(async (req, res) => {
    return verifyResetTokenService(Admin, req.body.token, res);
});

// @route   GET /api/v1/admin/sessions
export const getAdminSessions = asyncHandler(async (req, res) => {
    const admin = await Admin.findById(req.admin.id).select("sessions");
    if (!admin) return errorResponse(res, 404, "Admin not found");
    return getSessionsService(admin, res);
});

// @route   POST /api/v1/admin/logout-session
export const logoutSession = asyncHandler(async (req, res) => {
    const admin = await Admin.findById(req.admin.id);
    if (!admin) return errorResponse(res, 404, "Admin not found");
    return logoutSessionService(admin, req.body.sessionId, res);
});

// @route   POST /api/v1/admin/logout-all-sessions
export const logoutAllSessions = asyncHandler(async (req, res) => {
    const admin = await Admin.findById(req.admin.id);
    if (!admin) return errorResponse(res, 404, "Admin not found");
    const currentRefreshToken = req.cookies?.refreshToken || req.body?.refreshToken;
    return logoutAllSessionsService(admin, currentRefreshToken, res);
});

// @route   POST /api/v1/admin/change-password
export const changePassword = asyncHandler(async (req, res) => {
    const { currentPassword, newPassword, confirmPassword } = req.body;
    const admin = await Admin.findById(req.admin.id).select("+password");
    if (!admin) return errorResponse(res, 404, "Admin not found");
    try {
        await changePasswordService(admin, currentPassword, newPassword, confirmPassword);
        return successResponse(res, 200, "Password changed successfully. Please login again.");
    } catch (e) {
        return errorResponse(res, e.message === "Current password is incorrect" ? 401 : 400, e.message);
    }
});

// @route   POST /api/v1/admin/verify-password
export const verifyPassword = asyncHandler(async (req, res) => {
    const { password } = req.body;
    if (!password) return errorResponse(res, 400, "Password is required");
    const admin = await Admin.findById(req.admin.id).select("+password");
    if (!admin) return errorResponse(res, 404, "Admin not found");
    const isValid = await admin.comparePassword(password);
    if (!isValid) return errorResponse(res, 401, "Invalid password");
    return successResponse(res, 200, "Password verified successfully");
});
