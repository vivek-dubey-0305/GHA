//error middleware
import logger from "../configs/logger.config.js";

class ErrorHandler extends Error {
    constructor(message, statusCode) {
        super(message)
        this.statusCode = statusCode
    }
}

export const errorMiddleware = (err, req, res, next) => {
    err.statusCode = err.statusCode || 500
    err.message = err.message || "Internal Server Error"

    logger.error(`Error ${err.statusCode}: ${err.message}`);

    //* Mongoose Cast Error
    if (err.name == "CastError") {
        const message = `Invalid ${err.path}`
        err = new ErrorHandler(message, 400)
    }

    //* Mongoose Validation Error
    if (err.name === "ValidationError") {
        const rawErrors = err?.errors && typeof err.errors === "object" ? Object.values(err.errors) : [];
        const messages = rawErrors.map((e) => e?.message).filter(Boolean);
        const message = `Validation failed: ${messages.join(", ")}`;
        err = new ErrorHandler(message, 400);
    }

    //* express-rate-limit / general validation style errors
    if (err.code === "ERR_ERL_UNEXPECTED_X_FORWARDED_FOR") {
        err = new ErrorHandler("Server proxy configuration error", 500)
    }

    //* JWT Token
    if (err.name == "JsonWebTokenError") {
        const message = `Invalid JSON Web Token, try again!`
        err = new ErrorHandler(message, 400)
    }

    //* JWT Expired
    if (err.name == "TokenExpiredError") {
        const message = `JSON Web Token is expired, try again!`
        err = new ErrorHandler(message, 400)
    }

    //* Duplicate mongoose error
    if (err.code == 11000) {
        const fields = err?.keyValue ? Object.keys(err.keyValue).join(", ") : "unique field";
        const message = `Duplicate value entered for field: ${fields}`;
        err = new ErrorHandler(message, 400)
    }

    return res.status(err.statusCode).json({
        success: false,
        message: err.message,
    })

}

export default ErrorHandler