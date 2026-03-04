import dotenv from "dotenv";
import mongoose from "mongoose";
import connectDB from "../configs/connection.config.js";
import { Progress } from "../models/progress.model.js";
import { loadSeedData, saveSeedData, logCreated, separator } from "./seed-helpers.js";

dotenv.config();

/**
 * Seed Script: Create Test Progress (Lesson progress for users)
 * 
 * NOTE: Progress model has unique compound index on { user, course }
 * So we create one progress record per user per course (9 total).
 * Each record tracks the last accessed lesson.
 * 
 * Usage: node seeds/13_progress.seed.js
 */

export const seedProgress = async () => {
    console.log("\n📈 Step 13: Seeding Progress...");
    separator();

    const seedData = loadSeedData();
    if (!seedData.userIds || !seedData.courseIds || !seedData.lessonIds) {
        throw new Error("User/Course/Lesson IDs not found. Run previous seeds first.");
    }

    // Check if progress already exists
    const existingCount = await Progress.countDocuments({
        user: { $in: seedData.userIds.map(id => new mongoose.Types.ObjectId(id)) }
    });

    if (existingCount > 0) {
        console.log(`   ⚠️  ${existingCount} progress records already exist. Retrieving IDs...`);
        const existing = await Progress.find({
            user: { $in: seedData.userIds.map(id => new mongoose.Types.ObjectId(id)) }
        });
        const progressIds = existing.map(p => p._id.toString());
        saveSeedData({ progressIds });
        return progressIds;
    }

    const progressIds = [];

    // Progress status options
    const progressStatuses = [
        { status: "completed", percentage: 100, timeSpent: 1500 },
        { status: "in-progress", percentage: 65, timeSpent: 900 },
        { status: "in-progress", percentage: 40, timeSpent: 600 },
        { status: "completed", percentage: 100, timeSpent: 1800 },
        { status: "in-progress", percentage: 80, timeSpent: 1200 },
        { status: "not-started", percentage: 0, timeSpent: 0 },
        { status: "completed", percentage: 100, timeSpent: 2000 },
        { status: "in-progress", percentage: 50, timeSpent: 750 },
        { status: "in-progress", percentage: 25, timeSpent: 400 }
    ];

    let progressIndex = 0;

    // Create progress: each user per course (9 records)
    for (let userIdx = 0; userIdx < seedData.userIds.length; userIdx++) {
        for (let courseIdx = 0; courseIdx < seedData.courseIds.length; courseIdx++) {
            const userId = seedData.userIds[userIdx];
            const courseId = seedData.courseIds[courseIdx];
            
            // Get first lesson of this course (lesson index = courseIdx * 15)
            const courseLessonStartIdx = courseIdx * 15;
            const lessonIdx = Math.min(
                courseLessonStartIdx + Math.floor(progressStatuses[progressIndex].percentage / 7),
                courseLessonStartIdx + 14
            );
            const lessonId = seedData.lessonIds[lessonIdx] || seedData.lessonIds[courseLessonStartIdx];

            const progressData = progressStatuses[progressIndex];

            const progress = new Progress({
                user: userId,
                course: courseId,
                lesson: lessonId,
                status: progressData.status,
                progressPercentage: progressData.percentage,
                timeSpent: progressData.timeSpent,
                lastAccessedAt: new Date(Date.now() - progressIndex * 6 * 60 * 60 * 1000),
                completedAt: progressData.status === "completed" 
                    ? new Date(Date.now() - (progressIndex + 1) * 24 * 60 * 60 * 1000) 
                    : null,
                videoProgress: {
                    currentTime: Math.floor(progressData.percentage * 12),
                    totalDuration: 1200
                },
                assignmentSubmitted: progressData.percentage >= 80,
                quizAttempts: progressData.percentage >= 50 ? Math.floor(Math.random() * 3) + 1 : 0
            });

            await progress.save();
            progressIds.push(progress._id.toString());

            const statusIcon = progressData.status === "completed" ? "✅" : 
                              progressData.status === "in_progress" ? "📚" : "⏳";
            logCreated(`Progress ${progressIds.length}`, progress._id.toString(),
                `User ${userIdx + 1} → Course ${courseIdx + 1}: ${progressData.percentage}% ${statusIcon}`);

            progressIndex++;
        }
    }

    saveSeedData({ progressIds });

    console.log(`\n   📊 Total progress records: ${progressIds.length}`);
    console.log(`      - Completed: ${progressStatuses.filter(p => p.status === "completed").length}`);
    console.log(`      - In Progress: ${progressStatuses.filter(p => p.status === "in_progress").length}`);
    console.log(`      - Not Started: ${progressStatuses.filter(p => p.status === "not_started").length}`);
    separator();

    return progressIds;
};

// Standalone execution
if (process.argv[1] && process.argv[1].includes("13_progress")) {
    (async () => {
        try {
            await connectDB();
            await seedProgress();
            process.exit(0);
        } catch (error) {
            console.error("❌ Error:", error.message);
            process.exit(1);
        }
    })();
}
