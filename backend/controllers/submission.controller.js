import { Submission } from "../models/submission.model.js";
import { DateTime } from "luxon";
import { randomUUID } from "crypto";
import { Assignment } from "../models/assignment.model.js";
import { Course } from "../models/course.model.js";
import { Enrollment } from "../models/enrollment.model.js";
import { Lesson } from "../models/lesson.model.js";
import { Notification } from "../models/notification.model.js";
import { Admin } from "../models/admin.model.js";
import { User } from "../models/user.model.js";
import { asyncHandler } from "../middlewares/async.middleware.js";
import { errorResponse, successResponse } from "../utils/response.utils.js";
import { getPagination, createPaginationResponse } from "../utils/pagination.utils.js";
import logger from "../configs/logger.config.js";
import { upsertLessonProgress } from "../services/progress.service.js";
import { reconcileSubmittedAssignmentProgress } from "../services/assignment-progress-reconcile.service.js";
import { uploadAssignmentFile } from "../services/r2.service.js";
import { sendEmail } from "../services/mail.service.js";
import { refreshLeaderboardAfterActivity } from "../services/leaderboard.service.js";
import {
    ACHIEVEMENT_CATEGORIES,
    ACHIEVEMENT_POINTS,
    ACHIEVEMENT_STATUS,
} from "../constants/achievement.constant.js";
import { createAchievementEvent } from "../services/achievement.service.js";
import { enqueueMcqGradingJob } from "../services/grading-queue.service.js";

/**
 * Submission Controller
 * Handles assignment submissions for users and grading for instructors
 */

const toObjectIdString = (value) => String(value || "");

const getWordCount = (text = "") => {
    return text
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .length;
};

const parseArrayField = (rawValue) => {
    if (!rawValue) return [];
    if (Array.isArray(rawValue)) return rawValue;
    if (typeof rawValue === "string") {
        const trimmed = rawValue.trim();
        if (!trimmed) return [];
        try {
            const parsed = JSON.parse(trimmed);
            return Array.isArray(parsed) ? parsed : [];
        } catch {
            return [trimmed];
        }
    }
    return [];
};

const parseObjectField = (rawValue) => {
    if (!rawValue) return {};
    if (typeof rawValue === "object" && !Array.isArray(rawValue)) return rawValue;
    if (typeof rawValue === "string") {
        const trimmed = rawValue.trim();
        if (!trimmed) return {};
        try {
            const parsed = JSON.parse(trimmed);
            return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
        } catch {
            return {};
        }
    }
    return {};
};

const isPrivateHost = (host = "") => {
    const lowerHost = String(host).toLowerCase();
    if (!lowerHost) return true;
    if (lowerHost === "localhost" || lowerHost.endsWith(".localhost")) return true;
    if (lowerHost.endsWith(".local")) return true;

    const ipv4Match = lowerHost.match(/^(\d{1,3})(\.(\d{1,3})){3}$/);
    if (ipv4Match) {
        const [a, b] = lowerHost.split(".").map(Number);
        if (a === 10) return true;
        if (a === 127) return true;
        if (a === 0) return true;
        if (a === 169 && b === 254) return true;
        if (a === 172 && b >= 16 && b <= 31) return true;
        if (a === 192 && b === 168) return true;
    }

    if (lowerHost === "::1" || lowerHost.startsWith("fc") || lowerHost.startsWith("fd") || lowerHost.startsWith("fe80")) {
        return true;
    }

    return false;
};

const normalizeLinks = (rawLinks = []) => {
    const list = Array.isArray(rawLinks) ? rawLinks : [];
    const normalized = [];

    for (const link of list) {
        const candidate = typeof link === "string" ? { url: link } : (link || {});
        const rawUrl = String(candidate.url || "").trim();
        if (!rawUrl) continue;

        let parsed;
        try {
            parsed = new URL(rawUrl);
        } catch {
            throw new Error(`Invalid URL provided: ${rawUrl}`);
        }

        if (!["http:", "https:"].includes(parsed.protocol)) {
            throw new Error(`Only http/https URLs are allowed: ${rawUrl}`);
        }

        if (isPrivateHost(parsed.hostname)) {
            throw new Error(`Private or local URLs are not allowed: ${rawUrl}`);
        }

        normalized.push({
            title: String(candidate.title || parsed.hostname || "Reference Link").trim().slice(0, 120),
            url: parsed.toString(),
        });
    }

    return normalized;
};

