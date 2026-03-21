import { Instructor } from "../models/instructor.model.js";
import { Course } from "../models/course.model.js";
import { LiveClass } from "../models/liveclass.model.js";
import { VideoPackage } from "../models/videopackage.model.js";
import { Material } from "../models/material.model.js";
import { Enrollment } from "../models/enrollment.model.js";
import { Review } from "../models/review.model.js";
import { Assignment } from "../models/assignment.model.js";
import { Submission } from "../models/submission.model.js";
import { asyncHandler } from "../middlewares/async.middleware.js";
import { errorResponse, successResponse } from "../utils/response.utils.js";
import { getPagination, createPaginationResponse } from "../utils/pagination.utils.js";
import {
    getInstructorProfile,
    updateInstructorProfile,
    updateInstructorProfessionalInfo,
    addSpecialization,
    updateSpecialization,
    removeSpecialization,
    addSkill,
    removeSkill,
    addWorkExperience,
    removeWorkExperience,
    addQualification,
    removeQualification,
    addAchievement,
    removeAchievement,
    updateInstructorPreferences,
    deleteInstructorProfilePicture,
    deleteInstructorBannerImage
} from "../services/instructor.profile.service.js";

/**
 * Instructor Self-Management Controller
 * Handles profile, dashboard, courses, live classes, video packages, materials, earnings
 */

// ========================= PROFILE MANAGEMENT =========================

// @route   GET /api/v1/instructor/profile
// @desc    Get own profile
// @access  Private (Instructor)
export const getMyProfile = asyncHandler(async (req, res) => {
    const instructor = await getInstructorProfile(Instructor, req.instructor.id);
    if (!instructor) return errorResponse(res, 404, "Instructor not found");

    successResponse(res, 200, "Profile retrieved successfully", instructor);
});

// @route   PUT /api/v1/instructor/profile
// @desc    Update own profile (with optional profile picture via form-data)
// @access  Private (Instructor)
export const updateMyProfile = asyncHandler(async (req, res) => {
    const instructor = await updateInstructorProfile(
        Instructor,
        req.instructor.id,
        req.body,
        req.file
    );

    if (!instructor) return errorResponse(res, 404, "Instructor not found");

    successResponse(res, 200, "Profile updated successfully", instructor);
});

// @route   DELETE /api/v1/instructor/profile-picture
// @desc    Delete own profile picture
// @access  Private (Instructor)
export const deleteMyProfilePicture = asyncHandler(async (req, res) => {
    try {
        const result = await deleteInstructorProfilePicture(Instructor, req.instructor.id);
        successResponse(res, 200, result.message);
    } catch (error) {
        return errorResponse(res, 404, error.message);
    }
});

// ========================= PREFERENCES =========================

// @route   PUT /api/v1/instructor/preferences
// @desc    Update instructor preferences
// @access  Private (Instructor)
export const updatePreferences = asyncHandler(async (req, res) => {
    const preferences = await updateInstructorPreferences(Instructor, req.instructor.id, req.body);
    
    if (!preferences) return errorResponse(res, 404, "Instructor not found");

    successResponse(res, 200, "Preferences updated successfully", preferences);
});

// ========================= PROFESSIONAL PROFILE =========================

// @route   PUT /api/v1/instructor/professional-info
// @desc    Update professional info (title, bio, specializations, skills, etc)
// @access  Private (Instructor)
export const updateProfessionalInfo = asyncHandler(async (req, res) => {
    const instructor = await updateInstructorProfessionalInfo(
        Instructor,
        req.instructor.id,
        req.body
    );

    if (!instructor) return errorResponse(res, 404, "Instructor not found");

    successResponse(res, 200, "Professional information updated successfully", instructor);
});

// ========================= SPECIALIZATIONS =========================

// @route   POST /api/v1/instructor/specializations
// @desc    Add a specialization
// @access  Private (Instructor)
export const addSpecializationHandler = asyncHandler(async (req, res) => {
    const instructor = await addSpecialization(Instructor, req.instructor.id, req.body);
    if (!instructor) return errorResponse(res, 404, "Instructor not found");
    successResponse(res, 201, "Specialization added successfully", instructor.specializations);
});

