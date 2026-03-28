import mongoose from "mongoose";
import { DOUBT_TICKET_STATUS } from "../constants/doubt-ticket.constant.js";

const attachmentSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ["image", "video"],
        required: true,
    },
    mimeType: {
        type: String,
        required: true,
    },
    originalName: {
        type: String,
        required: true,
        trim: true,
    },
    public_id: {
        type: String,
        required: true,
    },
    secure_url: {
        type: String,
        required: true,
    },
    size: {
        type: Number,
        required: true,
        min: 0,
    },
}, { _id: false });

const replySchema = new mongoose.Schema({
    author: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        refPath: "replies.authorRole",
    },
    authorRole: {
        type: String,
        enum: ["User", "Instructor"],
        required: true,
    },
    content: {
        type: String,
        default: "",
        trim: true,
        maxlength: 2000,
    },
    images: {
        type: [{
            mimeType: {
                type: String,
                required: true,
            },
            originalName: {
                type: String,
                required: true,
                trim: true,
            },
            public_id: {
                type: String,
                required: true,
            },
            secure_url: {
                type: String,
                required: true,
            },
            size: {
                type: Number,
                required: true,
                min: 0,
            },
        }],
        default: [],
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
}, { _id: true });

const doubtTicketSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true,
    },
    instructor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Instructor",
        required: true,
        index: true,
    },
    course: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Course",
        required: true,
        index: true,
    },
    lesson: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Lesson",
        default: null,
    },
    liveClass: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "LiveClass",
        default: null,
    },
    title: {
        type: String,
        required: true,
        trim: true,
        minlength: 5,
        maxlength: 200,
    },
    description: {
        type: String,
        required: true,
        trim: true,
        minlength: 10,
        maxlength: 5000,
    },
    notes: {
        type: String,
        trim: true,
        maxlength: 3000,
        default: "",
    },
    status: {
        type: String,
        enum: Object.values(DOUBT_TICKET_STATUS),
        default: DOUBT_TICKET_STATUS.OPEN,
        index: true,
    },
    attachments: {
        type: [attachmentSchema],
        default: [],
    },
    replies: {
        type: [replySchema],
        default: [],
    },
    acceptedAt: {
        type: Date,
        default: null,
    },
    resolvedAt: {
        type: Date,
        default: null,
    },
    resolvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Instructor",
        default: null,
    },
    resolutionNote: {
        type: String,
        trim: true,
        maxlength: 2000,
        default: "",
    },
}, {
    timestamps: true,
    collection: "doubtTickets",
});

doubtTicketSchema.index({ user: 1, createdAt: -1 });
doubtTicketSchema.index({ instructor: 1, status: 1, createdAt: -1 });
doubtTicketSchema.index({ course: 1, status: 1, createdAt: -1 });
doubtTicketSchema.index({ createdAt: -1 });

export const DoubtTicket = mongoose.model("DoubtTicket", doubtTicketSchema);
