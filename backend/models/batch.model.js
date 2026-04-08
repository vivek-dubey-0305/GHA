import mongoose from "mongoose";

const batchSchema = new mongoose.Schema({
    courseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Course",
        required: true,
        index: true,
    },
    name: {
        type: String,
        required: true,
        trim: true,
        maxlength: 120,
    },
    startDate: {
        type: Date,
        required: true,
    },
    endDate: {
        type: Date,
        required: true,
    },
    instructorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Instructor",
        required: true,
        index: true,
    },
    students: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    }],
    status: {
        type: String,
        enum: ["scheduled", "active", "completed"],
        default: "scheduled",
        index: true,
    },
}, {
    timestamps: true,
    collection: "batches",
});

batchSchema.index({ courseId: 1, startDate: 1, endDate: 1 });
batchSchema.index({ instructorId: 1, status: 1, startDate: 1 });

const Batch = mongoose.model("Batch", batchSchema);

export { Batch };
