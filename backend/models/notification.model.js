import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
    {
        recipient: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            refPath: "recipientRole",
            index: true
        },
        recipientRole: {
            type: String,
            enum: ["User", "Instructor", "Admin"],
            required: true
        },
        type: {
            type: String,
            enum: [
                "new_enrollment", "new_review", "assignment_submission",
                "assignment_graded", "assignment_reported", "assignment_moderation_update",
                "discussion_reply", "discussion_created", "announcement", "payout_update",
                "course_published", "certificate_issued", "live_class_reminder",
                "live_class_started", "live_class_invite",
                "doubt_ticket_created", "doubt_ticket_accepted", "doubt_ticket_resolved", "doubt_saturday_session_reminder",
                "study_group_mention",
                "study_group_removed",
                "study_group_rejoin_requested",
                "study_group_rejoin_accepted",
                "study_group_rejoin_rejected",
                "general"
            ],
            required: true
        },
        title: {
            type: String,
            required: [true, "Notification title is required"],
            maxlength: [200, "Title cannot exceed 200 characters"]
        },
        message: {
            type: String,
            required: [true, "Notification message is required"],
            maxlength: [500, "Message cannot exceed 500 characters"]
        },
        data: {
            type: mongoose.Schema.Types.Mixed,
            default: {} // { courseId, enrollmentId, reviewId, etc. }
        },
        isRead: {
            type: Boolean,
            default: false,
            index: true
        },
        readAt: {
            type: Date
        }
    },
    { timestamps: true }
);

notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });

// Static: create notification helper
notificationSchema.statics.createNotification = async function (data) {
    return this.create(data);
};

export const Notification = mongoose.model("Notification", notificationSchema);
