import dotenv from "dotenv";
import connectDB from "../configs/connection.config.js";
import { Module } from "../models/module.model.js";
import { Course } from "../models/course.model.js";
import { loadSeedData, saveSeedData, logCreated, separator, STOCK_IMAGES, COURSE_MODULES } from "./seed-helpers.js";

dotenv.config();

/**
 * Seed Script: Create Modules (3 modules per course = 9 total)
 * Usage: node seeds/05_module.seed.js
 */

export const seedModules = async () => {
    console.log("\n📦 Step 5: Seeding Modules (9 modules - 3 per course)...");
    separator();

    const seedData = loadSeedData();
    if (!seedData.courseIds || seedData.courseIds.length < 3) {
        throw new Error("3 Course IDs not found. Run previous seeds first.");
    }

    // Check if modules already exist
    const existingModules = await Module.find({ 
        course: { $in: seedData.courseIds } 
    }).sort({ course: 1, order: 1 });

    if (existingModules.length > 0) {
        console.log(`   ⚠️  ${existingModules.length} modules already exist. Skipping...`);
        const moduleIds = existingModules.map(m => m._id.toString());
        
        // Group by course for seed data
        const course1Modules = existingModules.filter(m => m.course.toString() === seedData.courseIds[0]).map(m => m._id.toString());
        const course2Modules = existingModules.filter(m => m.course.toString() === seedData.courseIds[1]).map(m => m._id.toString());
        const course3Modules = existingModules.filter(m => m.course.toString() === seedData.courseIds[2]).map(m => m._id.toString());

        saveSeedData({
            moduleIds,
            course1ModuleIds: course1Modules,
            course2ModuleIds: course2Modules,
            course3ModuleIds: course3Modules
        });
        return moduleIds;
    }

    const courseModuleData = {
        [seedData.courseIds[0]]: COURSE_MODULES.course1,
        [seedData.courseIds[1]]: COURSE_MODULES.course2,
        [seedData.courseIds[2]]: COURSE_MODULES.course3
    };

    const allModuleIds = [];
    const course1ModuleIds = [];
    const course2ModuleIds = [];
    const course3ModuleIds = [];
    let thumbnailIndex = 0;

    for (let courseIndex = 0; courseIndex < seedData.courseIds.length; courseIndex++) {
        const courseId = seedData.courseIds[courseIndex];
        const instructorId = seedData.instructorIds[courseIndex];
        const modules = courseModuleData[courseId];

        console.log(`\n   📚 Course ${courseIndex + 1} Modules:`);

        const courseModuleIds = [];

        for (let i = 0; i < modules.length; i++) {
            const modData = modules[i];
            const module = new Module({
                title: modData.title,
                description: modData.description,
                course: courseId,
                order: i + 1,
                thumbnail: STOCK_IMAGES.moduleThumbnails[thumbnailIndex],
                isPublished: true,
                publishedAt: new Date(),
                objectives: modData.objectives,
                createdBy: instructorId,
                updatedBy: instructorId
            });

            await module.save();
            const id = module._id.toString();
            allModuleIds.push(id);
            courseModuleIds.push(id);

            logCreated(`   Module ${i + 1}`, id, modData.title);
            thumbnailIndex++;
        }

        // Store course-specific module IDs
        if (courseIndex === 0) course1ModuleIds.push(...courseModuleIds);
        else if (courseIndex === 1) course2ModuleIds.push(...courseModuleIds);
        else course3ModuleIds.push(...courseModuleIds);

        // Update course with module references
        await Course.findByIdAndUpdate(courseId, {
            modules: courseModuleIds,
            totalModules: courseModuleIds.length
        });
    }

    saveSeedData({
        moduleIds: allModuleIds,
        course1ModuleIds,
        course2ModuleIds,
        course3ModuleIds
    });

    console.log(`\n   📊 Total modules created: ${allModuleIds.length} (3 per course × 3 courses)`);
    separator();

    return allModuleIds;
};

// Standalone execution
if (process.argv[1] && process.argv[1].includes("05_module")) {
    (async () => {
        try {
            await connectDB();
            await seedModules();
            process.exit(0);
        } catch (error) {
            console.error("❌ Error:", error.message);
            process.exit(1);
        }
    })();
}