const parseContentPayload = (req) => {
    let content = req.body?.content;

    if (typeof content === "string") {
        try {
            content = JSON.parse(content);
        } catch {
            content = { text: content };
        }
    }

    if (!content || typeof content !== "object") content = {};

    const directText = typeof req.body?.text === "string" ? req.body.text : undefined;
    const directLinks = parseArrayField(req.body?.links);

    const text = String(content.text ?? directText ?? "").trim();
    const links = normalizeLinks(content.links ?? directLinks);
    const mcqAnswers = parseObjectField(content.mcqAnswers ?? req.body?.answers);

    return { text, links, mcqAnswers };
};

const IST_ZONE = "Asia/Kolkata";
const AUTO_GRADED_ASSESSMENT_TYPES = ["mcq", "true_false", "matching"];
const DEBUG_GRADING_ENABLED = String(process.env.DEBUG_GRADING || "").toLowerCase() === "true";

const debugGrading = (message, meta = {}) => {
    if (!DEBUG_GRADING_ENABLED) return;
    logger.info(`🧪 ===[AUTO_GRADER_API]=== ${message} ${JSON.stringify(meta)}`);
};

const isObjectiveAssessmentType = (assessmentType) => {
    return AUTO_GRADED_ASSESSMENT_TYPES.includes(String(assessmentType || "").toLowerCase());
};

const normalizeToken = (value = "") => String(value ?? "").trim();

const normalizeTokenLower = (value = "") => normalizeToken(value).toLowerCase();

const isPastDueDate = (dueDate) => {
    if (!dueDate) return false;

    const due = DateTime.fromJSDate(new Date(dueDate)).setZone(IST_ZONE);
    const now = DateTime.now().setZone(IST_ZONE);

    if (!due.isValid) return false;
    return now.toMillis() > due.toMillis();
};

const validateByAssignmentType = ({ assignment, content }) => {
    if (isObjectiveAssessmentType(assignment.assessmentType)) {
        const answers = content.mcqAnswers || {};
        const hasAnswers = answers && typeof answers === "object" && Object.keys(answers).length > 0;
        if (!hasAnswers) {
            throw new Error("Objective assignment requires answers payload");
        }

        if (assignment.assessmentType === "true_false") {
            const values = Object.values(answers);
            const hasInvalid = values.some((value) => {
                const normalized = normalizeTokenLower(value);
                return !["true", "false"].includes(normalized);
            });

            if (hasInvalid) {
                throw new Error("True/False assignment accepts only true/false answers");
            }
        }

        if (assignment.assessmentType === "matching") {
            const values = Object.values(answers);
            const hasInvalid = values.some((value) => {
                if (!value || typeof value !== "object" || Array.isArray(value)) return true;
                return Object.values(value).some((mapped) => !normalizeToken(mapped));
            });

            if (hasInvalid) {
                throw new Error("Matching assignment requires term-to-option mapping answers");
            }
        }

        return;
    }

    const type = assignment.type || "text";
    const hasText = Boolean(content.text?.trim());
    const hasFiles = Array.isArray(content.files) && content.files.length > 0;
    const hasLinks = Array.isArray(content.links) && content.links.length > 0;

    if (type === "text") {
        if (!hasText) throw new Error("This assignment accepts text only. Please provide text content.");
        if (hasFiles || hasLinks) throw new Error("This assignment accepts text only. Remove files and links.");
    }

    if (type === "file") {
        if (!hasFiles) throw new Error("This assignment requires file upload.");
        if (hasText || hasLinks) throw new Error("This assignment accepts files only. Remove text and links.");
    }

    if (type === "url") {
        if (!hasLinks) throw new Error("This assignment requires at least one valid URL.");
        if (hasText || hasFiles) throw new Error("This assignment accepts URLs only. Remove text and files.");
    }

    if (type === "mixed") {
        if (!hasText && !hasFiles && !hasLinks) {
            throw new Error("Mixed assignment requires at least one of text, file, or URL.");
        }
    }

    if (assignment.wordLimit && hasText) {
        const count = getWordCount(content.text);
        if (assignment.wordLimit.min && count < assignment.wordLimit.min) {
            throw new Error(`Submission text must have at least ${assignment.wordLimit.min} words.`);
        }
        if (assignment.wordLimit.max && count > assignment.wordLimit.max) {
            throw new Error(`Submission text cannot exceed ${assignment.wordLimit.max} words.`);
        }
    }
};

