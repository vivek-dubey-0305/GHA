import { DateTime } from "luxon";
import { Achievement } from "../models/achievement.model.js";
import { Assignment } from "../models/assignment.model.js";
import { Enrollment } from "../models/enrollment.model.js";
import { LiveClass } from "../models/liveclass.model.js";
import { Lesson } from "../models/lesson.model.js";
import { Progress } from "../models/progress.model.js";
import { Submission } from "../models/submission.model.js";
import { UserStreak } from "../models/user-streak.model.js";
import {
    ACHIEVEMENT_CATEGORIES,
    ACHIEVEMENT_POINTS,
    ACHIEVEMENT_STATUS,
    ACHIEVEMENT_TABS,
} from "../constants/achievement.constant.js";
import { STREAK_MILESTONES } from "../constants/leaderboard.constant.js";

const IST_ZONE = "Asia/Kolkata";

const toSafeNumber = (value, fallback = 0) => {
    const num = Number(value);
    return Number.isFinite(num) ? num : fallback;
};

const toDateFromIstKey = (dayKey) => {
    if (!dayKey) return null;
    const parsed = DateTime.fromFormat(dayKey, "yyyy-LL-dd", { zone: IST_ZONE });
    return parsed.isValid ? parsed.endOf("day").toJSDate() : null;
};

const buildTabFilter = (tab) => {
    if (tab === ACHIEVEMENT_TABS.ALL) return {};
    if (tab === ACHIEVEMENT_TABS.MISSED) {
        return { status: ACHIEVEMENT_STATUS.MISSED };
    }

    if ([ACHIEVEMENT_TABS.COURSE, ACHIEVEMENT_TABS.ASSIGNMENT, ACHIEVEMENT_TABS.STREAK, ACHIEVEMENT_TABS.LIVE].includes(tab)) {
        return { category: tab };
    }

    return {};
};

export const createAchievementEvent = async ({
    userId,
    category,
    status = ACHIEVEMENT_STATUS.ACHIEVED,
    title,
    description = "",
    pointsAwarded = 0,
    pointsPossible = null,
    source = "",
    occurredAt = new Date(),
    refs = {},
    metadata = {},
    dedupeKey = null,
}) => {
    if (!userId || !category || !title) return null;

    const normalizedPointsAwarded = Math.max(0, toSafeNumber(pointsAwarded));
    const normalizedPointsPossible = pointsPossible === null
        ? Math.max(normalizedPointsAwarded, 0)
        : Math.max(0, toSafeNumber(pointsPossible));

    const payload = {
        user: userId,
        category,
        status,
        title,
        description,
        pointsAwarded: normalizedPointsAwarded,
        pointsPossible: normalizedPointsPossible,
        source,
        occurredAt,
        metadata,
        dedupeKey,
        course: refs.course || null,
        module: refs.module || null,
        lesson: refs.lesson || null,
        assignment: refs.assignment || null,
        liveClass: refs.liveClass || null,
    };

    if (!dedupeKey) {
        return Achievement.create(payload);
    }

    return Achievement.findOneAndUpdate(
        { dedupeKey },
        { $setOnInsert: payload },
        { upsert: true, new: true }
    );
};

// const backfillEnrollmentAchievements = async (userId) => {
//     const enrollments = await Enrollment.find({
//         user: userId,
//         status: { $in: ["active", "completed"] },
//     })
//         .populate("course", "title")
//         .select("_id user course enrolledAt status")
//         .lean();

//     if (!enrollments.length) return;

//     await Promise.all(
//         enrollments.map((enrollment) =>
//             createAchievementEvent({
//                 userId,
//                 category: ACHIEVEMENT_CATEGORIES.COURSE,
//                 status: ACHIEVEMENT_STATUS.ACHIEVED,
//                 title: "Course enrolled",
//                 description: `Enrolled in ${enrollment?.course?.title || "a course"}`,
//                 pointsAwarded: ACHIEVEMENT_POINTS.COURSE_ENROLLED,
//                 pointsPossible: ACHIEVEMENT_POINTS.COURSE_ENROLLED,
//                 source: "enrollment.backfill",
//                 occurredAt: enrollment.enrolledAt || enrollment.createdAt || new Date(),
//                 refs: {
//                     course: enrollment?.course?._id || enrollment?.course || null,
//                 },
//                 metadata: {
//                     enrollmentId: String(enrollment._id),
//                     courseTitle: enrollment?.course?.title || "Course",
//                 },
//                 dedupeKey: `achievement:course-enrolled:${userId}:${enrollment?.course?._id || enrollment?.course}`,
//             })
//         )
//     );
// };

