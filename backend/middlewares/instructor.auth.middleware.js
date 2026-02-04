import jwt from "jsonwebtoken";
import { Instructor } from "../models/instructor.model.js";
import { errorResponse } from "../utils/response.utils.js";
import logger from "../configs/logger.config.js";

/**
 * Instructor Authentication Middleware
 * Verifies JWT tokens and validates instructor access
 */

// Verify Instructor Token
export const verifyInstructorToken = async (req, res, next) => {
    try {
        let token = req.cookies?.accessToken || req.headers.authorization?.split(" ")[1];

        logger.info(`Instructor token verification attempt`);

        if (!token) {
            logger.warn(`Instructor token verification failed - No token found`);
            return errorResponse(res, 401, "Access token not found. Please login.");
        }

        // Verify token
        const decoded = jwt.verify(
            token,
            process.env.JWT_ACCESS_TOKEN_SECRET || "your_jwt_secret"
        );

        // Find instructor
        const instructor = await Instructor.findById(decoded.id);

        if (!instructor || !instructor.isActive) {
            logger.warn(`Instructor token verification failed - Instructor not found or inactive: ${decoded.id}`);
            return errorResponse(res, 403, "Instructor not found or inactive");
        }

        // Check if suspended
        if (instructor.isSuspended) {
            logger.warn(`Instructor token verification failed - Instructor suspended: ${decoded.id}`);
            return errorResponse(res, 403, "Instructor account is suspended");
        }

        // Attach instructor to request
        req.instructor = decoded;
        req.instructorData = instructor;

        logger.info(`Instructor token verified successfully: ${decoded.id}`);
        next();
    } catch (error) {
        if (error.name === "TokenExpiredError") {
            logger.warn(`Instructor token verification failed - Token expired`);
            return errorResponse(res, 401, "Access token expired. Use refresh token to get new token.");
        }
        logger.error(`Instructor token verification error: ${error.message}`);
        return errorResponse(res, 401, "Invalid access token");
    }
};

// Verify Instructor Email Verification
export const verifyInstructorEmailVerified = async (req, res, next) => {
    try {
        if (!req.instructorData?.isEmailVerified) {
            logger.warn(`Instructor email verification check failed - Email not verified: ${req.instructor?.id}`);
            return errorResponse(res, 403, "Please verify your email to access this resource");
        }
        logger.info(`Instructor email verification check passed: ${req.instructor?.id}`);
        next();
    } catch (error) {
        logger.error(`Email verification check error: ${error.message}`);
        return errorResponse(res, 500, "Email verification check error");
    }
};

// Verify Instructor Active Status
export const verifyInstructorActive = async (req, res, next) => {
    try {
        if (!req.instructorData?.isActive) {
            logger.warn(`Instructor active status check failed - Instructor inactive: ${req.instructor?.id}`);
            return errorResponse(res, 403, "Instructor account is inactive");
        }
        logger.info(`Instructor active status check passed: ${req.instructor?.id}`);
        next();
    } catch (error) {
        logger.error(`Active status check error: ${error.message}`);
        return errorResponse(res, 500, "Active status check error");
    }
};

// Verify Instructor Not Suspended
export const verifyInstructorNotSuspended = async (req, res, next) => {
    try {
        if (req.instructorData?.isSuspended) {
            logger.warn(`Instructor suspension check failed - Instructor suspended: ${req.instructor?.id}`);
            return errorResponse(res, 403, `Instructor account is suspended. Reason: ${req.instructorData.suspensionReason || "Not specified"}`);
        }
        logger.info(`Instructor suspension check passed: ${req.instructor?.id}`);
        next();
    } catch (error) {
        logger.error(`Suspension check error: ${error.message}`);
        return errorResponse(res, 500, "Suspension check error");
    }
};

// Verify Instructor Documents (for certain operations)
export const verifyInstructorDocumentsVerified = async (req, res, next) => {
    try {
        if (!req.instructorData?.isDocumentsVerified) {
            logger.warn(`Instructor documents verification check failed - Documents not verified: ${req.instructor?.id}`);
            return errorResponse(res, 403, "Please complete document verification to access this resource");
        }
        logger.info(`Instructor documents verification check passed: ${req.instructor?.id}`);
        next();
    } catch (error) {
        logger.error(`Documents verification check error: ${error.message}`);
        return errorResponse(res, 500, "Documents verification check error");
    }
};

/**
 * Combined middleware for full instructor authentication and verification
 * Checks: Token validity, instructor existence, active status, email verification, suspension status
 */
export const authenticateInstructor = [
    verifyInstructorToken,
    verifyInstructorEmailVerified,
    verifyInstructorActive,
    verifyInstructorNotSuspended
];

/**
 * Strict authentication for sensitive operations
 * Also checks if documents are verified
 */
export const authenticateInstructorStrict = [
    verifyInstructorToken,
    verifyInstructorEmailVerified,
    verifyInstructorActive,
    verifyInstructorNotSuspended,
    verifyInstructorDocumentsVerified
];

export default {
    verifyInstructorToken,
    verifyInstructorEmailVerified,
    verifyInstructorActive,
    verifyInstructorNotSuspended,
    verifyInstructorDocumentsVerified,
    authenticateInstructor,
    authenticateInstructorStrict
};
