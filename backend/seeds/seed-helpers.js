import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";
import crypto from "crypto";

// Make require available globally for models that use require() in pre-save hooks (e.g., certificate model)
if (typeof globalThis.require === "undefined") {
    globalThis.require = createRequire(import.meta.url);
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SEED_DATA_PATH = path.join(__dirname, "seed-data.json");

/**
 * Load saved seed IDs from seed-data.json
 */
export const loadSeedData = () => {
    try {
        if (fs.existsSync(SEED_DATA_PATH)) {
            const raw = fs.readFileSync(SEED_DATA_PATH, "utf-8");
            return JSON.parse(raw);
        }
    } catch (err) {
        console.log("⚠️  No existing seed data found, starting fresh.");
    }
    return {};
};

/**
 * Save seed IDs to seed-data.json (merges with existing data)
 */
export const saveSeedData = (newData) => {
    const existing = loadSeedData();
    const merged = { ...existing, ...newData };
    fs.writeFileSync(SEED_DATA_PATH, JSON.stringify(merged, null, 2), "utf-8");
    return merged;
};

/**
 * Clear seed data file
 */
export const clearSeedData = () => {
    if (fs.existsSync(SEED_DATA_PATH)) {
        fs.unlinkSync(SEED_DATA_PATH);
    }
};

/**
 * Log created entity with its ID
 */
export const logCreated = (label, id, extra = "") => {
    console.log(`   ✅ ${label}: ${id}${extra ? ` (${extra})` : ""}`);
};

/**
 * Generate unique Razorpay-style IDs
 */
export const generatePaymentId = () => `pay_${crypto.randomBytes(12).toString("hex")}`;
export const generateOrderId = () => `order_${crypto.randomBytes(12).toString("hex")}`;
export const generateTransactionId = () => `TXN-${Date.now().toString(36)}-${crypto.randomBytes(4).toString("hex")}`.toUpperCase();

/**
 * Stock image URLs for testing - Extended for 3 instructors, 3 courses
 */
export const STOCK_IMAGES = {
    // User profiles (3 users)
    userProfiles: [
        { public_id: "seed/user-1", secure_url: "https://picsum.photos/seed/user1-2024/200/200" },
        { public_id: "seed/user-2", secure_url: "https://picsum.photos/seed/user2-2024/200/200" },
        { public_id: "seed/user-3", secure_url: "https://picsum.photos/seed/user3-2024/200/200" }
    ],
    // Instructor profiles (3 instructors)
    instructorProfiles: [
        { public_id: "seed/instructor-1", secure_url: "https://picsum.photos/seed/instructor1-2024/200/200" },
        { public_id: "seed/instructor-2", secure_url: "https://picsum.photos/seed/instructor2-2024/200/200" },
        { public_id: "seed/instructor-3", secure_url: "https://picsum.photos/seed/instructor3-2024/200/200" }
    ],
    // Course thumbnails (3 courses)
    courseThumbnails: [
        { public_id: "seed/course-fullstack", secure_url: "https://picsum.photos/seed/webdev-course/800/450" },
        { public_id: "seed/course-datascience", secure_url: "https://picsum.photos/seed/datascience-course/800/450" },
        { public_id: "seed/course-devops", secure_url: "https://picsum.photos/seed/devops-course/800/450" }
    ],
    // Module thumbnails (3 modules per course = 9 total)
    moduleThumbnails: [
        // Course 1 modules
        { public_id: "seed/c1-module-1", secure_url: "https://picsum.photos/seed/c1-mod1/400/225" },
        { public_id: "seed/c1-module-2", secure_url: "https://picsum.photos/seed/c1-mod2/400/225" },
        { public_id: "seed/c1-module-3", secure_url: "https://picsum.photos/seed/c1-mod3/400/225" },
        // Course 2 modules
        { public_id: "seed/c2-module-1", secure_url: "https://picsum.photos/seed/c2-mod1/400/225" },
        { public_id: "seed/c2-module-2", secure_url: "https://picsum.photos/seed/c2-mod2/400/225" },
        { public_id: "seed/c2-module-3", secure_url: "https://picsum.photos/seed/c2-mod3/400/225" },
        // Course 3 modules
        { public_id: "seed/c3-module-1", secure_url: "https://picsum.photos/seed/c3-mod1/400/225" },
        { public_id: "seed/c3-module-2", secure_url: "https://picsum.photos/seed/c3-mod2/400/225" },
        { public_id: "seed/c3-module-3", secure_url: "https://picsum.photos/seed/c3-mod3/400/225" }
    ],
    // Lesson thumbnails (15 per course = 45 total lessons)
    lessonThumbnails: Array.from({ length: 45 }, (_, i) => ({
        public_id: `seed/lesson-${i + 1}`,
        secure_url: `https://picsum.photos/seed/lesson-${i + 1}/400/225`
    })),
    // Assignment thumbnails
    assignmentThumbnails: Array.from({ length: 9 }, (_, i) => ({
        public_id: `seed/assignment-${i + 1}`,
        secure_url: `https://picsum.photos/seed/assignment-${i + 1}/400/225`
    })),
    // Material default
    materialDefault: {
        public_id: "seed/material-default",
        secure_url: "https://picsum.photos/seed/material/400/225"
    }
};

/**
 * Demo video URLs for testing
 */
export const DEMO_VIDEOS = {
    sample1: "https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4",
    sample2: "https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_2mb.mp4",
    sample3: "https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_5mb.mp4"
};

/**
 * Demo Razorpay test credentials factory
 */
export const generateRazorpayCredentials = () => ({
    keyId: "rzp_test_1DP5mmOlF5G5ag",
    orderId: generateOrderId(),
    paymentId: generatePaymentId(),
    signature: `sig_${crypto.randomBytes(16).toString("hex")}`
});

/**
 * Separator for console output
 */
export const separator = () => console.log("━".repeat(55));

/**
 * Test User Data (3 users)
 */
export const TEST_USERS = [
    {
        firstName: "Rahul",
        lastName: "Sharma",
        email: "rahul.sharma@testmail.com",
        phone: "+919876543001",
        password: "Test@1234",
        dateOfBirth: new Date("1995-03-15"),
        gender: "Male",
        address: {
            street: "123 MG Road",
            city: "Mumbai",
            state: "Maharashtra",
            postalCode: "400001",
            country: "India"
        }
    },
    {
        firstName: "Priya",
        lastName: "Patel",
        email: "priya.patel@testmail.com",
        phone: "+919876543002",
        password: "Test@1234",
        dateOfBirth: new Date("1998-07-22"),
        gender: "Female",
        address: {
            street: "456 Park Street",
            city: "Kolkata",
            state: "West Bengal",
            postalCode: "700016",
            country: "India"
        }
    },
    {
        firstName: "Amit",
        lastName: "Kumar",
        email: "amit.kumar@testmail.com",
        phone: "+919876543003",
        password: "Test@1234",
        dateOfBirth: new Date("1992-11-08"),
        gender: "Male",
        address: {
            street: "789 Brigade Road",
            city: "Bangalore",
            state: "Karnataka",
            postalCode: "560001",
            country: "India"
        }
    }
];

/**
 * Test Instructor Data (3 instructors)
 */
export const TEST_INSTRUCTORS = [
    {
        firstName: "Khushbu",
        lastName: "Bhargav",
        email: "khushbu.bhargav@academy.com",
        phone: "+919876543101",
        password: "Instructor@1234",
        dateOfBirth: new Date("1990-05-20"),
        gender: "Female",
        bio: "Senior Full-Stack Developer with 10+ years of experience. Specialized in MERN stack development. Taught 50,000+ students worldwide.",
        address: {
            street: "Tech Park Tower A",
            city: "Ahmedabad",
            state: "Gujarat",
            postalCode: "380015",
            country: "India"
        },
        specialization: ["web_development", "mobile_app_development"],
        qualifications: [
            { degree: "M.Tech Computer Science", institution: "IIT Delhi", yearOfCompletion: 2012, certificationId: "IITD-2012-CS-089" },
            { degree: "AWS Solutions Architect", institution: "Amazon Web Services", yearOfCompletion: 2020, certificationId: "AWS-SA-2020-456" }
        ],
        yearsOfExperience: 10
    },
    {
        firstName: "Vikram",
        lastName: "Desai",
        email: "vikram.desai@academy.com",
        phone: "+919876543102",
        password: "Instructor@1234",
        dateOfBirth: new Date("1988-09-12"),
        gender: "Male",
        bio: "Data Science Expert & AI Researcher. Former Google Data Scientist. Published researcher with 20+ papers in ML/AI.",
        address: {
            street: "Innovation Hub",
            city: "Hyderabad",
            state: "Telangana",
            postalCode: "500081",
            country: "India"
        },
        specialization: ["data_science", "artificial_intelligence", "machine_learning"],
        qualifications: [
            { degree: "PhD Data Science", institution: "Stanford University", yearOfCompletion: 2015, certificationId: "STAN-2015-DS-034" },
            { degree: "Google Professional ML Engineer", institution: "Google Cloud", yearOfCompletion: 2021, certificationId: "GCP-ML-2021-789" }
        ],
        yearsOfExperience: 12
    },
    {
        firstName: "Neha",
        lastName: "Gupta",
        email: "neha.gupta@academy.com",
        phone: "+919876543103",
        password: "Instructor@1234",
        dateOfBirth: new Date("1992-02-28"),
        gender: "Female",
        bio: "DevOps & Cloud Architecture Expert. Certified in AWS, Azure, and GCP. Built infrastructure for Fortune 500 companies.",
        address: {
            street: "Cyber Towers",
            city: "Pune",
            state: "Maharashtra",
            postalCode: "411001",
            country: "India"
        },
        specialization: ["devops", "cloud_computing", "cybersecurity"],
        qualifications: [
            { degree: "B.Tech IT", institution: "NIT Trichy", yearOfCompletion: 2014, certificationId: "NIT-2014-IT-156" },
            { degree: "Kubernetes Administrator", institution: "CNCF", yearOfCompletion: 2022, certificationId: "CKA-2022-234" }
        ],
        yearsOfExperience: 8
    }
];

/**
 * Test Course Data (3 courses - one per instructor)
 */
export const TEST_COURSES = [
    {
        title: "Full-Stack Web Development Masterclass 2026",
        description: "Complete MERN stack development from scratch. Build 10+ real-world projects including e-commerce, social media, and streaming platforms. Learn React 19, Node.js 22, MongoDB 8, and deploy to cloud.",
        shortDescription: "Master MERN stack with 10+ real-world projects. React 19, Node.js 22, MongoDB 8.",
        category: "programming",
        level: "intermediate",
        language: "English",
        price: 4999,
        currency: "INR",
        discountPrice: 1999,
        learningOutcomes: [
            "Build production-ready full-stack web applications",
            "Master React 19 with hooks, context, and Redux Toolkit",
            "Create RESTful APIs with Node.js and Express",
            "Implement authentication with JWT and OAuth",
            "Deploy applications to AWS, Vercel, and Railway"
        ],
        prerequisites: ["Basic JavaScript knowledge", "HTML/CSS fundamentals", "Computer with 8GB RAM"],
        targetAudience: ["Aspiring web developers", "Frontend devs learning backend", "CS students"],
        tags: ["react", "nodejs", "mongodb", "express", "mern", "fullstack", "javascript"]
    },
    {
        title: "Data Science & Machine Learning Complete Bootcamp",
        description: "Master Data Science from basics to advanced ML/AI. Python, Pandas, NumPy, Scikit-learn, TensorFlow, PyTorch. Real datasets, Kaggle competitions, and industry projects.",
        shortDescription: "Complete Data Science journey with Python, ML, and Deep Learning.",
        category: "data-science",
        level: "beginner",
        language: "English",
        price: 5999,
        currency: "INR",
        discountPrice: 2499,
        learningOutcomes: [
            "Master Python for Data Science",
            "Build ML models with Scikit-learn",
            "Deep Learning with TensorFlow and PyTorch",
            "Win Kaggle competitions",
            "Deploy ML models to production"
        ],
        prerequisites: ["Basic math knowledge", "No programming experience required", "Curiosity to learn"],
        targetAudience: ["Career changers", "Business analysts", "Students interested in AI"],
        tags: ["python", "machine-learning", "data-science", "tensorflow", "pandas", "ai", "deep-learning"]
    },
    {
        title: "DevOps & Cloud Engineering Professional Certificate",
        description: "Enterprise-grade DevOps and Cloud training. Docker, Kubernetes, Terraform, CI/CD, AWS, Azure, GCP. Learn to build scalable infrastructure and automate everything.",
        shortDescription: "Enterprise DevOps: Docker, K8s, Terraform, AWS/Azure/GCP.",
        category: "programming",
        level: "advanced",
        language: "English",
        price: 6999,
        currency: "INR",
        discountPrice: 2999,
        learningOutcomes: [
            "Containerize applications with Docker",
            "Orchestrate with Kubernetes",
            "Infrastructure as Code with Terraform",
            "Build CI/CD pipelines with GitHub Actions",
            "Multi-cloud deployment strategies"
        ],
        prerequisites: ["Linux basics", "Command line experience", "Basic networking knowledge"],
        targetAudience: ["System administrators", "Developers moving to DevOps", "Cloud engineers"],
        tags: ["devops", "docker", "kubernetes", "terraform", "aws", "azure", "cicd"]
    }
];

/**
 * Module templates for each course (3 modules per course)
 */
export const COURSE_MODULES = {
    // Course 1: Full-Stack Web Development
    course1: [
        {
            title: "JavaScript Fundamentals & ES6+",
            description: "Master modern JavaScript: ES6+ features, async/await, modules, classes, and functional programming patterns.",
            objectives: ["Understand JavaScript core concepts", "Master ES6+ features", "Write clean, modern JS code"]
        },
        {
            title: "React.js - Building Modern UIs",
            description: "Deep dive into React 19: Components, Hooks, State management, Routing, and performance optimization.",
            objectives: ["Build reusable React components", "Master React Hooks", "Implement global state management"]
        },
        {
            title: "Node.js & Express Backend",
            description: "Server-side development with Node.js: REST APIs, authentication, database integration, and deployment.",
            objectives: ["Create REST APIs with Express", "Implement JWT authentication", "Connect to MongoDB"]
        }
    ],
    // Course 2: Data Science
    course2: [
        {
            title: "Python for Data Science",
            description: "Complete Python programming: syntax, data structures, OOP, and essential libraries for data science.",
            objectives: ["Master Python programming", "Work with NumPy and Pandas", "Data manipulation and cleaning"]
        },
        {
            title: "Machine Learning Fundamentals",
            description: "Core ML algorithms: regression, classification, clustering, and model evaluation techniques.",
            objectives: ["Understand ML algorithms", "Build predictive models", "Evaluate model performance"]
        },
        {
            title: "Deep Learning & Neural Networks",
            description: "Neural networks with TensorFlow and PyTorch: CNNs, RNNs, transformers, and model deployment.",
            objectives: ["Build neural networks", "Train deep learning models", "Deploy ML models to production"]
        }
    ],
    // Course 3: DevOps
    course3: [
        {
            title: "Containerization with Docker",
            description: "Docker essentials: containers, images, Dockerfile, Docker Compose, and container orchestration basics.",
            objectives: ["Containerize applications", "Create optimized Docker images", "Use Docker Compose for multi-container apps"]
        },
        {
            title: "Kubernetes Orchestration",
            description: "Production Kubernetes: deployments, services, ingress, ConfigMaps, Secrets, and Helm charts.",
            objectives: ["Deploy apps to Kubernetes", "Manage K8s resources", "Implement Helm charts"]
        },
        {
            title: "CI/CD & Infrastructure as Code",
            description: "Automated pipelines with GitHub Actions, Terraform, and multi-cloud deployment strategies.",
            objectives: ["Build CI/CD pipelines", "Write Terraform configurations", "Deploy to multiple clouds"]
        }
    ]
};

/**
 * Lesson templates for each module (5 lessons per module)
 * Total: 9 modules × 5 lessons = 45 lessons
 */
export const generateLessonsForModule = (moduleIndex, courseIndex) => {
    const lessonTemplates = {
        // Course 1, Module 1: JavaScript Fundamentals
        "0-0": [
            { title: "Introduction to JavaScript", type: "video", duration: 1200, isFree: true },
            { title: "Variables, Data Types & Operators", type: "video", duration: 1800, isFree: false },
            { title: "Functions & Scope", type: "article", isFree: false },
            { title: "ES6+ Features Deep Dive", type: "video", duration: 2400, isFree: false },
            { title: "JavaScript Practice Assignment", type: "assignment", isFree: false }
        ],
        // Course 1, Module 2: React.js
        "0-1": [
            { title: "React Introduction & Setup", type: "video", duration: 1500, isFree: true },
            { title: "Components & JSX", type: "video", duration: 2100, isFree: false },
            { title: "React Hooks Explained", type: "article", isFree: false },
            { title: "State Management with Redux", type: "video", duration: 2700, isFree: false },
            { title: "Build a Todo App - Assignment", type: "assignment", isFree: false }
        ],
        // Course 1, Module 3: Node.js Backend
        "0-2": [
            { title: "Node.js Fundamentals", type: "video", duration: 1800, isFree: false },
            { title: "Building REST APIs with Express", type: "video", duration: 2400, isFree: false },
            { title: "MongoDB & Mongoose ODM", type: "article", isFree: false },
            { title: "Authentication & Authorization", type: "video", duration: 2100, isFree: false },
            { title: "Build a REST API - Assignment", type: "assignment", isFree: false }
        ],
        // Course 2, Module 1: Python
        "1-0": [
            { title: "Python Installation & Basics", type: "video", duration: 1200, isFree: true },
            { title: "Data Structures in Python", type: "video", duration: 2100, isFree: false },
            { title: "Object-Oriented Python", type: "article", isFree: false },
            { title: "NumPy for Numerical Computing", type: "video", duration: 1800, isFree: false },
            { title: "Data Manipulation Assignment", type: "assignment", isFree: false }
        ],
        // Course 2, Module 2: Machine Learning
        "1-1": [
            { title: "Introduction to Machine Learning", type: "video", duration: 1500, isFree: true },
            { title: "Linear Regression Deep Dive", type: "video", duration: 2400, isFree: false },
            { title: "Classification Algorithms", type: "article", isFree: false },
            { title: "Model Evaluation Techniques", type: "video", duration: 1800, isFree: false },
            { title: "Predict House Prices - Assignment", type: "assignment", isFree: false }
        ],
        // Course 2, Module 3: Deep Learning
        "1-2": [
            { title: "Neural Networks Fundamentals", type: "video", duration: 2100, isFree: false },
            { title: "TensorFlow & Keras Basics", type: "video", duration: 2400, isFree: false },
            { title: "Convolutional Neural Networks", type: "article", isFree: false },
            { title: "Building an Image Classifier", type: "video", duration: 2700, isFree: false },
            { title: "Cat vs Dog Classifier - Assignment", type: "assignment", isFree: false }
        ],
        // Course 3, Module 1: Docker
        "2-0": [
            { title: "Docker Introduction & Installation", type: "video", duration: 1200, isFree: true },
            { title: "Docker Images & Containers", type: "video", duration: 1800, isFree: false },
            { title: "Dockerfile Best Practices", type: "article", isFree: false },
            { title: "Docker Compose for Multi-Container Apps", type: "video", duration: 2100, isFree: false },
            { title: "Containerize a Node App - Assignment", type: "assignment", isFree: false }
        ],
        // Course 3, Module 2: Kubernetes
        "2-1": [
            { title: "Kubernetes Architecture", type: "video", duration: 1500, isFree: true },
            { title: "Pods, Deployments & Services", type: "video", duration: 2400, isFree: false },
            { title: "ConfigMaps & Secrets", type: "article", isFree: false },
            { title: "Kubernetes Networking & Ingress", type: "video", duration: 2100, isFree: false },
            { title: "Deploy to K8s Cluster - Assignment", type: "assignment", isFree: false }
        ],
        // Course 3, Module 3: CI/CD
        "2-2": [
            { title: "CI/CD Pipeline Fundamentals", type: "video", duration: 1200, isFree: false },
            { title: "GitHub Actions Deep Dive", type: "video", duration: 2100, isFree: false },
            { title: "Infrastructure as Code with Terraform", type: "article", isFree: false },
            { title: "Multi-Cloud Deployment", type: "video", duration: 2400, isFree: false },
            { title: "Build Complete Pipeline - Assignment", type: "assignment", isFree: false }
        ]
    };
    
    return lessonTemplates[`${courseIndex}-${moduleIndex}`] || [];
};

/**
 * Article content templates
 */
export const ARTICLE_CONTENTS = {
    "Functions & Scope": `# Functions & Scope in JavaScript

## Introduction
Functions are the building blocks of JavaScript applications. Understanding scope is crucial for writing bug-free code.

## Function Declaration vs Expression
\`\`\`javascript
// Declaration
function greet(name) {
    return \`Hello, \${name}!\`;
}

// Expression
const greet = function(name) {
    return \`Hello, \${name}!\`;
};

// Arrow Function
const greet = (name) => \`Hello, \${name}!\`;
\`\`\`

## Scope Types
1. **Global Scope** - Variables accessible everywhere
2. **Function Scope** - Variables inside functions
3. **Block Scope** - Variables inside {} with let/const

## Closures
A closure is when a function remembers its outer variables:
\`\`\`javascript
function counter() {
    let count = 0;
    return () => ++count;
}
\`\`\`

## Best Practices
- Use const by default, let when mutation needed
- Avoid global variables
- Use meaningful function names`,

    "React Hooks Explained": `# React Hooks Deep Dive

## Why Hooks?
Hooks let you use state and other React features in functional components.

## useState
\`\`\`jsx
const [count, setCount] = useState(0);
\`\`\`

## useEffect
\`\`\`jsx
useEffect(() => {
    // Side effect code
    return () => cleanup();
}, [dependencies]);
\`\`\`

## useContext
\`\`\`jsx
const theme = useContext(ThemeContext);
\`\`\`

## Custom Hooks
\`\`\`jsx
function useLocalStorage(key, initialValue) {
    const [value, setValue] = useState(() => {
        const stored = localStorage.getItem(key);
        return stored ? JSON.parse(stored) : initialValue;
    });
    
    useEffect(() => {
        localStorage.setItem(key, JSON.stringify(value));
    }, [key, value]);
    
    return [value, setValue];
}
\`\`\`

## Rules of Hooks
1. Only call at top level
2. Only call in React functions`,

    "MongoDB & Mongoose ODM": `# MongoDB & Mongoose Complete Guide

## Setting Up Mongoose
\`\`\`javascript
import mongoose from 'mongoose';
await mongoose.connect('mongodb://localhost/mydb');
\`\`\`

## Defining Schemas
\`\`\`javascript
const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, unique: true },
    age: { type: Number, min: 0 }
});
\`\`\`

## CRUD Operations
\`\`\`javascript
// Create
const user = await User.create({ name: 'John' });

// Read
const users = await User.find({ age: { $gte: 18 } });

// Update
await User.updateOne({ _id: id }, { name: 'Jane' });

// Delete
await User.deleteOne({ _id: id });
\`\`\`

## Middleware
\`\`\`javascript
userSchema.pre('save', async function() {
    this.password = await bcrypt.hash(this.password, 10);
});
\`\`\``,

    "Object-Oriented Python": `# Object-Oriented Programming in Python

## Classes and Objects
\`\`\`python
class Dog:
    species = "Canis familiaris"  # Class attribute
    
    def __init__(self, name, age):
        self.name = name  # Instance attribute
        self.age = age
    
    def bark(self):
        return f"{self.name} says woof!"
\`\`\`

## Inheritance
\`\`\`python
class GoldenRetriever(Dog):
    def fetch(self):
        return f"{self.name} fetches the ball!"
\`\`\`

## Encapsulation
\`\`\`python
class BankAccount:
    def __init__(self):
        self.__balance = 0  # Private
    
    @property
    def balance(self):
        return self.__balance
\`\`\`

## Magic Methods
\`\`\`python
def __str__(self):
    return f"Dog({self.name})"

def __repr__(self):
    return f"Dog(name='{self.name}', age={self.age})"
\`\`\``,

    "Classification Algorithms": `# Classification Algorithms in Machine Learning

## Logistic Regression
Despite its name, used for classification:
\`\`\`python
from sklearn.linear_model import LogisticRegression
model = LogisticRegression()
model.fit(X_train, y_train)
\`\`\`

## Decision Trees
\`\`\`python
from sklearn.tree import DecisionTreeClassifier
clf = DecisionTreeClassifier(max_depth=5)
clf.fit(X_train, y_train)
\`\`\`

## Random Forest
Ensemble of decision trees:
\`\`\`python
from sklearn.ensemble import RandomForestClassifier
rf = RandomForestClassifier(n_estimators=100)
\`\`\`

## Support Vector Machines
\`\`\`python
from sklearn.svm import SVC
svm = SVC(kernel='rbf', C=1.0)
\`\`\`

## Evaluation Metrics
- Accuracy, Precision, Recall
- F1-Score
- ROC-AUC Curve`,

    "Convolutional Neural Networks": `# Convolutional Neural Networks (CNNs)

## Architecture Components
1. **Convolutional Layer** - Feature extraction
2. **Pooling Layer** - Dimension reduction
3. **Fully Connected Layer** - Classification

## Building a CNN with Keras
\`\`\`python
from tensorflow.keras import Sequential
from tensorflow.keras.layers import Conv2D, MaxPooling2D, Flatten, Dense

model = Sequential([
    Conv2D(32, (3, 3), activation='relu', input_shape=(28, 28, 1)),
    MaxPooling2D((2, 2)),
    Conv2D(64, (3, 3), activation='relu'),
    MaxPooling2D((2, 2)),
    Flatten(),
    Dense(64, activation='relu'),
    Dense(10, activation='softmax')
])
\`\`\`

## Training
\`\`\`python
model.compile(optimizer='adam',
              loss='sparse_categorical_crossentropy',
              metrics=['accuracy'])
model.fit(X_train, y_train, epochs=10, validation_split=0.2)
\`\`\``,

    "Dockerfile Best Practices": `# Dockerfile Best Practices

## Multi-Stage Builds
\`\`\`dockerfile
# Build stage
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production stage
FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
EXPOSE 3000
CMD ["node", "dist/index.js"]
\`\`\`

## Layer Optimization
- Order commands from least to most frequently changing
- Combine RUN commands
- Use .dockerignore

## Security
- Don't run as root
- Use specific image versions
- Scan for vulnerabilities`,

    "ConfigMaps & Secrets": `# Kubernetes ConfigMaps & Secrets

## ConfigMaps
Store non-sensitive configuration:
\`\`\`yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: app-config
data:
  DATABASE_HOST: "postgres"
  LOG_LEVEL: "info"
\`\`\`

## Secrets
Store sensitive data (base64 encoded):
\`\`\`yaml
apiVersion: v1
kind: Secret
metadata:
  name: db-credentials
type: Opaque
data:
  username: YWRtaW4=
  password: cGFzc3dvcmQ=
\`\`\`

## Using in Pods
\`\`\`yaml
envFrom:
  - configMapRef:
      name: app-config
  - secretRef:
      name: db-credentials
\`\`\``,

    "Infrastructure as Code with Terraform": `# Terraform Infrastructure as Code

## Provider Configuration
\`\`\`hcl
terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = "ap-south-1"
}
\`\`\`

## Creating Resources
\`\`\`hcl
resource "aws_instance" "web" {
  ami           = "ami-0c55b159cbfafe1f0"
  instance_type = "t3.micro"
  
  tags = {
    Name = "WebServer"
  }
}
\`\`\`

## Variables
\`\`\`hcl
variable "environment" {
  type    = string
  default = "dev"
}
\`\`\`

## Commands
\`\`\`bash
terraform init
terraform plan
terraform apply
terraform destroy
\`\`\``
};