const enqueueAutoGradingIfEligible = async ({ assignment, submission, traceId }) => {
    const isAutoObjective = isObjectiveAssessmentType(assignment.assessmentType) && assignment.gradingType === "auto";
    if (!isAutoObjective) {
        return {
            queued: false,
            eligible: false,
            traceId: String(traceId || ""),
            jobId: null,
        };
    }

    const job = await enqueueMcqGradingJob({
        submissionId: submission._id,
        assignmentId: assignment._id,
        userId: submission.user,
        courseId: submission.course,
        assessmentType: assignment.assessmentType,
        attemptNumber: submission.attemptNumber,
        traceId,
        isLate: submission.isLate,
        latePenalty: submission.latePenalty,
    });

    if (!job) {
        throw new Error("Grading queue unavailable");
    }

    return {
        queued: true,
        eligible: true,
        traceId: String(traceId || ""),
        jobId: String(job.id),
    };
};

const markSubmissionQueueFailure = async (submission, errorMessage) => {
    submission.gradingStatus = "failed";
    submission.gradingError = String(errorMessage || "Grading queue unavailable").slice(0, 1000);
    submission.gradingSource = "auto";
    await submission.save();
};

const uploadSubmissionFiles = async ({ files = [], assignment, course }) => {
    if (!Array.isArray(files) || files.length === 0) return [];

    const uploaded = [];
    const courseName = course?.title || "course";
    const assignmentName = assignment?.title || "assignment";

    for (const file of files) {
        const result = await uploadAssignmentFile(
            file.buffer,
            courseName,
            "assignment_submissions",
            assignmentName,
            file.originalname
        );

        uploaded.push({
            name: file.originalname,
            public_id: result.public_id,
            url: result.secure_url,
            type: file.mimetype,
            size: file.size,
        });
    }

    return uploaded;
};

const createNotificationAndEmit = async ({ req, recipient, recipientRole, type, title, message, data }) => {
    const notification = await Notification.createNotification({
        recipient,
        recipientRole,
        type,
        title,
        message,
        data,
    });

    const io = req.app.get("io");
    if (io) {
        io.to(`notifications:${recipientRole}:${recipient}`).emit(type, {
            notification,
            data,
        });
    }

    return notification;
};

