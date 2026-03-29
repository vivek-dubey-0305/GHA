import path from "path";
import {
    STUDY_GROUP_ALLOWED_FILE_EXTENSIONS,
    STUDY_GROUP_BLOCKED_FILE_EXTENSIONS,
    STUDY_GROUP_IST_TIMEZONE,
    STUDY_GROUP_MAX_FILE_SIZE,
} from "../constants/study-group.constant.js";

export const normalizeStudyGroupName = (courseName = "") => {
    const trimmed = String(courseName || "").trim();
    return trimmed ? `${trimmed} Group` : "Course Study Group";
};

export const parseMentionIds = (mentions = []) => {
    let source = mentions;

    if (typeof mentions === "string") {
        const trimmed = mentions.trim();
        if (!trimmed) return [];
        try {
            const parsed = JSON.parse(trimmed);
            source = parsed;
        } catch {
            source = trimmed.split(",").map((item) => item.trim());
        }
    }

    if (!Array.isArray(source)) return [];

    const ids = source
        .map((id) => String(id || "").trim())
        .filter(Boolean);

    return Array.from(new Set(ids));
};

export const normalizeInstructions = (value) => {
    if (Array.isArray(value)) {
        return value
            .map((item) => String(item || "").trim())
            .filter(Boolean)
            .slice(0, 20);
    }

    if (typeof value === "string") {
        const trimmed = value.trim();
        if (!trimmed) return [];

        try {
            const parsed = JSON.parse(trimmed);
            if (Array.isArray(parsed)) {
                return parsed
                    .map((item) => String(item || "").trim())
                    .filter(Boolean)
                    .slice(0, 20);
            }
        } catch {
            return trimmed
                .split("\n")
                .map((line) => line.replace(/^[-*\d.\s]+/, "").trim())
                .filter(Boolean)
                .slice(0, 20);
        }
    }

    return [];
};

export const getISTDateTimeLabel = (date = new Date()) => {
    return new Intl.DateTimeFormat("en-IN", {
        timeZone: STUDY_GROUP_IST_TIMEZONE,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
    }).format(date);
};

export const toFutureDateFromMinutes = (minutes = 0) => {
    const safe = Number(minutes || 0);
    if (!Number.isFinite(safe) || safe <= 0) return null;
    return new Date(Date.now() + safe * 60 * 1000);
};

export const isMuteActive = (mutedUntil) => {
    if (!mutedUntil) return false;
    return new Date(mutedUntil).getTime() > Date.now();
};

export const validateStudyGroupAttachment = (file) => {
    if (!file) {
        return { valid: false, reason: "Attachment is missing" };
    }

    const ext = path.extname(file.originalname || "").toLowerCase();

    if (!ext) {
        return { valid: false, reason: "Attachment extension is missing" };
    }

    if (STUDY_GROUP_BLOCKED_FILE_EXTENSIONS.includes(ext)) {
        return { valid: false, reason: `Blocked file extension: ${ext}` };
    }

    if (!STUDY_GROUP_ALLOWED_FILE_EXTENSIONS.includes(ext)) {
        return { valid: false, reason: `Unsupported file extension: ${ext}` };
    }

    if (Number(file.size || 0) > STUDY_GROUP_MAX_FILE_SIZE) {
        return { valid: false, reason: "Attachment exceeds 100 MB limit" };
    }

    return { valid: true, reason: "ok", ext };
};
