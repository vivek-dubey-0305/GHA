import dotenv from "dotenv";
import crypto from "crypto";
import mongoose from "mongoose";
import connectDB from "../configs/connection.config.js";
import { Certificate } from "../models/certificate.model.js";
import { Enrollment } from "../models/enrollment.model.js";
import { User } from "../models/user.model.js";
import { loadSeedData, saveSeedData, logCreated, separator, TEST_COURSES } from "./seed-helpers.js";

dotenv.config();

/**
 * Seed Script: Create Test Certificates (for completed enrollments)
 * Usage: node seeds/16_certificate.seed.js
 */

// Skills by course
const COURSE_SKILLS = [
    ["React.js", "Node.js", "Express.js", "MongoDB", "REST API", "Full-Stack Development", "Git"],
    ["Python", "Pandas", "NumPy", "Machine Learning", "Data Visualization", "SQL", "Statistics"],
    ["Docker", "Kubernetes", "CI/CD", "AWS", "Linux", "Git", "Terraform"]
];

export const seedCertificate = async () => {
    console.log("\n🏆 Step 16: Seeding Certificates...");
    separator();

    const seedData = loadSeedData();
    if (!seedData.userIds || !seedData.courseIds || !seedData.instructorIds || !seedData.enrollmentIds) {
        throw new Error("Required IDs not found. Run previous seeds first.");
    }

    // Check if certificates already exist
    const existingCount = await Certificate.countDocuments({
        user: { $in: seedData.userIds.map(id => new mongoose.Types.ObjectId(id)) }
    });

    if (existingCount > 0) {
        console.log(`   ⚠️  ${existingCount} certificates already exist. Retrieving IDs...`);
        const existing = await Certificate.find({
            user: { $in: seedData.userIds.map(id => new mongoose.Types.ObjectId(id)) }
        });
        const certificateIds = existing.map(c => c._id.toString());
        saveSeedData({ certificateIds });
        return certificateIds;
    }

    const certificateIds = [];
    const verificationCodes = [];

    // Create certificates for completed enrollments (indices 0, 4, 6 based on progressData in enrollment seeder)
    // User 0: Course 0 (100% complete), User 1: Course 1 (100%), User 2: Course 0 (100%)
    const completedEnrollments = [
        { userIdx: 0, courseIdx: 0, enrollmentIdx: 0 },
        { userIdx: 1, courseIdx: 1, enrollmentIdx: 4 },
        { userIdx: 2, courseIdx: 0, enrollmentIdx: 6 }
    ];

    for (const { userIdx, courseIdx, enrollmentIdx } of completedEnrollments) {
        const userId = seedData.userIds[userIdx];
        const courseId = seedData.courseIds[courseIdx];
        const instructorId = seedData.instructorIds[courseIdx];
        const enrollmentId = seedData.enrollmentIds[enrollmentIdx];
        const courseTitle = TEST_COURSES[courseIdx].title;

        // Generate unique values
        const timestamp = Date.now().toString(36);
        const random = Math.random().toString(36).substr(2, 5);
        const certId = `CERT-${timestamp}-${random}`.toUpperCase();
        const verificationCode = crypto.randomBytes(16).toString("hex");
        const shareableUrl = `cert/${verificationCode}`;

        const certDoc = {
            _id: new mongoose.Types.ObjectId(),
            certificateId: certId,
            title: `Certificate of Completion - ${courseTitle}`,
            user: new mongoose.Types.ObjectId(userId),
            course: new mongoose.Types.ObjectId(courseId),
            instructor: new mongoose.Types.ObjectId(instructorId),
            issuedAt: new Date(Date.now() - enrollmentIdx * 24 * 60 * 60 * 1000),
            completionPercentage: 100,
            totalLessons: 15,
            completedLessons: 15,
            timeSpent: 20 + Math.floor(Math.random() * 10),
            status: "active",
            certificateUrl: `https://picsum.photos/seed/cert-${certId}/800/600`,
            shareableUrl,
            verificationCode,
            skills: COURSE_SKILLS[courseIdx],
            grade: "A",
            issuedBy: new mongoose.Types.ObjectId(instructorId),
            createdAt: new Date(),
            updatedAt: new Date()
        };

        // Use insertOne to bypass pre-save hooks
        await Certificate.collection.insertOne(certDoc);
        certificateIds.push(certDoc._id.toString());
        verificationCodes.push(verificationCode);

        // Update enrollment
        await Enrollment.findByIdAndUpdate(enrollmentId, {
            certificateIssued: true,
            certificateId: certDoc._id
        });

        logCreated(`Certificate ${certificateIds.length}`, certDoc._id.toString(),
            `User ${userIdx + 1} → ${courseTitle.substring(0, 20)}...`);
    }

    // Update user learning progress
    await User.findByIdAndUpdate(seedData.userIds[0], { $set: { "learningProgress.certificates": 1 } });
    await User.findByIdAndUpdate(seedData.userIds[1], { $set: { "learningProgress.certificates": 1 } });
    await User.findByIdAndUpdate(seedData.userIds[2], { $set: { "learningProgress.certificates": 1 } });

    saveSeedData({ certificateIds, verificationCodes });

    console.log(`\n   📊 Total certificates: ${certificateIds.length}`);
    console.log(`      - User 1: Full-Stack Web Development`);
    console.log(`      - User 2: Data Science & ML`);
    console.log(`      - User 3: Full-Stack Web Development`);
    separator();

    return certificateIds;
};

// Standalone execution
if (process.argv[1] && process.argv[1].includes("16_certificate")) {
    (async () => {
        try {
            await connectDB();
            await seedCertificate();
            process.exit(0);
        } catch (error) {
            console.error("❌ Error:", error.message);
            process.exit(1);
        }
    })();
}
