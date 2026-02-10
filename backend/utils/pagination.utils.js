/**
 * Pagination Utility
 * Provides reusable pagination logic for API endpoints
 */

/**
 * Get pagination parameters from request query
 * @param {Object} query - Request query object
 * @param {number} defaultLimit - Default number of items per page
 * @returns {Object} Pagination object with page, limit, skip, and pagination info
 */
export const getPagination = (query, defaultLimit = 10) => {
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || defaultLimit;
    const skip = (page - 1) * limit;

    return {
        page,
        limit,
        skip,
        pagination: {
            page,
            limit,
            skip
        }
    };
};

/**
 * Create pagination response metadata
 * @param {number} totalItems - Total number of items
 * @param {number} page - Current page
 * @param {number} limit - Items per page
 * @returns {Object} Pagination metadata
 */
export const createPaginationResponse = (totalItems, page, limit) => {
    const totalPages = Math.ceil(totalItems / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return {
        currentPage: page,
        totalPages,
        totalItems,
        itemsPerPage: limit,
        hasNextPage,
        hasPrevPage,
        nextPage: hasNextPage ? page + 1 : null,
        prevPage: hasPrevPage ? page - 1 : null
    };
};
