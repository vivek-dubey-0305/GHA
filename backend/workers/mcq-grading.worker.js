import "dotenv/config";
import { Worker } from "bullmq";
import connectDB from "../configs/connection.config.js";
import logger from "../configs/logger.config.js";
import { Assignment } from "../models/assignment.model.js";
import "../models/course.model.js";
import { Lesson } from "../models/lesson.model.js";
import { Notification } from "../models/notification.model.js";
import { Submission } from "../models/submission.model.js";
import { evaluateObjectiveAnswers } from "../services/mcq-grading.service.js";
import { upsertLessonProgress } from "../services/progress.service.js";

const AUTO_GRADED_ASSESSMENT_TYPES = ["mcq", "true_false", "matching"];
const DEBUG_GRADING_ENABLED = String(process.env.DEBUG_GRADING || "").toLowerCase() === "true";

const debugLog = (traceId, stage, meta = {}) => {
    if (!DEBUG_GRADING_ENABLED) return;
    logger.info(`🧪 ===[AUTO_GRADER_WORKER]=== [${stage}] [trace:${String(traceId || "n/a")}] ${JSON.stringify(meta)}`);
};

const getQueueConnection = () => {
    const host = process.env.REDIS_HOST;
    const port = Number(process.env.REDIS_PORT || 0);

    if (!host || !port) {
        throw new Error("REDIS_HOST and REDIS_PORT are required for MCQ worker");
    }

    const connection = { host, port };

    if (process.env.REDIS_USERNAME) connection.username = process.env.REDIS_USERNAME;
    if (process.env.REDIS_PASSWORD) connection.password = process.env.REDIS_PASSWORD;

    return connection;
};

const percentageToGrade = (score, maxScore) => {
    const percent = maxScore > 0 ? (Number(score) / Number(maxScore)) * 100 : 0;
    if (percent >= 90) return "A+";
    if (percent >= 80) return "A";
    if (percent >= 70) return "B+";
    if (percent >= 60) return "B";
    if (percent >= 50) return "C+";
    if (percent >= 40) return "C";
    return "F";
};

const findAssignmentLesson = async (assignment) => {
    if (!assignment) return null;
    if (assignment.lesson) {
        const lesson = await Lesson.findById(assignment.lesson).select("_id type course title");
        if (lesson) return lesson;
    }

    return Lesson.findOne({ assignmentId: assignment._id }).select("_id type course title");
};

const isTerminalGraded = (submission) => {
    return String(submission?.status || "").toLowerCase() === "graded"
        && String(submission?.gradingStatus || "").toLowerCase() === "completed";
};

const validateObjectiveQuestions = ({ assignment }) => {
    if (!assignment) throw new Error("Assignment context missing");
    if (!Array.isArray(assignment.questions) || assignment.questions.length === 0) {
        throw new Error(`Objective questions missing for assignment ${assignment._id}`);
    }
};

