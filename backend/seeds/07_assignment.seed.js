import dotenv from "dotenv";
import connectDB from "../configs/connection.config.js";
import { Assignment } from "../models/assignment.model.js";
import { Lesson } from "../models/lesson.model.js";
import { loadSeedData, saveSeedData, logCreated, separator, STOCK_IMAGES } from "./seed-helpers.js";

dotenv.config();

/**
 * Seed Script: Create Assignments (9 total - 1 per module)
 * Usage: node seeds/07_assignment.seed.js
 */

const ASSIGNMENT_DATA = [
    // Course 1: Full-Stack Web Development
    {
        title: "JavaScript Fundamentals Challenge",
        description: "Test your understanding of modern JavaScript concepts. Implement ES6+ features including arrow functions, destructuring, async/await, and modules.",
        instructions: "## Challenge\n1. Create a module that exports utility functions\n2. Use async/await for API calls\n3. Implement proper error handling\n4. Write unit tests for your functions"
    },
    {
        title: "Build a React Todo Application",
        description: "Create a fully functional todo app using React hooks and context API. Implement CRUD operations with local storage persistence.",
        instructions: "## Requirements\n1. Use functional components with hooks\n2. Implement useContext for state management\n3. Add local storage persistence\n4. Style with CSS modules or styled-components"
    },
    {
        title: "REST API Development with Express",
        description: "Build a complete REST API for a blog application. Implement authentication, CRUD operations, and proper error handling.",
        instructions: "## API Endpoints\n1. POST /api/auth/register\n2. POST /api/auth/login\n3. CRUD operations for posts\n4. Add JWT authentication middleware"
    },
    // Course 2: Data Science
    {
        title: "Data Manipulation with Pandas",
        description: "Analyze a real-world dataset using Python and Pandas. Perform data cleaning, transformation, and visualization.",
        instructions: "## Tasks\n1. Load and explore the dataset\n2. Handle missing values\n3. Create meaningful aggregations\n4. Visualize insights with matplotlib"
    },
    {
        title: "Predict House Prices - ML",
        description: "Build a machine learning model to predict house prices using regression techniques. Compare different algorithms and optimize hyperparameters.",
        instructions: "## Requirements\n1. EDA and feature engineering\n2. Train multiple regression models\n3. Cross-validation and metrics\n4. Deploy model with Flask API"
    },
    {
        title: "Image Classification with CNN",
        description: "Build and train a Convolutional Neural Network to classify images. Use TensorFlow/Keras for implementation.",
        instructions: "## Steps\n1. Load and preprocess image data\n2. Build CNN architecture\n3. Train with data augmentation\n4. Evaluate on test set"
    },
    // Course 3: DevOps
    {
        title: "Containerize a Node.js Application",
        description: "Create optimized Docker images for a multi-tier application. Use Docker Compose for local development.",
        instructions: "## Tasks\n1. Write Dockerfile with multi-stage builds\n2. Create docker-compose.yml\n3. Implement health checks\n4. Document deployment process"
    },
    {
        title: "Deploy to Kubernetes Cluster",
        description: "Deploy a microservices application to Kubernetes. Configure deployments, services, and ingress.",
        instructions: "## Requirements\n1. Create K8s manifests\n2. Configure ConfigMaps and Secrets\n3. Set up Ingress controller\n4. Implement horizontal pod autoscaler"
    },
    {
        title: "Build CI/CD Pipeline",
        description: "Create a complete CI/CD pipeline using GitHub Actions. Automate testing, building, and deployment.",
        instructions: "## Pipeline Steps\n1. Lint and test on PR\n2. Build Docker image\n3. Push to registry\n4. Deploy to staging/production"
    }
];

export const seedAssignment = async () => {
    console.log("\n📝 Step 7: Seeding Assignments (9 assignments)...");
    separator();

    const seedData = loadSeedData();
    if (!seedData.courseIds || !seedData.assignmentLessonIds || seedData.assignmentLessonIds.length < 9) {
        throw new Error("Course/Assignment Lesson IDs not found. Run previous seeds first.");
    }

    // Check if assignments already exist
    const existingCount = await Assignment.countDocuments({ 
        course: { $in: seedData.courseIds } 
    });
    
    if (existingCount > 0) {
        console.log(`   ⚠️  ${existingCount} assignments already exist. Retrieving IDs...`);
        const existing = await Assignment.find({ 
            course: { $in: seedData.courseIds } 
        }).sort({ createdAt: 1 });
        
        const assignmentIds = existing.map(a => a._id.toString());
        saveSeedData({ assignmentIds });
        return assignmentIds;
    }

    const assignmentIds = [];

    for (let i = 0; i < ASSIGNMENT_DATA.length; i++) {
        const data = ASSIGNMENT_DATA[i];
        const courseIndex = Math.floor(i / 3);
        const courseId = seedData.courseIds[courseIndex];
        const instructorId = seedData.instructorIds[courseIndex];
        const lessonId = seedData.assignmentLessonIds[i];

        const assignment = new Assignment({
            title: data.title,
            description: data.description,
            thumbnail: STOCK_IMAGES.assignmentThumbnails[i],
            course: courseId,
            lesson: lessonId,
            instructor: instructorId,
            type: "mixed",
            maxScore: 100,
            passingScore: 60,
            dueDate: new Date(Date.now() + (30 + i * 7) * 24 * 60 * 60 * 1000),
            allowLateSubmission: true,
            lateSubmissionPenalty: 10,
            instructions: data.instructions,
            requiredFiles: [
                { name: "Source Code (ZIP)", type: "zip", maxSize: 50, required: true },
                { name: "Documentation", type: "pdf", maxSize: 10, required: false }
            ],
            wordLimit: { min: 100, max: 1000 },
            isPublished: true,
            publishedAt: new Date(),
            rubrics: [
                { criterion: "Functionality", description: "Core requirements implemented correctly", maxPoints: 30 },
                { criterion: "Code Quality", description: "Clean, readable, well-structured code", maxPoints: 25 },
                { criterion: "Best Practices", description: "Following industry standards", maxPoints: 20 },
                { criterion: "Documentation", description: "Clear README and comments", maxPoints: 15 },
                { criterion: "Testing", description: "Test coverage and quality", maxPoints: 10 }
            ],
            createdBy: instructorId,
            updatedBy: instructorId
        });

        await assignment.save();
        const id = assignment._id.toString();
        assignmentIds.push(id);

        // Link assignment to lesson
        await Lesson.findByIdAndUpdate(lessonId, {
            "content.assignmentId": assignment._id
        });

        logCreated(`Assignment ${i + 1}`, id, data.title);
    }

    saveSeedData({ assignmentIds });

    console.log(`\n   📊 Total assignments created: ${assignmentIds.length}`);
    separator();

    return assignmentIds;
};

// Standalone execution
if (process.argv[1] && process.argv[1].includes("07_assignment")) {
    (async () => {
        try {
            await connectDB();
            await seedAssignment();
            process.exit(0);
        } catch (error) {
            console.error("❌ Error:", error.message);
            process.exit(1);
        }
    })();
}
