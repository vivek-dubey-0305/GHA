import mongoose from "mongoose";
import {
    STUDY_GROUP_MESSAGE_SENDER_ROLE,
    STUDY_GROUP_REACTION_WHITELIST,
} from "../constants/study-group.constant.js";

const attachmentSchema = new mongoose.Schema(
    {
        fileName: { type: String, required: true, trim: true },
        url: { type: String, required: true, trim: true },
        mimeType: { type: String, trim: true },
        extension: { type: String, trim: true },
        size: { type: Number, min: 0 },
    },
    { _id: false }
);

const reactionSchema = new mongoose.Schema(
    {
        emoji: {
            type: String,
            enum: STUDY_GROUP_REACTION_WHITELIST,
            required: true,
        },
        users: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        }],
    },
    { _id: false }
);

const studyGroupMessageSchema = new mongoose.Schema(
    {
        group: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "StudyGroup",
            required: true,
            index: true,
        },
        sender: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            refPath: "senderRole",
        },
        senderRole: {
            type: String,
            enum: Object.values(STUDY_GROUP_MESSAGE_SENDER_ROLE),
            required: true,
        },
        content: {
            type: String,
            trim: true,
            maxlength: [4000, "Message cannot exceed 4000 characters"],
            default: "",
        },
        attachments: [attachmentSchema],
        mentions: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        }],
        replyTo: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "StudyGroupMessage",
            default: null,
            index: true,
        },
        reactions: [reactionSchema],
        readBy: [{
            user: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
                required: true,
            },
            readAt: {
                type: Date,
                default: Date.now,
            },
        }],
        isEdited: {
            type: Boolean,
            default: false,
        },
        editedAt: {
            type: Date,
            default: null,
        },
        isDeleted: {
            type: Boolean,
            default: false,
        },
        deletedAt: {
            type: Date,
            default: null,
        },
    },
    {
        timestamps: true,
        collection: "studygroupmessages",
    }
);

studyGroupMessageSchema.index({ group: 1, createdAt: -1 });
studyGroupMessageSchema.index({ group: 1, replyTo: 1, createdAt: 1 });
studyGroupMessageSchema.index({ mentions: 1, createdAt: -1 });

export const StudyGroupMessage = mongoose.model("StudyGroupMessage", studyGroupMessageSchema);
