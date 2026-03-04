import dotenv from "dotenv";
import mongoose from "mongoose";
import connectDB from "../configs/connection.config.js";
import { Submission } from "../models/submission.model.js";
import { Assignment } from "../models/assignment.model.js";
import { loadSeedData, saveSeedData, logCreated, separator } from "./seed-helpers.js";

dotenv.config();

/**
 * Seed Script: Create Test Submissions (9 submissions - 3 users × 3 courses)
 * Each user submits one assignment per course
 * Usage: node seeds/14_submission.seed.js
 */

// Submission content templates per course domain
const SUBMISSION_TEMPLATES = {
    fullstack: {
        text: `## My REST API Todo Application

### Approach
I built a todo REST API using Express.js with MongoDB (Mongoose). The project follows MVC architecture.

### Key Features
- Full CRUD operations for todos
- Input validation using express-validator
- Error handling middleware
- Pagination and filtering support

### What I Learned
Building this API taught me how to structure a Node.js project properly and handle async errors gracefully.`,
        links: [{ title: "GitHub Repository", url: "https://github.com/testuser/todo-api" }]
    },
    datascience: {
        text: `## Data Analysis Project - Sales Dashboard

### Approach
I analyzed the sales dataset using pandas and created visualizations with matplotlib and seaborn.

### Key Findings
- Q4 sales were 45% higher than Q1
- Product category A drove 60% of revenue
- Customer retention improved by 12% year-over-year

### Tools Used
- Python with pandas, numpy
- Matplotlib, Seaborn for visualizations
- Jupyter Notebook for analysis`,
        links: [{ title: "Jupyter Notebook", url: "https://github.com/testuser/sales-analysis" }]
    },
    devops: {
        text: `## CI/CD Pipeline Implementation

### Approach
I set up a complete CI/CD pipeline using GitHub Actions with Docker containerization.

### Pipeline Stages
1. Code checkout and linting
2. Unit tests with coverage
3. Docker build and push
4. Deploy to staging
5. Integration tests
6. Production deployment

### Key Learnings
Understanding the importance of automated testing and deployment strategies.`,
        links: [{ title: "GitHub Actions Workflow", url: "https://github.com/testuser/devops-pipeline" }]
    }
};

const COURSE_DOMAINS = ["fullstack", "datascience", "devops"];

export const seedSubmission = async () => {
    console.log("\n📤 Step 14: Seeding Submissions...");
    separator();

    const seedData = loadSeedData();
    if (!seedData.userIds || !seedData.courseIds || !seedData.assignmentIds || !seedData.instructorIds) {
        throw new Error("Required IDs not found. Run previous seeds first.");
    }

    // Check if submissions already exist
    const existingCount = await Submission.countDocuments({
        user: { $in: seedData.userIds.map(id => new mongoose.Types.ObjectId(id)) }
    });

    if (existingCount > 0) {
        console.log(`   ⚠️  ${existingCount} submissions already exist. Retrieving IDs...`);
        const existing = await Submission.find({
            user: { $in: seedData.userIds.map(id => new mongoose.Types.ObjectId(id)) }
        });
        const submissionIds = existing.map(s => s._id.toString());
        saveSeedData({ submissionIds });
        return submissionIds;
    }

    const submissionIds = [];
    const grades = ["A", "A", "B+", "A+", "A", "B", "A", "B+", "A+"];
    const scores = [92, 88, 85, 90, 95, 78, 91, 83, 87];

    // Create submissions: each user submits for each course
    for (let userIdx = 0; userIdx < seedData.userIds.length; userIdx++) {
        for (let courseIdx = 0; courseIdx < seedData.courseIds.length; courseIdx++) {
            const userId = seedData.userIds[userIdx];
            const courseId = seedData.courseIds[courseIdx];
            const assignmentId = seedData.assignmentIds[courseIdx * 3]; // First assignment of each course
            const instructorId = seedData.instructorIds[courseIdx];
            const domain = COURSE_DOMAINS[courseIdx];
            const template = SUBMISSION_TEMPLATES[domain];
            const submissionIndex = userIdx * 3 + courseIdx;

            const submission = new Submission({
                user: userId,
                assignment: assignmentId,
                course: courseId,
                content: {
                    text: template.text,
                    files: [{
                        name: `${domain}-project-${userIdx + 1}.zip`,
                        url: "https://example.com/files/submission.zip",
                        type: "zip",
                        size: 2048576 + Math.random() * 1000000
                    }],
                    links: template.links
                },
                status: "graded",
                submittedAt: new Date(Date.now() - (20 - submissionIndex) * 24 * 60 * 60 * 1000),
                gradedAt: new Date(Date.now() - (18 - submissionIndex) * 24 * 60 * 60 * 1000),
                score: scores[submissionIndex],
                maxScore: 100,
                grade: grades[submissionIndex],
                isPassed: true,
                instructorFeedback: `Great work on your ${domain} project! Your implementation shows good understanding of the concepts. Consider adding more error handling and documentation for improvement.`,
                rubricScores: [
                    { criterion: "Implementation", score: Math.floor(scores[submissionIndex] * 0.25), maxPoints: 25 },
                    { criterion: "Code Quality", score: Math.floor(scores[submissionIndex] * 0.25), maxPoints: 25 },
                    { criterion: "Documentation", score: Math.floor(scores[submissionIndex] * 0.20), maxPoints: 20 },
                    { criterion: "Best Practices", score: Math.floor(scores[submissionIndex] * 0.15), maxPoints: 15 },
                    { criterion: "Testing", score: Math.floor(scores[submissionIndex] * 0.15), maxPoints: 15 }
                ],
                attemptNumber: 1,
                isLate: false,
                latePenalty: 0,
                submittedBy: userId,
                gradedBy: instructorId
            });

            await submission.save();
            submissionIds.push(submission._id.toString());

            logCreated(`Submission ${submissionIds.length}`, submission._id.toString(),
                `User ${userIdx + 1} → ${domain}: ${scores[submissionIndex]}/100 (${grades[submissionIndex]})`);
        }
    }

    // Update assignment stats
    for (const assignmentId of seedData.assignmentIds.slice(0, 3)) {
        await Assignment.findByIdAndUpdate(assignmentId, {
            $set: { totalSubmissions: 3 }
        });
    }

    saveSeedData({ submissionIds });

    console.log(`\n   📊 Total submissions: ${submissionIds.length}`);
    console.log(`      - All graded and passed`);
    separator();

    return submissionIds;
};

// Standalone execution
if (process.argv[1] && process.argv[1].includes("14_submission")) {
    (async () => {
        try {
            await connectDB();
            await seedSubmission();
            process.exit(0);
        } catch (error) {
            console.error("❌ Error:", error.message);
            process.exit(1);
        }
    })();
}
