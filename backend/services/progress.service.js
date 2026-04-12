import { Progress } from "../models/progress.model.js";
import { Enrollment } from "../models/enrollment.model.js";
import { Lesson } from "../models/lesson.model.js";

const clampPercentage = (value) => {
    const num = Number(value);
    if (!Number.isFinite(num)) return 0;
    return Math.min(100, Math.max(0, Math.round(num)));
};

const clampNonNegative = (value) => {
    const num = Number(value);
    if (!Number.isFinite(num)) return 0;
    return Math.max(0, Math.floor(num));
};

const toIdString = (value) => (value ? String(value) : null);

const derivePercentageByType = ({ lessonType, payload, current }) => {
    if (payload.progressPercentage !== undefined) {
        return clampPercentage(payload.progressPercentage);
    }

    if (lessonType === "video") {
        const currentTime = Number(payload?.videoProgress?.currentTime ?? current?.videoProgress?.currentTime ?? 0);
        const totalDuration = Number(payload?.videoProgress?.totalDuration ?? current?.videoProgress?.totalDuration ?? 0);
        if (totalDuration > 0) {
            return clampPercentage((currentTime / totalDuration) * 100);
        }

        return current?.status === "completed" ? 100 : current?.progressPercentage || 0;
    }

    if (lessonType === "article") {
        if (payload?.activityProgress?.articleCompleted) return 100;
        const ratio = Number(payload?.activityProgress?.articleReadRatio);
        if (Number.isFinite(ratio) && ratio >= 0) return clampPercentage(ratio * 100);
        if (payload?.activityProgress?.articleOpened) return current?.progressPercentage || 0;
        return current?.progressPercentage || 0;
    }

    if (lessonType === "material") {
        if (payload?.activityProgress?.materialDownloaded) return 100;
        if (payload?.activityProgress?.materialViewed) return current?.progressPercentage || 0;
        return current?.progressPercentage || 0;
    }

    if (lessonType === "live") {
        if (payload?.activityProgress?.liveAttended) return 100;
        const minutes = Number(payload?.activityProgress?.liveMinutes || 0);
        if (minutes >= 10) return 100;
        if (payload?.activityProgress?.liveJoined) return current?.progressPercentage || 0;
        return current?.progressPercentage || 0;
    }

    if (lessonType === "assignment") {
        if (payload?.assignmentSubmitted || payload?.activityProgress?.assignmentSubmitted) return 100;
        if (payload?.activityProgress?.assignmentStarted) return current?.progressPercentage || 0;
        return current?.progressPercentage || 0;
    }

    return current?.progressPercentage || 0;
};

const deriveStatus = (percentage) => {
    if (percentage >= 100) return "completed";
    if (percentage > 0) return "in-progress";
    return "not-started";
};

const mergeActivityProgress = (current = {}, incoming = {}) => ({
    articleOpened: incoming.articleOpened ?? current.articleOpened ?? false,
    articleReadRatio: incoming.articleReadRatio ?? current.articleReadRatio,
    articleCompleted: incoming.articleCompleted ?? current.articleCompleted ?? false,
    materialViewed: incoming.materialViewed ?? current.materialViewed ?? false,
    materialDownloaded: incoming.materialDownloaded ?? current.materialDownloaded ?? false,
    liveJoined: incoming.liveJoined ?? current.liveJoined ?? false,
    liveMinutes: incoming.liveMinutes ?? current.liveMinutes ?? 0,
    liveAttended: incoming.liveAttended ?? current.liveAttended ?? false,
    assignmentStarted: incoming.assignmentStarted ?? current.assignmentStarted ?? false,
    assignmentSubmitted: incoming.assignmentSubmitted ?? current.assignmentSubmitted ?? false,
});