// @route   POST /api/v1/assignments/:assignmentId/submissions
// @desc    Submit an assignment
// @access  Private (User - enrolled)
export const createSubmission = asyncHandler(async (req, res) => {
    const assignmentId = req.params.assignmentId || req.body.assignmentId;
    if (!assignmentId) return errorResponse(res, 400, "assignmentId is required");

    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) return errorResponse(res, 404, "Assignment not found");

    const course = await Course.findById(assignment.course).select("_id title");
    if (!course) return errorResponse(res, 404, "Course not found for assignment");

    const enrollment = await Enrollment.findOne({
        user: req.user.id,
        course: assignment.course,
        status: { $in: ["active", "completed"] }
    });

    if (!enrollment) return errorResponse(res, 403, "You must be enrolled in the course");
    if (enrollment.moderationLock?.isLocked) {
        return errorResponse(res, 403, "Your course access is temporarily locked due to moderation review");
    }

    const existing = await Submission.findOne({ user: req.user.id, assignment: assignmentId });

    if (existing?.moderation?.status === "approved_ban") {
        return errorResponse(res, 403, "Your submission is banned for policy violation and cannot be updated");
    }

    if (existing?.moderation?.status === "under_review") {
        return errorResponse(res, 403, "This submission is under moderation review and cannot be updated");
    }

    if (existing && existing.status === "graded") {
        const canResubmitAutoObjective =
            assignment.gradingType === "auto" &&
            isObjectiveAssessmentType(assignment.assessmentType);

        if (!canResubmitAutoObjective) {
            return errorResponse(res, 400, "This submission is graded and cannot be updated");
        }
    }

    const isLate = isPastDueDate(assignment.dueDate);
    if (isLate && !assignment.allowLateSubmission) {
        return errorResponse(res, 400, "Assignment submission deadline has passed and late submission is not allowed");
    }

    const parsed = parseContentPayload(req);
    const uploadedFiles = await uploadSubmissionFiles({
        files: req.files || [],
        assignment,
        course,
    });

    const mergedContent = {
        text: parsed.text,
        links: parsed.links,
        files: uploadedFiles,
        mcqAnswers: parsed.mcqAnswers,
    };

    if (existing) {
        mergedContent.text = parsed.text || existing.content?.text || "";
        mergedContent.links = parsed.links.length > 0 ? parsed.links : (existing.content?.links || []);
        mergedContent.mcqAnswers = Object.keys(parsed.mcqAnswers || {}).length > 0
            ? parsed.mcqAnswers
            : (existing.content?.mcqAnswers || {});
        mergedContent.files = [
            ...(existing.content?.files || []),
            ...uploadedFiles,
        ];
    }

    try {
        validateByAssignmentType({ assignment, content: mergedContent });
    } catch (validationError) {
        return errorResponse(res, 400, validationError.message);
    }

    const lesson = assignment.lesson
        ? await Lesson.findById(assignment.lesson).select("_id type course")
        : await Lesson.findOne({ assignmentId: assignment._id }).select("_id type course");

    const submissionData = {
        user: req.user.id,
        assignment: assignmentId,
        course: assignment.course,
        content: mergedContent,
        maxScore: assignment.maxScore,
        status: "submitted",
        gradingType: assignment.gradingType === "auto" ? "auto" : "manual",
        gradingStatus: assignment.gradingType === "auto" ? "queued" : "manual_review",
        gradingSource: assignment.gradingType === "auto" ? "auto" : "instructor",
        gradingError: "",
        submittedAt: new Date(),
        submittedBy: req.user.id,
        isLate,
        latePenalty: isLate ? assignment.lateSubmissionPenalty : 0
    };

    if (existing) {
        const updated = await existing.resubmit(mergedContent);
        updated.gradingType = assignment.gradingType === "auto" ? "auto" : "manual";
        updated.gradingStatus = assignment.gradingType === "auto" ? "queued" : "manual_review";
        updated.gradingSource = assignment.gradingType === "auto" ? "auto" : "instructor";
        updated.gradingError = "";
        await updated.save();

        const gradingTraceId = randomUUID();
        let queueMeta = {
            queued: false,
            eligible: assignment.gradingType === "auto" && isObjectiveAssessmentType(assignment.assessmentType),
            traceId: gradingTraceId,
            jobId: null,
        };

        if (queueMeta.eligible) {
            try {
                debugGrading("API_RESUBMIT_QUEUE_START", {
                    submissionId: String(updated._id),
                    assignmentId: String(assignment._id),
                    attemptNumber: Number(updated.attemptNumber || 1),
                    traceId: gradingTraceId,
                });
                queueMeta = await enqueueAutoGradingIfEligible({
                    assignment,
                    submission: updated,
                    traceId: gradingTraceId,
                });
                debugGrading("API_RESUBMIT_QUEUE_DONE", {
                    submissionId: String(updated._id),
                    traceId: queueMeta.traceId,
                    jobId: queueMeta.jobId,
                });
            } catch (queueError) {
                await markSubmissionQueueFailure(updated, `Queue enqueue failed: ${queueError.message}`);
                logger.error(`[AUTO_GRADER_API] Resubmit queue failed for submission ${updated._id}: ${queueError.message}`);
                queueMeta = {
                    queued: false,
                    eligible: true,
                    traceId: gradingTraceId,
                    jobId: null,
                };
            }
        }

        if (lesson) {
            await upsertLessonProgress({
                userId: req.user.id,
                lesson,
                payload: {
                    assignmentSubmitted: true,
                    activityProgress: {
                        assignmentStarted: true,
                        assignmentSubmitted: true,
                    },
                },
            });
        }

        await refreshLeaderboardAfterActivity({
            userId: req.user.id,
            io: req.app.get("io"),
            source: "submission.resubmit",
        });

        await createAchievementEvent({
            userId: req.user.id,
            category: ACHIEVEMENT_CATEGORIES.ASSIGNMENT,
            status: ACHIEVEMENT_STATUS.ACHIEVED,
            title: "Assignment submitted",
            description: `Submitted ${assignment.title}`,
            pointsAwarded: ACHIEVEMENT_POINTS.ASSIGNMENT_SUBMITTED,
            pointsPossible: ACHIEVEMENT_POINTS.ASSIGNMENT_SUBMITTED,
            source: "submission.resubmit",
            refs: {
                assignment: assignment._id,
                course: assignment.course,
            },
            metadata: {
                assignmentTitle: assignment.title,
                isResubmission: true,
                submittedAt: updated.submittedAt || new Date(),
            },
            dedupeKey: `achievement:assignment-submit:${req.user.id}:${assignment._id}`,
        });

        return successResponse(res, 200, "Assignment submission updated successfully", {
            submission: updated,
            autoGradingQueued: queueMeta.queued,
            gradingTraceId: queueMeta.traceId,
        });
    }

    const submission = await Submission.create(submissionData);

    const gradingTraceId = randomUUID();
    let queueMeta = {
        queued: false,
        eligible: assignment.gradingType === "auto" && isObjectiveAssessmentType(assignment.assessmentType),
        traceId: gradingTraceId,
        jobId: null,
    };

    if (queueMeta.eligible) {
        try {
            debugGrading("API_CREATE_QUEUE_START", {
                submissionId: String(submission._id),
                assignmentId: String(assignment._id),
                attemptNumber: Number(submission.attemptNumber || 1),
                traceId: gradingTraceId,
            });
            queueMeta = await enqueueAutoGradingIfEligible({
                assignment,
                submission,
                traceId: gradingTraceId,
            });
            debugGrading("API_CREATE_QUEUE_DONE", {
                submissionId: String(submission._id),
                traceId: queueMeta.traceId,
                jobId: queueMeta.jobId,
            });
        } catch (queueError) {
            await markSubmissionQueueFailure(submission, `Queue enqueue failed: ${queueError.message}`);
            logger.error(`[AUTO_GRADER_API] Create queue failed for submission ${submission._id}: ${queueError.message}`);
            queueMeta = {
                queued: false,
                eligible: true,
                traceId: gradingTraceId,
                jobId: null,
            };
        }
    }

    if (lesson) {
        await upsertLessonProgress({
            userId: req.user.id,
            lesson,
            payload: {
                assignmentSubmitted: true,
                activityProgress: {
                    assignmentStarted: true,
                    assignmentSubmitted: true,
                },
            },
        });
    }

    await refreshLeaderboardAfterActivity({
        userId: req.user.id,
        io: req.app.get("io"),
        source: "submission.create",
    });

    await createAchievementEvent({
        userId: req.user.id,
        category: ACHIEVEMENT_CATEGORIES.ASSIGNMENT,
        status: ACHIEVEMENT_STATUS.ACHIEVED,
        title: "Assignment submitted",
        description: `Submitted ${assignment.title}`,
        pointsAwarded: ACHIEVEMENT_POINTS.ASSIGNMENT_SUBMITTED,
        pointsPossible: ACHIEVEMENT_POINTS.ASSIGNMENT_SUBMITTED,
        source: "submission.create",
        refs: {
            assignment: assignment._id,
            course: assignment.course,
        },
        metadata: {
            assignmentTitle: assignment.title,
            isResubmission: false,
            submittedAt: submission.submittedAt || new Date(),
        },
        dedupeKey: `achievement:assignment-submit:${req.user.id}:${assignment._id}`,
    });

    if (!isLate) {
        await createAchievementEvent({
            userId: req.user.id,
            category: ACHIEVEMENT_CATEGORIES.ASSIGNMENT,
            status: ACHIEVEMENT_STATUS.ACHIEVED,
            title: "Submitted before deadline",
            description: `${assignment.title} submitted on time`,
            pointsAwarded: ACHIEVEMENT_POINTS.ASSIGNMENT_BEFORE_DEADLINE,
            pointsPossible: ACHIEVEMENT_POINTS.ASSIGNMENT_BEFORE_DEADLINE,
            source: "submission.beforeDeadline",
            refs: {
                assignment: assignment._id,
                course: assignment.course,
            },
            metadata: {
                assignmentTitle: assignment.title,
                dueDate: assignment.dueDate,
                submittedAt: submission.submittedAt || new Date(),
            },
            dedupeKey: `achievement:assignment-ontime:${req.user.id}:${assignment._id}`,
        });
    } else {
        await createAchievementEvent({
            userId: req.user.id,
            category: ACHIEVEMENT_CATEGORIES.ASSIGNMENT,
            status: ACHIEVEMENT_STATUS.MISSED,
            title: "Missed on-time bonus",
            description: `${assignment.title} was submitted after deadline`,
            pointsAwarded: 0,
            pointsPossible: ACHIEVEMENT_POINTS.ASSIGNMENT_BEFORE_DEADLINE,
            source: "submission.missedDeadlineBonus",
            refs: {
                assignment: assignment._id,
                course: assignment.course,
            },
            metadata: {
                assignmentTitle: assignment.title,
                dueDate: assignment.dueDate,
                submittedAt: submission.submittedAt || new Date(),
            },
            dedupeKey: `achievement:assignment-ontime-missed:${req.user.id}:${assignment._id}`,
        });
    }

    // Update assignment submission count
    await assignment.updateAnalytics();

    successResponse(res, 201, "Assignment submitted successfully", {
        submission,
        autoGradingQueued: queueMeta.queued,
        gradingTraceId: queueMeta.traceId,
    });
});

