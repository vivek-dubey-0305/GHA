import mongoose from "mongoose";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import connectDB from "../configs/connection.config.js";
import { Admin } from "../models/admin.model.js";
import { User } from "../models/user.model.js";
import { Instructor } from "../models/instructor.model.js";
import { Course } from "../models/course.model.js";
import { Module } from "../models/module.model.js";
import { Lesson } from "../models/lesson.model.js";
import { Assignment } from "../models/assignment.model.js";
import { LiveClass } from "../models/liveclass.model.js";
import { Video } from "../models/video.model.js";
import { Material } from "../models/material.model.js";
import { Payment } from "../models/payment.model.js";
import { Enrollment } from "../models/enrollment.model.js";
import { Progress } from "../models/progress.model.js";
import { Submission } from "../models/submission.model.js";
import { Review } from "../models/review.model.js";
import { Certificate } from "../models/certificate.model.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Cleanup Script: Remove ALL seeded test data
 * 
 * ⚠️  WARNING: This will delete test data from the database!
 * It uses IDs from seed-data.json to target only seeded records.
 * 
 * Usage: node seeds/cleanup.seed.js
 * 
 * Pass --all flag to drop entire collections (DANGEROUS):
 *   node seeds/cleanup.seed.js --all
 */

const cleanup = async () => {
    const isFullClean = process.argv.includes("--all");

    console.log("\n");
    console.log("╔══════════════════════════════════════════════════════════╗");
    console.log("║           🧹 SEED CLEANUP - GHA Platform               ║");
    console.log(`║     Mode: ${isFullClean ? "FULL CLEAN (drop collections)" : "Targeted (seed-data.json IDs only)"}       ║`);
    console.log("╚══════════════════════════════════════════════════════════╝\n");

    try {
        await connectDB();
        console.log("✅ Database connected\n");

        if (isFullClean) {
            console.log("⚠️  FULL CLEAN MODE - Dropping all test collections...\n");

            const collections = [
                "certificates", "reviews", "submissions", "progress",
                "enrollments", "payments", "payouts", "wallets", "materials", 
                "videos", "liveclasses", "assignments", "lessons", 
                "modules", "courses", "instructors", "users"
            ];

            for (const col of collections) {
                try {
                    await mongoose.connection.db.collection(col).drop();
                    console.log(`   🗑️  Dropped: ${col}`);
                } catch (e) {
                    if (e.code === 26) {
                        console.log(`   ⏭️  Skipped: ${col} (doesn't exist)`);
                    } else {
                        console.log(`   ❌ Error dropping ${col}: ${e.message}`);
                    }
                }
            }

        } else {
            // Targeted cleanup using IDs from seed-data.json
            const seedDataPath = path.join(__dirname, "seed-data.json");
            if (!fs.existsSync(seedDataPath)) {
                console.log("❌ No seed-data.json found. Nothing to clean up.");
                process.exit(0);
            }

            const seedData = JSON.parse(fs.readFileSync(seedDataPath, "utf-8"));
            console.log("📋 Removing seeded records by ID...\n");

            // Delete in reverse order of creation (dependencies first)
            
            // Certificates
            if (seedData.certificateIds) {
                for (const id of seedData.certificateIds) {
                    await Certificate.findByIdAndDelete(id).catch(() => {});
                }
                console.log(`   🗑️  Deleted ${seedData.certificateIds.length} Certificates`);
            }

            // Reviews
            if (seedData.reviewIds) {
                for (const id of seedData.reviewIds) {
                    await Review.findByIdAndDelete(id).catch(() => {});
                }
                console.log(`   🗑️  Deleted ${seedData.reviewIds.length} Reviews`);
            }

            // Submissions
            if (seedData.submissionIds) {
                for (const id of seedData.submissionIds) {
                    await Submission.findByIdAndDelete(id).catch(() => {});
                }
                console.log(`   🗑️  Deleted ${seedData.submissionIds.length} Submissions`);
            }

            // Progress
            if (seedData.progressIds) {
                for (const id of seedData.progressIds) {
                    await Progress.findByIdAndDelete(id).catch(() => {});
                }
                console.log(`   🗑️  Deleted ${seedData.progressIds.length} Progress records`);
            }

            // Payouts
            if (seedData.payoutIds) {
                try {
                    await mongoose.connection.db.collection("payouts").deleteMany({
                        _id: { $in: seedData.payoutIds.map(id => new mongoose.Types.ObjectId(id)) }
                    });
                    console.log(`   🗑️  Deleted ${seedData.payoutIds.length} Payouts`);
                } catch (e) {
                    console.log(`   ⏭️  Payouts collection doesn't exist`);
                }
            }

            // Wallets
            const allWalletIds = [
                ...(seedData.userWalletIds || []),
                ...(seedData.instructorWalletIds || [])
            ];
            if (allWalletIds.length > 0) {
                try {
                    await mongoose.connection.db.collection("wallets").deleteMany({
                        _id: { $in: allWalletIds.map(id => new mongoose.Types.ObjectId(id)) }
                    });
                    console.log(`   🗑️  Deleted ${allWalletIds.length} Wallets`);
                } catch (e) {
                    console.log(`   ⏭️  Wallets collection doesn't exist`);
                }
            }

            // Enrollments
            if (seedData.enrollmentIds) {
                for (const id of seedData.enrollmentIds) {
                    await Enrollment.findByIdAndDelete(id).catch(() => {});
                }
                console.log(`   🗑️  Deleted ${seedData.enrollmentIds.length} Enrollments`);
            }

            // Payments
            if (seedData.paymentIds) {
                for (const id of seedData.paymentIds) {
                    await Payment.findByIdAndDelete(id).catch(() => {});
                }
                console.log(`   🗑️  Deleted ${seedData.paymentIds.length} Payments`);
            }

            // Materials
            if (seedData.materialIds) {
                for (const id of seedData.materialIds) {
                    await Material.findByIdAndDelete(id).catch(() => {});
                }
                console.log(`   🗑️  Deleted ${seedData.materialIds.length} Materials`);
            }

            // Videos
            if (seedData.videoIds && Array.isArray(seedData.videoIds)) {
                for (const id of seedData.videoIds) {
                    await Video.findByIdAndDelete(id).catch(() => {});
                }
                console.log(`   🗑️  Deleted ${seedData.videoIds.length} Videos`);
            }

            // Live Classes
            if (seedData.liveClassId) {
                await LiveClass.findByIdAndDelete(seedData.liveClassId).catch(() => {});
                console.log("   🗑️  Deleted Live Class");
            }

            // Assignments
            if (seedData.assignmentIds) {
                for (const id of seedData.assignmentIds) {
                    await Assignment.findByIdAndDelete(id).catch(() => {});
                }
                console.log(`   🗑️  Deleted ${seedData.assignmentIds.length} Assignments`);
            }

            // Lessons
            if (seedData.lessonIds) {
                for (const id of seedData.lessonIds) {
                    await Lesson.findByIdAndDelete(id).catch(() => {});
                }
                console.log(`   🗑️  Deleted ${seedData.lessonIds.length} Lessons`);
            }

            // Modules
            if (seedData.moduleIds) {
                for (const id of seedData.moduleIds) {
                    await Module.findByIdAndDelete(id).catch(() => {});
                }
                console.log(`   🗑️  Deleted ${seedData.moduleIds.length} Modules`);
            }

            // Courses
            if (seedData.courseIds) {
                for (const id of seedData.courseIds) {
                    await Course.findByIdAndDelete(id).catch(() => {});
                }
                console.log(`   🗑️  Deleted ${seedData.courseIds.length} Courses`);
            }

            // Users
            if (seedData.userIds) {
                for (const id of seedData.userIds) {
                    await User.findByIdAndDelete(id).catch(() => {});
                }
                console.log(`   🗑️  Deleted ${seedData.userIds.length} Users`);
            }

            // Instructors
            if (seedData.instructorIds) {
                for (const id of seedData.instructorIds) {
                    await Instructor.findByIdAndDelete(id).catch(() => {});
                }
                console.log(`   🗑️  Deleted ${seedData.instructorIds.length} Instructors`);
            }
        }

        // Remove seed-data.json
        const seedDataPath = path.join(__dirname, "seed-data.json");
        if (fs.existsSync(seedDataPath)) {
            fs.unlinkSync(seedDataPath);
            console.log("\n   🗑️  Deleted seed-data.json");
        }

        console.log("\n✅ Cleanup complete! All seeded test data removed.\n");
        process.exit(0);
    } catch (error) {
        console.error("\n❌ Cleanup failed:", error.message);
        console.error(error.stack);
        process.exit(1);
    }
};

cleanup();
