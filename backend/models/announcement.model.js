import mongoose from "mongoose";

const announcementSchema = new mongoose.Schema(
    {
        instructor: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Instructor",
            required: true,
            index: true
        },
        course: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Course",
            default: null // null = all courses by this instructor
        },
        title: {
            type: String,
            required: [true, "Announcement title is required"],
            maxlength: [200, "Title cannot exceed 200 characters"],
            trim: true
        },
        content: {
            type: String,
            required: [true, "Announcement content is required"],
            maxlength: [2000, "Content cannot exceed 2000 characters"]
        },
        type: {
            type: String,
            enum: ["general", "new_lecture", "live_class", "assignment", "deadline", "update"],
            default: "general"
        },
        priority: {
            type: String,
            enum: ["low", "normal", "high"],
            default: "normal"
        },
        isPublished: {
            type: Boolean,
            default: true
        },
        readBy: [{
            user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
            readAt: { type: Date, default: Date.now }
        }]
    },
    { timestamps: true }
);

announcementSchema.index({ instructor: 1, createdAt: -1 });
announcementSchema.index({ course: 1, createdAt: -1 });

export const Announcement = mongoose.model("Announcement", announcementSchema);
