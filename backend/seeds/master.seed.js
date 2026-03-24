import mongoose from "mongoose";
import dotenv from "dotenv";
import connectDB from "../configs/connection.config.js";
import { Admin } from "../models/admin.model.js";
import { loadSeedData, saveSeedData, separator } from "./seed-helpers.js";
import { seedInstructor } from "./02_instructor.seed.js";
import { seedUser } from "./03_user.seed.js";
import { seedCourse } from "./04_course.seed.js";
import { seedModules } from "./05_module.seed.js";
import { seedLessons } from "./06_lesson.seed.js";
import { seedAssignment } from "./07_assignment.seed.js";
import { seedLiveClass } from "./08_liveclass.seed.js";
import { seedMaterials } from "./10_material.seed.js";
import { seedPayment } from "./11_payment.seed.js";
import { seedEnrollment } from "./12_enrollment.seed.js";
import { seedProgress } from "./13_progress.seed.js";
import { seedSubmission } from "./14_submission.seed.js";
import { seedReview } from "./15_review.seed.js";
import { seedCertificate } from "./16_certificate.seed.js";
import { seedWallet } from "./17_wallet.seed.js";
import { seedPayout } from "./18_payout.seed.js";

dotenv.config();

/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║               MASTER SEED RUNNER                            ║
 * ║  Runs ALL seeders in order with proper relationships        ║
 * ║                                                             ║
 * ║  Usage: node seeds/master.seed.js                           ║
 * ║                                                             ║
 * ║  Execution Order:                                           ║
 * ║   1. Admin (check existing / use env vars)                  ║
 * ║   2. Instructors (3 instructors)                            ║
 * ║   3. Users (3 users)                                        ║
 * ║   4. Courses (3 courses, 1 per instructor)                  ║
 * ║   5. Modules (9 modules, 3 per course)                      ║
 * ║   6. Lessons (45 lessons, 5 per module)                     ║
 * ║   7. Assignments (9 assignments, 1 per module)              ║
 * ║   8. Live Class → linked to Course & Instructor             ║
 * ║   9. Materials → linked to Course, Modules, Lessons         ║
 * ║  10. Payments (9 payments - 3 users × 3 courses)            ║
 * ║  11. Enrollments (9 enrollments)                            ║
 * ║  12. Progress (9 progress records)                          ║
 * ║  13. Submissions (9 submissions)                            ║
 * ║  14. Reviews (9 reviews)                                    ║
 * ║  15. Certificates (3 certificates for completed courses)    ║
 * ║  16. Wallets (6 wallets - 3 users + 3 instructors)          ║
 * ║  17. Payouts (4 payouts for instructors)                    ║
 * ╚══════════════════════════════════════════════════════════════╝
 */

