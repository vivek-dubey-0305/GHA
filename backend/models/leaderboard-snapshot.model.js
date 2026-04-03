import mongoose from "mongoose";

const leaderboardSnapshotSchema = new mongoose.Schema(
    {
        type: {
            type: String,
            required: true,
            index: true,
        },
        period: {
            type: String,
            required: true,
            index: true,
        },
        scopeKey: {
            type: String,
            required: true,
            index: true,
        },
        snapshotAt: {
            type: Date,
            default: Date.now,
            index: true,
        },
        entries: [
            {
                user: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "User",
                    required: true,
                },
                rank: {
                    type: Number,
                    required: true,
                    min: 1,
                },
            },
        ],
    },
    {
        timestamps: true,
        collection: "leaderboard_snapshots",
    }
);

leaderboardSnapshotSchema.index({ type: 1, period: 1, scopeKey: 1, snapshotAt: -1 });

const LeaderboardSnapshot = mongoose.model("LeaderboardSnapshot", leaderboardSnapshotSchema);

export { LeaderboardSnapshot };
