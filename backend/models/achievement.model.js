import mongoose from "mongoose";

const achievementSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        category: {
            type: String,
            enum: ["course", "assignment", "streak", "live"],
            required: true,
            index: true,
        },
        status: {
            type: String,
            enum: ["achieved", "partial", "missed"],
            default: "achieved",
            index: true,
        },
        title: {
            type: String,
            required: true,
            trim: true,
            maxlength: 180,
        },
        description: {
            type: String,
            default: "",
            trim: true,
            maxlength: 500,
        },
        pointsAwarded: {
            type: Number,
            default: 0,
            min: 0,
        },
        pointsPossible: {
            type: Number,
            default: 0,
            min: 0,
        },
        source: {
            type: String,
            default: "",
            index: true,
        },
        occurredAt: {
            type: Date,
            default: Date.now,
            index: true,
        },
        course: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Course",
            default: null,
        },
        module: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Module",
            default: null,
        },
        lesson: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Lesson",
            default: null,
        },
        assignment: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Assignment",
            default: null,
        },
        liveClass: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "LiveClass",
            default: null,
        },
        metadata: {
            type: mongoose.Schema.Types.Mixed,
            default: {},
        },
        dedupeKey: {
            type: String,
            default: null,
            unique: true,
            sparse: true,
            index: true,
        },
    },
    {
        timestamps: true,
        collection: "achievements",
    }
);

achievementSchema.index({ user: 1, occurredAt: -1 });
achievementSchema.index({ user: 1, category: 1, status: 1, occurredAt: -1 });

const Achievement = mongoose.model("Achievement", achievementSchema);

export { Achievement };
