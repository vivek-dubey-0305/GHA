import dotenv from "dotenv";
import connectDB from "../configs/connection.config.js";
import { Material } from "../models/material.model.js";
import { loadSeedData, saveSeedData, logCreated, separator } from "./seed-helpers.js";

dotenv.config();

/**
 * Seed Script: Create Test Materials (documents, PDFs, links)
 * Usage: node seeds/10_material.seed.js
 */

export const seedMaterials = async () => {
    console.log("\n📄 Step 10: Seeding Materials...");
    separator();

    const seedData = loadSeedData();
    // Support both old (single) and new (array) format
    const courseId = seedData.courseIds ? seedData.courseIds[0] : seedData.courseId;
    const instructorId = seedData.instructorIds ? seedData.instructorIds[0] : seedData.instructorId;
    const moduleId1 = seedData.moduleIds ? seedData.moduleIds[0] : seedData.moduleId1;
    const moduleId2 = seedData.moduleIds ? seedData.moduleIds[1] : seedData.moduleId2;
    const moduleId3 = seedData.moduleIds ? seedData.moduleIds[2] : seedData.moduleId3;

    if (!courseId || !instructorId || !moduleId1) {
        throw new Error("Course/Instructor/Module IDs not found. Run previous seeds first.");
    }

    // Check if materials already exist
    const existingCount = await Material.countDocuments({ course: courseId });
    if (existingCount > 0) {
        const existing = await Material.find({ course: courseId });
        const ids = existing.map(m => m._id.toString());
        console.log(`   ⚠️  ${existingCount} materials already exist for this course.`);
        saveSeedData({ materialIds: ids });
        return ids;
    }

    const materialsData = [
        {
            title: "Course Syllabus & Roadmap",
            description: "Complete course outline with weekly breakdown, topics covered, and learning milestones.",
            type: "pdf",
            fileUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
            fileName: "Course_Syllabus_2026.pdf",
            fileSize: 2048576, // ~2 MB
            mimeType: "application/pdf",
            module: moduleId1,
            accessLevel: "enrolled_students",
            order: 1,
            tags: ["syllabus", "roadmap", "overview"],
            status: "published",
            metadata: { pages: 12, language: "English", difficulty: "beginner" }
        },
        {
            title: "JavaScript Cheat Sheet",
            description: "Quick reference card for ES6+ JavaScript syntax, array methods, async/await, and common patterns.",
            type: "pdf",
            fileUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
            fileName: "JS_Cheat_Sheet.pdf",
            fileSize: 1048576, // ~1 MB
            mimeType: "application/pdf",
            module: moduleId2,
            accessLevel: "enrolled_students",
            order: 2,
            tags: ["javascript", "cheatsheet", "reference"],
            status: "published",
            metadata: { pages: 4, language: "English", difficulty: "intermediate" }
        },
        {
            title: "React Official Documentation",
            description: "Link to the official React documentation for additional reading and reference.",
            type: "link",
            externalLink: "https://react.dev",
            module: moduleId3,
            accessLevel: "public",
            order: 3,
            tags: ["react", "documentation", "reference"],
            status: "published",
            metadata: { language: "English", difficulty: "intermediate" }
        },
        {
            title: "Node.js Best Practices Slides",
            description: "Presentation covering Node.js production best practices, security, performance, and deployment strategies.",
            type: "presentation",
            fileUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
            fileName: "NodeJS_Best_Practices.pptx",
            fileSize: 5242880, // ~5 MB
            mimeType: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
            module: moduleId2,
            accessLevel: "enrolled_students",
            order: 4,
            tags: ["nodejs", "best-practices", "slides"],
            status: "published",
            metadata: { pages: 28, language: "English", difficulty: "advanced" }
        },
        {
            title: "Starter Code Template",
            description: "Boilerplate code for the assignment project. Includes project structure, configuration files, and basic setup.",
            type: "code",
            fileUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
            content: "// Starter template for Express.js REST API assignment\nimport express from 'express';\nconst app = express();\n// Your code here...",
            fileName: "starter-template.zip",
            fileSize: 524288, // ~500 KB
            mimeType: "application/zip",
            accessLevel: "enrolled_students",
            order: 5,
            tags: ["template", "starter", "assignment"],
            status: "published",
            metadata: { language: "English", difficulty: "intermediate" }
        }
    ];

    const materialIds = [];
    for (const matData of materialsData) {
        const material = new Material({
            ...matData,
            instructor: instructorId,
            course: courseId,
            createdBy: instructorId,
            updatedBy: instructorId
        });
        await material.save();
        materialIds.push(material._id.toString());
        logCreated(`Material (${matData.type})`, material._id.toString(), matData.title);
    }

    saveSeedData({ materialIds });

    console.log(`\n   📊 Total materials created: ${materialIds.length}`);
    separator();

    return materialIds;
};

// Standalone execution
if (process.argv[1] && process.argv[1].includes("10_material")) {
    (async () => {
        try {
            await connectDB();
            await seedMaterials();
            process.exit(0);
        } catch (error) {
            console.error("❌ Error:", error.message);
            process.exit(1);
        }
    })();
}
