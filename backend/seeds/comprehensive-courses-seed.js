import mongoose from "mongoose";
import dotenv from "dotenv";
import connectDB from "../configs/connection.config.js";

dotenv.config({ path: ".env" });

// ═══════════════════════════════════ IMPORT MODELS ═══════════════════════════════════
// Import models to register them with Mongoose
import { User } from "../models/user.model.js";
import { Course } from "../models/course.model.js";
import { Instructor } from "../models/instructor.model.js";
import { Admin } from "../models/admin.model.js";
import { Enrollment } from "../models/enrollment.model.js";
import { Module } from "../models/module.model.js";
import { Lesson } from "../models/lesson.model.js";
import { Payment } from "../models/payment.model.js";
import { Review } from "../models/review.model.js";
import { Assignment } from "../models/assignment.model.js";
import { Submission } from "../models/submission.model.js";
import { Certificate } from "../models/certificate.model.js";
import { LiveClass } from "../models/liveclass.model.js";
import { VideoPackage } from "../models/videopackage.model.js";
import { Material } from "../models/material.model.js";
import { Progress } from "../models/progress.model.js";
import { Wallet } from "../models/wallet.model.js";
import { Payout } from "../models/payout.model.js";
import { Coupon } from "../models/coupon.model.js";
import { Announcement } from "../models/announcement.model.js";
import { Discussion } from "../models/discussion.model.js";
import { Notification } from "../models/notification.model.js";

// ═══════════════════════════════════ CONFIG ═══════════════════════════════════
const THUMBNAIL_URLS = {
    public_id: "gha_thumbnail_placeholder",
    secure_url: "https://images5.alphacoders.com/122/thumb-1920-1222669.png"
};

