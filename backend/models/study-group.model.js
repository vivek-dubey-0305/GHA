import mongoose from "mongoose";
import {
    STUDY_GROUP_MEMBER_ROLE,
    STUDY_GROUP_MEMBER_STATUS,
} from "../constants/study-group.constant.js";

const studyGroupSchema = new mongoose.Schema(
    {
        course: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Course",
            required: true,
            unique: true,
            index: true,
        },
        ownerInstructor: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Instructor",
            required: true,
            index: true,
        },
        name: {
            type: String,
            required: [true, "Study group name is required"],
            trim: true,
            maxlength: [120, "Study group name cannot exceed 120 characters"],
        },
        description: {
            type: String,
            trim: true,
            maxlength: [2000, "Description cannot exceed 2000 characters"],
            default: "",
        },
        instructions: [{
            type: String,
            trim: true,
            maxlength: [300, "Each instruction cannot exceed 300 characters"],
        }],
        profilePhoto: {
            public_id: { type: String },
            secure_url: { type: String },
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        memberCount: {
            type: Number,
            default: 0,
            min: 0,
        },
        messageCount: {
            type: Number,
            default: 0,
            min: 0,
        },
        lastMessageAt: {
            type: Date,
        },
    },
    {
        timestamps: true,
        collection: "studygroups",
    }
);

studyGroupSchema.index({ ownerInstructor: 1, createdAt: -1 });
studyGroupSchema.index({ lastMessageAt: -1 });

const studyGroupMemberSchema = new mongoose.Schema(
    {
        group: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "StudyGroup",
            required: true,
            index: true,
        },
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        role: {
            type: String,
            enum: Object.values(STUDY_GROUP_MEMBER_ROLE),
            default: STUDY_GROUP_MEMBER_ROLE.MEMBER,
        },
        status: {
            type: String,
            enum: Object.values(STUDY_GROUP_MEMBER_STATUS),
            default: STUDY_GROUP_MEMBER_STATUS.ACTIVE,
            index: true,
        },
        joinedAt: {
            type: Date,
            default: Date.now,
        },
        removedAt: {
            type: Date,
            default: null,
        },
        mutedUntil: {
            type: Date,
            default: null,
        },
        mutedReason: {
            type: String,
            trim: true,
            maxlength: [300, "Mute reason cannot exceed 300 characters"],
            default: "",
        },
        mutedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Instructor",
            default: null,
        },
        lastReadAt: {
            type: Date,
            default: null,
        },
        removalReason: {
            type: String,
            trim: true,
            maxlength: [500, "Removal reason cannot exceed 500 characters"],
            default: "",
        },
        rejoinStatus: {
            type: String,
            enum: ["none", "pending", "accepted", "rejected"],
            default: "none",
            index: true,
        },
        rejoinRequestReason: {
            type: String,
            trim: true,
            maxlength: [500, "Rejoin request reason cannot exceed 500 characters"],
            default: "",
        },
        rejoinRequestedAt: {
            type: Date,
            default: null,
        },
        finalWarning: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
        collection: "studygroupmembers",
    }
);

studyGroupMemberSchema.index({ group: 1, user: 1 }, { unique: true });
studyGroupMemberSchema.index({ group: 1, status: 1, updatedAt: -1 });
studyGroupMemberSchema.index({ user: 1, status: 1, updatedAt: -1 });

export const StudyGroup = mongoose.model("StudyGroup", studyGroupSchema);
export const StudyGroupMember = mongoose.model("StudyGroupMember", studyGroupMemberSchema);
