import { Instructor } from "../models/instructor.model.js";
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

const getInstructorData = (i) => ({
    instructor: { id: i._id, firstName: i.firstName, lastName: i.lastName, email: i.email, isActive: i.isActive },
});

// @route   POST /api/v1/instructor/register
export const registerInstructor = asyncHandler(async (req, res) => {
    const { firstName, lastName, email, password, confirmPassword, specialization, bio } = req.body;

    logger.info(`Instructor registration attempt: ${email}`);
    const missing = ["firstName", "lastName", "email", "password", "confirmPassword"].filter(f => !req.body[f]);
    if (missing.length) return errorResponse(res, 400, `Missing required fields: ${missing.join(", ")}`);
    if (password !== confirmPassword) return errorResponse(res, 400, "Passwords do not match");

    const existing = await Instructor.findOne({ email: email.toLowerCase() });
    if (existing) return errorResponse(res, 409, "Instructor with this email already exists");

    try {
        let processedSpecialization = [];
        if (specialization) {
            const arr = Array.isArray(specialization) ? specialization : specialization.split(",").map(s => s.trim());
            processedSpecialization = arr.map(s => s.toLowerCase().replace(/\s+/g, "_")).filter(Boolean);
        }

        const instructor = new Instructor({
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            email: email.toLowerCase(),
            password,
            specialization: processedSpecialization.length ? processedSpecialization : undefined,
            bio: bio ? bio.trim() : undefined,
            isActive: true,
            isEmailVerified: false,
        });

        await generateAndSendOtp(instructor, `${firstName} ${lastName}`, "verify");

        return successResponse(res, 201, "Registration successful. Please verify your email with the OTP sent.", {
            email: instructor.email,
            message: "Check your email for the 6-digit OTP",
            otpExpiresIn: "10 minutes",
        });
    } catch (e) {
        logger.error(`Instructor registration error: ${e.message}`);
        return errorResponse(res, 500, "Registration failed. Please try again later.");
    }
});

// @route   POST /api/v1/instructor/login
export const loginInstructor = asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    logger.info(`Instructor login attempt: ${email}`);
    if (!email || !password) return errorResponse(res, 400, "Email and password are required");

    const instructor = await Instructor.findOne({ email: email.toLowerCase() }).select("+password");
    if (!instructor) return errorResponse(res, 401, "Invalid email or password");
    if (!instructor.isActive) return errorResponse(res, 403, "Instructor account is inactive");
    if (!instructor.isEmailVerified) return errorResponse(res, 403, "Please verify your email before logging in");
    if (instructor.isSuspended) return errorResponse(res, 403, `Instructor account is suspended. Reason: ${instructor.suspensionReason || "Not specified"}`);

    if (instructor.isLocked) {
        const wait = Math.ceil((instructor.lockUntil - Date.now()) / 60_000);
        return errorResponse(res, 429, `Account locked. Try again in ${wait} minutes`);
    }

    const isPasswordValid = await instructor.comparePassword(password);
    if (!isPasswordValid) {
        await Instructor.failLogin(instructor._id);
        const updated = await Instructor.findById(instructor._id);
        const remaining = 5 - updated.loginAttempts;
        if (remaining <= 0) return errorResponse(res, 429, "Account locked due to too many failed login attempts. Try again in 2 hours.");
        return errorResponse(res, 401, `Invalid email or password. Attempts remaining: ${remaining}`);
    }

    try {
        await generateAndSendOtp(instructor, `${instructor.firstName} ${instructor.lastName}`, "login");
    } catch {
        instructor.verificationCode = null;
        instructor.verificationCodeExpires = null;
        await instructor.save({ validateBeforeSave: false });
        return errorResponse(res, 500, "Failed to send OTP email. Please try again later.");
    }

    return successResponse(res, 200, "OTP sent to email. Verify to login.", {
        email: instructor.email,
        message: "Check your email for the 6-digit OTP",
        otpExpiresIn: "10 minutes",
    });
});

// @route   POST /api/v1/instructor/verify-otp
export const verifyOtp = asyncHandler(async (req, res) => {
    const { email, otp } = req.body;
    logger.info(`Instructor OTP verification attempt: ${email}`);
    if (!email || !otp) return errorResponse(res, 400, "Email and OTP are required");
    if (otp.length !== 6 || isNaN(otp)) return errorResponse(res, 400, "OTP must be a 6-digit number");

    const instructor = await Instructor.findOne({ email: email.toLowerCase() })
        .select("+verificationCode +verificationCodeExpires +otpAttempts");

    const otpError = await validateOtpRequest(instructor, otp, res);
    if (otpError) return otpError;

    return issueTokensAndRespond(instructor, "instructor", req, res, getInstructorData, {
        setEmailVerified: true,
        nameForEmail: `${instructor.firstName} ${instructor.lastName}`,
    });
});