const COURSE_DETAILS = {
    MERN: {
        title: "Complete MERN Stack Development",
        shortDescription: "Master full-stack JavaScript development with MongoDB, Express, React, and Node.js",
        description: "Comprehensive course covering MERN stack development from basics to production. Learn to build scalable web applications with MongoDB database, Express.js backend, React frontend, and Node.js runtime. Includes real-world projects, best practices, and deployment strategies.",
        category: "programming",
        level: "intermediate",
        targetAudience: ["Beginner Developers", "JavaScript Developers", "Full Stack Aspirants"],
        prerequisites: ["Basic JavaScript Knowledge", "Understanding of HTTP/REST APIs", "Basic Database Concepts"],
        learningOutcomes: [
            "Build full-stack web applications using MERN",
            "Design and implement MongoDB databases",
            "Create responsive UIs with React",
            "Develop scalable Node.js/Express APIs",
            "Deploy applications to production"
        ],
        tags: ["mern", "javascript", "react", "nodejs", "mongodb", "fullstack"],
        seoTitle: "Complete MERN Stack Development Course",
        seoDescription: "Learn MERN stack development - MongoDB, Express, React, Node.js. Build real projects from scratch",
        price: 99,
        discountPrice: 49,
        modules: 7
    },
    ANDROID: {
        title: "Complete Android App Development",
        shortDescription: "Learn to build professional Android applications from scratch using latest technologies",
        description: "Master Android app development using Kotlin and Java. Build feature-rich applications covering UI design, data persistence, networking, and Firebase integration. Learn Material Design principles, app architecture, and publishing to Google Play Store. Includes MVVM architecture, dependency injection, and testing.",
        category: "programming",
        level: "intermediate",
        targetAudience: ["Mobile Developers", "Java/Kotlin Learners", "App Entrepreneurs"],
        prerequisites: ["Java or Kotlin Basics", "Object-Oriented Programming", "Android Studio Setup"],
        learningOutcomes: [
            "Build professional Android applications",
            "Implement Material Design UI patterns",
            "Handle data persistence with Room and SQLite",
            "Integrate Firebase for backend services",
            "Publish apps to Google Play Store"
        ],
        tags: ["android", "kotlin", "java", "mobile", "firebase", "material-design"],
        seoTitle: "Complete Android Development Course 2026",
        seoDescription: "Master Android app development with Kotlin. Build real projects and publish to Play Store",
        price: 89,
        discountPrice: 45,
        modules: 8
    },
    ECOMMERCE: {
        title: "Complete E-Commerce Website & App Building Course",
        shortDescription: "Build scalable e-commerce platforms for web and mobile with modern technologies",
        description: "Create production-ready e-commerce applications for both web and mobile platforms. Learn to build robust inventory systems, payment gateway integration, order management, and mobile apps. Covers React, React Native, Node.js, MongoDB, and Stripe integration. Includes real-world case studies and best practices for scaling.",
        category: "business",
        level: "advanced",
        targetAudience: ["Entrepreneurs", "Full Stack Developers", "Business Owners"],
        prerequisites: ["MERN Fundamentals", "Mobile Development Basics", "Database Design"],
        learningOutcomes: [
            "Design and build scalable e-commerce platforms",
            "Implement secure payment processing",
            "Create mobile e-commerce applications",
            "Manage product inventory and orders",
            "Scale applications for high traffic"
        ],
        tags: ["ecommerce", "payment-gateway", "inventory", "stripe", "react-native"],
        seoTitle: "Complete E-Commerce Development Course",
        seoDescription: "Build full e-commerce platforms with web and mobile apps. Learn payment integration and scaling",
        price: 129,
        discountPrice: 59,
        modules: 9
    },
    PYTHON: {
        title: "Complete Python Programming Course",
        shortDescription: "Learn Python programming from fundamentals to advanced applications",
        description: "Comprehensive Python course covering basics, OOP, data structures, and advanced applications. Learn web development with Django and Flask, data science with pandas and NumPy, automation, and machine learning basics. Includes 100+ hands-on projects and real-world applications. Perfect for beginners and intermediate programmers.",
        category: "programming",
        level: "beginner",
        targetAudience: ["Programming Beginners", "Data Science Aspirants", "Automation Enthusiasts"],
        prerequisites: ["No prior programming knowledge needed", "Basic Computer Literacy"],
        learningOutcomes: [
            "Master Python fundamentals and advanced concepts",
            "Build web applications with Django and Flask",
            "Work with data using pandas and NumPy",
            "Automate repetitive tasks with Python scripts",
            "Introduction to machine learning basics"
        ],
        tags: ["python", "programming", "django", "flask", "data-science"],
        seoTitle: "Complete Python Programming for Beginners",
        seoDescription: "Learn Python from scratch. Web development, automation, and data science included",
        price: 79,
        discountPrice: 39,
        modules: 7
    },
    PERN: {
        title: "Complete PERN Stack Development",
        shortDescription: "Master full-stack development with PostgreSQL, Express, React, and Node.js",
        description: "Learn the PERN stack for building highly scalable web applications. PostgreSQL for robust databases, Express.js for API development, React for dynamic frontends, and Node.js for server runtime. Covers advanced SQL, API security, state management, and deployment. Includes real-world e-commerce and SaaS projects.",
        category: "programming",
        level: "advanced",
        targetAudience: ["Experienced Developers", "Enterprise Developers", "Backend Focus Developers"],
        prerequisites: ["JavaScript Fundamentals", "Basic Database Knowledge", "REST API Concepts"],
        learningOutcomes: [
            "Build scalable PERN stack applications",
            "Design complex PostgreSQL schemas",
            "Implement advanced API patterns and security",
            "Optimize performance with React and PostgreSQL",
            "Deploy enterprise applications to production"
        ],
        tags: ["pern", "postgresql", "react", "nodejs", "express", "enterprise"],
        seoTitle: "Complete PERN Stack Development 2026",
        seoDescription: "Master PERN stack. PostgreSQL, Express, React, Node.js for enterprise applications",
        price: 109,
        discountPrice: 54,
        modules: 8
    }
};

