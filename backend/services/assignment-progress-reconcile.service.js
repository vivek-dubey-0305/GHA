import { Assignment } from "../models/assignment.model.js";
import { Lesson } from "../models/lesson.model.js";
import { Submission } from "../models/submission.model.js";
import logger from "../configs/logger.config.js";
import { upsertLessonProgress } from "./progress.service.js";

const normalizeAssignmentIds = (submissions = []) => {
    return [...new Set(
        submissions
            .filter((s) => ["submitted", "graded"].includes(s?.status))
            .map((s) => String(s?.assignment?._id || s?.assignment))
            .filter(Boolean)
    )];
};

const getLessonsForAssignments = async ({ assignmentIds = [], courseId }) => {
    if (assignmentIds.length === 0) return [];

    const assignmentFilter = { _id: { $in: assignmentIds } };
    if (courseId) assignmentFilter.course = courseId;

    const assignments = await Assignment.find(assignmentFilter)
        .select("_id lesson course")
        .lean();

    const assignmentIdToLessonRef = new Map(
        assignments
            .filter((a) => a.lesson)
            .map((a) => [String(a._id), String(a.lesson)])
    );

    const directLessonIds = [...new Set([...assignmentIdToLessonRef.values()])];
    const directLessonFilter = { _id: { $in: directLessonIds } };
    if (courseId) directLessonFilter.course = courseId;

    const directLessons = directLessonIds.length > 0
        ? await Lesson.find(directLessonFilter).select("_id course type assignmentId").lean()
        : [];

    const missingAssignmentIds = assignmentIds.filter((id) => !assignmentIdToLessonRef.has(id));
    const fallbackLessonFilter = { assignmentId: { $in: missingAssignmentIds } };
    if (courseId) fallbackLessonFilter.course = courseId;

    const fallbackLessons = missingAssignmentIds.length > 0
        ? await Lesson.find(fallbackLessonFilter).select("_id course type assignmentId").lean()
        : [];

    const uniqueLessons = new Map();
    [...directLessons, ...fallbackLessons].forEach((lesson) => {
        if (lesson?._id) {
            uniqueLessons.set(String(lesson._id), lesson);
        }
    });

    return [...uniqueLessons.values()];
};

export const reconcileSubmittedAssignmentProgress = async ({
    userId,
    courseId,
    submissions,
    source = "unknown",
}) => {
    if (!userId) return { updatedLessons: 0, assignmentIds: 0 };

    let effectiveSubmissions = submissions;
    if (!Array.isArray(effectiveSubmissions)) {
        const submissionFilter = {
            user: userId,
            status: { $in: ["submitted", "graded"] },
        };
        if (courseId) submissionFilter.course = courseId;

        effectiveSubmissions = await Submission.find(submissionFilter)
            .select("assignment status")
            .lean();
    }

    const assignmentIds = normalizeAssignmentIds(effectiveSubmissions);
    if (assignmentIds.length === 0) {
        logger.info(`[progress-reconcile:${source}] no submitted/graded assignments found for user ${userId}`);
        return { updatedLessons: 0, assignmentIds: 0 };
    }

    const lessons = await getLessonsForAssignments({ assignmentIds, courseId });
    if (lessons.length === 0) {
        logger.warn(`[progress-reconcile:${source}] no assignment-linked lessons found for ${assignmentIds.length} assignments (user=${userId}, course=${courseId || "all"})`);
        return { updatedLessons: 0, assignmentIds: assignmentIds.length };
    }

    let updatedLessons = 0;
    for (const lesson of lessons) {
        await upsertLessonProgress({
            userId,
            lesson,
            payload: {
                assignmentSubmitted: true,
                activityProgress: {
                    assignmentStarted: true,
                    assignmentSubmitted: true,
                },
            },
        });
        updatedLessons += 1;
    }

    logger.info(`[progress-reconcile:${source}] updated ${updatedLessons} assignment lesson progress rows from ${assignmentIds.length} assignments (user=${userId}, course=${courseId || "all"})`);

    return { updatedLessons, assignmentIds: assignmentIds.length };
};