export const syncEnrollmentProgress = async ({ userId, courseId }) => {
    const [completedLessons, totalTimeSpent, totalLessons] = await Promise.all([
        Progress.countDocuments({ user: userId, course: courseId, status: "completed" }),
        Progress.aggregate([
            { $match: { user: userId, course: courseId } },
            { $group: { _id: null, total: { $sum: "$timeSpent" } } }
        ]),
        Lesson.countDocuments({ course: courseId, isPublished: true })
    ]);

    const safeTotalLessons = Math.max(totalLessons, 0);
    const completionPercentage = safeTotalLessons > 0
        ? clampPercentage((completedLessons / safeTotalLessons) * 100)
        : 0;

    const existingEnrollment = await Enrollment.findOne({ user: userId, course: courseId })
        .populate("course", "title")
        .lean();

    const previousProgressModules = Array.isArray(existingEnrollment?.progressModules)
        ? existingEnrollment.progressModules
        : [];

    const [publishedModuleStats, completedLessonRows] = await Promise.all([
        Lesson.aggregate([
            {
                $match: {
                    course: courseId,
                    isPublished: true,
                },
            },
            {
                $group: {
                    _id: "$module",
                    totalLessons: { $sum: 1 },
                },
            },
        ]),
        Progress.aggregate([
            {
                $match: {
                    user: userId,
                    course: courseId,
                    status: "completed",
                },
            },
            {
                $lookup: {
                    from: "lessons",
                    localField: "lesson",
                    foreignField: "_id",
                    as: "lessonDoc",
                },
            },
            { $unwind: "$lessonDoc" },
            {
                $group: {
                    _id: "$lessonDoc.module",
                    completedLessons: { $sum: 1 },
                },
            },
        ]),
    ]);

    const moduleTotalMap = new Map(
        publishedModuleStats
            .filter((row) => !!row?._id)
            .map((row) => [toIdString(row._id), Number(row.totalLessons || 0)])
    );

    const moduleCompletedMap = new Map(
        completedLessonRows
            .filter((row) => !!row?._id)
            .map((row) => [toIdString(row._id), Number(row.completedLessons || 0)])
    );

    const previousModuleMap = new Map(
        previousProgressModules
            .filter((item) => !!item?.moduleId)
            .map((item) => [toIdString(item.moduleId), item])
    );

    const nextProgressModules = Array.from(moduleTotalMap.entries()).map(([moduleId, totalLessonsInModule]) => {
        const completedLessonsInModule = Number(moduleCompletedMap.get(moduleId) || 0);
        const previousModule = previousModuleMap.get(moduleId);

        const nextStatus = completedLessonsInModule >= totalLessonsInModule && totalLessonsInModule > 0
            ? "completed"
            : completedLessonsInModule > 0
                ? "in-progress"
                : "not-started";

        return {
            moduleId,
            status: nextStatus,
            completedAt: nextStatus === "completed"
                ? previousModule?.completedAt || new Date()
                : previousModule?.completedAt || null,
        };
    });

    const nextStatus = completionPercentage >= 100 ? "completed" : "active";
    const shouldSetCompletedAt = completionPercentage >= 100;

    const updatedEnrollment = await Enrollment.findOneAndUpdate(
        { user: userId, course: courseId },
        {
            $set: {
                progressPercentage: completionPercentage,
                completedLessons,
                lastAccessedAt: new Date(),
                timeSpent: Number(totalTimeSpent?.[0]?.total || 0),
                status: nextStatus,
                progressModules: nextProgressModules,
                ...(shouldSetCompletedAt ? { completedAt: new Date() } : {}),
            },
        }
        ,
        { new: true }
    );

    const transitionedToCompleted =
        completionPercentage >= 100 &&
        existingEnrollment &&
        existingEnrollment.status !== "completed";

    const modulesTransitionedToCompleted = nextProgressModules.filter((item) => {
        if (item.status !== "completed") return false;
        const previousModule = previousModuleMap.get(toIdString(item.moduleId));
        return previousModule?.status !== "completed";
    });

    const courseTitle = existingEnrollment?.course?.title || "Course";

    return {
        completedLessons,
        totalLessons: safeTotalLessons,
        completionPercentage,
    };
};

export const upsertLessonProgress = async ({ userId, lesson, payload = {} }) => {
    const filter = { user: userId, lesson: lesson._id };
    const existing = await Progress.findOne(filter).lean();

    const mergedVideoProgress = {
        currentTime: clampNonNegative(payload?.videoProgress?.currentTime ?? existing?.videoProgress?.currentTime ?? 0),
        totalDuration: clampNonNegative(payload?.videoProgress?.totalDuration ?? existing?.videoProgress?.totalDuration ?? 0),
    };

    const mergedActivityProgress = mergeActivityProgress(existing?.activityProgress, payload?.activityProgress);
    const nextPercentage = derivePercentageByType({ lessonType: lesson.type, payload, current: { ...existing, videoProgress: mergedVideoProgress, activityProgress: mergedActivityProgress } });
    const status = deriveStatus(nextPercentage);

    const updateDoc = {
        $set: {
            status,
            progressPercentage: nextPercentage,
            lastAccessedAt: new Date(),
            videoProgress: mergedVideoProgress,
            activityProgress: mergedActivityProgress,
            assignmentSubmitted: payload.assignmentSubmitted ?? existing?.assignmentSubmitted ?? false,
            assignmentScore: payload.assignmentScore ?? existing?.assignmentScore,
            assignmentFeedback: payload.assignmentFeedback ?? existing?.assignmentFeedback,
            quizAttempts: payload.quizAttempts ?? existing?.quizAttempts ?? 0,
            quizScore: payload.quizScore ?? existing?.quizScore,
        },
        $setOnInsert: {
            user: userId,
            course: lesson.course,
            lesson: lesson._id,
        },
        $inc: {
            timeSpent: clampNonNegative(payload.timeSpent),
        }
    };

    if (status === "completed") {
        updateDoc.$set.completedAt = existing?.completedAt || new Date();
    }

    const progress = await Progress.findOneAndUpdate(filter, updateDoc, {
        new: true,
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true,
    });

    const justCompletedLesson = existing?.status !== "completed" && progress?.status === "completed";

    await syncEnrollmentProgress({ userId, courseId: lesson.course });
    return progress;
};