// @route   GET /api/v1/submissions/my
// @desc    Get my submissions
// @access  Private (User)
export const getMySubmissions = asyncHandler(async (req, res) => {
    const { page, limit, skip } = getPagination(req.query, 10);
    const { courseId, status } = req.query;

    const options = { courseId, status, limit, skip, sort: "-submittedAt" };
    const submissions = await Submission.getUserSubmissions(req.user.id, options);

    const total = await Submission.countDocuments({
        user: req.user.id,
        ...(courseId && { course: courseId }),
        ...(status && { status })
    });

    successResponse(res, 200, "Submissions retrieved successfully", {
        submissions,
        pagination: createPaginationResponse(total, page, limit)
    });
});

// @route   GET /api/v1/submissions/:id
// @desc    Get submission by ID
// @access  Private (User - own / Instructor - assignment owner)
export const getSubmission = asyncHandler(async (req, res) => {
    const submission = await Submission.findById(req.params.id)
        .populate("user", "firstName lastName email profilePicture")
        .populate("assignment", "title description dueDate maxScore rubrics")
        .populate("course", "title");

    if (!submission) return errorResponse(res, 404, "Submission not found");

    // Access control
    const isOwner = req.user && submission.user._id.toString() === req.user.id;
    const isAdmin = !!req.admin;
    let isInstructor = false;
    if (req.instructor) {
        const assignment = await Assignment.findById(submission.assignment._id);
        isInstructor = assignment && assignment.instructor.toString() === req.instructor.id;
    }

    if (!isOwner && !isAdmin && !isInstructor) {
        return errorResponse(res, 403, "Access denied");
    }

    successResponse(res, 200, "Submission retrieved successfully", submission);
});

