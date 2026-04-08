import { Queue } from "bullmq";
import logger from "../configs/logger.config.js";

const GRADING_QUEUE_NAME = "gha-grading-mcq";
let gradingQueue = null;
const DEBUG_GRADING_ENABLED = String(process.env.DEBUG_GRADING || "").toLowerCase() === "true";

const debugLog = (message, meta = {}) => {
    if (!DEBUG_GRADING_ENABLED) return;
    logger.info(`🧪 ===[AUTO_GRADER_QUEUE]=== ${message} ${JSON.stringify(meta)}`);
};

const getQueueConnection = () => {
    const host = process.env.REDIS_HOST;
    const port = Number(process.env.REDIS_PORT || 0);

    if (!host || !port) {
        return null;
    }

    const connection = {
        host,
        port,
    };

    if (process.env.REDIS_USERNAME) {
        connection.username = process.env.REDIS_USERNAME;
    }

    if (process.env.REDIS_PASSWORD) {
        connection.password = process.env.REDIS_PASSWORD;
    }

    return connection;
};

export const isGradingQueueConfigured = () => Boolean(getQueueConnection());

export const getGradingQueueName = () => GRADING_QUEUE_NAME;

export const getGradingQueue = () => {
    if (gradingQueue) {
        return gradingQueue;
    }

    const connection = getQueueConnection();
    if (!connection) {
        return null;
    }

    gradingQueue = new Queue(GRADING_QUEUE_NAME, { connection });
    return gradingQueue;
};

export const enqueueMcqGradingJob = async ({
    submissionId,
    assignmentId,
    userId,
    courseId,
    assessmentType,
    attemptNumber = 1,
    traceId = "",
    isLate = false,
    latePenalty = 0,
}) => {
    const queue = getGradingQueue();
    if (!queue) {
        logger.error("MCQ grading queue is not configured; cannot enqueue grading job");
        return null;
    }

    debugLog("QUEUE_ENQUEUE_START", {
        submissionId: String(submissionId),
        assignmentId: String(assignmentId),
        userId: String(userId),
        courseId: String(courseId),
        assessmentType: String(assessmentType || ""),
        attemptNumber: Number(attemptNumber || 1),
        traceId: String(traceId || ""),
    });

    const job = await queue.add(
        "mcq.grade",
        {
            submissionId: String(submissionId),
            assignmentId: String(assignmentId),
            userId: String(userId),
            courseId: String(courseId),
            assessmentType: String(assessmentType || ""),
            attemptNumber: Number(attemptNumber || 1),
            traceId: String(traceId || ""),
            isLate: Boolean(isLate),
            latePenalty: Number(latePenalty || 0),
        },
        {
            jobId: `submission-${String(submissionId)}-attempt-${Number(attemptNumber || 1)}`,
            removeOnComplete: 500,
            removeOnFail: 1000,
            attempts: 3,
            backoff: {
                type: "exponential",
                delay: 1500,
            },
        }
    );

    debugLog("QUEUE_ENQUEUE_DONE", {
        jobId: String(job.id),
        submissionId: String(submissionId),
        traceId: String(traceId || ""),
    });

    return job;
};