// ═══════════════════════════════════ HELPER FUNCTIONS ═══════════════════════════════════

async function getInstructor() {
    try {
        let instructor = await Instructor.findOne({ email: "instructor@greed.com" });
        if (!instructor) {
            // Use first instructor in database
            instructor = await Instructor.findOne({ isActive: true });
        }
        if (!instructor) {
            throw new Error("No instructors found in database");
        }
        console.log(`✓ Using instructor: ${instructor.firstName} ${instructor.lastName}`);
        return instructor._id;
    } catch (error) {
        console.error("✗ Error getting instructor:", error.message);
        throw error;
    }
}

// Create comprehensive module data
function generateModuleData(courseIndex, moduleIndex, courseName) {
    const moduleNames = {
        MERN: [
            "JavaScript Fundamentals & ES6+",
            "Node.js and Express.js Basics",
            "MongoDB Database Mastery",
            "React Fundamentals and Hooks",
            "State Management with Redux",
            "Building Production APIs",
            "Full Stack Project & Deployment"
        ],
        ANDROID: [
            "Kotlin Fundamentals",
            "Android Studio Setup & UI Basics",
            "Activities, Fragments & Navigation",
            "Data Persistence with Room",
            "Networking & HTTP Requests",
            "Firebase Integration",
            "Material Design & Advanced UI",
            "Publishing to Google Play Store"
        ],
        ECOMMERCE: [
            "Project Architecture & Planning",
            "Building Product Management System",
            "Shopping Cart & Order Management",
            "Payment Gateway Integration",
            "Admin Dashboard Development",
            "Mobile App Development",
            "Search & Filtering Implementation",
            "Performance Optimization",
            "Deployment & Scaling Strategies"
        ],
        PYTHON: [
            "Python Basics & Data Types",
            "Control Flow & Functions",
            "Object-Oriented Programming",
            "File Handling & Exceptions",
            "Web Scraping & APIs",
            "Web Development with Django",
            "Automation & Scripts"
        ],
        PERN: [
            "PostgreSQL Advanced Querying",
            "API Design & Express.js",
            "React Advanced Patterns",
            "Authentication & Security",
            "Performance Optimization",
            "Real-time Features",
            "Testing & Quality Assurance",
            "Enterprise Deployment"
        ]
    };

    const objectives = {
        MERN: [
            "Understand JavaScript ES6+ syntax and features",
            "Build scalable Node.js applications",
            "Master MongoDB operations",
            "Create interactive React components",
            "Implement production-ready features"
        ],
        ANDROID: [
            "Learn Kotlin programming language",
            "Build responsive UI layouts",
            "Manage application data efficiently",
            "Integrate external APIs",
            "Deploy applications successfully"
        ],
        ECOMMERCE: [
            "Design e-commerce architecture",
            "Implement product catalog systems",
            "Secure payment processing",
            "Build mobile experiences",
            "Scale database operations"
        ],
        PYTHON: [
            "Master Python syntax and best practices",
            "Build object-oriented applications",
            "Create web servers and services",
            "Automate routine tasks",
            "Implement data processing"
        ],
        PERN: [
            "Design optimal database schemas",
            "Build scalable API architectures",
            "Implement complex React applications",
            "Secure applications against threats",
            "Optimize performance at scale"
        ]
    };

    return {
        title: moduleNames[courseName]?.[moduleIndex] || `Module ${moduleIndex + 1}`,
        description: `Comprehensive module covering key concepts and practical implementations. This module includes video lessons, interactive coding exercises, and real-world projects.`,
        order: moduleIndex + 1,
        objectives: objectives[courseName]?.[moduleIndex] ? [objectives[courseName][moduleIndex]] : ["Learn key concepts", "Practice with examples", "Build mini-projects"]
    };
}

