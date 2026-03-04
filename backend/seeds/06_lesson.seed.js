import dotenv from "dotenv";
import connectDB from "../configs/connection.config.js";
import { Lesson } from "../models/lesson.model.js";
import { Module } from "../models/module.model.js";
import { Course } from "../models/course.model.js";
import { loadSeedData, saveSeedData, logCreated, separator, STOCK_IMAGES, DEMO_VIDEOS, generateLessonsForModule, ARTICLE_CONTENTS } from "./seed-helpers.js";

dotenv.config();

/**
 * Seed Script: Create Lessons (5 lessons per module × 9 modules = 45 total)
 * Usage: node seeds/06_lesson.seed.js
 * 
 * Each module has 5 lessons:
 * - 3 video lessons
 * - 1 article lesson
 * - 1 assignment lesson
 */

export const seedLessons = async () => {
    console.log("\n🎬 Step 6: Seeding Lessons (45 lessons - 5 per module)...");
    separator();

    const seedData = loadSeedData();
    if (!seedData.courseIds || !seedData.moduleIds || seedData.moduleIds.length < 9) {
        throw new Error("Course/Module IDs not found. Run previous seeds first.");
    }

    // Check if lessons already exist
    const existingCount = await Lesson.countDocuments({ 
        course: { $in: seedData.courseIds } 
    });
    
    if (existingCount > 0) {
        console.log(`   ⚠️  ${existingCount} lessons already exist. Retrieving IDs...`);
        const existing = await Lesson.find({ 
            course: { $in: seedData.courseIds } 
        }).sort({ course: 1, module: 1, order: 1 });
        
        const lessonIds = existing.map(l => l._id.toString());
        const videoLessonIds = existing.filter(l => l.type === "video").map(l => l._id.toString());
        const articleLessonIds = existing.filter(l => l.type === "article").map(l => l._id.toString());
        const assignmentLessonIds = existing.filter(l => l.type === "assignment").map(l => l._id.toString());

        saveSeedData({
            lessonIds,
            videoLessonIds,
            articleLessonIds,
            assignmentLessonIds
        });
        return lessonIds;
    }

    const allLessonIds = [];
    const videoLessonIds = [];
    const articleLessonIds = [];
    const assignmentLessonIds = [];
    let thumbnailIndex = 0;

    // Process each course
    for (let courseIndex = 0; courseIndex < seedData.courseIds.length; courseIndex++) {
        const courseId = seedData.courseIds[courseIndex];
        const instructorId = seedData.instructorIds[courseIndex];
        
        // Get modules for this course
        const courseModuleIds = courseIndex === 0 ? seedData.course1ModuleIds :
                                courseIndex === 1 ? seedData.course2ModuleIds :
                                seedData.course3ModuleIds;

        console.log(`\n   📚 Course ${courseIndex + 1} Lessons:`);
        const courseLessonIds = [];

        // Process each module
        for (let moduleIndex = 0; moduleIndex < courseModuleIds.length; moduleIndex++) {
            const moduleId = courseModuleIds[moduleIndex];
            const lessonTemplates = generateLessonsForModule(moduleIndex, courseIndex);

            console.log(`      📦 Module ${moduleIndex + 1}:`);
            const moduleLessonIds = [];

            // Create lessons for this module
            for (let lessonIndex = 0; lessonIndex < lessonTemplates.length; lessonIndex++) {
                const template = lessonTemplates[lessonIndex];
                
                const lessonData = {
                    title: template.title,
                    description: generateLessonDescription(template.title, template.type),
                    course: courseId,
                    module: moduleId,
                    order: lessonIndex + 1,
                    thumbnail: STOCK_IMAGES.lessonThumbnails[thumbnailIndex % 45],
                    type: template.type,
                    content: generateLessonContent(template),
                    isFree: template.isFree || false,
                    isPublished: true,
                    publishedAt: new Date(),
                    createdBy: instructorId,
                    updatedBy: instructorId
                };

                const lesson = new Lesson(lessonData);
                await lesson.save();
                const id = lesson._id.toString();

                allLessonIds.push(id);
                moduleLessonIds.push(id);
                courseLessonIds.push(id);

                if (template.type === "video") videoLessonIds.push(id);
                else if (template.type === "article") articleLessonIds.push(id);
                else if (template.type === "assignment") assignmentLessonIds.push(id);

                console.log(`         ✅ L${lessonIndex + 1} (${template.type}): ${template.title}`);
                thumbnailIndex++;
            }

            // Update module with lesson references
            await Module.findByIdAndUpdate(moduleId, {
                lessons: moduleLessonIds,
                totalLessons: moduleLessonIds.length,
                totalDuration: moduleLessonIds.length * 20
            });
        }

        // Update course with total lessons and preview lessons
        const freeLessons = await Lesson.find({ 
            course: courseId, 
            isFree: true 
        }).select("_id");
        
        await Course.findByIdAndUpdate(courseId, {
            totalLessons: courseLessonIds.length,
            previewLessons: freeLessons.map(l => l._id)
        });
    }

    saveSeedData({
        lessonIds: allLessonIds,
        videoLessonIds,
        articleLessonIds,
        assignmentLessonIds
    });

    console.log(`\n   📊 Total lessons created: ${allLessonIds.length}`);
    console.log(`      - Video: ${videoLessonIds.length}`);
    console.log(`      - Article: ${articleLessonIds.length}`);
    console.log(`      - Assignment: ${assignmentLessonIds.length}`);
    separator();

    return allLessonIds;
};

function generateLessonDescription(title, type) {
    const descriptions = {
        video: `Watch this comprehensive video lesson on "${title}". Includes practical examples and code demonstrations.`,
        article: `Read this detailed article on "${title}". Complete with code snippets and step-by-step explanations.`,
        assignment: `Hands-on assignment: "${title}". Apply what you've learned with real-world exercises.`
    };
    return descriptions[type] || `Learn about ${title} in this lesson.`;
}

function generateLessonContent(template) {
    if (template.type === "video") {
        return {
            videoUrl: DEMO_VIDEOS.sample1,
            videoDuration: template.duration || 1800
        };
    }
    
    if (template.type === "article") {
        return {
            articleContent: ARTICLE_CONTENTS[template.title] || generateDefaultArticle(template.title)
        };
    }
    
    if (template.type === "assignment") {
        return {};
    }
    
    return {};
}

function generateDefaultArticle(title) {
    return `# ${title}

## Introduction
Welcome to this lesson on **${title}**.

## Key Concepts

### Understanding the Basics
Let's understand the fundamentals of this topic.

\`\`\`javascript
// Example code
const learn = "by doing";
console.log(learn);
\`\`\`

### Practical Applications
1. Set up your environment
2. Create the basic structure  
3. Implement core functionality
4. Test and debug
5. Deploy

## Best Practices
- Write clean, readable code
- Document your code properly
- Test thoroughly before deployment

## Summary
Practice these concepts by completing the exercises and assignments.`;
}

// Standalone execution
if (process.argv[1] && process.argv[1].includes("06_lesson")) {
    (async () => {
        try {
            await connectDB();
            await seedLessons();
            process.exit(0);
        } catch (error) {
            console.error("❌ Error:", error.message);
            process.exit(1);
        }
    })();
}
