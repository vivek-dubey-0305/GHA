import { Progress } from "../models/progress.model.js";
import { Course } from "../models/course.model.js";
import { Enrollment } from "../models/enrollment.model.js";
import { Lesson } from "../models/lesson.model.js";
import { asyncHandler } from "../middlewares/async.middleware.js";
import { errorResponse, successResponse } from "../utils/response.utils.js";
import { syncEnrollmentProgress, upsertLessonProgress } from "../services/progress.service.js";

/**
 * Progress Controller
 * Handles learning progress tracking
 */

// @route   GET /api/v1/progress/course/:courseId
// @desc    Get user's progress for a course
// @access  Private (User)
export const getCourseProgress = asyncHandler(async (req, res) => {
    const progress = await Progress.find({
        user: req.user.id,
        course: req.params.courseId,
    }).sort({ updatedAt: -1 });

    if (progress.length === 0) {
        return successResponse(res, 200, "No progress found", {
            progress: [],
            overallPercentage: 0
        });
    }

    // Calculate overall progress
    const totalLessons = progress.length;
    const completedLessons = progress.filter(p => p.status === "completed").length;
    const overallPercentage = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
    const totalTimeSpent = progress.reduce((sum, p) => sum + (p.timeSpent || 0), 0);

    successResponse(res, 200, "Course progress retrieved", {
        progress,
        overallPercentage,
        completedLessons,
        totalLessons,
        totalTimeSpent
    });
});

// @route   GET /api/v1/progress/lesson/:lessonId
// @desc    Get user's progress for a specific lesson
// @access  Private (User)
export const getLessonProgress = asyncHandler(async (req, res) => {
    const progress = await Progress.findOne({
        user: req.user.id,
        lesson: req.params.lessonId
    });

    successResponse(res, 200, "Lesson progress retrieved", progress || { status: "not_started", progressPercentage: 0 });
});

// @route   POST /api/v1/progress/lesson/:lessonId
// @desc    Update/Create progress for a lesson
// @access  Private (User)
export const updateLessonProgress = asyncHandler(async (req, res) => {
    const lesson = await Lesson.findById(req.params.lessonId);
    if (!lesson) return errorResponse(res, 404, "Lesson not found");

    // Verify enrollment
    const isEnrolled = await Enrollment.isUserEnrolled(req.user.id, lesson.course);
    if (!isEnrolled) {
        return errorResponse(res, 403, "You must be enrolled in the course");
    }

    const progress = await upsertLessonProgress({
        userId: req.user.id,
        lesson,
        payload: req.body,
    });

    successResponse(res, 200, "Progress updated successfully", progress);
});

// @route   PATCH /api/v1/progress/lesson/:lessonId/complete
// @desc    Mark a lesson as completed
// @access  Private (User)
export const markLessonComplete = asyncHandler(async (req, res) => {
    const lesson = await Lesson.findById(req.params.lessonId);
    if (!lesson) return errorResponse(res, 404, "Lesson not found");

    const progress = await upsertLessonProgress({
        userId: req.user.id,
        lesson,
        payload: {
            progressPercentage: 100,
            activityProgress: {
                articleCompleted: true,
                materialDownloaded: true,
                liveAttended: true,
                assignmentSubmitted: true,
            }
        },
    });

    await syncEnrollmentProgress({ userId: req.user.id, courseId: lesson.course });

    successResponse(res, 200, "Lesson marked as completed", progress);
});

// @route   GET /api/v1/progress/user/stats
// @desc    Get overall learning stats for the user
// @access  Private (User)
export const getMyLearningStats = asyncHandler(async (req, res) => {
    const allProgress = await Progress.find({ user: req.user.id }).lean();

    const stats = {
        totalLessonsStarted: allProgress.length,
        totalLessonsCompleted: allProgress.filter(p => p.status === "completed").length,
        totalTimeSpent: allProgress.reduce((sum, p) => sum + (p.timeSpent || 0), 0),
        averageProgress: allProgress.length > 0
            ? Math.round(allProgress.reduce((sum, p) => sum + (p.progressPercentage || 0), 0) / allProgress.length)
            : 0
    };

    // Group by course
    const courseMap = {};
    for (const p of allProgress) {
        const courseId = p.course?.toString();
        if (!courseMap[courseId]) {
            courseMap[courseId] = { total: 0, completed: 0, timeSpent: 0 };
        }
        courseMap[courseId].total++;
        if (p.status === "completed") courseMap[courseId].completed++;
        courseMap[courseId].timeSpent += p.timeSpent || 0;
    }

    stats.courseBreakdown = courseMap;

    successResponse(res, 200, "Learning stats retrieved", stats);
});

// @route   GET /api/v1/progress/instructor/course/:courseId
// @desc    Get progress overview of all students in a course
// @access  Private (Instructor - course owner)
export const getCourseStudentProgress = asyncHandler(async (req, res) => {
    const course = await Course.findById(req.params.courseId);
    if (!course) return errorResponse(res, 404, "Course not found");

    if (course.instructor.toString() !== req.instructor.id) {
        return errorResponse(res, 403, "You can only view progress for your own courses");
    }

    const enrollments = await Enrollment.find({
        course: req.params.courseId,
        status: "active"
    }).populate("user", "firstName lastName email profilePicture");

    const progressData = await Promise.all(
        enrollments.map(async (enrollment) => {
            const progress = await Progress.find({
                user: enrollment.user._id,
                course: req.params.courseId,
            }).lean();
            const completedLessons = progress.filter(p => p.status === "completed").length;
            return {
                student: enrollment.user,
                enrolledAt: enrollment.enrolledAt || enrollment.createdAt,
                progressPercentage: enrollment.progressPercentage,
                completedLessons,
                totalLessons: progress.length,
                totalTimeSpent: progress.reduce((sum, p) => sum + (p.timeSpent || 0), 0),
                lastActivity: progress.length > 0
                    ? Math.max(...progress.map(p => new Date(p.updatedAt).getTime()))
                    : null
            };
        })
    );

    successResponse(res, 200, "Course student progress retrieved", progressData);
});