// @route   GET /api/v1/assignments/:assignmentId/submissions
// @desc    Get all submissions for an assignment
// @access  Private (Instructor - assignment owner / Admin)
export const getAssignmentSubmissions = asyncHandler(async (req, res) => {
    const { assignmentId } = req.params;
    const { page, limit, skip } = getPagination(req.query, 20);
    const { status } = req.query;

    // Verify instructor owns the assignment
    if (req.instructor) {
        const assignment = await Assignment.findById(assignmentId);
        if (!assignment || assignment.instructor.toString() !== req.instructor.id) {
            return errorResponse(res, 403, "You can only view submissions for your own assignments");
        }
    }

    const filter = { assignment: assignmentId };
    if (status) filter.status = status;

    const total = await Submission.countDocuments(filter);
    const submissions = await Submission.find(filter)
        .populate("user", "firstName lastName email profilePicture")
        .sort({ submittedAt: -1 })
        .skip(skip)
        .limit(limit);

    // Get stats
    const stats = await Submission.getSubmissionStats(assignmentId);

    successResponse(res, 200, "Submissions retrieved successfully", {
        submissions,
        stats: stats[0] || null,
        pagination: createPaginationResponse(total, page, limit)
    });
});

// @route   PUT /api/v1/submissions/:id/grade
// @desc    Grade a submission
// @access  Private (Instructor - assignment owner)
export const gradeSubmission = asyncHandler(async (req, res) => {
    const { score, feedback, rubricScores } = req.body;
    const submission = await Submission.findById(req.params.id);
    if (!submission) return errorResponse(res, 404, "Submission not found");

    // Verify instructor owns the assignment
    const assignment = await Assignment.findById(submission.assignment);
    if (!assignment || assignment.instructor.toString() !== req.instructor.id) {
        return errorResponse(res, 403, "You can only grade submissions for your own assignments");
    }

    if (score === undefined) return errorResponse(res, 400, "Score is required");

    const graded = await submission.assignGrade(
        score,
        feedback || "",
        req.instructor.id,
        rubricScores || []
    );

    // Update assignment analytics
    await assignment.updateAnalytics();

    const lesson = assignment.lesson
        ? await Lesson.findById(assignment.lesson).select("_id type course")
        : await Lesson.findOne({ assignmentId: assignment._id }).select("_id type course");

    if (lesson) {
        await upsertLessonProgress({
            userId: submission.user,
            lesson,
            payload: {
                assignmentSubmitted: true,
                assignmentScore: score,
                assignmentFeedback: feedback || "",
                activityProgress: {
                    assignmentStarted: true,
                    assignmentSubmitted: true,
                },
            },
        });
    }

    await refreshLeaderboardAfterActivity({
        userId: submission.user,
        io: req.app.get("io"),
        source: "submission.grade",
    });

    const percentage = submission.maxScore > 0 ? Number(score) / Number(submission.maxScore) : 0;
    let gradePoints = 0;
    let gradeTitle = "Assignment graded";
    let gradeStatus = ACHIEVEMENT_STATUS.PARTIAL;
    let gradePossible = ACHIEVEMENT_POINTS.ASSIGNMENT_SCORE_80;

    if (percentage >= 1) {
        gradePoints = ACHIEVEMENT_POINTS.ASSIGNMENT_SCORE_100;
        gradeTitle = "Perfect score achieved";
        gradeStatus = ACHIEVEMENT_STATUS.ACHIEVED;
        gradePossible = ACHIEVEMENT_POINTS.ASSIGNMENT_SCORE_100;
    } else if (percentage >= 0.9) {
        gradePoints = ACHIEVEMENT_POINTS.ASSIGNMENT_SCORE_90;
        gradeTitle = "90%+ score achieved";
        gradeStatus = ACHIEVEMENT_STATUS.ACHIEVED;
        gradePossible = ACHIEVEMENT_POINTS.ASSIGNMENT_SCORE_90;
    } else if (percentage >= 0.8) {
        gradePoints = ACHIEVEMENT_POINTS.ASSIGNMENT_SCORE_80;
        gradeTitle = "80%+ score achieved";
        gradeStatus = ACHIEVEMENT_STATUS.ACHIEVED;
        gradePossible = ACHIEVEMENT_POINTS.ASSIGNMENT_SCORE_80;
    } else {
        gradePoints = Math.floor(ACHIEVEMENT_POINTS.ASSIGNMENT_SCORE_80 / 2);
        gradeTitle = "Partial grading reward";
        gradeStatus = ACHIEVEMENT_STATUS.PARTIAL;
        gradePossible = ACHIEVEMENT_POINTS.ASSIGNMENT_SCORE_80;
    }

    await createAchievementEvent({
        userId: submission.user,
        category: ACHIEVEMENT_CATEGORIES.ASSIGNMENT,
        status: gradeStatus,
        title: gradeTitle,
        description: `${assignment.title} scored ${score}/${submission.maxScore}`,
        pointsAwarded: gradePoints,
        pointsPossible: gradePossible,
        source: "submission.grade",
        refs: {
            assignment: assignment._id,
            course: assignment.course,
        },
        metadata: {
            assignmentTitle: assignment.title,
            score,
            maxScore: submission.maxScore,
            percentage,
        },
        dedupeKey: `achievement:assignment-grade:${submission.user}:${assignment._id}`,
    });

    await createNotificationAndEmit({
        req,
        recipient: toObjectIdString(submission.user),
        recipientRole: "User",
        type: "assignment_graded",
        title: "Assignment graded",
        message: `Your assignment \"${assignment.title}\" was graded. Score: ${score}/${submission.maxScore}`,
        data: {
            submissionId: submission._id,
            assignmentId: assignment._id,
            courseId: assignment.course,
            score,
            feedback: feedback || "",
        },
    });

    logger.info(`Instructor ${req.instructor.id} graded submission ${req.params.id} with score ${score}`);

    successResponse(res, 200, "Submission graded successfully", graded);
});

