export const STUDY_GROUP_MEMBER_STATUS = {
    ACTIVE: "active",
    REMOVED: "removed",
};

export const STUDY_GROUP_MESSAGE_SENDER_ROLE = {
    USER: "User",
    INSTRUCTOR: "Instructor",
};

export const STUDY_GROUP_MEMBER_ROLE = {
    MEMBER: "member",
    ADMIN: "admin",
};

export const STUDY_GROUP_MAX_MESSAGE_LENGTH = 4000;
export const STUDY_GROUP_MAX_ATTACHMENTS = 10;
export const STUDY_GROUP_MAX_FILE_SIZE = 100 * 1024 * 1024;

export const STUDY_GROUP_TYPING_TTL_MS = 5000;
export const STUDY_GROUP_MENTION_NOTIFICATION_TYPE = "study_group_mention";
export const STUDY_GROUP_IST_TIMEZONE = "Asia/Kolkata";

export const STUDY_GROUP_ALLOWED_FILE_EXTENSIONS = [
    ".pdf", ".doc", ".docx", ".ppt", ".pptx", ".xls", ".xlsx",
    ".txt", ".csv", ".md", ".jpg", ".jpeg", ".png", ".webp", ".gif",
    ".mp4", ".webm", ".zip"
];

export const STUDY_GROUP_BLOCKED_FILE_EXTENSIONS = [
    ".bat", ".cmd", ".com", ".exe", ".msi", ".scr", ".pif", ".jar",
    ".vbs", ".js", ".jse", ".ws", ".wsf", ".wsh", ".ps1", ".psm1",
    ".sh", ".bash", ".zsh", ".ksh", ".php", ".py", ".rb", ".pl", ".apk"
];

export const STUDY_GROUP_REACTION_WHITELIST = ["👏", "👍", "🔥", "❤️", "🎉", "🙌", "😄", "🤝", "💡"];

export default {
    STUDY_GROUP_MEMBER_STATUS,
    STUDY_GROUP_MESSAGE_SENDER_ROLE,
    STUDY_GROUP_MEMBER_ROLE,
    STUDY_GROUP_MAX_MESSAGE_LENGTH,
    STUDY_GROUP_MAX_ATTACHMENTS,
    STUDY_GROUP_MAX_FILE_SIZE,
    STUDY_GROUP_TYPING_TTL_MS,
    STUDY_GROUP_MENTION_NOTIFICATION_TYPE,
    STUDY_GROUP_IST_TIMEZONE,
    STUDY_GROUP_ALLOWED_FILE_EXTENSIONS,
    STUDY_GROUP_BLOCKED_FILE_EXTENSIONS,
    STUDY_GROUP_REACTION_WHITELIST,
};