const runMasterSeed = async () => {
    const startTime = Date.now();

    console.log("\n");
    console.log("╔══════════════════════════════════════════════════════════╗");
    console.log("║           🌱 MASTER SEED RUNNER - GHA Platform          ║");
    console.log("║       Creating end-to-end test data for all models      ║");
    console.log("╚══════════════════════════════════════════════════════════╝\n");

    try {
        // ── Connect to Database ──
        await connectDB();
        console.log("✅ Database connected\n");

        // ── Step 1: Check/Create Admin ──
        console.log("👑 Step 1: Checking Admin...");
        separator();
        const adminEmail = process.env.ADMIN_MAIL;
        if (adminEmail) {
            const admin = await Admin.findOne({ email: adminEmail }).select("+email");
            if (admin) {
                console.log(`   ✅ Admin exists: ${adminEmail} (ID: ${admin._id})`);
                saveSeedData({ adminId: admin._id.toString() });
            } else {
                console.log("   ⚠️  Admin not found. Run 'node seeds/admin.seed.js' first.");
                console.log("   Continuing without admin reference...");
            }
        } else {
            console.log("   ⚠️  ADMIN_MAIL env var not set. Skipping admin check.");
        }
        separator();

        // ── Step 2: Create Instructors (3) ──
        await seedInstructor();

        // ── Step 3: Create Users (3) ──
        await seedUser();

        // ── Step 4: Create Courses (3) ──
        await seedCourse();

        // ── Step 5: Create Modules (9) ──
        await seedModules();

        // ── Step 6: Create Lessons (45) ──
        await seedLessons();

        // ── Step 7: Create Assignments (9) ──
        await seedAssignment();

        // ── Step 8: Create Live Class ──
        await seedLiveClass();

        // ── Step 9: Create Materials ──
        await seedMaterials();

        // ── Step 10: Create Payments (9) ──
        await seedPayment();

        // ── Step 11: Create Enrollments (9) ──
        await seedEnrollment();

        // ── Step 12: Create Progress (9) ──
        await seedProgress();

        // ── Step 13: Create Submissions (9) ──
        await seedSubmission();

        // ── Step 14: Create Reviews (9) ──
        await seedReview();

        // ── Step 15: Create Certificates (3) ──
        await seedCertificate();

        // ── Step 16: Create Wallets (6) ──
        await seedWallet();

        // ── Step 17: Create Payouts (4) ──
        await seedPayout();

        // ── Summary ──
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
        const seedData = loadSeedData();

        console.log("\n");
        console.log("╔══════════════════════════════════════════════════════════╗");
        console.log("║              🎉 SEEDING COMPLETE!                       ║");
        console.log("╚══════════════════════════════════════════════════════════╝\n");
        
        console.log("📋 SUMMARY OF CREATED DATA:");
        console.log("━".repeat(55));
        console.log(`  Instructors: ${seedData.instructorIds?.length || 0}`);
        console.log(`  Users: ${seedData.userIds?.length || 0}`);
        console.log(`  Courses: ${seedData.courseIds?.length || 0}`);
        console.log(`  Modules: ${seedData.moduleIds?.length || 0}`);
        console.log(`  Lessons: ${seedData.lessonIds?.length || 0}`);
        console.log(`  Assignments: ${seedData.assignmentIds?.length || 0}`);
        console.log(`  Payments: ${seedData.paymentIds?.length || 0}`);
        console.log(`  Enrollments: ${seedData.enrollmentIds?.length || 0}`);
        console.log(`  Progress Records: ${seedData.progressIds?.length || 0}`);
        console.log(`  Submissions: ${seedData.submissionIds?.length || 0}`);
        console.log(`  Reviews: ${seedData.reviewIds?.length || 0}`);
        console.log(`  Certificates: ${seedData.certificateIds?.length || 0}`);
        console.log(`  Wallets: ${(seedData.userWalletIds?.length || 0) + (seedData.instructorWalletIds?.length || 0)}`);
        console.log(`  Payouts: ${seedData.payoutIds?.length || 0}`);
        console.log("━".repeat(55));

        console.log("\n📁 All IDs saved to: seeds/seed-data.json");
        console.log(`⏱️  Total time: ${elapsed}s`);

        console.log("\n🔗 RELATIONSHIP MAP:");
        console.log("━".repeat(55));
        console.log("  Instructors (3)");
        console.log("  ├── Instructor 1 → Course: Full-Stack Web Development");
        console.log("  ├── Instructor 2 → Course: Data Science & ML");
        console.log("  └── Instructor 3 → Course: DevOps Engineering");
        console.log("");
        console.log("  Courses (3) - Each with:");
        console.log("  ├── 3 Modules");
        console.log("  │   └── 5 Lessons each (video, article, assignment)");
        console.log("  ├── 3 Assignments (1 per module)");
        console.log("  ├── Live Class, Video Package, Materials");
        console.log("  └── 3 Enrollments (each user enrolled)");
        console.log("");
        console.log("  Users (3) - Each with:");
        console.log("  ├── 3 Course Enrollments");
        console.log("  ├── 3 Payments");
        console.log("  ├── Progress tracking");
        console.log("  ├── Assignment submissions");
        console.log("  ├── Course reviews");
        console.log("  └── Wallet for transactions");
        console.log("");
        console.log("  Financial:");
        console.log("  ├── 6 Wallets (3 users + 3 instructors)");
        console.log("  └── 4 Payouts (instructor withdrawals)");
        console.log("━".repeat(55));

        console.log("\n✅ All models seeded with proper end-to-end relationships!\n");

        process.exit(0);
    } catch (error) {
        console.error("\n❌ MASTER SEED FAILED:");
        console.error(`   Error: ${error.message}`);
        console.error(`   Stack: ${error.stack}`);
        console.error("\n💡 Check seed-data.json for partially saved IDs.");
        console.error("   You can re-run this script — it skips already-created records.\n");
        process.exit(1);
    }
};

runMasterSeed();