// const backfillCourseCompletionAchievements = async (userId) => {
//     const completedEnrollments = await Enrollment.find({
//         user: userId,
//         $or: [
//             { status: "completed" },
//             { progressPercentage: { $gte: 100 } },
//         ],
//     })
//         .populate("course", "title")
//         .select("_id user course enrolledAt completedAt progressPercentage status")
//         .lean();

//     if (!completedEnrollments.length) return;

//     await Promise.all(
//         completedEnrollments.map(async (enrollment) => {
//             const courseId = enrollment?.course?._id || enrollment?.course;
//             if (!courseId) return;

//             const completedAt = enrollment.completedAt || new Date();
//             const courseTitle = enrollment?.course?.title || "Course";

//             await createAchievementEvent({
//                 userId,
//                 category: ACHIEVEMENT_CATEGORIES.COURSE,
//                 status: ACHIEVEMENT_STATUS.ACHIEVED,
//                 title: "Course completed",
//                 description: `Completed course ${courseTitle}`,
//                 pointsAwarded: ACHIEVEMENT_POINTS.COURSE_COMPLETED,
//                 pointsPossible: ACHIEVEMENT_POINTS.COURSE_COMPLETED,
//                 source: "enrollment.courseComplete.backfill",
//                 occurredAt: completedAt,
//                 refs: {
//                     course: courseId,
//                 },
//                 metadata: {
//                     enrollmentId: String(enrollment._id),
//                     courseTitle,
//                     completedAt,
//                     progressPercentage: enrollment.progressPercentage || 100,
//                 },
//                 dedupeKey: `achievement:course-complete:${userId}:${courseId}`,
//             });

//             if (!enrollment.enrolledAt) return;

//             const elapsedMs = new Date(completedAt).getTime() - new Date(enrollment.enrolledAt).getTime();
//             const elapsedDays = Math.max(0, Math.floor(elapsedMs / (1000 * 60 * 60 * 24)));

//             if (elapsedDays <= 30) {
//                 await createAchievementEvent({
//                     userId,
//                     category: ACHIEVEMENT_CATEGORIES.COURSE,
//                     status: ACHIEVEMENT_STATUS.ACHIEVED,
//                     title: "Fast completion bonus",
//                     description: `Completed ${courseTitle} in ${elapsedDays} day(s)`,
//                     pointsAwarded: ACHIEVEMENT_POINTS.COURSE_FAST_COMPLETION,
//                     pointsPossible: ACHIEVEMENT_POINTS.COURSE_FAST_COMPLETION,
//                     source: "enrollment.courseFast.backfill",
//                     occurredAt: completedAt,
//                     refs: {
//                         course: courseId,
//                     },
//                     metadata: {
//                         enrollmentId: String(enrollment._id),
//                         courseTitle,
//                         elapsedDays,
//                     },
//                     dedupeKey: `achievement:course-fast:${userId}:${courseId}`,
//                 });
//             }
//         })
//     );
// };

// const backfillModuleCompletionAchievements = async (userId) => {
//     const enrollments = await Enrollment.find({
//         user: userId,
//         status: { $in: ["active", "completed"] },
//     })
//         .populate("course", "title")
//         .select("_id course progressModules completedAt")
//         .lean();

//     if (!enrollments.length) return;

//     const courseIds = Array.from(
//         new Set(
//             enrollments
//                 .map((item) => item?.course?._id || item?.course)
//                 .filter(Boolean)
//                 .map((id) => String(id))
//         )
//     );

//     if (!courseIds.length) return;

//     const [publishedLessons, completedProgresses] = await Promise.all([
//         Lesson.find({
//             course: { $in: courseIds },
//             isPublished: true,
//         })
//             .select("_id course module")
//             .lean(),
//         Progress.find({
//             user: userId,
//             course: { $in: courseIds },
//             status: "completed",
//         })
//             .select("lesson completedAt updatedAt")
//             .lean(),
//     ]);

//     const lessonMetaMap = new Map(
//         publishedLessons
//             .filter((lesson) => lesson?._id && lesson?.module && lesson?.course)
//             .map((lesson) => [
//                 String(lesson._id),
//                 {
//                     moduleId: String(lesson.module),
//                     courseId: String(lesson.course),
//                 },
//             ])
//     );

