import dotenv from "dotenv";
import mongoose from "mongoose";
import connectDB from "../configs/connection.config.js";
import { Review } from "../models/review.model.js";
import { Course } from "../models/course.model.js";
import { loadSeedData, saveSeedData, logCreated, separator } from "./seed-helpers.js";

dotenv.config();

/**
 * Seed Script: Create Test Reviews (9 reviews - 3 users × 3 courses)
 * NOTE: The Review model's pre-save hook checks enrollment, so enrollment must exist first.
 * Usage: node seeds/15_review.seed.js
 */

// Review templates per course
const REVIEW_TEMPLATES = [
    // Full-Stack reviews
    {
        rating: 5, title: "Best Full-Stack Course Ever!",
        comment: "This course transformed my career. The instructor explains complex concepts in a simple way. The projects are practical and industry-relevant. Highly recommend!"
    },
    {
        rating: 4, title: "Great Content, Well Structured",
        comment: "Comprehensive coverage of modern web development. The React and Node.js sections are excellent. Would love more content on testing."
    },
    {
        rating: 5, title: "Perfect for Career Changers",
        comment: "I switched from marketing to tech after this course. The curriculum is well-designed and the support is amazing. Worth every penny!"
    },
    // Data Science reviews
    {
        rating: 5, title: "Excellent Data Science Foundation",
        comment: "From Python basics to machine learning, this course covers it all. The hands-on projects with real datasets are incredibly valuable."
    },
    {
        rating: 4, title: "Solid ML Fundamentals",
        comment: "Great introduction to machine learning. The explanations are clear and the visualizations help understand complex algorithms."
    },
    {
        rating: 5, title: "Career-Changing Course",
        comment: "This course helped me land my first data science job. The portfolio projects are exactly what employers look for."
    },
    // DevOps reviews
    {
        rating: 5, title: "DevOps Made Simple",
        comment: "Finally understand CI/CD and Docker! The hands-on labs are fantastic. The instructor has real industry experience."
    },
    {
        rating: 4, title: "Comprehensive DevOps Training",
        comment: "Covers all major DevOps tools and practices. Would appreciate more content on Kubernetes advanced topics."
    },
    {
        rating: 5, title: "Industry-Ready DevOps Skills",
        comment: "After completing this course, I automated our entire deployment pipeline at work. My manager was impressed!"
    }
];

export const seedReview = async () => {
    console.log("\n⭐ Step 15: Seeding Reviews...");
    separator();

    const seedData = loadSeedData();
    if (!seedData.userIds || !seedData.courseIds) {
        throw new Error("User/Course IDs not found. Run previous seeds first.");
    }

    // Check if reviews already exist
    const existingCount = await Review.countDocuments({
        user: { $in: seedData.userIds.map(id => new mongoose.Types.ObjectId(id)) }
    });

    if (existingCount > 0) {
        console.log(`   ⚠️  ${existingCount} reviews already exist. Retrieving IDs...`);
        const existing = await Review.find({
            user: { $in: seedData.userIds.map(id => new mongoose.Types.ObjectId(id)) }
        });
        const reviewIds = existing.map(r => r._id.toString());
        saveSeedData({ reviewIds });
        return reviewIds;
    }

    const reviewIds = [];

    // Create reviews: each user reviews each course
    for (let userIdx = 0; userIdx < seedData.userIds.length; userIdx++) {
        for (let courseIdx = 0; courseIdx < seedData.courseIds.length; courseIdx++) {
            const userId = seedData.userIds[userIdx];
            const courseId = seedData.courseIds[courseIdx];
            const reviewIndex = courseIdx * 3 + userIdx;
            const template = REVIEW_TEMPLATES[reviewIndex];

            const review = new Review({
                user: userId,
                course: courseId,
                rating: template.rating,
                title: template.title,
                comment: template.comment,
                isVerified: true,
                helpful: Math.floor(Math.random() * 20) + 5,
                reported: false,
                isApproved: true
            });

            await review.save();
            reviewIds.push(review._id.toString());

            logCreated(`Review ${reviewIds.length}`, review._id.toString(),
                `User ${userIdx + 1} → Course ${courseIdx + 1}: ${"★".repeat(template.rating)}`);
        }
    }

    // Update course ratings
    const courseRatings = [
        { idx: 0, rating: 4.7, count: 3 },
        { idx: 1, rating: 4.7, count: 3 },
        { idx: 2, rating: 4.7, count: 3 }
    ];

    for (const { idx, rating, count } of courseRatings) {
        await Course.findByIdAndUpdate(seedData.courseIds[idx], {
            $set: { rating, totalReviews: count }
        });
    }

    saveSeedData({ reviewIds });

    console.log(`\n   📊 Total reviews: ${reviewIds.length}`);
    console.log(`      - 5 stars: ${REVIEW_TEMPLATES.filter(r => r.rating === 5).length}`);
    console.log(`      - 4 stars: ${REVIEW_TEMPLATES.filter(r => r.rating === 4).length}`);
    separator();

    return reviewIds;
};

// Standalone execution
if (process.argv[1] && process.argv[1].includes("15_review")) {
    (async () => {
        try {
            await connectDB();
            await seedReview();
            process.exit(0);
        } catch (error) {
            console.error("❌ Error:", error.message);
            process.exit(1);
        }
    })();
}
