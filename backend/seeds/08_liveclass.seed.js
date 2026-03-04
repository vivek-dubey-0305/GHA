import dotenv from "dotenv";
import connectDB from "../configs/connection.config.js";
import { LiveClass } from "../models/liveclass.model.js";
import { Instructor } from "../models/instructor.model.js";
import { loadSeedData, saveSeedData, logCreated, separator } from "./seed-helpers.js";

dotenv.config();

/**
 * Seed Script: Create Test Live Class
 * Usage: node seeds/08_liveclass.seed.js
 */

export const seedLiveClass = async () => {
    console.log("\n🔴 Step 8: Seeding Live Class...");
    separator();

    const seedData = loadSeedData();
    // Support both old (single) and new (array) format
    const courseId = seedData.courseIds ? seedData.courseIds[0] : seedData.courseId;
    const instructorId = seedData.instructorIds ? seedData.instructorIds[0] : seedData.instructorId;
    const userId = seedData.userIds ? seedData.userIds[0] : seedData.userId;

    if (!courseId || !instructorId) {
        throw new Error("Course/Instructor IDs not found. Run previous seeds first.");
    }

    // Check if live class already exists
    const existing = await LiveClass.findOne({ course: courseId, instructor: instructorId });
    if (existing) {
        console.log(`   ⚠️  Live class already exists: ${existing.title}`);
        saveSeedData({ liveClassId: existing._id.toString() });
        return existing._id.toString();
    }

    const scheduledDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now

    const liveClass = new LiveClass({
        instructor: instructorId,
        course: courseId,
        title: "Live Coding: Building Express.js APIs from Scratch",
        description: "Join this interactive live session where we'll build a complete Express.js REST API step by step. Bring your questions! We'll cover routing, middleware, error handling, and MongoDB integration in real-time.",
        scheduledAt: scheduledDate,
        duration: 90, // minutes
        timezone: "Asia/Kolkata",
        bunnyVideoId: "seed-test-video-id-00001",
        rtmpUrl: "rtmp://live.bunnycdn.com/live",
        rtmpKey: "610075-seed-test-video-id-00001?password=seed-api-key",
        playbackUrl: "https://vz-610075.b-cdn.net/seed-test-video-id-00001/playlist.m3u8",
        maxParticipants: 500,
        actualParticipants: 0,
        registeredParticipants: userId ? [{
            user: userId,
            registeredAt: new Date(),
            attended: false
        }] : [],
        status: "scheduled",
        recordingStatus: "not_recorded",
        recordingAvailable: false,
        notes: "Prerequisites: Complete Module 2 lessons. Have Node.js installed and VS Code ready.",
        tags: ["express.js", "rest-api", "live-coding", "node.js"],
        isPublic: false,
        createdBy: instructorId,
        updatedBy: instructorId
    });

    await liveClass.save();
    const id = liveClass._id.toString();

    // Update instructor's liveClasses array
    await Instructor.findByIdAndUpdate(instructorId, {
        $push: { liveClasses: liveClass._id },
        $inc: { totalLiveClasses: 1 }
    });

    logCreated("Live Class", id, liveClass.title);
    saveSeedData({ liveClassId: id });

    console.log(`   📅 Scheduled: ${scheduledDate.toISOString()}`);
    console.log(`   ⏱️  Duration: ${liveClass.duration} min`);
    console.log(`   🔗 Playback: ${liveClass.playbackUrl}`);
    separator();

    return id;
};

// Standalone execution
if (process.argv[1] && process.argv[1].includes("08_liveclass")) {
    (async () => {
        try {
            await connectDB();
            await seedLiveClass();
            process.exit(0);
        } catch (error) {
            console.error("❌ Error:", error.message);
            process.exit(1);
        }
    })();
}