//     const moduleRequiredLessonsMap = new Map();
//     publishedLessons.forEach((lesson) => {
//         if (!lesson?._id || !lesson?.module || !lesson?.course) return;
//         const moduleKey = `${String(lesson.course)}:${String(lesson.module)}`;
//         moduleRequiredLessonsMap.set(moduleKey, Number(moduleRequiredLessonsMap.get(moduleKey) || 0) + 1);
//     });

//     const moduleCompletedLessonSetMap = new Map();
//     const moduleCompletedAtMap = new Map();

//     completedProgresses.forEach((progress) => {
//         const lessonMeta = lessonMetaMap.get(String(progress?.lesson || ""));
//         if (!lessonMeta?.moduleId || !lessonMeta?.courseId) return;

//         const moduleKey = `${lessonMeta.courseId}:${lessonMeta.moduleId}`;
//         if (!moduleCompletedLessonSetMap.has(moduleKey)) {
//             moduleCompletedLessonSetMap.set(moduleKey, new Set());
//         }

//         moduleCompletedLessonSetMap.get(moduleKey).add(String(progress.lesson));

//         const candidateDate = progress.completedAt || progress.updatedAt || new Date();
//         const previousDate = moduleCompletedAtMap.get(moduleKey);
//         if (!previousDate || new Date(candidateDate).getTime() > new Date(previousDate).getTime()) {
//             moduleCompletedAtMap.set(moduleKey, candidateDate);
//         }
//     });

//     const courseTitleMap = new Map(
//         enrollments.map((enrollment) => [
//             String(enrollment?.course?._id || enrollment?.course),
//             enrollment?.course?.title || "Course",
//         ])
//     );

//     const completedModuleRowsByModuleId = new Map();

//     moduleRequiredLessonsMap.forEach((requiredCount, moduleKey) => {
//         const completedSet = moduleCompletedLessonSetMap.get(moduleKey);
//         const completedCount = completedSet ? completedSet.size : 0;
//         if (!requiredCount || completedCount < requiredCount) return;

//         const [courseId, moduleId] = moduleKey.split(":");
//         if (!moduleId) return;

//         completedModuleRowsByModuleId.set(moduleId, {
//             moduleId,
//             courseId,
//             courseTitle: courseTitleMap.get(courseId) || "Course",
//             completedAt: moduleCompletedAtMap.get(moduleKey) || new Date(),
//         });
//     });

//     // Fallback to persisted enrollment progressModules for historical records without lesson-level completion details.
//     enrollments.forEach((enrollment) => {
//         const courseId = String(enrollment?.course?._id || enrollment?.course || "");
//         const courseTitle = enrollment?.course?.title || "Course";
//         (enrollment.progressModules || [])
//             .filter((item) => item?.status === "completed" && item?.moduleId)
//             .forEach((item) => {
//                 const moduleId = String(item.moduleId);
//                 if (!completedModuleRowsByModuleId.has(moduleId)) {
//                     completedModuleRowsByModuleId.set(moduleId, {
//                         moduleId,
//                         courseId,
//                         courseTitle,
//                         completedAt: item.completedAt || enrollment.completedAt || new Date(),
//                     });
//                 }
//             });
//     });

//     const completedModuleRows = Array.from(completedModuleRowsByModuleId.values());

//     if (!completedModuleRows.length) return;

//     await Promise.all(
//         completedModuleRows.map((row) =>
//             createAchievementEvent({
//                 userId,
//                 category: ACHIEVEMENT_CATEGORIES.COURSE,
//                 status: ACHIEVEMENT_STATUS.ACHIEVED,
//                 title: "Module completed",
//                 description: `Completed a module in ${row.courseTitle}`,
//                 pointsAwarded: ACHIEVEMENT_POINTS.MODULE_COMPLETED,
//                 pointsPossible: ACHIEVEMENT_POINTS.MODULE_COMPLETED,
//                 source: "enrollment.moduleComplete.backfill",
//                 occurredAt: row.completedAt,
//                 refs: {
//                     course: row.courseId,
//                     module: row.moduleId,
//                 },
//                 metadata: {
//                     courseTitle: row.courseTitle,
//                     moduleId: row.moduleId,
//                     completedAt: row.completedAt,
//                 },
//                 dedupeKey: `achievement:module-complete:${userId}:${row.moduleId}`,
//             })
//         )
//     );
// };

