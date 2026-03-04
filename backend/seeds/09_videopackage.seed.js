import dotenv from "dotenv";
import mongoose from "mongoose";
import connectDB from "../configs/connection.config.js";
import { VideoPackage } from "../models/videopackage.model.js";
import { Instructor } from "../models/instructor.model.js";
import { loadSeedData, saveSeedData, logCreated, separator, DEMO_VIDEOS, STOCK_IMAGES } from "./seed-helpers.js";

dotenv.config();

/**
 * Seed Script: Create Test Video Package (pre-recorded content)
 * Usage: node seeds/09_videopackage.seed.js
 */

export const seedVideoPackage = async () => {
    console.log("\n📹 Step 9: Seeding Video Package...");
    separator();

    const seedData = loadSeedData();
    // Support both old (single) and new (array) format
    const courseId = seedData.courseIds ? seedData.courseIds[0] : seedData.courseId;
    const instructorId = seedData.instructorIds ? seedData.instructorIds[0] : seedData.instructorId;

    if (!courseId || !instructorId) {
        throw new Error("Course/Instructor IDs not found. Run previous seeds first.");
    }

    // Check if video package already exists
    const existing = await VideoPackage.findOne({ course: courseId, instructor: instructorId });
    if (existing) {
        console.log(`   ⚠️  Video package already exists: ${existing.packageName}`);
        saveSeedData({ videoPackageId: existing._id.toString() });
        return existing._id.toString();
    }

    const videoPackage = new VideoPackage({
        instructor: instructorId,
        course: courseId,
        packageName: "Full-Stack Web Dev - Complete Video Series",
        description: "A curated collection of pre-recorded video lessons covering the entire full-stack web development curriculum. Watch at your own pace, rewind, and practice along.",
        videos: [
            {
                videoId: new mongoose.Types.ObjectId(),
                title: "Introduction to Full-Stack Development",
                description: "Overview of the MERN stack and what you'll build in this course.",
                duration: 900, // 15 min in seconds
                fileSize: 52428800, // 50 MB
                uploadedAt: new Date(),
                url: DEMO_VIDEOS.sample1,
                thumbnail: STOCK_IMAGES.lessonThumbnails[0].secure_url,
                status: "available",
                views: 150,
                likes: 45,
                order: 1
            },
            {
                videoId: new mongoose.Types.ObjectId(),
                title: "Setting Up Node.js & Express Project",
                description: "Initialize a Node.js project, install Express, and create your first route.",
                duration: 1500, // 25 min
                fileSize: 78643200, // 75 MB
                uploadedAt: new Date(),
                url: DEMO_VIDEOS.sample2,
                thumbnail: STOCK_IMAGES.lessonThumbnails[1].secure_url,
                status: "available",
                views: 120,
                likes: 38,
                order: 2
            },
            {
                videoId: new mongoose.Types.ObjectId(),
                title: "React Components Deep Dive",
                description: "Functional components, hooks, props, and building a dynamic UI.",
                duration: 2100, // 35 min
                fileSize: 104857600, // 100 MB
                uploadedAt: new Date(),
                url: DEMO_VIDEOS.sample3,
                thumbnail: STOCK_IMAGES.lessonThumbnails[2].secure_url,
                status: "available",
                views: 95,
                likes: 32,
                order: 3
            }
        ],
        isPublished: true,
        isPublic: false,
        price: 999,
        currency: "INR",
        tags: ["mern", "fullstack", "webdev", "react", "nodejs"],
        category: "tutorial",
        totalViews: 365,
        totalLikes: 115,
        averageRating: 4.3,
        createdBy: instructorId,
        updatedBy: instructorId
    });

    await videoPackage.save();
    const id = videoPackage._id.toString();

    // Update instructor's videoPackages array
    await Instructor.findByIdAndUpdate(instructorId, {
        $push: { videoPackages: videoPackage._id }
    });

    logCreated("Video Package", id, videoPackage.packageName);
    saveSeedData({ videoPackageId: id });

    console.log(`   🎥 Videos: ${videoPackage.totalVideos}`);
    console.log(`   ⏱️  Total Duration: ${Math.round(videoPackage.totalDuration / 60)} min`);
    console.log(`   💰 Price: ₹${videoPackage.price}`);
    separator();

    return id;
};

// Standalone execution
if (process.argv[1] && process.argv[1].includes("09_videopackage")) {
    (async () => {
        try {
            await connectDB();
            await seedVideoPackage();
            process.exit(0);
        } catch (error) {
            console.error("❌ Error:", error.message);
            process.exit(1);
        }
    })();
}