// @route   POST /api/v1/instructor/logout
export const logoutInstructor = asyncHandler(async (req, res) => {
    if (!req.instructor?.id) return errorResponse(res, 401, "Unauthorized");
    const instructor = await Instructor.findById(req.instructor.id);
    if (instructor) return logoutService(instructor, res);
    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");
    return successResponse(res, 200, "Logout successful");
});

// @route   POST /api/v1/instructor/resend-otp
export const resendOtp = asyncHandler(async (req, res) => {
    const { email } = req.body;
    if (!email) return errorResponse(res, 400, "Email is required");
    const instructor = await Instructor.findOne({ email: email.toLowerCase() });
    if (!instructor) return errorResponse(res, 401, "Invalid email");
    return resendOtpService(instructor, `${instructor.firstName} ${instructor.lastName}`, res);
});

// @route   GET /api/v1/instructor/profile
export const getInstructorProfile = asyncHandler(async (req, res) => {
    if (!req.instructor?.id) return errorResponse(res, 401, "Unauthorized");
    const instructor = await Instructor.findById(req.instructor.id);
    if (!instructor) return errorResponse(res, 404, "Instructor not found");
    return successResponse(res, 200, "Instructor profile retrieved", instructor);
});

// @route   POST /api/v1/instructor/forgot-password
export const forgotPassword = asyncHandler(async (req, res) => {
    const { email } = req.body;
    if (!email) return errorResponse(res, 400, "Email is required");
    const instructor = await Instructor.findOne({ email: email.toLowerCase() });
    const name = instructor ? `${instructor.firstName} ${instructor.lastName}` : "";
    return forgotPasswordService(instructor, "/instructor/reset", name, res);
});

// @route   POST /api/v1/instructor/reset-password
export const resetPassword = asyncHandler(async (req, res) => {
    const { token, password, confirmPassword } = req.body;
    return resetPasswordService(Instructor, token, password, confirmPassword, "/instructor/login", res);
});

// @route   POST /api/v1/instructor/verify-reset-token
export const verifyResetToken = asyncHandler(async (req, res) => {
    return verifyResetTokenService(Instructor, req.body.token, res);
});

// @route   POST /api/v1/instructor/refresh-token
export const refreshAccessToken = asyncHandler(async (req, res) => {
    return refreshTokenService(Instructor, "instructor", req, res, getInstructorData);
});

// @route   GET /api/v1/instructor/sessions
export const getInstructorSessions = asyncHandler(async (req, res) => {
    const instructor = await Instructor.findById(req.instructor.id).select("sessions");
    if (!instructor) return errorResponse(res, 404, "Instructor not found");
    return getSessionsService(instructor, res);
});

// @route   POST /api/v1/instructor/logout-session
export const logoutSession = asyncHandler(async (req, res) => {
    const instructor = await Instructor.findById(req.instructor.id);
    if (!instructor) return errorResponse(res, 404, "Instructor not found");
    return logoutSessionService(instructor, req.body.sessionId, res);
});

// @route   POST /api/v1/instructor/logout-all-sessions
export const logoutAllSessions = asyncHandler(async (req, res) => {
    const instructor = await Instructor.findById(req.instructor.id);
    if (!instructor) return errorResponse(res, 404, "Instructor not found");
    const currentRefreshToken = req.cookies?.refreshToken || req.body?.refreshToken;
    return logoutAllSessionsService(instructor, currentRefreshToken, res);
});

// @route   POST /api/v1/instructor/change-password
export const changePassword = asyncHandler(async (req, res) => {
    const { currentPassword, newPassword, confirmPassword } = req.body;
    logger.info(`Password change attempt for instructor: ${req.instructor.id}`);
    const instructor = await Instructor.findById(req.instructor.id).select("+password");
    if (!instructor) return errorResponse(res, 404, "Instructor not found");
    try {
        await changePasswordService(instructor, currentPassword, newPassword, confirmPassword);
        return successResponse(res, 200, "Password changed successfully. Please login again.");
    } catch (e) {
        return errorResponse(res, e.message === "Current password is incorrect" ? 401 : 400, e.message);
    }
});
