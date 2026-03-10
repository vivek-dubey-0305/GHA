import { asyncHandler } from "../middlewares/async.middleware.js";
import { errorResponse, successResponse } from "../utils/response.utils.js";
import { getPagination, createPaginationResponse } from "../utils/pagination.utils.js";
import { updateImage, deleteImage, deleteRawResource } from "../services/r2.service.js";
import { deleteVideo as deleteBunnyVideo } from "../services/bunny.service.js";
import logger from "../configs/logger.config.js";

/**
 * Admin Resource Service
 * Generates standard CRUD handlers for admin resource management.
 * Eliminates boilerplate for modules, lessons, enrollments, payments,
 * reviews, assignments, submissions, certificates, live classes,
 * video packages, materials, and progress.
 */

/**
 * Generate admin CRUD handlers for a model
 * @param {Model} Model - Mongoose model
 * @param {Object} config - Configuration
 * @param {string} config.resourceName - Display name (e.g. "Module")
 * @param {string} config.resourceKey - Key for response (e.g. "modules")
 * @param {number} [config.defaultLimit=20] - Default pagination limit
 * @param {Function} [config.buildFilter] - (req.query) => filter object
 * @param {Array} [config.listPopulate] - Populate options for list
 * @param {Array} [config.detailPopulate] - Populate options for detail
 * @param {Object} [config.listSort] - Sort for list query
 * @param {Object} [config.imageConfig] - { field, uploadFn } for thumbnail handling
 * @param {Function} [config.beforeCreate] - async (data, req) => modified data
 * @param {Function} [config.afterCreate] - async (doc, req) => void
 * @param {Function} [config.beforeDelete] - async (doc, req) => void (cleanup)
 * @returns {Object} { getAll, getById, create, update, delete }
 */
export const generateAdminResourceHandlers = (Model, config) => {
    const {
        resourceName,
        resourceKey,
        defaultLimit = 20,
        buildFilter = () => ({}),
        listPopulate = [],
        detailPopulate = [],
        listSort = { createdAt: -1 },
        imageConfig = null,
        beforeCreate = null,
        afterCreate = null,
        beforeDelete = null,
    } = config;

    return {
        // ── GET ALL ──
        getAll: asyncHandler(async (req, res) => {
            const { page, limit, skip } = getPagination(req.query, defaultLimit);
            const filter = buildFilter(req.query);

            const total = await Model.countDocuments(filter);
            let query = Model.find(filter);
            for (const pop of listPopulate) query = query.populate(pop);
            const docs = await query.skip(skip).limit(limit).sort(listSort);

            successResponse(res, 200, `${resourceName}s retrieved successfully`, {
                [resourceKey]: docs,
                pagination: createPaginationResponse(total, page, limit)
            });
        }),

        // ── GET BY ID ──
        getById: asyncHandler(async (req, res) => {
            let query = Model.findById(req.params.id);
            for (const pop of detailPopulate) query = query.populate(pop);
            const doc = await query;

            if (!doc) return errorResponse(res, 404, `${resourceName} not found`);
            successResponse(res, 200, `${resourceName} retrieved successfully`, doc);
        }),

        // ── CREATE ──
        create: asyncHandler(async (req, res) => {
            let data = req.file ? JSON.parse(req.body.data || "{}") : req.body;

            // Handle image upload
            if (req.file && imageConfig) {
                try {
                    const result = await imageConfig.uploadFn(req.file.buffer, data.title || resourceName.toLowerCase());
                    data[imageConfig.field || "thumbnail"] = { public_id: result.public_id, secure_url: result.secure_url };
                } catch (error) {
                    logger.error(`${resourceName} image upload failed: ${error.message}`);
                }
            }

            if (beforeCreate) data = await beforeCreate(data, req);

            const doc = await Model.create(data);

            if (afterCreate) await afterCreate(doc, req);

            successResponse(res, 201, `${resourceName} created successfully`, doc);
        }),

        // ── UPDATE ──
        update: asyncHandler(async (req, res) => {
            const data = req.file ? JSON.parse(req.body.data || "{}") : req.body;

            // Handle image update
            if (req.file && imageConfig) {
                const existing = await Model.findById(req.params.id);
                if (!existing) return errorResponse(res, 404, `${resourceName} not found`);
                const oldPublicId = existing[imageConfig.field || "thumbnail"]?.public_id || null;
                try {
                    const result = await updateImage(oldPublicId, req.file.buffer, imageConfig.uploadFn, data.title || existing.title);
                    data[imageConfig.field || "thumbnail"] = { public_id: result.public_id, secure_url: result.secure_url };
                } catch (error) {
                    logger.error(`${resourceName} image update failed: ${error.message}`);
                }
            }

            const doc = await Model.findByIdAndUpdate(req.params.id, data, { new: true, runValidators: true });
            if (!doc) return errorResponse(res, 404, `${resourceName} not found`);
            successResponse(res, 200, `${resourceName} updated successfully`, doc);
        }),

        // ── DELETE ──
        delete: asyncHandler(async (req, res) => {
            const doc = await Model.findById(req.params.id);
            if (!doc) return errorResponse(res, 404, `${resourceName} not found`);

            // Clean up image if applicable
            if (imageConfig && doc[imageConfig.field || "thumbnail"]?.public_id) {
                await deleteImage(doc[imageConfig.field || "thumbnail"].public_id).catch(() => {});
            }

            if (beforeDelete) await beforeDelete(doc, req);

            await Model.findByIdAndDelete(req.params.id);
            successResponse(res, 200, `${resourceName} deleted successfully`);
        }),
    };
};
