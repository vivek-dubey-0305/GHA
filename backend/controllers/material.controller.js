import { Material } from "../models/material.model.js";
import { Course } from "../models/course.model.js";
import { Enrollment } from "../models/enrollment.model.js";
import { asyncHandler } from "../middlewares/async.middleware.js";
import { errorResponse, successResponse } from "../utils/response.utils.js";
import { getPagination, createPaginationResponse } from "../utils/pagination.utils.js";
import { isInstructorMaterialOwner } from "../services/ownership.service.js";
import logger from "../configs/logger.config.js";

/**
 * Material Controller
 * Handles course material CRUD and management
 */

// @route   GET /api/v1/courses/:courseId/materials
// @desc    Get all materials for a course (access level checks)
// @access  Private (Enrolled user / Instructor owner)
export const getCourseMaterials = asyncHandler(async (req, res) => {
    const { page, limit, skip } = getPagination(req.query, 20);

    const course = await Course.findById(req.params.courseId).select("instructor");
    if (!course) return errorResponse(res, 404, "Course not found");

    const filter = { course: req.params.courseId, status: "published" };

    if (req.query.type) filter.type = req.query.type;
    if (req.query.moduleId) filter.module = req.query.moduleId;
    if (req.query.lessonId) filter.lesson = req.query.lessonId;

    // Access rules:
    // - Public: only materials explicitly public
    // - Enrolled users: enrolled_students + public
    // - Instructor owner: all published materials for the course
    const isInstructorOwner = !!req.instructor && course.instructor?.toString() === req.instructor.id;
    let isEnrolled = false;
    if (!isInstructorOwner && req.user?.id) {
        isEnrolled = await Enrollment.isUserEnrolled(req.user.id, req.params.courseId);
    }

    if (!isInstructorOwner) {
        if (isEnrolled) {
            filter.$or = [
                { accessLevel: "enrolled_students" },
                { accessLevel: "public" },
                { isPublic: true },
            ];
        } else {
            filter.$or = [
                { accessLevel: "public" },
                { isPublic: true },
            ];
        }
    }

    const total = await Material.countDocuments(filter);
    const materials = await Material.find(filter)
        .populate("instructor", "firstName lastName")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

    successResponse(res, 200, "Materials retrieved successfully", {
        materials,
        pagination: createPaginationResponse(total, page, limit)
    });
});

// @route   GET /api/v1/materials/:id
// @desc    Get material details
// @access  Private
export const getMaterial = asyncHandler(async (req, res) => {
    const material = await Material.findById(req.params.id)
        .populate("instructor", "firstName lastName")
        .populate("course", "title")
        .populate("module", "title")
        .populate("lesson", "title");

    if (!material) return errorResponse(res, 404, "Material not found");

    successResponse(res, 200, "Material retrieved successfully", material);
});

// @route   POST /api/v1/materials
// @desc    Create a new material
// @access  Private (Instructor)
export const createMaterial = asyncHandler(async (req, res) => {
    const materialData = req.body;

    // Verify course ownership
    const isOwner = await isInstructorMaterialOwner(req.instructor.id, materialData.courseId);
    if (!isOwner) {
        return errorResponse(res, 403, "You can only create materials for your own courses");
    }

    materialData.instructor = req.instructor.id;
    materialData.course = materialData.courseId;
    if (materialData.moduleId) materialData.module = materialData.moduleId;
    if (materialData.lessonId) materialData.lesson = materialData.lessonId;
    delete materialData.courseId;
    delete materialData.moduleId;
    delete materialData.lessonId;

    const material = await Material.create(materialData);

    successResponse(res, 201, "Material created successfully", material);
});

