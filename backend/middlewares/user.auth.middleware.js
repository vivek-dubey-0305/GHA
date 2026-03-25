//user.auth.middleware.js
import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";
import { errorResponse } from "../utils/response.utils.js";
import logger from "../configs/logger.config.js";

/**
 * User (Student) Authentication Middleware
 * Verifies JWT tokens and validates user access
 */

// Verify User Token
export const verifyUserToken = async (req, res, next) => {
    try {
        let token = req.cookies?.accessToken || req.headers.authorization?.split(" ")[1];

        logger.info(`User token verification attempt`);

        if (!token) {
            logger.warn(`User token verification failed - No token found`);
            return errorResponse(res, 401, "Access token not found. Please login.");
        }

        // Verify token
        const decoded = jwt.verify(
            token,
            process.env.JWT_ACCESS_TOKEN_SECRET || "your_jwt_secret"
        );

        // Find user
        const user = await User.findById(decoded.id);

        if (!user || !user.isActive) {
            logger.warn(`User token verification failed - User not found or inactive: ${decoded.id}`);
            return errorResponse(res, 403, "User not found or inactive");
        }

        // Attach user to request
        req.user = decoded;
        req.userData = user;

        logger.info(`User token verified successfully: ${decoded.id}`);
        next();
    } catch (error) {
        if (error.name === "TokenExpiredError") {
            logger.warn(`User token verification failed - Token expired`);
            return errorResponse(res, 401, "Access token expired. Use refresh token to get new token.");
        }
        logger.error(`User token verification error: ${error.message}`);
        return errorResponse(res, 401, "Invalid access token");
    }
};

// Verify User Email Verification
export const verifyUserEmailVerified = async (req, res, next) => {
    try {
        if (!req.userData?.isEmailVerified) {
            logger.warn(`User email verification check failed - Email not verified: ${req.user?.id}`);
            return errorResponse(res, 403, "Please verify your email to access this resource");
        }
        logger.info(`User email verification check passed: ${req.user?.id}`);
        next();
    } catch (error) {
        logger.error(`Email verification check error: ${error.message}`);
        return errorResponse(res, 500, "Email verification check error");
    }
};

// Verify User Active Status
export const verifyUserActive = async (req, res, next) => {
    try {
        if (!req.userData?.isActive) {
            logger.warn(`User active status check failed - User inactive: ${req.user?.id}`);
            return errorResponse(res, 403, "User account is inactive");
        }
        logger.info(`User active status check passed: ${req.user?.id}`);
        next();
    } catch (error) {
        logger.error(`Active status check error: ${error.message}`);
        return errorResponse(res, 500, "Active status check error");
    }
};

/**
 * Combined middleware for full user authentication and verification
 * Checks: Token validity, user existence, active status, email verification
 */
export const authenticateUser = [
    verifyUserToken,
    verifyUserEmailVerified,
    verifyUserActive
];

export default {
    verifyUserToken,
    verifyUserEmailVerified,
    verifyUserActive,
    authenticateUser
};