// @route   PUT /api/v1/submissions/:id/return
// @desc    Return submission for revision
// @access  Private (Instructor - assignment owner)
export const returnSubmission = asyncHandler(async (req, res) => {
    const { feedback } = req.body;
    const submission = await Submission.findById(req.params.id);
    if (!submission) return errorResponse(res, 404, "Submission not found");

    const assignment = await Assignment.findById(submission.assignment);
    if (!assignment || assignment.instructor.toString() !== req.instructor.id) {
        return errorResponse(res, 403, "You can only return submissions for your own assignments");
    }

    const returned = await submission.returnForRevision(
        feedback || "Please revise and resubmit",
        req.instructor.id
    );

    successResponse(res, 200, "Submission returned for revision", returned);
});

// @route   PATCH /api/v1/submissions/:id/report
// @desc    Report suspicious submission and temporarily lock course access
// @access  Private (Instructor - assignment owner)
export const reportSubmission = asyncHandler(async (req, res) => {
    const { reason } = req.body;
    const submission = await Submission.findById(req.params.id);
    if (!submission) return errorResponse(res, 404, "Submission not found");

    const assignment = await Assignment.findById(submission.assignment);
    if (!assignment || toObjectIdString(assignment.instructor) !== req.instructor.id) {
        return errorResponse(res, 403, "You can only report submissions for your own assignments");
    }

    if (!reason || String(reason).trim().length < 10) {
        return errorResponse(res, 400, "Detailed report reason is required (minimum 10 characters)");
    }

    const course = await Course.findById(submission.course).select("title");
    const evidenceFiles = await uploadSubmissionFiles({
        files: req.files || [],
        assignment,
        course,
    });

    submission.moderation = {
        ...submission.moderation,
        isReported: true,
        status: "under_review",
        reportReason: String(reason).trim(),
        reportEvidence: evidenceFiles,
        reportedAt: new Date(),
        reportedBy: req.instructor.id,
        adminDecisionAt: null,
        adminDecisionBy: null,
        adminNote: "",
    };
    await submission.save();

    const enrollment = await Enrollment.findOne({
        user: submission.user,
        course: submission.course,
        status: { $in: ["active", "completed"] }
    });

    if (enrollment) {
        await enrollment.lockByModeration({
            reason: "Temporarily locked while suspicious assignment report is reviewed",
            lockedBy: req.instructor.id,
            reportId: submission._id,
        });
    }

    const admins = await Admin.find({ isActive: true }).select("_id");
    for (const admin of admins) {
        await createNotificationAndEmit({
            req,
            recipient: toObjectIdString(admin._id),
            recipientRole: "Admin",
            type: "assignment_reported",
            title: "Suspicious assignment reported",
            message: `A submission has been reported by instructor and needs moderation review.`,
            data: {
                submissionId: submission._id,
                assignmentId: assignment._id,
                courseId: assignment.course,
                reportedBy: req.instructor.id,
            },
        });
    }

    successResponse(res, 200, "Submission reported and user access temporarily locked", submission);
});