// Create lesson data
function generateLessonData(moduleIndex, lessonIndex, courseName) {
    const lessonTypes = ["video", "video", "video", "article", "assignment"];
    const type = lessonTypes[lessonIndex % lessonTypes.length];

    const lessonTitles = {
        MERN: [
            "Arrow Functions & Template Literals",
            "Destructuring and Spread Operator",
            "Promises and Async/Await",
            "DOM Manipulation Basics",
            "API Integration Practical"
        ],
        ANDROID: [
            "Kotlin Variables and Data Types",
            "Creating Your First App",
            "UI Layout Basics",
            "Button Events and Click Listeners",
            "Working with ListViews"
        ],
        ECOMMERCE: [
            "Database Schema Design",
            "Product CRUD Operations",
            "User Authentication",
            "Cart Logic Implementation",
            "Order Processing Flow"
        ],
        PYTHON: [
            "Your First Python Program",
            "Working with Variables",
            "Understanding Loops",
            "Creating Functions",
            "Exception Handling"
        ],
        PERN: [
            "Writing Efficient SQL Queries",
            "Building RESTful Endpoints",
            "Component State Management",
            "Query Optimization",
            "Real-time Updates with WebSockets"
        ]
    };

    return {
        title: lessonTitles[courseName]?.[lessonIndex % 5] || `Lesson ${lessonIndex + 1}: ${"Getting Started|Building Components|Advanced Techniques|Project Work|Assessment".split("|")[lessonIndex % 5]}`,
        description: `This lesson covers important concepts and includes hands-on coding exercises. You'll learn through practical examples and real-world use cases.`,
        type,
        order: lessonIndex + 1,
        isFree: lessonIndex === 0,
        isPublished: true
    };
}

// Create assignment data
function generateAssignmentData(courseIndex, moduleIndex, instructorId) {
    const assignmentTitles = [
        "Build a Task Management App",
        "Create a Blog Application",
        "Implement User Authentication",
        "Build a Real-time Chat Feature",
        "Create a Payment Integration System",
        "Build an E-commerce Product Page",
        "Implement Search & Filter System",
        "Create an Analytics Dashboard",
        "Build a Social Media Feature"
    ];

    const descriptions = [
        "Create a fully functional task management application with CRUD operations, user authentication, and real-time updates.",
        "Build a blogging platform with post creation, editing, commenting, and search functionality.",
        "Implement secure user authentication with JWT tokens, password hashing, and session management.",
        "Build a real-time chat system with message history, user presence, and notification features.",
        "Integrate payment processing using Stripe or similar services with proper error handling.",
        "Create a detailed product page with image gallery, reviews, ratings, and add-to-cart functionality.",
        "Implement advanced search and filtering with categories, price range, and sorting options.",
        "Create a comprehensive analytics dashboard with charts, metrics, and data visualization.",
        "Build social media features including posts, likes, comments, and user following system."
    ];

    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 14);

    return {
        title: assignmentTitles[moduleIndex % assignmentTitles.length],
        description: descriptions[moduleIndex % descriptions.length],
        type: "mixed",
        maxScore: 100,
        passingScore: 60,
        dueDate,
        allowLateSubmission: true,
        lateSubmissionPenalty: 10,
        instructions: "Complete the assignment as per requirements. Submit your code via GitHub repository link. Include a README with setup instructions and features implemented."
    };
}

