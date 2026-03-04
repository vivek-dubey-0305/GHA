import dotenv from "dotenv";
import connectDB from "../configs/connection.config.js";
import { Instructor } from "../models/instructor.model.js";
import { loadSeedData, saveSeedData, logCreated, separator, STOCK_IMAGES, TEST_INSTRUCTORS } from "./seed-helpers.js";

dotenv.config();

/**
 * Seed Script: Create 3 Test Instructors
 * Usage: node seeds/02_instructor.seed.js
 * 
 * Creates 3 unique instructors with different specializations:
 * 1. Khushbu Bhargav - Web Development
 * 2. Vikram Desai - Data Science & AI
 * 3. Neha Gupta - DevOps & Cloud
 */

export const seedInstructor = async () => {
    console.log("\n📋 Step 2: Seeding Instructors (3 instructors)...");
    separator();

    const seedData = loadSeedData();
    const instructorIds = [];

    for (let i = 0; i < TEST_INSTRUCTORS.length; i++) {
        const instructorData = TEST_INSTRUCTORS[i];

        // Check if already exists
        const existing = await Instructor.findOne({ email: instructorData.email }).select("+email");
        if (existing) {
            console.log(`   ⚠️  Instructor already exists: ${instructorData.email}`);
            instructorIds.push(existing._id.toString());
            continue;
        }

        const instructor = new Instructor({
            ...instructorData,
            profilePicture: STOCK_IMAGES.instructorProfiles[i],
            isEmailVerified: true,
            isPhoneVerified: true,
            isDocumentsVerified: true,
            isKYCVerified: true,
            isActive: true,
            rating: {
                averageRating: 4.5 + (i * 0.1),
                totalReviews: 0,
                ratingBreakdown: {
                    fivestar: 0,
                    fourstar: 0,
                    threestar: 0,
                    twostar: 0,
                    onestar: 0
                }
            },
            preferences: {
                emailNotifications: true,
                classReminders: true,
                studentUpdates: true,
                language: "en",
                timezone: "Asia/Kolkata"
            },
            createdBy: seedData.adminId ? seedData.adminId : undefined
        });

        await instructor.save();
        const id = instructor._id.toString();
        instructorIds.push(id);

        logCreated(`Instructor ${i + 1}`, id, instructorData.email);
        console.log(`      📧 Email: ${instructorData.email}`);
        console.log(`      🔐 Password: ${instructorData.password}`);
        console.log(`      🎓 Specialization: ${instructorData.specialization.join(", ")}`);
    }

    saveSeedData({
        instructorIds,
        instructorId1: instructorIds[0],
        instructorId2: instructorIds[1],
        instructorId3: instructorIds[2]
    });

    console.log(`\n   📊 Total instructors created: ${instructorIds.length}`);
    separator();

    return instructorIds;
};

// Standalone execution
if (process.argv[1] && process.argv[1].includes("02_instructor")) {
    (async () => {
        try {
            await connectDB();
            await seedInstructor();
            process.exit(0);
        } catch (error) {
            console.error("❌ Error:", error.message);
            process.exit(1);
        }
    })();
}