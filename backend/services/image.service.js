import { updateImage, deleteImage } from "./r2.service.js";
import logger from "../configs/logger.config.js";

/**
 * Image Service
 * Handles common image operations
 */

/**
 * Update image for a document
 * @param {Model} Model - The mongoose model
 * @param {String} documentId - Document ID
 * @param {Buffer} fileBuffer - File buffer
 * @param {Function} uploadFunction - Upload function
 * @param {String} entityType - Entity type
 * @param {String} name - Name for the file
 * @param {String} imageField - Image field name (default: 'thumbnail')
 * @returns {Object} - Upload result
 */
export const updateDocumentImage = async (
    Model,
    documentId,
    fileBuffer,
    uploadFunction,
    entityType,
    name,
    imageField = 'thumbnail'
) => {
    const document = await Model.findById(documentId);
    if (!document) throw new Error(`${Model.modelName} not found`);

    const oldPublicId = document[imageField]?.public_id || null;

    try {
        const uploadResult = await updateImage(
            oldPublicId, fileBuffer, uploadFunction, entityType, name
        );
        return uploadResult;
    } catch (error) {
        logger.error(`Image update failed for ${Model.modelName} ${documentId}: ${error.message}`);
        throw error;
    }
};

/**
 * Delete image from a document
 * @param {Model} Model - The mongoose model
 * @param {String} documentId - Document ID
 * @param {String} imageField - Image field name (default: 'thumbnail')
 * @returns {Object} - Deletion result
 */
export const deleteDocumentImage = async (Model, documentId, imageField = 'thumbnail') => {
    const document = await Model.findById(documentId);
    if (!document) throw new Error(`${Model.modelName} not found`);

    if (!document[imageField]?.public_id) {
        throw new Error(`No ${imageField} to delete`);
    }

    const deleteResult = await deleteImage(document[imageField].public_id);
    if (deleteResult.result === "ok") {
        document[imageField] = null;
        await document.save({ validateBeforeSave: false });
        return { success: true, message: `${imageField} deleted successfully` };
    }

    throw new Error(`Failed to delete ${imageField}`);
};

/**
 * Upload image for new document
 * @param {Buffer} fileBuffer - File buffer
 * @param {Function} uploadFunction - Upload function
 * @param {String} entityType - Entity type
 * @param {String} name - Name for the file
 * @returns {Object} - Upload result
 */
export const uploadNewImage = async (fileBuffer, uploadFunction, entityType, name) => {
    try {
        const uploadResult = await uploadFunction(fileBuffer, entityType, name);
        return {
            public_id: uploadResult.public_id,
            secure_url: uploadResult.secure_url
        };
    } catch (error) {
        logger.error(`Image upload failed for ${entityType} ${name}: ${error.message}`);
        throw error;
    }
};