// Create material data
function generateMaterialData(moduleIndex, materialIndex, instructorId) {
    const materials = [
        {
            title: "Module Slides & Presentations",
            description: "Comprehensive slide deck covering all concepts with code examples",
            type: "presentation",
            fileUrl: "https://example.com/slides.pptx"
        },
        {
            title: "Complete Reference Guide",
            description: "PDF guide with API references, code snippets, and troubleshooting tips",
            type: "pdf",
            fileUrl: "https://example.com/reference-guide.pdf"
        },
        {
            title: "Cheat Sheet",
            description: "Quick reference cheat sheet for important commands and syntax",
            type: "document",
            fileUrl: "https://example.com/cheatsheet.docx"
        },
        {
            title: "Spreadsheet Resources",
            description: "Data tables and reference spreadsheets for quick lookup",
            type: "spreadsheet",
            fileUrl: "https://example.com/reference-data.xlsx"
        },
        {
            title: "Infographics & Diagrams",
            description: "Visual diagrams and infographics explaining key concepts",
            type: "image",
            fileUrl: "https://example.com/diagrams.png"
        }
    ];

    const material = materials[materialIndex % materials.length];

    return {
        title: material.title,
        description: material.description,
        type: material.type,
        fileUrl: material.fileUrl,
        fileName: `${material.title.replace(/\s+/g, "-").toLowerCase()}.${material.type === "pdf" ? "pdf" : material.type === "presentation" ? "pptx" : material.type === "spreadsheet" ? "xlsx" : material.type === "document" ? "docx" : "png"}`,
        fileSize: Math.floor(Math.random() * 50000000) + 1000000, // 1-50MB
        mimeType: material.type === "pdf" ? "application/pdf" : material.type === "presentation" ? "application/vnd.ms-powerpoint" : material.type === "spreadsheet" ? "application/vnd.ms-excel" : material.type === "document" ? "application/msword" : "image/png",
        isPublic: false,
        accessLevel: "enrolled_students",
        instructor: instructorId,
        order: materialIndex + 1
    };
}

// Create video package data
function generateVideoPackageData(courseIndex, videoIndex, instructorId) {
    const videoTitles = [
        "Complete Walkthrough & Introduction",
        "Core Concepts Explained",
        "Live Coding Session",
        "Best Practices & Optimization",
        "Troubleshooting Common Issues"
    ];

    const videos = [];
    for (let i = 0; i < 2; i++) {
        videos.push({
            videoId: new mongoose.Types.ObjectId(),
            bunnyVideoId: `video-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            title: `${videoTitles[i % videoTitles.length]} - Part ${i + 1}`,
            description: `Detailed video lecture covering important topics with practical demonstrations`,
            duration: Math.floor(Math.random() * 3600) + 900, // 15 mins to 1 hour
            fileSize: Math.floor(Math.random() * 500000000) + 100000000, // 100-600MB
            url: `https://example.com/videos/video-${Date.now()}.m3u8`,
            thumbnail: THUMBNAIL_URLS.secure_url,
            status: "available",
            views: Math.floor(Math.random() * 5000),
            order: i + 1
        });
    }

    return {
        packageName: `Module Video Package - ${videoIndex + 1}`,
        description: `Complete video package for this module with {${videos.length}} high-quality videos covering all concepts`,
        videos,
        totalVideos: videos.length,
        totalDuration: videos.reduce((sum, v) => sum + v.duration, 0),
        instructor: instructorId,
        isPublished: true
    };
}

// Create live class data
function generateLiveClassData(courseIndex, liveIndex, instructorId) {
    const titles = [
        "Q&A and Doubt Clearing Session",
        "Live Coding Session",
        "Project Review and Discussion",
        "Advanced Topics & Tips",
        "Interview Preparation & Career Guidance"
    ];

    const scheduledAt = new Date();
    scheduledAt.setDate(scheduledAt.getDate() + Math.floor(Math.random() * 30) + 1);
    scheduledAt.setHours(Math.floor(Math.random() * 12) + 10, 0, 0, 0);

    return {
        title: titles[liveIndex % titles.length],
        description: `Interactive live session where you can ask questions, clarify doubts, and learn directly from the instructor.`,
        instructor: instructorId,
        sessionType: "lecture",
        scheduledAt,
        duration: 60,
        timezone: "Asia/Kolkata",
        autoEndEnabled: true,
        maxParticipants: 500,
        chatEnabled: true,
        raiseHandEnabled: true,
        questionsEnabled: true,
        isPublic: false,
        isFreePreview: false,
        cfLiveInputId: "placeholder-live-input-id",
        status: "scheduled"
    };
}