// @route   PUT /api/v1/instructor/specializations/:id
// @desc    Update a specialization
// @access  Private (Instructor)
export const updateSpecializationHandler = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const instructor = await updateSpecialization(Instructor, req.instructor.id, id, req.body);
    if (!instructor) return errorResponse(res, 404, "Instructor not found");
    successResponse(res, 200, "Specialization updated successfully", instructor.specializations);
});

// @route   DELETE /api/v1/instructor/specializations/:id
// @desc    Remove a specialization
// @access  Private (Instructor)
export const removeSpecializationHandler = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const instructor = await removeSpecialization(Instructor, req.instructor.id, id);
    if (!instructor) return errorResponse(res, 404, "Instructor not found");
    successResponse(res, 200, "Specialization removed successfully", instructor.specializations);
});

// ========================= SKILLS =========================

// @route   POST /api/v1/instructor/skills
// @desc    Add a skill
// @access  Private (Instructor)
export const addSkillHandler = asyncHandler(async (req, res) => {
    const instructor = await addSkill(Instructor, req.instructor.id, req.body);
    if (!instructor) return errorResponse(res, 404, "Instructor not found");
    successResponse(res, 201, "Skill added successfully", instructor.skills);
});

// @route   DELETE /api/v1/instructor/skills/:id
// @desc    Remove a skill
// @access  Private (Instructor)
export const removeSkillHandler = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const instructor = await removeSkill(Instructor, req.instructor.id, id);
    if (!instructor) return errorResponse(res, 404, "Instructor not found");
    successResponse(res, 200, "Skill removed successfully", instructor.skills);
});

// ========================= WORK EXPERIENCE =========================

// @route   POST /api/v1/instructor/work-experience
// @desc    Add work experience
// @access  Private (Instructor)
export const addWorkExperienceHandler = asyncHandler(async (req, res) => {
    const instructor = await addWorkExperience(Instructor, req.instructor.id, req.body);
    if (!instructor) return errorResponse(res, 404, "Instructor not found");
    successResponse(res, 201, "Work experience added successfully", instructor.workExperience);
});

// @route   DELETE /api/v1/instructor/work-experience/:id
// @desc    Remove work experience
// @access  Private (Instructor)
export const removeWorkExperienceHandler = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const instructor = await removeWorkExperience(Instructor, req.instructor.id, id);
    if (!instructor) return errorResponse(res, 404, "Instructor not found");
    successResponse(res, 200, "Work experience removed successfully", instructor.workExperience);
});

// ========================= QUALIFICATIONS =========================

// @route   POST /api/v1/instructor/qualifications
// @desc    Add a qualification (degree, certification, bootcamp, etc)
// @access  Private (Instructor)
export const addQualificationHandler = asyncHandler(async (req, res) => {
    const instructor = await addQualification(Instructor, req.instructor.id, req.body);
    if (!instructor) return errorResponse(res, 404, "Instructor not found");
    successResponse(res, 201, "Qualification added successfully", instructor.qualifications);
});

// @route   DELETE /api/v1/instructor/qualifications/:id
// @desc    Remove a qualification
// @access  Private (Instructor)
export const removeQualificationHandler = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const instructor = await removeQualification(Instructor, req.instructor.id, id);
    if (!instructor) return errorResponse(res, 404, "Instructor not found");
    successResponse(res, 200, "Qualification removed successfully", instructor.qualifications);
});

// ========================= ACHIEVEMENTS =========================

// @route   POST /api/v1/instructor/achievements
// @desc    Add an achievement (award, speaking, publication, etc)
// @access  Private (Instructor)
export const addAchievementHandler = asyncHandler(async (req, res) => {
    const instructor = await addAchievement(Instructor, req.instructor.id, req.body);
    if (!instructor) return errorResponse(res, 404, "Instructor not found");
    successResponse(res, 201, "Achievement added successfully", instructor.achievements);
});