// const backfillOverdueAssignmentMissedAchievements = async (userId) => {
//     const now = new Date();
//     const enrollments = await Enrollment.find({
//         user: userId,
//         status: { $in: ["active", "completed"] },
//     })
//         .populate("course", "title")
//         .select("course")
//         .lean();

//     const courseIds = Array.from(
//         new Set(
//             enrollments
//                 .map((item) => item?.course?._id || item?.course)
//                 .filter(Boolean)
//                 .map((id) => String(id))
//         )
//     );

//     if (!courseIds.length) return;

//     const [overdueAssignments, mySubmissions] = await Promise.all([
//         Assignment.find({
//             course: { $in: courseIds },
//             isPublished: true,
//             dueDate: { $lt: now },
//             allowLateSubmission: false,
//         })
//             .populate("course", "title")
//             .select("_id title dueDate allowLateSubmission course")
//             .lean(),
//         Submission.find({
//             user: userId,
//             assignment: { $exists: true, $ne: null },
//             status: { $in: ["submitted", "graded", "returned"] },
//         })
//             .select("assignment")
//             .lean(),
//     ]);

//     if (!overdueAssignments.length) return;

//     const submittedAssignmentIds = new Set(
//         mySubmissions.map((item) => String(item.assignment)).filter(Boolean)
//     );

//     const misses = overdueAssignments.filter((item) => !submittedAssignmentIds.has(String(item._id)));

//     await Promise.all(
//         misses.map((assignment) =>
//             createAchievementEvent({
//                 userId,
//                 category: ACHIEVEMENT_CATEGORIES.ASSIGNMENT,
//                 status: ACHIEVEMENT_STATUS.MISSED,
//                 title: "Missed assignment deadline",
//                 description: `${assignment.title} deadline passed without submission`,
//                 pointsAwarded: 0,
//                 pointsPossible: ACHIEVEMENT_POINTS.ASSIGNMENT_SUBMITTED + ACHIEVEMENT_POINTS.ASSIGNMENT_BEFORE_DEADLINE,
//                 source: "assignment.deadlineMissed.backfill",
//                 occurredAt: assignment.dueDate || now,
//                 refs: {
//                     assignment: assignment._id,
//                     course: assignment?.course?._id || assignment?.course || null,
//                 },
//                 metadata: {
//                     assignmentTitle: assignment.title,
//                     courseTitle: assignment?.course?.title || "Course",
//                     dueDate: assignment.dueDate,
//                     reason: "not_submitted_before_deadline",
//                 },
//                 dedupeKey: `achievement:assignment-deadline-missed:${userId}:${assignment._id}`,
//             })
//         )
//     );
// };

// const backfillMissedLiveAchievements = async (userId) => {
//     const now = DateTime.now().setZone(IST_ZONE);

//     const enrollments = await Enrollment.find({
//         user: userId,
//         status: { $in: ["active", "completed"] },
//     })
//         .select("course")
//         .lean();

//     const courseIds = Array.from(
//         new Set(
//             enrollments
//                 .map((item) => item?.course)
//                 .filter(Boolean)
//                 .map((id) => String(id))
//         )
//     );

//     if (!courseIds.length) return;

//     const candidateLives = await LiveClass.find({
//         course: { $in: courseIds },
//         sessionType: { $in: ["lecture", "doubt"] },
//         status: { $in: ["completed", "live", "scheduled"] },
//     })
//         .populate("course", "title")
//         .select("_id title status scheduledAt endedAt duration course registeredParticipants")
//         .lean();

//     const missedLives = candidateLives.filter((liveClass) => {
//         const scheduled = liveClass?.scheduledAt
//             ? DateTime.fromJSDate(new Date(liveClass.scheduledAt)).setZone(IST_ZONE)
//             : null;

//         if (!scheduled || !scheduled.isValid) return false;

//         const ended = liveClass?.endedAt
//             ? DateTime.fromJSDate(new Date(liveClass.endedAt)).setZone(IST_ZONE)
//             : scheduled.plus({ minutes: Number(liveClass?.duration || 60) });

//         if (now <= ended) return false;

//         const participant = (liveClass.registeredParticipants || []).find(
//             (entry) => String(entry?.user) === String(userId)
//         );

//         return !(participant && participant.attended);
//     });

