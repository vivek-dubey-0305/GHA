import { Progress } from "../models/progress.model.js";
import { Course } from "../models/course.model.js";
import { Enrollment } from "../models/enrollment.model.js";
import { Lesson } from "../models/lesson.model.js";
import { asyncHandler } from "../middlewares/async.middleware.js";
import { errorResponse, successResponse } from "../utils/response.utils.js";
import logger from "../configs/logger.config.js";
import { syncEnrollmentProgress, upsertLessonProgress } from "../services/progress.service.js";
import { refreshLeaderboardAfterActivity } from "../services/leaderboard.service.js";
import {
    ACHIEVEMENT_CATEGORIES,
    ACHIEVEMENT_POINTS,
    ACHIEVEMENT_STATUS,
} from "../constants/achievement.constant.js";
import { createAchievementEvent } from "../services/achievement.service.js";

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

    await refreshLeaderboardAfterActivity({
        userId: req.user.id,
        io: req.app.get("io"),
        source: "progress.updateLessonProgress",
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

    const enrollment = await Enrollment.findOne({
        user: req.user.id,
        course: lesson.course,
    })
        .populate("course", "title")
        .lean();

    const courseTitle = enrollment?.course?.title || "Course";

    await createAchievementEvent({
        userId: req.user.id,
        category: ACHIEVEMENT_CATEGORIES.COURSE,
        status: ACHIEVEMENT_STATUS.ACHIEVED,
        title: "Lesson completed",
        description: `Completed lesson ${lesson.title || ""}`.trim(),
        pointsAwarded: ACHIEVEMENT_POINTS.LESSON_COMPLETED,
        pointsPossible: ACHIEVEMENT_POINTS.LESSON_COMPLETED,
        source: "progress.markLessonComplete",
        refs: {
            course: lesson.course,
            lesson: lesson._id,
        },
        metadata: {
            courseTitle,
            lessonTitle: lesson.title || "",
        },
        dedupeKey: `achievement:lesson-complete:${req.user.id}:${lesson._id}`,
    });

    const completedModules = Array.isArray(enrollment?.progressModules)
        ? enrollment.progressModules.filter((item) => item?.status === "completed" && item?.moduleId)
        : [];

    await Promise.all(
        completedModules.map((moduleProgress) =>
            createAchievementEvent({
                userId: req.user.id,
                category: ACHIEVEMENT_CATEGORIES.COURSE,
                status: ACHIEVEMENT_STATUS.ACHIEVED,
                title: "Module completed",
                description: `Completed a module in ${courseTitle}`,
                pointsAwarded: ACHIEVEMENT_POINTS.MODULE_COMPLETED,
                pointsPossible: ACHIEVEMENT_POINTS.MODULE_COMPLETED,
                source: "progress.moduleComplete",
                refs: {
                    course: lesson.course,
                    module: moduleProgress.moduleId,
                },
                metadata: {
                    courseTitle,
                    moduleId: String(moduleProgress.moduleId),
                    completedAt: moduleProgress.completedAt || new Date(),
                },
                dedupeKey: `achievement:module-complete:${req.user.id}:${moduleProgress.moduleId}`,
            })
        )
    );

    if (enrollment?.status === "completed") {
        await createAchievementEvent({
            userId: req.user.id,
            category: ACHIEVEMENT_CATEGORIES.COURSE,
            status: ACHIEVEMENT_STATUS.ACHIEVED,
            title: "Course completed",
            description: `Completed course ${courseTitle}`,
            pointsAwarded: ACHIEVEMENT_POINTS.COURSE_COMPLETED,
            pointsPossible: ACHIEVEMENT_POINTS.COURSE_COMPLETED,
            source: "progress.courseComplete",
            refs: {
                course: lesson.course,
            },
            metadata: {
                courseTitle,
                completedAt: enrollment.completedAt || new Date(),
            },
            dedupeKey: `achievement:course-complete:${req.user.id}:${lesson.course}`,
        });

        if (enrollment?.enrolledAt) {
            const elapsedMs = new Date(enrollment.completedAt || Date.now()).getTime() - new Date(enrollment.enrolledAt).getTime();
            const elapsedDays = Math.floor(elapsedMs / (1000 * 60 * 60 * 24));

            if (elapsedDays >= 0 && elapsedDays <= 30) {
                await createAchievementEvent({
                    userId: req.user.id,
                    category: ACHIEVEMENT_CATEGORIES.COURSE,
                    status: ACHIEVEMENT_STATUS.ACHIEVED,
                    title: "Fast completion bonus",
                    description: `Completed ${courseTitle} in ${elapsedDays} days`,
                    pointsAwarded: ACHIEVEMENT_POINTS.COURSE_FAST_COMPLETION,
                    pointsPossible: ACHIEVEMENT_POINTS.COURSE_FAST_COMPLETION,
                    source: "progress.fastCompletion",
                    refs: {
                        course: lesson.course,
                    },
                    metadata: {
                        courseTitle,
                        elapsedDays,
                    },
                    dedupeKey: `achievement:course-fast:${req.user.id}:${lesson.course}`,
                });
            }
        }
    }

    await refreshLeaderboardAfterActivity({
        userId: req.user.id,
        io: req.app.get("io"),
        source: "progress.markLessonComplete",
    });

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
