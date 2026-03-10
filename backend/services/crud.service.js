import { getPagination, createPaginationResponse } from "../utils/pagination.utils.js";
import logger from "../configs/logger.config.js";

/**
 * CRUD Service
 * Handles generic CRUD operations for admin controllers
 */

/**
 * Get all documents with pagination
 * @param {Model} Model - The mongoose model
 * @param {Object} req - Express request object
 * @param {Number} defaultLimit - Default items per page
 * @param {Object} additionalFilter - Additional filter criteria
 * @param {Object} populateOptions - Population options
 * @param {Object} sortOptions - Sort options
 * @returns {Object} - Paginated results
 */
export const getAllDocuments = async (
    Model,
    req,
    defaultLimit = 10,
    additionalFilter = {},
    populateOptions = [],
    sortOptions = { createdAt: -1 }
) => {
    logger.info(`Fetching all ${Model.modelName}s with pagination`);

    const { page, limit, skip } = getPagination(req.query, defaultLimit);

    const filter = { ...additionalFilter };

    // Add search functionality if search query exists
    if (req.query.search) {
        const searchRegex = new RegExp(req.query.search, "i");
        filter.$or = [
            { title: searchRegex },
            { name: searchRegex },
            { firstName: searchRegex },
            { lastName: searchRegex },
            { email: searchRegex }
        ].filter(condition => Object.keys(condition)[0] in Model.schema.paths);
    }

    // Get total count for pagination
    const total = await Model.countDocuments(filter);

    // Build query
    let query = Model.find(filter).sort(sortOptions).skip(skip).limit(limit);

    // Apply population if provided
    if (populateOptions && populateOptions.length > 0) {
        populateOptions.forEach(populate => {
            query = query.populate(populate);
        });
    }

    const documents = await query;

    const pagination = createPaginationResponse(total, page, limit);

    return { documents, pagination };
};

/**
 * Get document by ID
 * @param {Model} Model - The mongoose model
 * @param {String} id - Document ID
 * @param {Array} populateOptions - Population options
 * @returns {Object} - Document data
 */
export const getDocumentById = async (Model, id, populateOptions = []) => {
    logger.info(`Fetching ${Model.modelName}: ${id}`);

    let query = Model.findById(id);

    // Apply population if provided
    if (populateOptions && populateOptions.length > 0) {
        populateOptions.forEach(populate => {
            query = query.populate(populate);
        });
    }

    const document = await query;
    return document;
};

/**
 * Create a new document
 * @param {Model} Model - The mongoose model
 * @param {Object} data - Document data
 * @param {Object} req - Express request object (for file uploads)
 * @param {Function} uploadFunction - Upload function for images
 * @param {String} entityType - Entity type for logging
 * @returns {Object} - Created document
 */
export const createDocument = async (Model, data, req = null, uploadFunction = null, entityType = "") => {
    logger.info(`Creating ${entityType || Model.modelName}: ${data.email || data.title || data.name || 'unknown'}`);

    const documentData = { ...data };

    // Parse JSON strings for object fields (when sent as FormData)
    const objectFields = ['address', 'preferences', 'learningProgress', 'content', 'requirements', 'objectives'];
    objectFields.forEach(field => {
        if (documentData[field] && typeof documentData[field] === 'string') {
            try {
                documentData[field] = JSON.parse(documentData[field]);
            } catch (error) {
                logger.warn(`Failed to parse ${field} as JSON: ${documentData[field]}`);
            }
        }
    });

    // Handle file upload if provided
    if (req?.file && uploadFunction) {
        const name = `${documentData.firstName || documentData.title || documentData.name || 'unknown'}`.replace(/\s+/g, "_");
        logger.info(`Uploading file for new ${entityType || Model.modelName}: ${name}`);

        try {
            const uploadResult = await uploadFunction(req.file.buffer, entityType || Model.modelName, name);
            documentData.profilePicture = {
                public_id: uploadResult.public_id,
                secure_url: uploadResult.secure_url
            };
        } catch (error) {
            logger.error(`File upload failed for new ${entityType || Model.modelName}: ${error.message}`);
        }
    }

    // Hash password if provided and model has password field
    if (documentData.password && Model.schema.paths.password) {
        const bcrypt = (await import('bcrypt')).default;
        documentData.password = await bcrypt.hash(documentData.password, 12);
    }

    const document = await Model.create(documentData);
    return document;
};

/**
 * Update a document by ID
 * @param {Model} Model - The mongoose model
 * @param {String} id - Document ID
 * @param {Object} updateData - Update data
 * @param {Object} req - Express request object (for file uploads)
 * @param {Function} updateImageFunction - Update image function
 * @param {Function} uploadFunction - Upload function
 * @param {String} entityType - Entity type for logging
 * @returns {Object} - Updated document
 */
export const updateDocument = async (
    Model,
    id,
    updateData,
    req = null,
    updateImageFunction = null,
    uploadFunction = null,
    entityType = ""
) => {
    logger.info(`Updating ${Model.modelName}: ${id}`);

    const data = { ...updateData };

    // Parse JSON strings for object fields (when sent as FormData)
    const objectFields = ['address', 'preferences', 'learningProgress', 'content', 'requirements', 'objectives'];
    objectFields.forEach(field => {
        if (data[field] && typeof data[field] === 'string') {
            try {
                data[field] = JSON.parse(data[field]);
            } catch (error) {
                logger.warn(`Failed to parse ${field} as JSON: ${data[field]}`);
            }
        }
    });

    // Handle file update if provided
    if (req?.file && updateImageFunction && uploadFunction) {
        const document = await Model.findById(id);
        if (!document) throw new Error(`${Model.modelName} not found`);

        const name = `${document.firstName || document.title || document.name || 'unknown'}`.replace(/\s+/g, "_");
        const oldPublicId = document.profilePicture?.public_id || null;

        try {
            const uploadResult = await updateImageFunction(
                oldPublicId, req.file.buffer, uploadFunction, entityType || Model.modelName, name
            );
            data.profilePicture = {
                public_id: uploadResult.public_id,
                secure_url: uploadResult.secure_url
            };
        } catch (error) {
            logger.error(`File update failed for ${Model.modelName} ${id}: ${error.message}`);
        }
    }

    const document = await Model.findByIdAndUpdate(id, data, {
        new: true,
        runValidators: true
    });

    return document;
};

/**
 * Delete a document by ID
 * @param {Model} Model - The mongoose model
 * @param {String} id - Document ID
 * @param {Function} deleteImageFunction - Delete image function
 * @param {String} imageField - Image field name (default: 'profilePicture')
 * @returns {Object} - Deletion result
 */
export const deleteDocument = async (Model, id, deleteImageFunction = null, imageField = 'profilePicture') => {
    logger.info(`Deleting ${Model.modelName}: ${id}`);

    const document = await Model.findById(id);
    if (!document) throw new Error(`${Model.modelName} not found`);

    // Delete associated image if exists
    if (deleteImageFunction && document[imageField]?.public_id) {
        try {
            await deleteImageFunction(document[imageField].public_id);
        } catch (error) {
            logger.warn(`Failed to delete image for ${Model.modelName} ${id}: ${error.message}`);
        }
    }

    await Model.findByIdAndDelete(id);
    return { success: true, message: `${Model.modelName} deleted successfully` };
};