const processMcqJob = async (job) => {
    const startedAt = Date.now();
    const {
        submissionId,
        assignmentId,
        attemptNumber,
        traceId: rawTraceId,
    } = job.data || {};
    const traceId = String(rawTraceId || `submission-${String(submissionId || "unknown")}`);

    debugLog(traceId, "WORKER_PICKED", {
        jobId: String(job?.id || ""),
        submissionId: String(submissionId || ""),
        assignmentId: String(assignmentId || ""),
        attemptNumber: Number(attemptNumber || 1),
        attemptsMade: Number(job?.attemptsMade || 0),
    });

    const submission = await Submission.findById(submissionId);
    if (!submission) {
        throw new Error(`Submission not found: ${submissionId}`);
    }

    if (isTerminalGraded(submission)) {
        debugLog(traceId, "JOB_IDEMPOTENT_SKIP", {
            submissionId: String(submission._id),
            reason: "submission already graded/completed",
        });
        return { submissionId: String(submission._id), skipped: true, reason: "already_graded" };
    }

    if (Number(attemptNumber || 1) !== Number(submission.attemptNumber || 1)) {
        debugLog(traceId, "JOB_STALE_SKIP", {
            submissionId: String(submission._id),
            queuedAttempt: Number(attemptNumber || 1),
            currentAttempt: Number(submission.attemptNumber || 1),
        });
        return {
            submissionId: String(submission._id),
            skipped: true,
            reason: "stale_attempt",
            queuedAttempt: Number(attemptNumber || 1),
            currentAttempt: Number(submission.attemptNumber || 1),
        };
    }

    const assignment = await Assignment.findById(assignmentId).select("title questions maxScore gradingType assessmentType course");
    if (!assignment) {
        throw new Error(`Assignment not found: ${assignmentId}`);
    }

    debugLog(traceId, "ASSIGNMENT_LOADED", {
        submissionId: String(submission._id),
        assignmentId: String(assignment._id),
        assessmentType: String(assignment.assessmentType || ""),
        gradingType: String(assignment.gradingType || ""),
    });

    if (!AUTO_GRADED_ASSESSMENT_TYPES.includes(assignment.assessmentType) || assignment.gradingType !== "auto") {
        submission.gradingStatus = "manual_review";
        submission.gradingType = "manual";
        submission.gradingSource = "instructor";
        submission.gradingError = "Assignment does not qualify for auto objective grading";
        await submission.save();
        debugLog(traceId, "NON_OBJECTIVE_SKIP", {
            submissionId: String(submission._id),
            assignmentId: String(assignment._id),
            assessmentType: String(assignment.assessmentType || ""),
        });
        return { submissionId, skipped: true };
    }

    validateObjectiveQuestions({ assignment });

    submission.gradingStatus = "processing";
    submission.gradingError = "";
    await submission.save();
    debugLog(traceId, "STATUS_PROCESSING_SET", {
        submissionId: String(submission._id),
        gradingStatus: submission.gradingStatus,
    });

    const evaluation = evaluateObjectiveAnswers({
        assessmentType: assignment.assessmentType,
        questions: assignment.questions,
        answers: submission.content?.mcqAnswers || {},
        maxScore: assignment.maxScore || submission.maxScore,
    });

    debugLog(traceId, "EVALUATION_DONE", {
        submissionId: String(submission._id),
        score: Number(evaluation.score || 0),
        maxScore: Number(evaluation.maxScore || 0),
        totalQuestionMarks: Number(evaluation.totalQuestionMarks || 0),
    });

    let score = Math.min(evaluation.maxScore, evaluation.score);
    const latePenalty = Number(submission.latePenalty || 0);
    if (submission.isLate && latePenalty > 0) {
        const penaltyFactor = Math.max(0, 1 - (latePenalty / 100));
        score = Math.round((score * penaltyFactor) * 100) / 100;
        debugLog(traceId, "LATE_PENALTY_APPLIED", {
            submissionId: String(submission._id),
            latePenalty,
            penaltyFactor,
            scoreAfterPenalty: score,
        });
    }

    submission.score = score;
    submission.maxScore = evaluation.maxScore || submission.maxScore;
    submission.status = "graded";
    submission.gradedAt = new Date();
    submission.gradingType = "auto";
    submission.gradingStatus = "completed";
    submission.gradingSource = "auto";
    submission.instructorFeedback = `Auto-graded (${assignment.assessmentType})`;
    submission.grade = percentageToGrade(score, submission.maxScore);
    submission.isPassed = score >= (submission.maxScore * 0.6);
    await submission.save();
    debugLog(traceId, "SUBMISSION_GRADED_SAVED", {
        submissionId: String(submission._id),
        status: submission.status,
        gradingStatus: submission.gradingStatus,
        score: Number(submission.score || 0),
        maxScore: Number(submission.maxScore || 0),
        grade: String(submission.grade || ""),
    });

    const sideEffectWarnings = [];

    try {
        const assignmentForAnalytics = await Assignment.findById(assignment._id);
        if (assignmentForAnalytics) {
            await assignmentForAnalytics.updateAnalytics();
            debugLog(traceId, "ASSIGNMENT_ANALYTICS_UPDATED", {
                assignmentId: String(assignment._id),
            });
        }
    } catch (error) {
        sideEffectWarnings.push(`assignmentAnalytics:${error.message}`);
        logger.error(`⚠️ ===[AUTO_GRADER_WORKER]=== assignment analytics warning trace:${traceId} error:${error.message}`);
    }

    try {
        const lesson = await findAssignmentLesson(assignment);
        if (lesson) {
            await upsertLessonProgress({
                userId: submission.user,
                lesson,
                payload: {
                    assignmentSubmitted: true,
                    assignmentScore: score,
                    assignmentFeedback: `Auto-graded (${assignment.assessmentType})`,
                    activityProgress: {
                        assignmentStarted: true,
                        assignmentSubmitted: true,
                    },
                },
            });
            debugLog(traceId, "PROGRESS_SYNCED", {
                submissionId: String(submission._id),
                lessonId: String(lesson._id),
                score,
            });
        }
    } catch (error) {
        sideEffectWarnings.push(`progressSync:${error.message}`);
        logger.error(`⚠️ ===[AUTO_GRADER_WORKER]=== progress sync warning trace:${traceId} error:${error.message}`);
    }



    try {
        await Notification.createNotification({
            recipient: submission.user,
            recipientRole: "User",
            type: "assignment_graded",
            title: "Assignment graded automatically",
            message: `Your assignment \"${assignment.title}\" was auto-graded. Score: ${score}/${submission.maxScore}`,
            data: {
                submissionId: submission._id,
                assignmentId: assignment._id,
                courseId: assignment.course,
                score,
                gradingType: "auto",
                assessmentType: assignment.assessmentType,
                traceId,
            },
        });
        debugLog(traceId, "NOTIFICATION_SENT", {
            submissionId: String(submission._id),
            recipient: String(submission.user || ""),
        });
    } catch (error) {
        sideEffectWarnings.push(`notification:${error.message}`);
        logger.error(`⚠️ ===[AUTO_GRADER_WORKER]=== notification warning trace:${traceId} error:${error.message}`);
    }

    const durationMs = Date.now() - startedAt;
    logger.info(`✅ ===[AUTO_GRADER_WORKER]=== COMPLETED trace:${traceId} submission:${submission._id} score:${score}/${submission.maxScore} durationMs:${durationMs}`);

    return {
        submissionId: String(submission._id),
        score,
        maxScore: Number(submission.maxScore || 0),
        traceId,
        durationMs,
        sideEffectWarnings,
    };
};