// @route   PUT /api/v1/materials/:id
// @desc    Update a material
// @access  Private (Instructor - owner)
export const updateMaterial = asyncHandler(async (req, res) => {
    const material = await Material.findById(req.params.id);
    if (!material) return errorResponse(res, 404, "Material not found");

    const isOwner = await isInstructorMaterialOwner(req.instructor.id, req.params.id);
    if (!isOwner) {
        return errorResponse(res, 403, "You can only update your own materials");
    }

    const updated = await Material.findByIdAndUpdate(req.params.id, req.body, {
        new: true, runValidators: true
    });

    successResponse(res, 200, "Material updated successfully", updated);
});

// @route   DELETE /api/v1/materials/:id
// @desc    Delete a material
// @access  Private (Instructor - owner)
export const deleteMaterial = asyncHandler(async (req, res) => {
    const material = await Material.findById(req.params.id);
    if (!material) return errorResponse(res, 404, "Material not found");

    const isOwner = await isInstructorMaterialOwner(req.instructor.id, req.params.id);
    if (!isOwner) {
        return errorResponse(res, 403, "You can only delete your own materials");
    }

    await Material.findByIdAndDelete(req.params.id);

    successResponse(res, 200, "Material deleted successfully");
});

// @route   PATCH /api/v1/materials/:id/publish
// @desc    Publish a material
// @access  Private (Instructor - owner)
export const publishMaterial = asyncHandler(async (req, res) => {
    const material = await Material.findById(req.params.id);
    if (!material) return errorResponse(res, 404, "Material not found");

    const isOwner = await isInstructorMaterialOwner(req.instructor.id, req.params.id);
    if (!isOwner) {
        return errorResponse(res, 403, "You can only publish your own materials");
    }

    await material.publish();

    successResponse(res, 200, "Material published successfully");
});

// @route   PATCH /api/v1/materials/:id/archive
// @desc    Archive a material
// @access  Private (Instructor - owner)
export const archiveMaterial = asyncHandler(async (req, res) => {
    const material = await Material.findById(req.params.id);
    if (!material) return errorResponse(res, 404, "Material not found");

    const isOwner = await isInstructorMaterialOwner(req.instructor.id, req.params.id);
    if (!isOwner) {
        return errorResponse(res, 403, "You can only archive your own materials");
    }

    await material.archive();

    successResponse(res, 200, "Material archived successfully");
});

// @route   PATCH /api/v1/materials/:id/download
// @desc    Record a material download
// @access  Private (User - enrolled)
export const downloadMaterial = asyncHandler(async (req, res) => {
    const material = await Material.findById(req.params.id);
    if (!material) return errorResponse(res, 404, "Material not found");

    // Verify enrollment
    const isEnrolled = await Enrollment.isUserEnrolled(req.user.id, material.course);
    if (!isEnrolled) {
        return errorResponse(res, 403, "You must be enrolled in the course to download materials");
    }

    await material.incrementDownload();

    successResponse(res, 200, "Download recorded", { fileUrl: material.fileUrl });
});

// @route   PATCH /api/v1/materials/:id/view
// @desc    Record a material view
// @access  Private (User - enrolled)
export const viewMaterial = asyncHandler(async (req, res) => {
    const material = await Material.findById(req.params.id);
    if (!material) return errorResponse(res, 404, "Material not found");

    await material.incrementView();

    successResponse(res, 200, "View recorded");
});

// @route   GET /api/v1/materials/search
// @desc    Search materials
// @access  Private
export const searchMaterials = asyncHandler(async (req, res) => {
    const { query, courseId, type } = req.query;
    const { page, limit, skip } = getPagination(req.query, 20);

    if (!query) return errorResponse(res, 400, "Search query is required");

    const filter = {
        $text: { $search: query },
        status: "published"
    };

    if (courseId) filter.course = courseId;
    if (type) filter.type = type;

    const total = await Material.countDocuments(filter);
    const materials = await Material.find(filter)
        .populate("instructor", "firstName lastName")
        .populate("course", "title")
        .sort({ score: { $meta: "textScore" } })
        .skip(skip)
        .limit(limit);

    successResponse(res, 200, "Search results", {
        materials,
        pagination: createPaginationResponse(total, page, limit)
    });
});