// @route   DELETE /api/v1/instructor/achievements/:id
// @desc    Remove an achievement
// @access  Private (Instructor)
export const removeAchievementHandler = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const instructor = await removeAchievement(Instructor, req.instructor.id, id);
    if (!instructor) return errorResponse(res, 404, "Instructor not found");
    successResponse(res, 200, "Achievement removed successfully", instructor.achievements);
});

// @route   DELETE /api/v1/instructor/banner-image
// @desc    Delete banner image
// @access  Private (Instructor)
export const deleteMyBannerImage = asyncHandler(async (req, res) => {
    try {
        const result = await deleteInstructorBannerImage(Instructor, req.instructor.id);
        successResponse(res, 200, result.message);
    } catch (error) {
        return errorResponse(res, 404, error.message);
    }
});

// ========================= DASHBOARD =========================

// @route   GET /api/v1/instructor/dashboard
// @desc    Get instructor dashboard stats
// @access  Private (Instructor)
export const getDashboard = asyncHandler(async (req, res) => {
    const instructorId = req.instructor.id;

    const [
        instructor,
        totalCourses,
        totalEnrollments,
        totalReviews,
        liveClassStats,
        videoPackageStats
    ] = await Promise.all([
        Instructor.findById(instructorId),
        Course.countDocuments({ instructor: instructorId }),
        Enrollment.countDocuments({
            course: { $in: (await Course.find({ instructor: instructorId }).select("_id")).map(c => c._id) }
        }),
        Review.countDocuments({
            course: { $in: (await Course.find({ instructor: instructorId }).select("_id")).map(c => c._id) }
        }),
        LiveClass.getClassStats(instructorId),
        VideoPackage.getPackageStats(instructorId)
    ]);

    successResponse(res, 200, "Dashboard retrieved successfully", {
        profile: { firstName: instructor.firstName, lastName: instructor.lastName, rating: instructor.rating.averageRating },
        stats: {
            totalCourses,
            totalEnrollments,
            totalReviews,
            totalStudentsTeaching: instructor.totalStudentsTeaching,
            liveClasses: liveClassStats[0] || {},
            videoPackages: videoPackageStats[0] || {}
        }
    });
});

// ========================= MY COURSES =========================

// @route   GET /api/v1/instructor/courses
// @desc    Get my courses
// @access  Private (Instructor)
export const getMyCourses = asyncHandler(async (req, res) => {
    const { page, limit, skip } = getPagination(req.query, 10);
    const { status } = req.query;

    const filter = { instructor: req.instructor.id };
    if (status) filter.status = status;

    const total = await Course.countDocuments(filter);
    const courses = await Course.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

    successResponse(res, 200, "Courses retrieved successfully", {
        courses,
        pagination: createPaginationResponse(total, page, limit)
    });
});

// ========================= MY STUDENTS =========================

// @route   GET /api/v1/instructor/students
// @desc    Get students enrolled in my courses
// @access  Private (Instructor)
export const getMyStudents = asyncHandler(async (req, res) => {
    const { page, limit, skip } = getPagination(req.query, 20);
    const { courseId } = req.query;

    const courseFilter = { instructor: req.instructor.id };
    if (courseId) courseFilter._id = courseId;

    const courseIds = (await Course.find(courseFilter).select("_id")).map(c => c._id);

    const filter = { course: { $in: courseIds }, status: { $in: ["active", "completed"] } };
    const total = await Enrollment.countDocuments(filter);
    const enrollments = await Enrollment.find(filter)
        .populate("user", "firstName lastName email profilePicture")
        .populate("course", "title")
        .sort({ enrolledAt: -1 })
        .skip(skip)
        .limit(limit);

    successResponse(res, 200, "Students retrieved successfully", {
        students: enrollments,
        pagination: createPaginationResponse(total, page, limit)
    });
});

// ========================= DEACTIVATE =========================