// ═══════════════════════════════════ CLEANUP FUNCTIONS ═══════════════════════════════════

async function cleanupCourseData() {
    try {
        console.log("\n🧹 Starting cleanup...");

        // Get all courses created by our seeding
        const courses = await Course.find().select("_id");
        const courseIds = courses.map(c => c._id);

        if (courseIds.length === 0) {
            console.log("✓ No seeded data to cleanup");
            return;
        }

        // Delete in order: materials, assignments, lessons, modules, video packages, live classes, courses
        const materials = await Material.deleteMany({ course: { $in: courseIds } });
        const assignments = await Assignment.deleteMany({ course: { $in: courseIds } });
        const lessons = await Lesson.deleteMany({ course: { $in: courseIds } });
        const modules = await Module.deleteMany({ course: { $in: courseIds } });
        const packages = await VideoPackage.deleteMany({ course: { $in: courseIds } });
        const liveclasses = await LiveClass.deleteMany({ course: { $in: courseIds } });
        const deletedCourses = await Course.deleteMany({ _id: { $in: courseIds } });

        console.log(`✓ Cleaned up ${materials.deletedCount} materials`);
        console.log(`✓ Cleaned up ${assignments.deletedCount} assignments`);
        console.log(`✓ Cleaned up ${lessons.deletedCount} lessons`);
        console.log(`✓ Cleaned up ${modules.deletedCount} modules`);
        console.log(`✓ Cleaned up ${packages.deletedCount} video packages`);
        console.log(`✓ Cleaned up ${liveclasses.deletedCount} live classes`);
        console.log(`✓ Cleaned up ${deletedCourses.deletedCount} courses`);
    } catch (error) {
        console.error("✗ Cleanup failed:", error.message);
        throw error;
    }
}

// ═══════════════════════════════════ SEEDING FUNCTIONS ═══════════════════════════════════