// @route   PATCH /api/v1/submissions/:id/moderate
// @desc    Admin moderation decision for reported submission
// @access  Private (Admin)
export const moderateSubmissionReport = asyncHandler(async (req, res) => {
    const { action, adminNote } = req.body;
    const submission = await Submission.findById(req.params.id);
    if (!submission) return errorResponse(res, 404, "Submission not found");

    if (!submission.moderation?.isReported || submission.moderation?.status !== "under_review") {
        return errorResponse(res, 400, "Submission is not in report review state");
    }

    if (!["approve_ban", "reject_report"].includes(action)) {
        return errorResponse(res, 400, "Invalid moderation action");
    }

    const assignment = await Assignment.findById(submission.assignment).select("title course");
    const user = await User.findById(submission.user).select("firstName lastName email");
    const enrollment = await Enrollment.findOne({ user: submission.user, course: submission.course });

    const approvedBan = action === "approve_ban";
    submission.moderation.status = approvedBan ? "approved_ban" : "rejected";
    submission.moderation.adminNote = String(adminNote || "").trim().slice(0, 2000);
    submission.moderation.adminDecisionAt = new Date();
    submission.moderation.adminDecisionBy = req.admin.id;
    await submission.save();

    if (enrollment) {
        if (approvedBan) {
            enrollment.status = "cancelled";
            enrollment.moderationLock = {
                isLocked: true,
                reason: "Banned from course due to malicious assignment submission",
                lockedAt: new Date(),
                lockedBy: submission.moderation.reportedBy,
                reportId: submission._id,
            };
            await enrollment.save();
        } else {
            await enrollment.unlockByModeration();
        }
    }

    const decisionMessage = approvedBan
        ? "Your submission violated policy. You are banned from this course and the fee is non-refundable."
        : "Your submission report was reviewed and access has been restored.";

    await createNotificationAndEmit({
        req,
        recipient: toObjectIdString(submission.user),
        recipientRole: "User",
        type: "assignment_moderation_update",
        title: approvedBan ? "Course ban approved" : "Report cleared",
        message: decisionMessage,
        data: {
            submissionId: submission._id,
            assignmentId: submission.assignment,
            action,
        },
    });

    if (user?.email && approvedBan) {
        const fullName = `${user.firstName || ""} ${user.lastName || ""}`.trim() || "Learner";
        try {
            await sendEmail({
                to: user.email,
                subject: "Course access removed due to policy violation",
                html: `
                    <p>Hello ${fullName},</p>
                    <p>Your assignment submission for <strong>${assignment?.title || "your course"}</strong> was found to violate platform policy.</p>
                    <p>You have been banned from this course. As per policy, your course fee is non-refundable.</p>
                    <p>If you believe this decision is incorrect, please contact support.</p>
                    <p>Regards,<br/>GHA Compliance Team</p>
                `,
            });
        } catch (mailError) {
            logger.error(`Failed to send moderation email to user ${submission.user}: ${mailError.message}`);
        }
    }

    successResponse(res, 200, "Moderation decision saved successfully", submission);
});
