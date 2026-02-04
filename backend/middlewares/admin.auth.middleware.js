import jwt from "jsonwebtoken";
import { Admin } from "../models/admin.model.js";
import { errorResponse } from "../utils/response.utils.js";

/**
 * Admin Authentication Middleware
 * Verifies JWT tokens and validates admin access
 */

// Verify Admin Token
export const verifyAdminToken = async (req, res, next) => {
    try {
        let token = req.cookies?.accessToken || req.headers.authorization?.split(" ")[1];

        if (!token) {
            return errorResponse(res, 401, "Access token not found. Please login.");
        }

        // Verify token
        const decoded = jwt.verify(
            token,
            process.env.JWT_ACCESS_TOKEN_SECRET || "your_jwt_secret"
        );

        // Find admin
        const admin = await Admin.findById(decoded.id);

        if (!admin || !admin.isActive) {
            return errorResponse(res, 403, "Admin not found or inactive");
        }

        // Attach admin to request
        req.admin = decoded;
        req.adminData = admin;

        next();
    } catch (error) {
        if (error.name === "TokenExpiredError") {
            return errorResponse(res, 401, "Access token expired. Use refresh token to get new token.");
        }
        return errorResponse(res, 401, "Invalid access token");
    }
};

// Verify Super Admin
export const verifySuperAdmin = async (req, res, next) => {
    try {
        if (!req.adminData?.isSuperAdmin) {
            return errorResponse(res, 403, "Only super admin can access this resource");
        }
        next();
    } catch (error) {
        return errorResponse(res, 500, "Authentication error");
    }
};

// Verify Admin Permissions
export const verifyAdminPermission = (requiredPermissions = []) => {
    return async (req, res, next) => {
        try {
            if (!req.adminData) {
                return errorResponse(res, 401, "Admin not authenticated");
            }

            if (req.adminData.isSuperAdmin) {
                return next(); // Super admin has all permissions
            }

            const hasPermission = requiredPermissions.some(permission =>
                req.adminData.permissions?.includes(permission)
            );

            if (!hasPermission) {
                return errorResponse(
                    res,
                    403,
                    `Insufficient permissions. Required: ${requiredPermissions.join(", ")}`
                );
            }

            next();
        } catch (error) {
            return errorResponse(res, 500, "Permission verification error");
        }
    };
};

// Verify OTP Before Token Generation (Optional: for extra security)
export const verifyOtpStatus = async (req, res, next) => {
    try {
        if (!req.adminData?.isOtpVerified) {
            return errorResponse(res, 403, "OTP verification required");
        }
        next();
    } catch (error) {
        return errorResponse(res, 500, "OTP status verification error");
    }
};
