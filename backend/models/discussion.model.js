import mongoose from "mongoose";

const replySchema = new mongoose.Schema(
    {
        author: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            refPath: "replies.authorRole"
        },
        authorRole: {
            type: String,
            enum: ["User", "Instructor"],
            required: true
        },
        content: {
            type: String,
            required: [true, "Reply content is required"],
            maxlength: [2000, "Reply cannot exceed 2000 characters"]
        },
        isEdited: { type: Boolean, default: false },
        editedAt: { type: Date }
    },
    { timestamps: true }
);

const discussionSchema = new mongoose.Schema(
    {
        course: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Course",
            required: true,
            index: true
        },
        lesson: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Lesson",
            default: null
        },
        author: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            refPath: "authorRole"
        },
        authorRole: {
            type: String,
            enum: ["User", "Instructor"],
            required: true
        },
        title: {
            type: String,
            required: [true, "Discussion title is required"],
            maxlength: [200, "Title cannot exceed 200 characters"],
            trim: true
        },
        content: {
            type: String,
            required: [true, "Discussion content is required"],
            maxlength: [5000, "Content cannot exceed 5000 characters"]
        },
        replies: [replySchema],
        isResolved: {
            type: Boolean,
            default: false
        },
        isPinned: {
            type: Boolean,
            default: false
        },
        upvotes: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        }],
        tags: [{
            type: String,
            maxlength: 30
        }]
    },
    { timestamps: true }
);

discussionSchema.index({ course: 1, createdAt: -1 });
discussionSchema.index({ course: 1, isPinned: -1, createdAt: -1 });

export const Discussion = mongoose.model("Discussion", discussionSchema);