const start = async () => {
    await connectDB();

    const worker = new Worker("gha-grading-mcq", processMcqJob, {
        connection: getQueueConnection(),
        concurrency: 5,
    });

    worker.on("ready", () => logger.info("MCQ grading worker ready"));
    worker.on("active", (job) => {
        const traceId = String(job?.data?.traceId || `submission-${String(job?.data?.submissionId || "unknown")}`);
        debugLog(traceId, "JOB_ACTIVE", {
            jobId: String(job?.id || ""),
            submissionId: String(job?.data?.submissionId || ""),
            attemptsMade: Number(job?.attemptsMade || 0),
        });
    });
    worker.on("completed", (job, result) => {
        const traceId = String(job?.data?.traceId || result?.traceId || `submission-${String(job?.data?.submissionId || "unknown")}`);
        logger.info(`✅ ===[AUTO_GRADER_WORKER]=== JOB_COMPLETED job:${job.id} trace:${traceId}`);
        debugLog(traceId, "JOB_COMPLETED_META", {
            jobId: String(job?.id || ""),
            result,
        });
    });
    worker.on("failed", async (job, error) => {
        const traceId = String(job?.data?.traceId || `submission-${String(job?.data?.submissionId || "unknown")}`);
        logger.error(`❌ ===[AUTO_GRADER_WORKER]=== JOB_FAILED job:${job?.id} trace:${traceId} error:${error.message}`);

        const submissionId = job?.data?.submissionId;
        if (!submissionId) return;

        const currentSubmission = await Submission.findById(submissionId).select("status gradingStatus");
        if (
            currentSubmission
            && String(currentSubmission.status || "").toLowerCase() === "graded"
            && String(currentSubmission.gradingStatus || "").toLowerCase() === "completed"
        ) {
            debugLog(traceId, "JOB_FAILED_IGNORED_ALREADY_COMPLETED", {
                submissionId: String(submissionId),
            });
            return;
        }

        const maxAttempts = Number(job?.opts?.attempts || 1);
        const attemptsMade = Number(job?.attemptsMade || 0);
        const willRetry = attemptsMade < maxAttempts;

        await Submission.findByIdAndUpdate(submissionId, {
            gradingStatus: willRetry ? "queued" : "failed",
            gradingError: String(error.message || "Unknown worker error").slice(0, 1000),
        });

        debugLog(traceId, "JOB_FAILED_STATUS_SET", {
            submissionId: String(submissionId),
            willRetry,
            attemptsMade,
            maxAttempts,
        });
    });

    const gracefulShutdown = async (signal) => {
        logger.info(`MCQ grading worker received ${signal}, shutting down`);
        await worker.close();
        process.exit(0);
    };

    process.on("SIGTERM", () => {
        gracefulShutdown("SIGTERM");
    });

    process.on("SIGINT", () => {
        gracefulShutdown("SIGINT");
    });
};

start().catch((error) => {
    logger.error(`Failed to start MCQ grading worker: ${error.message}`);
    process.exit(1);
});
