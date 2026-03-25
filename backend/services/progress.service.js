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
        if (payload?.activityProgress?.articleOpened) return Math.max(20, current?.progressPercentage || 0);
        return current?.progressPercentage || 0;
    }

    if (lessonType === "material") {
        if (payload?.activityProgress?.materialDownloaded) return 100;
        if (payload?.activityProgress?.materialViewed) return Math.max(60, current?.progressPercentage || 0);
        return current?.progressPercentage || 0;
    }

    if (lessonType === "live") {
        if (payload?.activityProgress?.liveAttended) return 100;
        const minutes = Number(payload?.activityProgress?.liveMinutes || 0);
        if (minutes >= 10) return 100;
        if (payload?.activityProgress?.liveJoined) return Math.max(40, current?.progressPercentage || 0);
        return current?.progressPercentage || 0;
    }

    if (lessonType === "assignment") {
        if (payload?.assignmentSubmitted || payload?.activityProgress?.assignmentSubmitted) return 100;
        if (payload?.activityProgress?.assignmentStarted) return Math.max(25, current?.progressPercentage || 0);
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

    await Enrollment.findOneAndUpdate(
        { user: userId, course: courseId },
        {
            $set: {
                progressPercentage: completionPercentage,
                completedLessons,
                lastAccessedAt: new Date(),
                timeSpent: Number(totalTimeSpent?.[0]?.total || 0),
            },
        }
    );

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

    await syncEnrollmentProgress({ userId, courseId: lesson.course });
    return progress;
};
