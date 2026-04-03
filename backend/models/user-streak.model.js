import mongoose from "mongoose";

const userStreakSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            unique: true,
        },
        currentStreak: {
            type: Number,
            default: 0,
            min: 0,
        },
        longestStreak: {
            type: Number,
            default: 0,
            min: 0,
        },
        totalActiveDays: {
            type: Number,
            default: 0,
            min: 0,
        },
        lastActivityDateKey: {
            type: String,
            default: null,
        },
    },
    {
        timestamps: true,
        collection: "user_streaks",
    }
);

userStreakSchema.index({ currentStreak: -1 });
userStreakSchema.index({ longestStreak: -1 });

const UserStreak = mongoose.model("UserStreak", userStreakSchema);

export { UserStreak };