// @route   GET /api/v1/instructor/live-classes
// @desc    Get my live classes
// @access  Private (Instructor)
export const getMyLiveClasses = asyncHandler(async (req, res) => {
    const { page, limit, skip } = getPagination(req.query, 10);
    const { status } = req.query;

    const filter = { instructor: req.instructor.id };
    if (status) filter.status = status;

    const total = await LiveClass.countDocuments(filter);
    const classes = await LiveClass.find(filter)
        .populate("course", "title")
        .sort({ scheduledAt: -1 })
        .skip(skip)
        .limit(limit);

    successResponse(res, 200, "Live classes retrieved successfully", {
        liveClasses: classes,
        pagination: createPaginationResponse(total, page, limit)
    });
});

// ========================= MY VIDEO PACKAGES =========================

// @route   GET /api/v1/instructor/video-packages
// @desc    Get my video packages
// @access  Private (Instructor)
export const getMyVideoPackages = asyncHandler(async (req, res) => {
    const { page, limit, skip } = getPagination(req.query, 10);

    const filter = { instructor: req.instructor.id };
    const total = await VideoPackage.countDocuments(filter);
    const packages = await VideoPackage.find(filter)
        .populate("course", "title")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

    successResponse(res, 200, "Video packages retrieved successfully", {
        videoPackages: packages,
        pagination: createPaginationResponse(total, page, limit)
    });
});

// ========================= MY MATERIALS =========================

// @route   GET /api/v1/instructor/materials
// @desc    Get my materials
// @access  Private (Instructor)
export const getMyMaterials = asyncHandler(async (req, res) => {
    const { page, limit, skip } = getPagination(req.query, 20);
    const { courseId, type } = req.query;

    const filter = { instructor: req.instructor.id };
    if (courseId) filter.course = courseId;
    if (type) filter.type = type;

    const total = await Material.countDocuments(filter);
    const materials = await Material.find(filter)
        .populate("course", "title")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

    successResponse(res, 200, "Materials retrieved successfully", {
        materials,
        pagination: createPaginationResponse(total, page, limit)
    });
});

// ========================= MY ASSIGNMENTS =========================

// @route   GET /api/v1/instructor/assignments
// @desc    Get assignments I created
// @access  Private (Instructor)
export const getMyAssignments = asyncHandler(async (req, res) => {
    const { page, limit, skip } = getPagination(req.query, 10);
    const { courseId } = req.query;

    const filter = { instructor: req.instructor.id };
    if (courseId) filter.course = courseId;

    const total = await Assignment.countDocuments(filter);
    const assignments = await Assignment.find(filter)
        .populate("course", "title")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

    successResponse(res, 200, "Assignments retrieved successfully", {
        assignments,
        pagination: createPaginationResponse(total, page, limit)
    });
});

// ========================= PENDING SUBMISSIONS =========================

// @route   GET /api/v1/instructor/submissions/pending
// @desc    Get pending submissions to grade
// @access  Private (Instructor)
export const getPendingSubmissions = asyncHandler(async (req, res) => {
    const { page, limit, skip } = getPagination(req.query, 20);

    const assignmentIds = (await Assignment.find({ instructor: req.instructor.id }).select("_id")).map(a => a._id);

    const filter = { assignment: { $in: assignmentIds }, status: "submitted" };
    const total = await Submission.countDocuments(filter);
    const submissions = await Submission.find(filter)
        .populate("user", "firstName lastName email")
        .populate("assignment", "title dueDate maxScore")
        .populate("course", "title")
        .sort({ submittedAt: -1 })
        .skip(skip)
        .limit(limit);

    successResponse(res, 200, "Pending submissions retrieved successfully", {
        submissions,
        pagination: createPaginationResponse(total, page, limit)
    });
});

// ========================= DEACTIVATE =========================

// @route   DELETE /api/v1/instructor/account
// @desc    Deactivate (soft delete) instructor account
// @access  Private (Instructor)
export const deactivateAccount = asyncHandler(async (req, res) => {
    const { reason } = req.body;

    const instructor = await Instructor.findById(req.instructor.id);
    if (!instructor) return errorResponse(res, 404, "Instructor not found");

    instructor.isActive = false;
    instructor.deletedAt = new Date();
    instructor.deletionReason = reason || "Instructor requested deactivation";
    instructor.clearAllSessions();
    await instructor.save({ validateBeforeSave: false });

    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");

    successResponse(res, 200, "Account deactivated successfully");
});
