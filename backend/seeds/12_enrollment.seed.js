import dotenv from "dotenv";
import connectDB from "../configs/connection.config.js";
import { Enrollment } from "../models/enrollment.model.js";
import { Course } from "../models/course.model.js";
import { User } from "../models/user.model.js";
import { loadSeedData, saveSeedData, logCreated, separator } from "./seed-helpers.js";

dotenv.config();

/**
 * Seed Script: Create Test Enrollments (9 enrollments - 3 users × 3 courses)
 * Usage: node seeds/12_enrollment.seed.js
 */

export const seedEnrollment = async () => {
    console.log("\n🎓 Step 12: Seeding Enrollments...");
    separator();

    const seedData = loadSeedData();
    if (!seedData.userIds || !seedData.courseIds || !seedData.paymentIds) {
        throw new Error("User/Course/Payment IDs not found. Run previous seeds first.");
    }

    // Check if enrollments already exist
    const existingCount = await Enrollment.countDocuments({
        user: { $in: seedData.userIds }
    });

    if (existingCount > 0) {
        console.log(`   ⚠️  ${existingCount} enrollments already exist. Retrieving IDs...`);
        const existing = await Enrollment.find({ user: { $in: seedData.userIds } });
        const enrollmentIds = existing.map(e => e._id.toString());
        saveSeedData({ enrollmentIds });
        return enrollmentIds;
    }

    const enrollmentIds = [];
    let paymentIndex = 0;

    // Progress statuses for variety
    const progressData = [
        { percentage: 100, status: "completed" },
        { percentage: 65, status: "in_progress" },
        { percentage: 40, status: "in_progress" },
        { percentage: 85, status: "in_progress" },
        { percentage: 100, status: "completed" },
        { percentage: 20, status: "in_progress" },
        { percentage: 100, status: "completed" },
        { percentage: 55, status: "in_progress" },
        { percentage: 30, status: "in_progress" }
    ];

    // Each user enrolled in all 3 courses
    for (let userIdx = 0; userIdx < seedData.userIds.length; userIdx++) {
        for (let courseIdx = 0; courseIdx < seedData.courseIds.length; courseIdx++) {
            const userId = seedData.userIds[userIdx];
            const courseId = seedData.courseIds[courseIdx];
            const paymentId = seedData.paymentIds[paymentIndex];
            
            // Get module IDs for this course
            const courseModuleIds = seedData.moduleIds.slice(courseIdx * 3, (courseIdx + 1) * 3);
            const progress = progressData[paymentIndex];
            
            const totalLessons = 15; // 5 lessons × 3 modules
            const completedLessons = Math.floor((progress.percentage / 100) * totalLessons);

            const enrollment = new Enrollment({
                user: userId,
                course: courseId,
                payment: paymentId,
                enrolledAt: new Date(Date.now() - (28 - paymentIndex * 3) * 24 * 60 * 60 * 1000),
                status: progress.status === "completed" ? "completed" : "active",
                progressPercentage: progress.percentage,
                completedLessons,
                totalLessons,
                progressModules: courseModuleIds.map((modId, idx) => {
                    const moduleProgress = Math.min(100, Math.max(0, progress.percentage * 3 - idx * 100));
                    return {
                        moduleId: modId,
                        status: moduleProgress >= 100 ? "completed" : moduleProgress > 0 ? "in_progress" : "not_started",
                        completedAt: moduleProgress >= 100 ? new Date() : undefined
                    };
                }),
                timeSpent: Math.floor(progress.percentage * 2), // hours in minutes
                lastAccessedAt: new Date(Date.now() - paymentIndex * 24 * 60 * 60 * 1000),
                isLifetime: true,
                certificateIssued: progress.percentage === 100,
                enrolledBy: userId
            });

            await enrollment.save();
            enrollmentIds.push(enrollment._id.toString());
            
            const statusIcon = progress.status === "completed" ? "✅" : "📚";
            logCreated(`Enrollment ${enrollmentIds.length}`, enrollment._id.toString(),
                `User ${userIdx + 1} → Course ${courseIdx + 1}: ${progress.percentage}% ${statusIcon}`);

            paymentIndex++;
        }
    }

    // Update course enrolled counts
    for (const courseId of seedData.courseIds) {
        await Course.findByIdAndUpdate(courseId, { $set: { enrolledCount: 3 } });
    }

    // Update user learning progress
    for (const userId of seedData.userIds) {
        await User.findByIdAndUpdate(userId, {
            $set: { "learningProgress.totalCoursesEnrolled": 3 }
        });
    }

    saveSeedData({ enrollmentIds });

    console.log(`\n   📊 Total enrollments created: ${enrollmentIds.length}`);
    console.log(`      - Completed: ${progressData.filter(p => p.status === "completed").length}`);
    console.log(`      - In Progress: ${progressData.filter(p => p.status === "in_progress").length}`);
    separator();

    return enrollmentIds;
};

// Standalone execution
if (process.argv[1] && process.argv[1].includes("12_enrollment")) {
    (async () => {
        try {
            await connectDB();
            await seedEnrollment();
            process.exit(0);
        } catch (error) {
            console.error("❌ Error:", error.message);
            process.exit(1);
        }
    })();
}