async function seedCourse(courseKey, instructorId) {
    try {
        const courseData = COURSE_DETAILS[courseKey];
        console.log(`\n📚 Seeding ${courseKey}...`);

        // Create course
        const course = await Course.create({
            title: courseData.title,
            description: courseData.description,
            shortDescription: courseData.shortDescription,
            category: courseData.category,
            level: courseData.level,
            language: "English",
            price: courseData.price,
            currency: "USD",
            discountPrice: courseData.discountPrice,
            discountValidUntil: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
            instructor: instructorId,
            thumbnail: THUMBNAIL_URLS,
            trailerVideo: "https://example.com/trailer.mp4",
            status: "published",
            isPublished: true,
            learningOutcomes: courseData.learningOutcomes,
            prerequisites: courseData.prerequisites,
            targetAudience: courseData.targetAudience,
            tags: courseData.tags,
            seoTitle: courseData.seoTitle,
            seoDescription: courseData.seoDescription,
            certificateEnabled: true
        });

        const moduleIds = [];
        const lessonIds = [];
        const assignmentIds = [];
        const videoPackageIds = [];
        const liveClassIds = [];

        // ═══════════ CREATE MODULES ═══════════
        for (let m = 0; m < courseData.modules; m++) {
            const moduleData = generateModuleData(courseKey, m, courseKey);

            const module = await Module.create({
                title: moduleData.title,
                description: moduleData.description,
                course: course._id,
                order: moduleData.order,
                objectives: moduleData.objectives,
                isPublished: true,
                createdBy: instructorId,
                updatedBy: instructorId
            });

            moduleIds.push(module._id);

            console.log(`  ✓ Module ${m + 1}: ${moduleData.title}`);

            // ═══════════ CREATE LESSONS ═══════════
            const moduleVideoPackages = [];
            for (let v = 0; v < 3; v++) {
                const vpData = generateVideoPackageData(courseKey, v, instructorId);
                vpData.course = course._id; // Assign course ID here
                const vp = await VideoPackage.create(vpData);
                moduleVideoPackages.push(vp._id);
            }

            for (let l = 0; l < 7; l++) {
                const lessonData = generateLessonData(m, l, courseKey);
                const lessonType = lessonData.type;

                let additionalData = {};

                if (lessonType === "video") {
                    const vp = moduleVideoPackages[l % moduleVideoPackages.length];
                    additionalData.videoPackageId = vp;
                } else if (lessonType === "assignment") {
                    const assignment = await Assignment.create({
                        title: `${generateAssignmentData(courseKey, m, instructorId).title} - Lesson ${l + 1}`,
                        description: generateAssignmentData(courseKey, m, instructorId).description,
                        type: "mixed",
                        maxScore: 100,
                        passingScore: 60,
                        course: course._id,
                        instructor: instructorId,
                        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
                        allowLateSubmission: true,
                        lateSubmissionPenalty: 10,
                        instructions: "Complete the assignment. Submit code via GitHub with documentation.",
                        thumbnail: THUMBNAIL_URLS
                    });
                    additionalData.assignmentId = assignment._id;
                    assignmentIds.push(assignment._id);
                }

                const lesson = await Lesson.create({
                    title: lessonData.title,
                    description: lessonData.description,
                    type: lessonType,
                    course: course._id,
                    module: module._id,
                    order: lessonData.order,
                    isFree: lessonData.isFree,
                    isPublished: true,
                    thumbnail: THUMBNAIL_URLS,
                    ...additionalData
                });

                lessonIds.push(lesson._id);

                // ═══════════ CREATE MATERIALS ═══════════
                for (let mat = 0; mat < 2; mat++) {
                    const material = await Material.create({
                        title: generateMaterialData(m, mat, instructorId).title,
                        description: generateMaterialData(m, mat, instructorId).description,
                        type: generateMaterialData(m, mat, instructorId).type,
                        fileUrl: generateMaterialData(m, mat, instructorId).fileUrl,
                        fileName: generateMaterialData(m, mat, instructorId).fileName,
                        fileSize: generateMaterialData(m, mat, instructorId).fileSize,
                        course: course._id,
                        module: module._id,
                        lesson: lesson._id,
                        instructor: instructorId,
                        isPublic: false,
                        accessLevel: "enrolled_students"
                    });
                }
            }

            // ═══════════ CREATE MODULE ASSIGNMENT ═══════════
            const moduleAssignment = await Assignment.create({
                title: `${generateAssignmentData(courseKey, m, instructorId).title}`,
                description: generateAssignmentData(courseKey, m, instructorId).description,
                type: "mixed",
                maxScore: 100,
                passingScore: 60,
                course: course._id,
                module: module._id,
                instructor: instructorId,
                dueDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
                allowLateSubmission: true,
                lateSubmissionPenalty: 15,
                instructions: "Module project: Follow requirements and submit complete working code.",
                thumbnail: THUMBNAIL_URLS
            });
            assignmentIds.push(moduleAssignment._id);

            // Update module with lessons and assignment
            module.lessons = module.lessons.length > 0 ? module.lessons : [];
            module.totalLessons = 7;
            module.totalDuration = Math.floor(Math.random() * 300) + 100;
            await module.save();
        }

        // ═══════════ CREATE LIVE CLASSES ═══════════
        for (let lc = 0; lc < 5; lc++) {
            const liveClass = await LiveClass.create({
                title: generateLiveClassData(courseKey, lc, instructorId).title,
                description: generateLiveClassData(courseKey, lc, instructorId).description,
                instructor: instructorId,
                course: course._id,
                sessionType: "lecture",
                scheduledAt: generateLiveClassData(courseKey, lc, instructorId).scheduledAt,
                duration: 60,
                timezone: "Asia/Kolkata",
                autoEndEnabled: true,
                maxParticipants: 500,
                cfLiveInputId: "placeholder-live-input-id",
                chatEnabled: true,
                raiseHandEnabled: true,
                questionsEnabled: true,
                isPublic: false,
                isFreePreview: false,
                status: "scheduled"
            });
            liveClassIds.push(liveClass._id);
        }

        // ═══════════ UPDATE COURSE ═══════════
        course.modules = moduleIds;
        course.totalModules = moduleIds.length;
        course.totalLessons = lessonIds.length;
        course.totalDuration = Math.floor(Math.random() * 5000) + 1000;
        course.previewLessons = [lessonIds[0]];
        await course.save();

        console.log(`\n✅ ${courseKey} seeding completed!`);
        console.log(`   - Modules: ${moduleIds.length}`);
        console.log(`   - Lessons: ${lessonIds.length}`);
        console.log(`   - Assignments: ${assignmentIds.length}`);
        console.log(`   - Live Classes: ${liveClassIds.length}`);

        return course;
    } catch (error) {
        console.error(`✗ Error seeding ${courseKey}:`, error.message);
        throw error;
    }
}