//     await Promise.all(
//         missedLives.map((liveClass) =>
//             createAchievementEvent({
//                 userId,
//                 category: ACHIEVEMENT_CATEGORIES.LIVE,
//                 status: ACHIEVEMENT_STATUS.MISSED,
//                 title: "Missed live class",
//                 description: `Missed ${liveClass.title || "live class"} held at ${DateTime.fromJSDate(new Date(liveClass.scheduledAt)).setZone(IST_ZONE).toFormat("dd LLL yyyy, HH:mm")}`,
//                 pointsAwarded: 0,
//                 pointsPossible: ACHIEVEMENT_POINTS.LIVE_JOINED,
//                 source: "live.missed.backfill",
//                 occurredAt: liveClass.scheduledAt || new Date(),
//                 refs: {
//                     liveClass: liveClass._id,
//                     course: liveClass?.course?._id || liveClass?.course || null,
//                 },
//                 metadata: {
//                     liveClassTitle: liveClass.title || "Live class",
//                     courseTitle: liveClass?.course?.title || "Course",
//                     scheduledAt: liveClass.scheduledAt,
//                     reason: "did_not_join",
//                 },
//                 dedupeKey: `achievement:live-missed:${userId}:${liveClass._id}`,
//             })
//         )
//     );
// };

// const backfillJoinedLiveAchievements = async (userId) => {
//     const joinedLives = await LiveClass.find({
//         registeredParticipants: {
//             $elemMatch: {
//                 user: userId,
//                 role: "User",
//                 attended: true,
//             },
//         },
//     })
//         .populate("course", "title")
//         .select("_id title scheduledAt endedAt course registeredParticipants")
//         .lean();

//     if (!joinedLives.length) return;

//     await Promise.all(
//         joinedLives.map((liveClass) => {
//             const participant = (liveClass.registeredParticipants || []).find(
//                 (entry) => String(entry?.user) === String(userId) && entry?.role === "User"
//             );

//             const occurredAt = participant?.joinedAt || liveClass?.endedAt || liveClass?.scheduledAt || new Date();

//             return createAchievementEvent({
//                 userId,
//                 category: ACHIEVEMENT_CATEGORIES.LIVE,
//                 status: ACHIEVEMENT_STATUS.ACHIEVED,
//                 title: "Joined live class",
//                 description: `${liveClass?.title || "Live class"} attended`,
//                 pointsAwarded: ACHIEVEMENT_POINTS.LIVE_JOINED,
//                 pointsPossible: ACHIEVEMENT_POINTS.LIVE_JOINED,
//                 source: "live.join.backfill",
//                 occurredAt,
//                 refs: {
//                     liveClass: liveClass._id,
//                     course: liveClass?.course?._id || liveClass?.course || null,
//                 },
//                 metadata: {
//                     liveClassTitle: liveClass?.title || "Live class",
//                     courseTitle: liveClass?.course?.title || "Course",
//                     scheduledAt: liveClass?.scheduledAt || null,
//                 },
//                 dedupeKey: `achievement:live-joined:${userId}:${liveClass._id}`,
//             });
//         })
//     );
// };

// const backfillStreakAchievements = async (userId) => {
//     const streak = await UserStreak.findOne({ user: userId })
//         .select("currentStreak lastActivityDateKey")
//         .lean();

//     if (!streak?.lastActivityDateKey) return;

//     const occurredAt = toDateFromIstKey(streak.lastActivityDateKey) || new Date();

//     await createAchievementEvent({
//         userId,
//         category: ACHIEVEMENT_CATEGORIES.STREAK,
//         status: ACHIEVEMENT_STATUS.ACHIEVED,
//         title: "Daily streak maintained",
//         description: `Streak updated to ${Number(streak.currentStreak || 0)} day(s)`,
//         pointsAwarded: ACHIEVEMENT_POINTS.STREAK_DAILY,
//         pointsPossible: ACHIEVEMENT_POINTS.STREAK_DAILY,
//         source: "streak.backfill",
//         occurredAt,
//         metadata: {
//             currentStreak: Number(streak.currentStreak || 0),
//             dayKey: streak.lastActivityDateKey,
//         },
//         dedupeKey: `achievement:streak-daily:${userId}:${streak.lastActivityDateKey}`,
//     });

//     const milestonePointMap = {
//         3: ACHIEVEMENT_POINTS.STREAK_3,
//         7: ACHIEVEMENT_POINTS.STREAK_7,
//         14: ACHIEVEMENT_POINTS.STREAK_14,
//         30: ACHIEVEMENT_POINTS.STREAK_30,
//     };

