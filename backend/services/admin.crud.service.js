import { getAllDocuments, getDocumentById, createDocument, updateDocument, deleteDocument } from "./crud.service.js";
import { errorResponse, successResponse } from "../utils/response.utils.js";
import { asyncHandler } from "../middlewares/async.middleware.js";

/**
 * Admin CRUD Service
 * Provides generic CRUD operations for admin controllers
 */

/**
 * Generate CRUD handlers for a model
 * @param {Model} Model - The mongoose model
 * @param {Object} options - Configuration options
 * @returns {Object} - CRUD handlers
 */
export const generateCrudHandlers = (Model, options = {}) => {
    const {
        uploadFunction = null,
        updateImageFunction = null,
        deleteImageFunction = null,
        entityType = Model.modelName,
        defaultLimit = 10,
        populateOptions = [],
        imageField = 'profilePicture'
    } = options;

    return {
        // Get all documents
        getAll: asyncHandler(async (req, res) => {
            const { documents, pagination } = await getAllDocuments(
                Model,
                req,
                defaultLimit,
                {},
                populateOptions
            );

            successResponse(res, 200, `${entityType}s retrieved successfully`, {
                [entityType.toLowerCase() + 's']: documents,
                pagination
            });
        }),

        // Get document by ID
        getById: asyncHandler(async (req, res) => {
            const document = await getDocumentById(Model, req.params.id, populateOptions);

            if (!document) {
                return errorResponse(res, 404, `${entityType} not found`);
            }

            successResponse(res, 200, `${entityType} retrieved successfully`, document);
        }),

        // Create document
        create: asyncHandler(async (req, res) => {
            const document = await createDocument(Model, req.body, req, uploadFunction, entityType);
            successResponse(res, 201, `${entityType} created successfully`, document);
        }),

        // Update document
        update: asyncHandler(async (req, res) => {
            const document = await updateDocument(
                Model,
                req.params.id,
                req.body,
                req,
                updateImageFunction,
                uploadFunction,
                entityType
            );

            if (!document) {
                return errorResponse(res, 404, `${entityType} not found`);
            }

            successResponse(res, 200, `${entityType} updated successfully`, document);
        }),

        // Delete document
        delete: asyncHandler(async (req, res) => {
            try {
                const result = await deleteDocument(Model, req.params.id, deleteImageFunction, imageField);
                successResponse(res, 200, result.message);
            } catch (error) {
                return errorResponse(res, 404, error.message);
            }
        })
    };
};