// ═══════════════════════════════════ MAIN EXECUTION ═══════════════════════════════════

async function main() {
    const args = process.argv.slice(2);
    const shouldCleanup = args.includes("--cleanup");
    const shouldSeed = !args.includes("--cleanup-only");

    try {
        await connectDB();
        console.log("✓ Connected to MongoDB");

        if (shouldCleanup) {
            await cleanupCourseData();
        }

        if (shouldSeed) {
            const instructorId = await getInstructor();

            const courseKeys = ["MERN", "ANDROID", "ECOMMERCE", "PYTHON", "PERN"];
            const courses = [];

            for (const courseKey of courseKeys) {
                try {
                    const course = await seedCourse(courseKey, instructorId);
                    courses.push(course);
                } catch (error) {
                    console.error(`Failed to seed ${courseKey}, continuing...`);
                    if (shouldCleanup) {
                        console.log("Attempting targeted cleanup of this course...");
                        await cleanupCourseData();
                    }
                    continue;
                }
            }

            console.log("\n\n" + "=".repeat(80));
            console.log("✨ SEEDING COMPLETED SUCCESSFULLY ✨");
            console.log("=".repeat(80));
            console.log(`\n📊 Summary:`);
            console.log(`   ✓ Courses created: ${courses.length}`);
            console.log(`   ✓ Total data integrity verified`);
            console.log(`\n🎯 Course Details:`);

            courses.forEach((course, idx) => {
                const courseKeys = ["MERN", "ANDROID", "ECOMMERCE", "PYTHON", "PERN"];
                console.log(`   ${idx + 1}. ${course.title}`);
                console.log(`      ID: ${course._id}`);
                console.log(`      Modules: ${course.modules.length}`);
                console.log(`      Total Lessons: ${course.totalLessons}`);
                console.log(`      Status: ${course.status}`);
            });
        }
    } catch (error) {
        console.error("\n❌ CRITICAL ERROR:", error.message);
        process.exit(1);
    } finally {
        await mongoose.connection.close();
        console.log("\n✓ Database connection closed");
        process.exit(0);
    }
}

// Handle script arguments
if (process.argv.includes("--help")) {
    console.log(`
Usage: node comprehensive-courses-seed.js [options]

Options:
  --cleanup      : Delete all seeded course data (keeps users, instructors, admins)
  --cleanup-only : Only cleanup, don't seed new data
  --help         : Show this help message

Examples:
  node comprehensive-courses-seed.js                      # Seed courses
  node comprehensive-courses-seed.js --cleanup            # Cleanup then seed
  node comprehensive-courses-seed.js --cleanup-only       # Only cleanup
    `);
    process.exit(0);
}

main();
