import dotenv from "dotenv";
import connectDB from "../configs/connection.config.js";
import { User } from "../models/user.model.js";
import { loadSeedData, saveSeedData, logCreated, separator, STOCK_IMAGES, TEST_USERS } from "./seed-helpers.js";

dotenv.config();

/**
 * Seed Script: Create 3 Test Users
 * Usage: node seeds/03_user.seed.js
 * 
 * Creates 3 unique users with different details:
 * 1. Rahul Sharma - Mumbai
 * 2. Priya Patel - Kolkata
 * 3. Amit Kumar - Bangalore
 */

export const seedUser = async () => {
    console.log("\n👤 Step 3: Seeding Users (3 users)...");
    separator();

    const seedData = loadSeedData();
    const userIds = [];

    for (let i = 0; i < TEST_USERS.length; i++) {
        const userData = TEST_USERS[i];

        // Check if already exists
        const existing = await User.findOne({ email: userData.email }).select("+email");
        if (existing) {
            console.log(`   ⚠️  User already exists: ${userData.email}`);
            userIds.push(existing._id.toString());
            continue;
        }

        const user = new User({
            ...userData,
            profilePicture: STOCK_IMAGES.userProfiles[i],
            isEmailVerified: true,
            isPhoneVerified: true,
            isActive: true,
            preferences: {
                emailNotifications: true,
                smsNotifications: true,
                courseUpdates: true,
                promotionalEmails: i === 0, // First user gets promotional emails
                language: "en"
            },
            learningProgress: {
                totalCoursesEnrolled: 0,
                totalCoursesCompleted: 0,
                totalLearningHours: 0,
                certificates: 0,
                averageRating: 0
            },
            createdBy: seedData.adminId ? seedData.adminId : undefined
        });

        await user.save();
        const id = user._id.toString();
        userIds.push(id);

        logCreated(`User ${i + 1}`, id, userData.email);
        console.log(`      📧 Email: ${userData.email}`);
        console.log(`      🔐 Password: ${userData.password}`);
        console.log(`      📍 Location: ${userData.address.city}, ${userData.address.state}`);
    }

    saveSeedData({
        userIds,
        userId1: userIds[0],
        userId2: userIds[1],
        userId3: userIds[2]
    });

    console.log(`\n   📊 Total users created: ${userIds.length}`);
    separator();

    return userIds;
};

// Standalone execution
if (process.argv[1] && process.argv[1].includes("03_user")) {
    (async () => {
        try {
            await connectDB();
            await seedUser();
            process.exit(0);
        } catch (error) {
            console.error("❌ Error:", error.message);
            process.exit(1);
        }
    })();
}
