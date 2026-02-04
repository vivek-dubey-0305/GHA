/**
 * Response Utility Functions
 * Standardized API response format
 */

// Success Response
export const successResponse = (res, statusCode = 200, message = "Success", data = null) => {
    return res.status(statusCode).json({
        status: "success",
        statusCode,
        message,
        data: data || {},
        timestamp: new Date().toISOString()
    });
};

// Error Response
export const errorResponse = (res, statusCode = 500, message = "Internal Server Error", error = null) => {
    return res.status(statusCode).json({
        status: "error",
        statusCode,
        message,
        error: error || null,
        timestamp: new Date().toISOString()
    });
};

// Validation Error Response
export const validationErrorResponse = (res, errors = []) => {
    return res.status(400).json({
        status: "validation_error",
        statusCode: 400,
        message: "Validation failed",
        errors,
        timestamp: new Date().toISOString()
    });
};

// Pagination Response
export const paginationResponse = (res, data = [], page = 1, limit = 10, total = 0) => {
    const totalPages = Math.ceil(total / limit);
    return res.status(200).json({
        status: "success",
        statusCode: 200,
        message: "Data retrieved successfully",
        data,
        pagination: {
            page,
            limit,
            total,
            totalPages,
            hasNextPage: page < totalPages,
            hasPrevPage: page > 1
        },
        timestamp: new Date().toISOString()
    });
};
