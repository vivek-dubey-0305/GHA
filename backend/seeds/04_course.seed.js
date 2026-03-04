import dotenv from "dotenv";
import connectDB from "../configs/connection.config.js";
import { Course } from "../models/course.model.js";
import { Instructor } from "../models/instructor.model.js";
import { loadSeedData, saveSeedData, logCreated, separator, STOCK_IMAGES, TEST_COURSES } from "./seed-helpers.js";

dotenv.config();

/**
 * Seed Script: Create 3 Test Courses (one per instructor)
 * Usage: node seeds/04_course.seed.js
 * 
 * Each instructor creates one unique course:
 * 1. Instructor 1 → Full-Stack Web Development
 * 2. Instructor 2 → Data Science & ML
 * 3. Instructor 3 → DevOps & Cloud
 */

export const seedCourse = async () => {
    console.log("\n📚 Step 4: Seeding Courses (3 courses)...");
    separator();

    const seedData = loadSeedData();
    if (!seedData.instructorIds || seedData.instructorIds.length < 3) {
        throw new Error("3 Instructor IDs not found. Run 02_instructor.seed.js first.");
    }

    const courseIds = [];

    for (let i = 0; i < TEST_COURSES.length; i++) {
        const courseData = TEST_COURSES[i];
        const instructorId = seedData.instructorIds[i];

        // Check if a course with this title already exists
        const existing = await Course.findOne({ title: courseData.title });
        if (existing) {
            console.log(`   ⚠️  Course already exists: ${courseData.title}`);
            courseIds.push(existing._id.toString());
            continue;
        }

        const course = new Course({
            ...courseData,
            instructor: instructorId,
            thumbnail: STOCK_IMAGES.courseThumbnails[i],
            trailerVideo: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
            discountValidUntil: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
            totalModules: 3,
            totalLessons: 15, // 5 lessons per module × 3 modules
            totalDuration: 900 + (i * 120), // ~15-19 hours per course
            status: "published",
            isPublished: true,
            publishedAt: new Date(),
            enrolledCount: 0,
            maxStudents: 5000,
            rating: 0,
            totalReviews: 0,
            seoTitle: courseData.title.substring(0, 50) + " | GHA",
            seoDescription: courseData.shortDescription,
            isFree: false,
            allowPreview: true,
            certificateEnabled: true,
            createdBy: instructorId,
            updatedBy: instructorId
        });

        await course.save();
        const id = course._id.toString();
        courseIds.push(id);

        // Update instructor's courses array
        await Instructor.findByIdAndUpdate(instructorId, {
            $push: { courses: course._id },
            $inc: { totalCourses: 1 }
        });

        logCreated(`Course ${i + 1}`, id, courseData.title);
        console.log(`      👨‍🏫 Instructor: ${seedData.instructorIds[i]}`);
        console.log(`      💰 Price: ₹${courseData.price} (Discount: ₹${courseData.discountPrice})`);
        console.log(`      🏷️  Category: ${courseData.category} | Level: ${courseData.level}`);
    }

    saveSeedData({
        courseIds,
        courseId1: courseIds[0],
        courseId2: courseIds[1],
        courseId3: courseIds[2]
    });

    console.log(`\n   📊 Total courses created: ${courseIds.length}`);
    separator();

    return courseIds;
};

// Standalone execution
if (process.argv[1] && process.argv[1].includes("04_course")) {
    (async () => {
        try {
            await connectDB();
            await seedCourse();
            process.exit(0);
        } catch (error) {
            console.error("❌ Error:", error.message);
            process.exit(1);
        }
    })();
}