//     const earnedMilestones = STREAK_MILESTONES.filter((value) => Number(streak.currentStreak || 0) >= value);

//     await Promise.all(
//         earnedMilestones.map((milestone) =>
//             createAchievementEvent({
//                 userId,
//                 category: ACHIEVEMENT_CATEGORIES.STREAK,
//                 status: ACHIEVEMENT_STATUS.ACHIEVED,
//                 title: `${milestone}-day streak milestone`,
//                 description: `Unlocked ${milestone}-day streak reward`,
//                 pointsAwarded: milestonePointMap[milestone] || 0,
//                 pointsPossible: milestonePointMap[milestone] || 0,
//                 source: "streak.milestone.backfill",
//                 occurredAt,
//                 metadata: {
//                     milestone,
//                     currentStreak: Number(streak.currentStreak || 0),
//                 },
//                 dedupeKey: `achievement:streak-milestone:${userId}:${milestone}`,
//             })
//         )
//     );
// };

export const listMyAchievements = async ({
    userId,
    tab = ACHIEVEMENT_TABS.ALL,
    status,
    page = 1,
    limit = 20,
    courseId,
}) => {
    // await backfillEnrollmentAchievements(userId);
    // await backfillCourseCompletionAchievements(userId);
    // await backfillModuleCompletionAchievements(userId);
    // await backfillOverdueAssignmentMissedAchievements(userId);
    // await backfillJoinedLiveAchievements(userId);
    // await backfillMissedLiveAchievements(userId);
    // await backfillStreakAchievements(userId);

    const safePage = Math.max(1, Number(page) || 1);
    const safeLimit = Math.min(100, Math.max(1, Number(limit) || 20));

    const query = {
        user: userId,
        ...buildTabFilter(tab),
    };

    if (status && Object.values(ACHIEVEMENT_STATUS).includes(status)) {
        query.status = status;
    }

    if (courseId && tab !== ACHIEVEMENT_TABS.STREAK) {
        query.course = courseId;
    }

    const [total, items] = await Promise.all([
        Achievement.countDocuments(query),
        Achievement.find(query)
            .sort({ occurredAt: -1, createdAt: -1 })
            .skip((safePage - 1) * safeLimit)
            .limit(safeLimit)
            .lean(),
    ]);

    const weekStart = DateTime.now().setZone(IST_ZONE).startOf("week").toJSDate();

    const [summaryRows] = await Promise.all([
        Achievement.aggregate([
            { $match: { user: items[0]?.user || userId } },
            {
                $group: {
                    _id: null,
                    totalPoints: {
                        $sum: {
                            $cond: [
                                { $in: ["$status", [ACHIEVEMENT_STATUS.ACHIEVED, ACHIEVEMENT_STATUS.PARTIAL]] },
                                "$pointsAwarded",
                                0,
                            ],
                        },
                    },
                    weekPoints: {
                        $sum: {
                            $cond: [
                                {
                                    $and: [
                                        { $gte: ["$occurredAt", weekStart] },
                                        { $in: ["$status", [ACHIEVEMENT_STATUS.ACHIEVED, ACHIEVEMENT_STATUS.PARTIAL]] },
                                    ],
                                },
                                "$pointsAwarded",
                                0,
                            ],
                        },
                    },
                    missedPoints: {
                        $sum: {
                            $cond: [
                                { $eq: ["$status", ACHIEVEMENT_STATUS.MISSED] },
                                "$pointsPossible",
                                0,
                            ],
                        },
                    },
                    achievedCount: {
                        $sum: { $cond: [{ $eq: ["$status", ACHIEVEMENT_STATUS.ACHIEVED] }, 1, 0] },
                    },
                    partialCount: {
                        $sum: { $cond: [{ $eq: ["$status", ACHIEVEMENT_STATUS.PARTIAL] }, 1, 0] },
                    },
                    missedCount: {
                        $sum: { $cond: [{ $eq: ["$status", ACHIEVEMENT_STATUS.MISSED] }, 1, 0] },
                    },
                },
            },
        ]),
    ]);

    const summary = summaryRows?.[0] || {
        totalPoints: 0,
        weekPoints: 0,
        missedPoints: 0,
        achievedCount: 0,
        partialCount: 0,
        missedCount: 0,
    };

    return {
        items,
        page: safePage,
        limit: safeLimit,
        total,
        totalPages: Math.ceil(total / safeLimit),
        summary,
    };
};
