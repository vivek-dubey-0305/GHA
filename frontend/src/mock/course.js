// /**
//  * Mock Course Data - Complete End-to-End Structure
//  * 5 detailed courses with nested modules, lessons, and content
//  * All course relationships fully populated
//  */

// export const mockCourses = [
//   {
//     _id: "course_001",
//     title: "Advanced React & Modern JavaScript - Full Stack Development",
//     description: "Master React 18, TypeScript, Redux, React Query, and build production-ready applications. This comprehensive course covers frontend architecture, state management, performance optimization, and advanced patterns. Learn from real-world projects and industry best practices used by top tech companies.",
//     shortDescription: "Complete guide to building scalable React applications with modern JavaScript and best practices.",
//     instructor: "inst_001",
//     category: "programming",
//     level: "advanced",
//     language: "English",
//     price: 99.99,
//     currency: "USD",
//     discountPrice: 49.99,
//     discountValidUntil: "2024-06-30T23:59:59Z",
//     modules: [
//       "module_001",
//       "module_002",
//       "module_003"
//     ],
//     totalModules: 3,
//     totalLessons: 42,
//     totalDuration: 4320, // 72 hours in minutes
//     thumbnail: {
//       public_id: "gha/courses/react-advanced-001",
//       secure_url: "https://images.unsplash.com/photo-1633356122544-f134324ef6db?w=800&h=600&fit=crop"
//     },
//     trailerVideo: "https://vimeo.com/react-trailer-001",
//     previewLessons: [
//       "lesson_001",
//       "lesson_004"
//     ],
//     status: "published",
//     isPublished: true,
//     publishedAt: "2023-06-15T10:00:00Z",
//     enrolledCount: 5420,
//     maxStudents: 10000,
//     rating: 4.8,
//     totalReviews: 892,
//     learningOutcomes: [
//       "Build scalable React applications with TypeScript and Redux",
//       "Master React Hooks, Context API, and custom hooks development",
//       "Implement advanced state management with Redux Toolkit and Recoil",
//       "Optimize performance with code splitting, lazy loading, and memoization",
//       "Deploy applications to production with CI/CD pipelines",
//       "Write testable code with Jest, React Testing Library, and E2E testing"
//     ],
//     prerequisites: [
//       "Basic knowledge of JavaScript ES6+",
//       "Understanding of React fundamentals",
//       "Familiarity with HTML5 and CSS3"
//     ],
//     targetAudience: [
//       "JavaScript developers looking to master React",
//       "Frontend developers aiming for advanced skills",
//       "Web developers transitioning to full-stack roles",
//       "Career-changers entering web development"
//     ],
//     tags: ["react", "javascript", "typescript", "redux", "web-development", "frontend"],
//     seoTitle: "Advanced React Development with TypeScript - Full Stack Course",
//     seoDescription: "Learn advanced React 18 patterns, TypeScript, Redux, and build production-ready applications with real-world projects.",
//     isFree: false,
//     allowPreview: true,
//     certificateEnabled: true,
//     certificates: [
//       "cert_001",
//       "cert_002"
//     ],
//     createdBy: "inst_001",
//     updatedBy: "inst_001",
//     createdAt: "2023-06-01T08:00:00Z",
//     updatedAt: "2024-03-10T15:30:00Z",
//     currentPrice: 49.99,
//     durationHours: 72
//   },

//   {
//     _id: "course_002",
//     title: "Complete Web Development Bootcamp 2024",
//     description: "From zero to job-ready web developer! This intensive bootcamp covers HTML, CSS, JavaScript, React, Node.js, databases, and deployment. Perfect for beginners. Includes 50+ projects, daily coding challenges, and real-world applications.",
//     shortDescription: "Comprehensive web development bootcamp covering frontend, backend, and everything in between.",
//     instructor: "inst_001",
//     category: "programming",
//     level: "beginner",
//     language: "English",
//     price: 129.99,
//     currency: "USD",
//     discountPrice: 79.99,
//     discountValidUntil: "2024-07-15T23:59:59Z",
//     modules: [
//       "module_004",
//       "module_005",
//       "module_006",
//       "module_007"
//     ],
//     totalModules: 4,
//     totalLessons: 156,
//     totalDuration: 15600, // 260 hours
//     thumbnail: {
//       public_id: "gha/courses/web-dev-bootcamp-2024",
//       secure_url: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&h=600&fit=crop"
//     },
//     trailerVideo: "https://vimeo.com/webdev-bootcamp-trailer",
//     previewLessons: [
//       "lesson_014",
//       "lesson_020"
//     ],
//     status: "published",
//     isPublished: true,
//     publishedAt: "2023-12-01T09:00:00Z",
//     enrolledCount: 8932,
//     maxStudents: 15000,
//     rating: 4.7,
//     totalReviews: 1456,
//     learningOutcomes: [
//       "Build stunning websites with HTML5, CSS3, and responsive design",
//       "Master JavaScript fundamentals and ES6+ features",
//       "Create interactive applications with React and modern frontend tools",
//       "Build backend services with Node.js and Express",
//       "Work with databases (MongoDB, PostgreSQL, MySQL)",
//       "Deploy applications to production and manage servers",
//       "Apply Git version control and collaborate with teams"
//     ],
//     prerequisites: [
//       "A computer (Mac, Linux, or Windows)",
//       "Willingness to practice coding daily",
//       "No prior programming experience required"
//     ],
//     targetAudience: [
//       "Complete beginners with no coding experience",
//       "Career changers wanting to enter tech",
//       "People looking for higher-paying careers",
//       "Freelancers wanting to build web apps"
//     ],
//     tags: ["web-development", "bootcamp", "javascript", "react", "nodejs", "full-stack"],
//     seoTitle: "Complete Web Development Bootcamp 2024 - Learn Full-Stack Development",
//     seoDescription: "Become a job-ready web developer in 2024. Learn HTML, CSS, JavaScript, React, Node.js, and deploy real applications.",
//     isFree: false,
//     allowPreview: true,
//     certificateEnabled: true,
//     certificates: [
//       "cert_003",
//       "cert_004",
//       "cert_005"
//     ],
//     createdBy: "inst_001",
//     updatedBy: "inst_001",
//     createdAt: "2023-11-15T10:00:00Z",
//     updatedAt: "2024-03-09T12:00:00Z",
//     currentPrice: 79.99,
//     durationHours: 260
//   },

//   {
//     _id: "course_004",
//     title: "Machine Learning Mastery: From Theory to Production",
//     description: "Deep dive into machine learning with Python. Learn supervised learning, unsupervised learning, deep learning, NLP, and computer vision. Build real projects on Kaggle competitions. Covers TensorFlow, PyTorch, Scikit-learn, and more.",
//     shortDescription: "Complete ML course from theory to production-ready applications with real datasets and projects.",
//     instructor: "inst_002",
//     category: "data-science",
//     level: "intermediate",
//     language: "English",
//     price: 149.99,
//     currency: "USD",
//     discountPrice: 89.99,
//     discountValidUntil: "2024-05-20T23:59:59Z",
//     modules: [
//       "module_008",
//       "module_009",
//       "module_010"
//     ],
//     totalModules: 3,
//     totalLessons: 87,
//     totalDuration: 6480, // 108 hours
//     thumbnail: {
//       public_id: "gha/courses/ml-mastery-advanced",
//       secure_url: "https://images.unsplash.com/photo-1555949519-a1911ea6f620?w=800&h=600&fit=crop"
//     },
//     trailerVideo: "https://vimeo.com/ml-mastery-trailer",
//     previewLessons: [
//       "lesson_045",
//       "lesson_050"
//     ],
//     status: "published",
//     isPublished: true,
//     publishedAt: "2023-09-01T14:00:00Z",
//     enrolledCount: 3450,
//     maxStudents: 8000,
//     rating: 4.9,
//     totalReviews: 567,
//     learningOutcomes: [
//       "Understand fundamental ML algorithms and their mathematical foundations",
//       "Build and train supervised learning models (regression, classification)",
//       "Apply unsupervised learning (clustering, dimensionality reduction)",
//       "Implement deep neural networks with TensorFlow and PyTorch",
//       "Work with NLP and process text data effectively",
//       "Build computer vision models for image classification",
//       "Deploy ML models to production with Docker and Cloud"
//     ],
//     prerequisites: [
//       "Python programming proficiency",
//       "Understanding of basic statistics",
//       "Linear algebra knowledge helpful"
//     ],
//     targetAudience: [
//       "Software engineers entering ML field",
//       "Data analysts wanting to learn ML",
//       "Physics/Math graduates interested in ML",
//       "Developers building AI applications"
//     ],
//     tags: ["machine-learning", "python", "deep-learning", "data-science", "tensorflow", "pytorch"],
//     seoTitle: "Machine Learning Mastery: Complete Course for Data Scientists",
//     seoDescription: "Learn machine learning from scratch to production. TensorFlow, PyTorch, real projects, and Kaggle competitions.",
//     isFree: false,
//     allowPreview: true,
//     certificateEnabled: true,
//     certificates: [
//       "cert_006"
//     ],
//     createdBy: "inst_002",
//     updatedBy: "inst_002",
//     createdAt: "2023-08-15T11:00:00Z",
//     updatedAt: "2024-03-08T16:00:00Z",
//     currentPrice: 89.99,
//     durationHours: 108
//   },

//   {
//     _id: "course_006",
//     title: "UI/UX Design Fundamentals & Advanced Practices",
//     description: "Learn to design beautiful, user-friendly digital products. Master design thinking, wireframing, prototyping, user research, and usability testing. Use industry-standard tools like Figma, Adobe XD. Build a professional portfolio.",
//     shortDescription: "Complete guide to UI/UX design with Figma and modern design principles for digital products.",
//     instructor: "inst_003",
//     category: "design",
//     level: "beginner",
//     language: "English",
//     price: 79.99,
//     currency: "USD",
//     discountPrice: 49.99,
//     discountValidUntil: "2024-04-30T23:59:59Z",
//     modules: [
//       "module_011",
//       "module_012"
//     ],
//     totalModules: 2,
//     totalLessons: 38,
//     totalDuration: 2280, // 38 hours
//     thumbnail: {
//       public_id: "gha/courses/ui-ux-design-2024",
//       secure_url: "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800&h=600&fit=crop"
//     },
//     trailerVideo: "https://vimeo.com/uiux-design-trailer",
//     previewLessons: [
//       "lesson_065",
//       "lesson_070"
//     ],
//     status: "published",
//     isPublished: true,
//     publishedAt: "2024-01-01T09:00:00Z",
//     enrolledCount: 2134,
//     maxStudents: 5000,
//     rating: 4.7,
//     totalReviews: 345,
//     learningOutcomes: [
//       "Understand design thinking and user-centered design principles",
//       "Conduct user research and create detailed personas",
//       "Create wireframes and prototypes with industry tools",
//       "Apply color theory, typography, and visual hierarchy",
//       "Master layout systems, grids, and responsive design",
//       "Perform usability testing and iterate on designs",
//       "Build a professional portfolio with 5+ real projects"
//     ],
//     prerequisites: [
//       "Basic understanding of design principles",
//       "No design software experience needed"
//     ],
//     targetAudience: [
//       "Career changers interested in design",
//       "Developers wanting to improve design skills",
//       "Beginner designers looking to learn fundamentals",
//       "Entrepreneurs designing their own products"
//     ],
//     tags: ["design", "ui-ux", "figma", "user-experience", "product-design"],
//     seoTitle: "UI/UX Design Fundamentals - Learn Design with Figma",
//     seoDescription: "Master UI/UX design from zero to hero. User research, wireframing, prototyping with Figma and best practices.",
//     isFree: false,
//     allowPreview: true,
//     certificateEnabled: true,
//     certificates: [
//       "cert_007"
//     ],
//     createdBy: "inst_003",
//     updatedBy: "inst_003",
//     createdAt: "2023-12-01T08:00:00Z",
//     updatedAt: "2024-03-07T14:30:00Z",
//     currentPrice: 49.99,
//     durationHours: 38
//   },

//   {
//     _id: "course_008",
//     title: "AWS Solutions Architect Professional Certification Prep",
//     description: "Comprehensive preparation for AWS Solutions Architect Professional exam. Deep dive into AWS services, architecture best practices, security, high availability, and disaster recovery. Includes practice exams, real-world scenarios, and exam tips.",
//     shortDescription: "Pass AWS SAP certification with comprehensive exam preparation and hands-on labs.",
//     instructor: "inst_004",
//     category: "programming",
//     level: "advanced",
//     language: "English",
//     price: 69.99,
//     currency: "USD",
//     discountPrice: 39.99,
//     discountValidUntil: "2024-04-15T23:59:59Z",
//     modules: [
//       "module_013",
//       "module_014"
//     ],
//     totalModules: 2,
//     totalLessons: 52,
//     totalDuration: 3120, // 52 hours
//     thumbnail: {
//       public_id: "gha/courses/aws-sap-cert",
//       secure_url: "https://images.unsplash.com/photo-1516321318423-f06f70504646?w=800&h=600&fit=crop"
//     },
//     trailerVideo: "https://vimeo.com/aws-sap-trailer",
//     previewLessons: [
//       "lesson_085",
//       "lesson_090"
//     ],
//     status: "published",
//     isPublished: true,
//     publishedAt: "2023-10-15T10:00:00Z",
//     enrolledCount: 1876,
//     maxStudents: 4000,
//     rating: 4.8,
//     totalReviews: 234,
//     learningOutcomes: [
//       "Master AWS core services and their integration",
//       "Design secure, resilient, and performance-optimized architectures",
//       "Understand multi-tier application design and microservices",
//       "Design disaster recovery and business continuity strategies",
//       "Implement network and content delivery solutions",
//       "Master identity and access management on AWS",
//       "Pass AWS Solutions Architect Professional (SAP-C02) exam"
//     ],
//     prerequisites: [
//       "AWS Solutions Architect Associate knowledge",
//       "AWS hands-on experience",
//       "Networking and security fundamentals"
//     ],
//     targetAudience: [
//       "AWS certification aspirants",
//       "Cloud architects and engineers",
//       "DevOps professionals",
//       "System engineers transitioning to cloud"
//     ],
//     tags: ["aws", "cloud-computing", "certification", "architecture", "devops"],
//     seoTitle: "AWS Solutions Architect Professional Certification - Complete Guide",
//     seoDescription: "Ace AWS SAP certification. Comprehensive course with practice exams, labs, and real-world scenarios.",
//     isFree: false,
//     allowPreview: true,
//     certificateEnabled: true,
//     certificates: [
//       "cert_008"
//     ],
//     createdBy: "inst_004",
//     updatedBy: "inst_004",
//     createdAt: "2023-09-20T12:00:00Z",
//     updatedAt: "2024-03-06T11:00:00Z",
//     currentPrice: 39.99,
//     durationHours: 52
//   }
// ];

// // ========================
// // DETAILED MODULE STRUCTURE
// // ========================

// export const mockModules = [
//   // Course 001 - Advanced React Modules
//   {
//     _id: "module_001",
//     title: "React Fundamentals & Hooks Deep Dive",
//     description: "Master React 18 fundamentals and advanced hooks patterns. Learn functional components, useState, useEffect, useContext, and custom hooks development.",
//     course: "course_001",
//     order: 1,
//     lessons: [
//       "lesson_001",
//       "lesson_002",
//       "lesson_003"
//     ],
//     totalLessons: 3,
//     totalDuration: 540, // 9 hours
//     thumbnail: {
//       public_id: "gha/modules/react-hooks-001",
//       secure_url: "https://images.unsplash.com/photo-1633356122544-f134324ef6db?w=200&h=150&fit=crop"
//     },
//     isPublished: true,
//     publishedAt: "2023-06-15T10:00:00Z",
//     objectives: [
//       "Understand React component lifecycle and rendering optimization",
//       "Master all React Hooks and their use cases",
//       "Build custom hooks for reusable logic",
//       "Implement context API for state management"
//     ],
//     createdBy: "inst_001",
//     updatedBy: "inst_001",
//     createdAt: "2023-06-01T08:00:00Z",
//     updatedAt: "2024-03-10T15:30:00Z"
//   },
//   {
//     _id: "module_002",
//     title: "State Management with Redux & TypeScript",
//     description: "Learn Redux Toolkit, Redux Saga, middleware patterns, and TypeScript integration. Build scalable applications with predictable state management.",
//     course: "course_001",
//     order: 2,
//     lessons: [
//       "lesson_004",
//       "lesson_005",
//       "lesson_006"
//     ],
//     totalLessons: 3,
//     totalDuration: 720, // 12 hours
//     thumbnail: {
//       public_id: "gha/modules/redux-ts-001",
//       secure_url: "https://images.unsplash.com/photo-1633356122544-f134324ef6db?w=200&h=150&fit=crop"
//     },
//     isPublished: true,
//     publishedAt: "2023-06-20T14:00:00Z",
//     objectives: [
//       "Implement Redux and Redux Toolkit patterns",
//       "Master slices, actions, and selectors",
//       "Handle async operations with thunks and sagas",
//       "Integrate TypeScript with Redux"
//     ],
//     createdBy: "inst_001",
//     updatedBy: "inst_001",
//     createdAt: "2023-06-05T09:00:00Z",
//     updatedAt: "2024-03-10T15:30:00Z"
//   },
//   {
//     _id: "module_003",
//     title: "Performance & Advanced Patterns",
//     description: "Optimize React applications with code splitting, lazy loading, memoization, and advanced patterns. Master real-world performance techniques.",
//     course: "course_001",
//     order: 3,
//     lessons: [
//       "lesson_007",
//       "lesson_008",
//       "lesson_009",
//       "lesson_010"
//     ],
//     totalLessons: 4,
//     totalDuration: 1080, // 18 hours
//     thumbnail: {
//       public_id: "gha/modules/react-perf-001",
//       secure_url: "https://images.unsplash.com/photo-1633356122544-f134324ef6db?w=200&h=150&fit=crop"
//     },
//     isPublished: true,
//     publishedAt: "2023-07-01T10:00:00Z",
//     objectives: [
//       "Profile and optimize React application performance",
//       "Implement code splitting and lazy loading",
//       "Master memoization and memo patterns",
//       "Handle large lists and data virtualization"
//     ],
//     createdBy: "inst_001",
//     updatedBy: "inst_001",
//     createdAt: "2023-06-15T10:00:00Z",
//     updatedAt: "2024-03-10T15:30:00Z"
//   }
// ];

// // ========================
// // DETAILED LESSON STRUCTURE
// // ========================

// export const mockLessons = [
//   // Module 001 - Lessons
//   {
//     _id: "lesson_001",
//     title: "React 18 Features & Concurrent Rendering",
//     description: "Explore React 18 new features including concurrent rendering, automatic batching, transitions, and Suspense. Understand the new mental model.",
//     course: "course_001",
//     module: "module_001",
//     order: 1,
//     thumbnail: {
//       public_id: "gha/lessons/react18-features",
//       secure_url: "https://images.unsplash.com/photo-1633356122544-f134324ef6db?w=300&h=200&fit=crop"
//     },
//     type: "video",
//     content: {
//       articleContent: null
//     },
//     videoPackageId: "vidpkg_001",
//     isFree: true,
//     isPublished: true,
//     publishedAt: "2023-06-15T10:00:00Z",
//     viewCount: 3420,
//     completionCount: 2156,
//     createdBy: "inst_001",
//     updatedBy: "inst_001",
//     createdAt: "2023-06-01T08:00:00Z",
//     updatedAt: "2024-03-10T15:30:00Z"
//   },
//   {
//     _id: "lesson_002",
//     title: "Understanding React Hooks Architecture",
//     description: "Deep dive into how React Hooks work internally. Understand closures, dependency arrays, and rules of hooks.",
//     course: "course_001",
//     module: "module_001",
//     order: 2,
//     thumbnail: {
//       public_id: "gha/lessons/react-hooks-arch",
//       secure_url: "https://images.unsplash.com/photo-1633356122544-f134324ef6db?w=300&h=200&fit=crop"
//     },
//     type: "video",
//     videoPackageId: "vidpkg_002",
//     isFree: false,
//     isPublished: true,
//     publishedAt: "2023-06-18T09:00:00Z",
//     viewCount: 2890,
//     completionCount: 1945,
//     createdBy: "inst_001",
//     updatedBy: "inst_001",
//     createdAt: "2023-06-05T09:00:00Z",
//     updatedAt: "2024-03-10T15:30:00Z"
//   },
//   {
//     _id: "lesson_003",
//     title: "useState, useEffect & useContext Mastery",
//     description: "Master the most-used hooks. Build practical examples with proper cleanup, dependency management, and context usage.",
//     course: "course_001",
//     module: "module_001",
//     order: 3,
//     thumbnail: {
//       public_id: "gha/lessons/hooks-mastery",
//       secure_url: "https://images.unsplash.com/photo-1633356122544-f134324ef6db?w=300&h=200&fit=crop"
//     },
//     type: "assignment",
//     assignmentId: "assign_001",
//     isFree: false,
//     isPublished: true,
//     publishedAt: "2023-06-20T10:00:00Z",
//     viewCount: 3120,
//     completionCount: 2340,
//     createdBy: "inst_001",
//     updatedBy: "inst_001",
//     createdAt: "2023-06-10T08:00:00Z",
//     updatedAt: "2024-03-10T15:30:00Z"
//   },
//   {
//     _id: "lesson_004",
//     title: "Redux Essentials",
//     description: "Learn Redux fundamentals with Redux Toolkit. Build a todo app with actions, reducers, and store.",
//     course: "course_001",
//     module: "module_002",
//     order: 1,
//     thumbnail: {
//       public_id: "gha/lessons/redux-essentials",
//       secure_url: "https://images.unsplash.com/photo-1633356122544-f134324ef6db?w=300&h=200&fit=crop"
//     },
//     type: "video",
//     videoPackageId: "vidpkg_003",
//     isFree: false,
//     isPublished: true,
//     publishedAt: "2023-06-25T10:00:00Z",
//     viewCount: 2650,
//     completionCount: 1876,
//     createdBy: "inst_001",
//     updatedBy: "inst_001",
//     createdAt: "2023-06-15T10:00:00Z",
//     updatedAt: "2024-03-10T15:30:00Z"
//   },
//   {
//     _id: "lesson_005",
//     title: "Redux Middleware & Async Thunks",
//     description: "Master Redux middleware, handle async actions with thunk middleware, and implement real-world patterns.",
//     course: "course_001",
//     module: "module_002",
//     order: 2,
//     thumbnail: {
//       public_id: "gha/lessons/redux-middleware",
//       secure_url: "https://images.unsplash.com/photo-1633356122544-f134324ef6db?w=300&h=200&fit=crop"
//     },
//     type: "article",
//     content: {
//       articleContent: "Redux middleware allows intercepting actions. Thunk middleware enables async action creators. Learn best practices..."
//     },
//     isFree: false,
//     isPublished: true,
//     publishedAt: "2023-06-28T11:00:00Z",
//     viewCount: 1890,
//     completionCount: 1234,
//     createdBy: "inst_001",
//     updatedBy: "inst_001",
//     createdAt: "2023-06-18T09:00:00Z",
//     updatedAt: "2024-03-10T15:30:00Z"
//   },
//   {
//     _id: "lesson_006",
//     title: "TypeScript with Redux",
//     description: "Integrate TypeScript with Redux for type-safe state management. Learn best practices for Redux + TS.",
//     course: "course_001",
//     module: "module_002",
//     order: 3,
//     thumbnail: {
//       public_id: "gha/lessons/redux-ts",
//       secure_url: "https://images.unsplash.com/photo-1633356122544-f134324ef6db?w=300&h=200&fit=crop"
//     },
//     type: "material",
//     materialId: "mat_001",
//     isFree: false,
//     isPublished: true,
//     publishedAt: "2023-07-02T09:00:00Z",
//     viewCount: 1560,
//     completionCount: 956,
//     createdBy: "inst_001",
//     updatedBy: "inst_001",
//     createdAt: "2023-06-22T10:00:00Z",
//     updatedAt: "2024-03-10T15:30:00Z"
//   },
//   {
//     _id: "lesson_007",
//     title: "React Performance Profiling",
//     description: "Learn to profile React applications using DevTools. Identify performance bottlenecks and understand rendering behavior.",
//     course: "course_001",
//     module: "module_003",
//     order: 1,
//     thumbnail: {
//       public_id: "gha/lessons/react-profiling",
//       secure_url: "https://images.unsplash.com/photo-1633356122544-f134324ef6db?w=300&h=200&fit=crop"
//     },
//     type: "video",
//     videoPackageId: "vidpkg_004",
//     isFree: false,
//     isPublished: true,
//     publishedAt: "2023-07-08T10:00:00Z",
//     viewCount: 2100,
//     completionCount: 1456,
//     createdBy: "inst_001",
//     updatedBy: "inst_001",
//     createdAt: "2023-07-01T08:00:00Z",
//     updatedAt: "2024-03-10T15:30:00Z"
//   }
// ];

// // ========================
// // DETAILED VIDEO PACKAGES
// // ========================

// export const mockVideoPackages = [
//   {
//     _id: "vidpkg_001",
//     instructor: "inst_001",
//     course: "course_001",
//     packageName: "React 18 Features - Complete Walkthrough",
//     description: "Comprehensive video walkthrough covering all React 18 features with live coding examples.",
//     videos: [
//       {
//         videoId: "vid_001",
//         bunnyVideoId: "d8b5c8ff-3a2e-4b1e-8d2c-1e5f8c8b5f8c",
//         title: "React 18 Overview & Concurrent Features",
//         description: "Introduction to React 18 and its revolutionary concurrent rendering features",
//         duration: 1200, // 20 minutes
//         fileSize: 450000000, // 450 MB
//         uploadedAt: "2023-06-01T10:00:00Z",
//         url: "https://stream.bunnycdn.com/react18-features-001.m3u8",
//         thumbnail: "https://images.unsplash.com/photo-1633356122544-f134324ef6db?w=200&h=150&fit=crop",
//         status: "available",
//         views: 3420,
//         likes: 456,
//         order: 1
//       }
//     ],
//     totalVideos: 1,
//     totalDuration: 1200,
//     totalSize: 450000000,
//     isPublished: true,
//     isPublic: false,
//     price: 0,
//     currency: "USD",
//     tags: ["react", "react18", "javascript", "frontend"],
//     category: "lecture",
//     totalViews: 3420,
//     totalLikes: 456,
//     createdAt: "2023-06-01T08:00:00Z",
//     updatedAt: "2024-03-10T15:30:00Z"
//   }
// ];

// // ========================
// // DETAILED ASSIGNMENTS
// // ========================

// export const mockAssignments = [
//   {
//     _id: "assign_001",
//     title: "Build a Todo App with React Hooks",
//     description: "Create a fully functional todo application using React Hooks. Implement add, delete, mark complete, and filter features. Use useState and useEffect hooks properly.",
//     thumbnail: {
//       public_id: "gha/assignments/todo-app-001",
//       secure_url: "https://images.unsplash.com/photo-1633356122544-f134324ef6db?w=300&h=200&fit=crop"
//     },
//     course: "course_001",
//     lesson: "lesson_003",
//     instructor: "inst_001",
//     type: "mixed",
//     maxScore: 100,
//     passingScore: 60,
//     dueDate: "2024-12-31T23:59:59Z",
//     allowLateSubmission: true,
//     lateSubmissionPenalty: 10,
//     instructions: "1. Create a React component for the todo app\n2. Implement add, delete, and complete functions\n3. Use localStorage to persist data\n4. Make it responsive and mobile-friendly\n5. Submit your GitHub repository link",
//     requiredFiles: [
//       {
//         name: "src/App.jsx",
//         type: "txt",
//         maxSize: 50,
//         required: true
//       }
//     ],
//     wordLimit: {
//       min: 100,
//       max: 5000
//     },
//     isPublished: true,
//     publishedAt: "2023-06-20T10:00:00Z",
//     totalSubmissions: 345,
//     averageScore: 78.5,
//     rubrics: [
//       {
//         criterion: "Functionality",
//         description: "App works as specified with all features implemented",
//         maxPoints: 40
//       },
//       {
//         criterion: "Code Quality",
//         description: "Clean, readable, well-structured code following best practices",
//         maxPoints: 30
//       },
//       {
//         criterion: "UI/UX",
//         description: "Responsive design, good user experience",
//         maxPoints: 20
//       },
//       {
//         criterion: "Documentation",
//         description: "Clear comments and README explaining the project",
//         maxPoints: 10
//       }
//     ],
//     createdBy: "inst_001",
//     updatedBy: "inst_001",
//     createdAt: "2023-06-10T08:00:00Z",
//     updatedAt: "2024-03-10T15:30:00Z"
//   }
// ];

// // ========================
// // DETAILED MATERIALS
// // ========================

// export const mockMaterials = [
//   {
//     _id: "mat_001",
//     instructor: "inst_001",
//     course: "course_001",
//     module: "module_002",
//     lesson: "lesson_006",
//     title: "Redux + TypeScript Starter Template",
//     description: "Complete Redux Toolkit + TypeScript project template with all best practices. Ready to clone and use.",
//     type: "code",
//     fileUrl: "https://r2.gha.edu/materials/redux-ts-template.zip",
//     content: "Redux store setup, typed actions, selectors, middleware configuration...",
//     fileName: "redux-ts-template.zip",
//     fileSize: 2500000,
//     mimeType: "application/zip",
//     thumbnail: "https://images.unsplash.com/photo-1633356122544-f134324ef6db?w=200&h=150&fit=crop",
//     isPublic: false,
//     accessLevel: "enrolled_students",
//     downloadCount: 234,
//     viewCount: 567,
//     lastAccessedAt: "2024-03-10T14:00:00Z",
//     order: 1,
//     tags: ["redux", "typescript", "template", "starter"],
//     status: "published",
//     metadata: {
//       language: "TypeScript",
//       difficulty: "intermediate"
//     },
//     createdBy: "inst_001",
//     updatedBy: "inst_001",
//     createdAt: "2023-06-22T10:00:00Z",
//     updatedAt: "2024-03-10T15:30:00Z"
//   }
// ];

// export default {
//   mockCourses,
//   mockModules,
//   mockLessons,
//   mockVideoPackages,
//   mockAssignments,
//   mockMaterials
// };



/**
 * Mock Course Data — Extended for CourseListing + CourseDetail
 *
 * All existing fields from the original course.js are preserved.
 * Added fields for CourseListing page:
 *   - id          (numeric alias for _id)
 *   - cat         (display category string)
 *   - sub         (display sub-category)
 *   - img         (card thumbnail URL alias)
 *   - hours       (numeric, alias for durationHours)
 *   - reviews     (numeric, alias for totalReviews)
 *   - students    (numeric, alias for enrolledCount)
 *   - projects    (project count)
 *   - instructor  (string name for listing display)
 *   - instColor   (avatar accent color)
 *   - topics      (filterable topic array)
 *   - badges      (array: "best"|"new"|"hot"|"intern"|"free")
 *   - internship  (boolean)
 *   - handson     (boolean)
 *   - certificate (boolean, alias for certificateEnabled)
 *   - lang        (string alias for language)
 *   - desc        (string alias for shortDescription)
 */

export const mockCourses = [
  {
    // ── Mongo-style fields (from schema) ──
    _id: "course_001",
    title: "Advanced React & Modern JavaScript - Full Stack Development",
    description:
      "Master React 18, TypeScript, Redux, React Query, and build production-ready applications. This comprehensive course covers frontend architecture, state management, performance optimization, and advanced patterns. Learn from real-world projects and industry best practices used by top tech companies.",
    shortDescription:
      "Complete guide to building scalable React applications with modern JavaScript and best practices.",
    instructor: "inst_001",
    category: "programming",
    level: "advanced",
    language: "English",
    price: 99.99,
    currency: "USD",
    discountPrice: 49.99,
    discountValidUntil: "2024-06-30T23:59:59Z",
    modules: ["module_001", "module_002", "module_003"],
    totalModules: 3,
    totalLessons: 42,
    totalDuration: 4320,
    thumbnail: {
      public_id: "gha/courses/react-advanced-001",
      secure_url:
        "https://images.unsplash.com/photo-1633356122544-f134324ef6db?w=800&h=600&fit=crop",
    },
    trailerVideo: "https://vimeo.com/react-trailer-001",
    previewLessons: ["lesson_001", "lesson_004"],
    status: "published",
    isPublished: true,
    publishedAt: "2023-06-15T10:00:00Z",
    enrolledCount: 5420,
    maxStudents: 10000,
    rating: 4.8,
    totalReviews: 892,
    learningOutcomes: [
      "Build scalable React applications with TypeScript and Redux",
      "Master React Hooks, Context API, and custom hooks development",
      "Implement advanced state management with Redux Toolkit and Recoil",
      "Optimize performance with code splitting, lazy loading, and memoization",
      "Deploy applications to production with CI/CD pipelines",
      "Write testable code with Jest, React Testing Library, and E2E testing",
    ],
    prerequisites: [
      "Basic knowledge of JavaScript ES6+",
      "Understanding of React fundamentals",
      "Familiarity with HTML5 and CSS3",
    ],
    targetAudience: [
      "JavaScript developers looking to master React",
      "Frontend developers aiming for advanced skills",
      "Web developers transitioning to full-stack roles",
      "Career-changers entering web development",
    ],
    tags: ["react", "javascript", "typescript", "redux", "web-development", "frontend"],
    seoTitle: "Advanced React Development with TypeScript - Full Stack Course",
    seoDescription:
      "Learn advanced React 18 patterns, TypeScript, Redux, and build production-ready applications with real-world projects.",
    isFree: false,
    allowPreview: true,
    certificateEnabled: true,
    certificates: ["cert_001", "cert_002"],
    createdBy: "inst_001",
    updatedBy: "inst_001",
    createdAt: "2023-06-01T08:00:00Z",
    updatedAt: "2024-03-10T15:30:00Z",
    currentPrice: 49.99,
    durationHours: 72,

    // ── CourseListing display fields ──
    id: 4,
    cat: "Web Development",
    sub: "Frontend",
    img: "https://images.unsplash.com/photo-1633356122544-a6cee?w=400&h=220&fit=crop&q=80",
    hours: 72,
    reviews: 892,
    students: 5420,
    projects: 7,
    instColor: "#f5c518",
    topics: ["React", "Next.js", "TypeScript"],
    badges: ["best"],
    internship: false,
    handson: true,
    certificate: true,
    lang: "English",
    desc: "Master the modern React ecosystem. TypeScript, Redux Toolkit, React Query and production-grade patterns.",
  },

  {
    _id: "course_002",
    title: "Complete Web Development Bootcamp 2024",
    description:
      "From zero to job-ready web developer! This intensive bootcamp covers HTML, CSS, JavaScript, React, Node.js, databases, and deployment. Perfect for beginners. Includes 50+ projects, daily coding challenges, and real-world applications.",
    shortDescription:
      "Comprehensive web development bootcamp covering frontend, backend, and everything in between.",
    instructor: "inst_001",
    category: "programming",
    level: "beginner",
    language: "English",
    price: 129.99,
    currency: "USD",
    discountPrice: 79.99,
    discountValidUntil: "2024-07-15T23:59:59Z",
    modules: ["module_004", "module_005", "module_006", "module_007"],
    totalModules: 4,
    totalLessons: 156,
    totalDuration: 15600,
    thumbnail: {
      public_id: "gha/courses/web-dev-bootcamp-2024",
      secure_url:
        "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&h=600&fit=crop",
    },
    trailerVideo: "https://vimeo.com/webdev-bootcamp-trailer",
    previewLessons: ["lesson_014", "lesson_020"],
    status: "published",
    isPublished: true,
    publishedAt: "2023-12-01T09:00:00Z",
    enrolledCount: 8932,
    maxStudents: 15000,
    rating: 4.7,
    totalReviews: 1456,
    learningOutcomes: [
      "Build stunning websites with HTML5, CSS3, and responsive design",
      "Master JavaScript fundamentals and ES6+ features",
      "Create interactive applications with React and modern frontend tools",
      "Build backend services with Node.js and Express",
      "Work with databases (MongoDB, PostgreSQL, MySQL)",
      "Deploy applications to production and manage servers",
      "Apply Git version control and collaborate with teams",
    ],
    prerequisites: [
      "A computer (Mac, Linux, or Windows)",
      "Willingness to practice coding daily",
      "No prior programming experience required",
    ],
    targetAudience: [
      "Complete beginners with no coding experience",
      "Career changers wanting to enter tech",
      "People looking for higher-paying careers",
      "Freelancers wanting to build web apps",
    ],
    tags: ["web-development", "bootcamp", "javascript", "react", "nodejs", "full-stack"],
    seoTitle: "Complete Web Development Bootcamp 2024 - Learn Full-Stack Development",
    seoDescription:
      "Become a job-ready web developer in 2024. Learn HTML, CSS, JavaScript, React, Node.js, and deploy real applications.",
    isFree: false,
    allowPreview: true,
    certificateEnabled: true,
    certificates: ["cert_003", "cert_004", "cert_005"],
    createdBy: "inst_001",
    updatedBy: "inst_001",
    createdAt: "2023-11-15T10:00:00Z",
    updatedAt: "2024-03-09T12:00:00Z",
    currentPrice: 79.99,
    durationHours: 260,

    id: 1,
    cat: "Web Development",
    sub: "Full Stack",
    img: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=400&h=220&fit=crop&q=80",
    hours: 260,
    reviews: 1456,
    students: 8932,
    projects: 8,
    instColor: "#f5c518",
    topics: ["MERN", "React", "Node.js", "MongoDB"],
    badges: ["best"],
    internship: false,
    handson: true,
    certificate: true,
    lang: "English",
    desc: "Build 8 production-ready full-stack apps with MongoDB, Express, React, and Node.js. Deploy on AWS.",
  },

  {
    _id: "course_004",
    title: "Machine Learning Mastery: From Theory to Production",
    description:
      "Deep dive into machine learning with Python. Learn supervised learning, unsupervised learning, deep learning, NLP, and computer vision. Build real projects on Kaggle competitions. Covers TensorFlow, PyTorch, Scikit-learn, and more.",
    shortDescription:
      "Complete ML course from theory to production-ready applications with real datasets and projects.",
    instructor: "inst_002",
    category: "data-science",
    level: "intermediate",
    language: "English",
    price: 149.99,
    currency: "USD",
    discountPrice: 89.99,
    discountValidUntil: "2024-05-20T23:59:59Z",
    modules: ["module_008", "module_009", "module_010"],
    totalModules: 3,
    totalLessons: 87,
    totalDuration: 6480,
    thumbnail: {
      public_id: "gha/courses/ml-mastery-advanced",
      secure_url:
        "https://images.unsplash.com/photo-1555949519-a1911ea6f620?w=800&h=600&fit=crop",
    },
    trailerVideo: "https://vimeo.com/ml-mastery-trailer",
    previewLessons: ["lesson_045", "lesson_050"],
    status: "published",
    isPublished: true,
    publishedAt: "2023-09-01T14:00:00Z",
    enrolledCount: 3450,
    maxStudents: 8000,
    rating: 4.9,
    totalReviews: 567,
    learningOutcomes: [
      "Understand fundamental ML algorithms and their mathematical foundations",
      "Build and train supervised learning models (regression, classification)",
      "Apply unsupervised learning (clustering, dimensionality reduction)",
      "Implement deep neural networks with TensorFlow and PyTorch",
      "Work with NLP and process text data effectively",
      "Build computer vision models for image classification",
      "Deploy ML models to production with Docker and Cloud",
    ],
    prerequisites: [
      "Python programming proficiency",
      "Understanding of basic statistics",
      "Linear algebra knowledge helpful",
    ],
    targetAudience: [
      "Software engineers entering ML field",
      "Data analysts wanting to learn ML",
      "Physics/Math graduates interested in ML",
      "Developers building AI applications",
    ],
    tags: ["machine-learning", "python", "deep-learning", "data-science", "tensorflow", "pytorch"],
    seoTitle: "Machine Learning Mastery: Complete Course for Data Scientists",
    seoDescription:
      "Learn machine learning from scratch to production. TensorFlow, PyTorch, real projects, and Kaggle competitions.",
    isFree: false,
    allowPreview: true,
    certificateEnabled: true,
    certificates: ["cert_006"],
    createdBy: "inst_002",
    updatedBy: "inst_002",
    createdAt: "2023-08-15T11:00:00Z",
    updatedAt: "2024-03-08T16:00:00Z",
    currentPrice: 89.99,
    durationHours: 108,

    id: 3,
    cat: "Machine Learning",
    sub: "ML Engineering",
    img: "https://images.unsplash.com/photo-1677442135703-1787eea5ce01?w=400&h=220&fit=crop&q=80",
    hours: 108,
    reviews: 567,
    students: 3450,
    projects: 5,
    instColor: "#3498db",
    topics: ["Python", "PyTorch", "LLMs"],
    badges: ["hot"],
    internship: false,
    handson: true,
    certificate: true,
    lang: "English",
    desc: "PyTorch, transformers, fine-tuning LLMs, and production ML pipelines from the ground up.",
  },

  {
    _id: "course_006",
    title: "UI/UX Design Fundamentals & Advanced Practices",
    description:
      "Learn to design beautiful, user-friendly digital products. Master design thinking, wireframing, prototyping, user research, and usability testing. Use industry-standard tools like Figma, Adobe XD. Build a professional portfolio.",
    shortDescription:
      "Complete guide to UI/UX design with Figma and modern design principles for digital products.",
    instructor: "inst_003",
    category: "design",
    level: "beginner",
    language: "English",
    price: 79.99,
    currency: "USD",
    discountPrice: 49.99,
    discountValidUntil: "2024-04-30T23:59:59Z",
    modules: ["module_011", "module_012"],
    totalModules: 2,
    totalLessons: 38,
    totalDuration: 2280,
    thumbnail: {
      public_id: "gha/courses/ui-ux-design-2024",
      secure_url:
        "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800&h=600&fit=crop",
    },
    trailerVideo: "https://vimeo.com/uiux-design-trailer",
    previewLessons: ["lesson_065", "lesson_070"],
    status: "published",
    isPublished: true,
    publishedAt: "2024-01-01T09:00:00Z",
    enrolledCount: 2134,
    maxStudents: 5000,
    rating: 4.95,
    totalReviews: 2847,
    learningOutcomes: [
      "Understand design thinking and user-centered design principles",
      "Conduct user research and create detailed personas",
      "Create wireframes and prototypes with industry tools",
      "Apply color theory, typography, and visual hierarchy",
      "Master layout systems, grids, and responsive design",
      "Perform usability testing and iterate on designs",
      "Build a professional portfolio with 5+ real projects",
      "Integrate with Storybook and developer workflows",
    ],
    prerequisites: [
      "3+ years experience with Figma or similar design tools",
      "Working knowledge of UI/UX design principles",
      "Basic understanding of front-end concepts (HTML/CSS)",
      "A Figma Professional account (free trial is fine)",
      "Desire to work at a senior or lead design level",
    ],
    targetAudience: [
      "Senior designers wanting to move into Design Lead roles",
      "Design system contributors at growing startups",
      "Product designers at scale-ups building their first system",
      "Frontend engineers who collaborate closely with design",
    ],
    tags: ["design", "ui-ux", "figma", "user-experience", "product-design", "design-tokens", "component-library"],
    seoTitle: "UI/UX Design Fundamentals - Learn Design with Figma",
    seoDescription:
      "Master UI/UX design from zero to hero. User research, wireframing, prototyping with Figma and best practices.",
    isFree: false,
    allowPreview: true,
    certificateEnabled: true,
    certificates: ["cert_007"],
    createdBy: "inst_003",
    updatedBy: "inst_003",
    createdAt: "2023-12-01T08:00:00Z",
    updatedAt: "2024-03-07T14:30:00Z",
    currentPrice: 49.99,
    durationHours: 42,

    id: 2,
    cat: "Design",
    sub: "Design Systems",
    img: "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=400&h=220&fit=crop&q=80",
    hours: 42,
    reviews: 2847,
    students: 12400,
    projects: 6,
    instColor: "#e74c3c",
    topics: ["Figma", "Design Tokens", "Components"],
    badges: ["best", "intern"],
    internship: true,
    handson: true,
    certificate: true,
    lang: "English",
    desc: "Build scalable design systems from first principles. Used by teams at Airbnb, Figma, and Stripe.",
  },

  {
    _id: "course_008",
    title: "AWS Solutions Architect Professional Certification Prep",
    description:
      "Comprehensive preparation for AWS Solutions Architect Professional exam. Deep dive into AWS services, architecture best practices, security, high availability, and disaster recovery. Includes practice exams, real-world scenarios, and exam tips.",
    shortDescription:
      "Pass AWS SAP certification with comprehensive exam preparation and hands-on labs.",
    instructor: "inst_004",
    category: "programming",
    level: "advanced",
    language: "English",
    price: 69.99,
    currency: "USD",
    discountPrice: 39.99,
    discountValidUntil: "2024-04-15T23:59:59Z",
    modules: ["module_013", "module_014"],
    totalModules: 2,
    totalLessons: 52,
    totalDuration: 3120,
    thumbnail: {
      public_id: "gha/courses/aws-sap-cert",
      secure_url:
        "https://images.unsplash.com/photo-1516321318423-f06f70504646?w=800&h=600&fit=crop",
    },
    trailerVideo: "https://vimeo.com/aws-sap-trailer",
    previewLessons: ["lesson_085", "lesson_090"],
    status: "published",
    isPublished: true,
    publishedAt: "2023-10-15T10:00:00Z",
    enrolledCount: 11200,
    maxStudents: 4000,
    rating: 4.85,
    totalReviews: 2103,
    learningOutcomes: [
      "Master AWS core services and their integration",
      "Design secure, resilient, and performance-optimized architectures",
      "Understand multi-tier application design and microservices",
      "Design disaster recovery and business continuity strategies",
      "Implement network and content delivery solutions",
      "Master identity and access management on AWS",
      "Pass AWS Solutions Architect Professional (SAP-C02) exam",
    ],
    prerequisites: [
      "AWS Solutions Architect Associate knowledge",
      "AWS hands-on experience",
      "Networking and security fundamentals",
    ],
    targetAudience: [
      "AWS certification aspirants",
      "Cloud architects and engineers",
      "DevOps professionals",
      "System engineers transitioning to cloud",
    ],
    tags: ["aws", "cloud-computing", "certification", "architecture", "devops", "docker", "kubernetes"],
    seoTitle: "AWS Solutions Architect Professional Certification - Complete Guide",
    seoDescription:
      "Ace AWS SAP certification. Comprehensive course with practice exams, labs, and real-world scenarios.",
    isFree: false,
    allowPreview: true,
    certificateEnabled: true,
    certificates: ["cert_008"],
    createdBy: "inst_004",
    updatedBy: "inst_004",
    createdAt: "2023-09-20T12:00:00Z",
    updatedAt: "2024-03-06T11:00:00Z",
    currentPrice: 39.99,
    durationHours: 52,

    id: 7,
    cat: "DevOps",
    sub: "Cloud",
    img: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=400&h=220&fit=crop&q=80",
    hours: 52,
    reviews: 2103,
    students: 11200,
    projects: 4,
    instColor: "#f5c518",
    topics: ["AWS", "Docker", "Kubernetes"],
    badges: ["best"],
    internship: true,
    handson: true,
    certificate: true,
    lang: "English",
    desc: "From cloud basics to Solutions Architect level. Hands-on labs with real AWS infrastructure.",
  },

  // ── Extra courses for listing variety ──
  {
    _id: "course_010",
    title: "Python for Data Science & Analytics",
    description:
      "Your complete introduction to Python programming for data analysis, visualization, and machine learning. Covers pandas, NumPy, matplotlib, seaborn, and scikit-learn.",
    shortDescription: "Learn Python for data analysis, visualization, and ML from scratch.",
    instructor: "inst_002",
    category: "data-science",
    level: "beginner",
    language: "English",
    price: 0,
    currency: "USD",
    discountPrice: null,
    discountValidUntil: null,
    modules: [],
    totalModules: 5,
    totalLessons: 62,
    totalDuration: 1680,
    thumbnail: {
      public_id: "gha/courses/python-datascience",
      secure_url:
        "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=600&fit=crop",
    },
    status: "published",
    isPublished: true,
    publishedAt: "2023-07-01T09:00:00Z",
    enrolledCount: 41000,
    maxStudents: 50000,
    rating: 4.7,
    totalReviews: 8820,
    learningOutcomes: [
      "Master Python programming fundamentals",
      "Work with pandas and NumPy for data manipulation",
      "Create compelling visualizations with matplotlib and seaborn",
      "Apply basic machine learning with scikit-learn",
    ],
    prerequisites: ["No prior programming experience required", "Basic math knowledge"],
    targetAudience: ["Complete beginners", "Analysts wanting to learn Python", "Students in STEM"],
    tags: ["python", "data-science", "sql", "pandas", "analytics"],
    isFree: true,
    allowPreview: true,
    certificateEnabled: false,
    certificates: [],
    createdBy: "inst_002",
    updatedBy: "inst_002",
    createdAt: "2023-06-01T09:00:00Z",
    updatedAt: "2024-02-01T09:00:00Z",
    currentPrice: 0,
    durationHours: 28,

    id: 5,
    cat: "Data Science",
    sub: "Analytics",
    img: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=220&fit=crop&q=80",
    hours: 28,
    reviews: 8820,
    students: 41000,
    projects: 4,
    instColor: "#27ae60",
    topics: ["Python", "SQL", "Pandas"],
    badges: ["free"],
    internship: false,
    handson: true,
    certificate: false,
    lang: "English",
    desc: "Your complete introduction to Python programming for data analysis, visualization, and ML.",
  },

  {
    _id: "course_011",
    title: "Ethical Hacking & Penetration Testing",
    description:
      "Master ethical hacking with real-world CTF challenges. CEH exam prep included. Learn Kali Linux, network scanning, exploitation, web application hacking, and reporting.",
    shortDescription: "Master ethical hacking and penetration testing from zero to expert.",
    instructor: "inst_002",
    category: "programming",
    level: "intermediate",
    language: "English",
    price: 169,
    currency: "USD",
    discountPrice: 109,
    discountValidUntil: "2024-06-01T23:59:59Z",
    modules: [],
    totalModules: 6,
    totalLessons: 74,
    totalDuration: 3000,
    thumbnail: {
      public_id: "gha/courses/ethical-hacking",
      secure_url:
        "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800&h=600&fit=crop",
    },
    status: "published",
    isPublished: true,
    publishedAt: "2023-05-01T10:00:00Z",
    enrolledCount: 10800,
    maxStudents: 15000,
    rating: 4.9,
    totalReviews: 2341,
    learningOutcomes: [
      "Master ethical hacking methodology and tools",
      "Perform network scanning and vulnerability assessment",
      "Exploit common web application vulnerabilities",
      "Prepare for CEH certification",
    ],
    prerequisites: [
      "Basic networking knowledge",
      "Understanding of Linux command line",
    ],
    targetAudience: [
      "Cybersecurity enthusiasts",
      "IT professionals entering security",
      "Developers wanting to secure their apps",
    ],
    tags: ["cybersecurity", "hacking", "networking", "kali-linux", "security"],
    isFree: false,
    allowPreview: true,
    certificateEnabled: true,
    certificates: [],
    createdBy: "inst_002",
    updatedBy: "inst_002",
    createdAt: "2023-04-01T10:00:00Z",
    updatedAt: "2024-03-01T10:00:00Z",
    currentPrice: 109,
    durationHours: 50,

    id: 11,
    cat: "Cybersecurity",
    sub: "Pen Testing",
    img: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=400&h=220&fit=crop&q=80",
    hours: 50,
    reviews: 2341,
    students: 10800,
    projects: 7,
    instColor: "#3498db",
    topics: ["Security", "Networking", "Kali Linux"],
    badges: ["hot"],
    internship: false,
    handson: true,
    certificate: true,
    lang: "English",
    desc: "Master ethical hacking with real-world CTF challenges. CEH exam prep included.",
  },

  {
    _id: "course_012",
    title: "Flutter & Dart Mobile Development",
    description:
      "Build beautiful cross-platform iOS and Android apps with Flutter and Dart. Covers navigation, state management, Firebase integration, and App Store publishing.",
    shortDescription: "Build beautiful cross-platform iOS and Android apps with Flutter.",
    instructor: "inst_002",
    category: "programming",
    level: "beginner",
    language: "English",
    price: 119,
    currency: "USD",
    discountPrice: 79,
    discountValidUntil: "2024-05-30T23:59:59Z",
    modules: [],
    totalModules: 4,
    totalLessons: 68,
    totalDuration: 2100,
    thumbnail: {
      public_id: "gha/courses/flutter-dart",
      secure_url:
        "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=800&h=600&fit=crop",
    },
    status: "published",
    isPublished: true,
    publishedAt: "2023-11-01T09:00:00Z",
    enrolledCount: 9300,
    maxStudents: 12000,
    rating: 4.75,
    totalReviews: 1892,
    learningOutcomes: [
      "Build cross-platform mobile apps with Flutter",
      "Master Dart programming language",
      "Integrate Firebase for backend services",
      "Publish apps to iOS App Store and Google Play",
    ],
    prerequisites: [
      "Basic programming knowledge helpful",
      "No mobile development experience required",
    ],
    targetAudience: [
      "Web developers entering mobile",
      "Beginners wanting to build apps",
      "Entrepreneurs wanting to launch mobile products",
    ],
    tags: ["flutter", "dart", "mobile", "ios", "android", "cross-platform"],
    isFree: false,
    allowPreview: true,
    certificateEnabled: true,
    certificates: [],
    createdBy: "inst_002",
    updatedBy: "inst_002",
    createdAt: "2023-10-01T09:00:00Z",
    updatedAt: "2024-02-15T09:00:00Z",
    currentPrice: 79,
    durationHours: 35,

    id: 10,
    cat: "Mobile",
    sub: "Cross-Platform",
    img: "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=400&h=220&fit=crop&q=80",
    hours: 35,
    reviews: 1892,
    students: 9300,
    projects: 6,
    instColor: "#27ae60",
    topics: ["Flutter", "Dart", "Mobile"],
    badges: ["new"],
    internship: true,
    handson: true,
    certificate: true,
    lang: "English",
    desc: "Build beautiful cross-platform iOS and Android apps with Flutter and Dart from scratch.",
  },
];

// ════════════════════════════════════════
// MODULES (unchanged from original)
// ════════════════════════════════════════

export const mockModules = [
  {
    _id: "module_001",
    title: "React Fundamentals & Hooks Deep Dive",
    description:
      "Master React 18 fundamentals and advanced hooks patterns. Learn functional components, useState, useEffect, useContext, and custom hooks development.",
    course: "course_001",
    order: 1,
    lessons: ["lesson_001", "lesson_002", "lesson_003"],
    totalLessons: 3,
    totalDuration: 540,
    thumbnail: {
      public_id: "gha/modules/react-hooks-001",
      secure_url:
        "https://images.unsplash.com/photo-1633356122544-f134324ef6db?w=200&h=150&fit=crop",
    },
    isPublished: true,
    publishedAt: "2023-06-15T10:00:00Z",
    objectives: [
      "Understand React component lifecycle and rendering optimization",
      "Master all React Hooks and their use cases",
      "Build custom hooks for reusable logic",
      "Implement context API for state management",
    ],
    createdBy: "inst_001",
    updatedBy: "inst_001",
    createdAt: "2023-06-01T08:00:00Z",
    updatedAt: "2024-03-10T15:30:00Z",
    lessonDetails: [
      { _id: "lesson_001", title: "React 18 Features & Concurrent Rendering", isFree: true, duration: 1200, type: "video" },
      { _id: "lesson_002", title: "Understanding React Hooks Architecture", isFree: false, duration: 1560, type: "video" },
      { _id: "lesson_003", title: "useState, useEffect & useContext Mastery", isFree: false, duration: 1740, type: "assignment" },
    ],
  },
  {
    _id: "module_002",
    title: "State Management with Redux & TypeScript",
    description:
      "Learn Redux Toolkit, Redux Saga, middleware patterns, and TypeScript integration. Build scalable applications with predictable state management.",
    course: "course_001",
    order: 2,
    lessons: ["lesson_004", "lesson_005", "lesson_006"],
    totalLessons: 3,
    totalDuration: 720,
    thumbnail: { public_id: "gha/modules/redux-ts-001", secure_url: "https://images.unsplash.com/photo-1633356122544-f134324ef6db?w=200&h=150&fit=crop" },
    isPublished: true,
    publishedAt: "2023-06-20T14:00:00Z",
    objectives: [
      "Implement Redux and Redux Toolkit patterns",
      "Master slices, actions, and selectors",
      "Handle async operations with thunks and sagas",
      "Integrate TypeScript with Redux",
    ],
    createdBy: "inst_001",
    updatedBy: "inst_001",
    createdAt: "2023-06-05T09:00:00Z",
    updatedAt: "2024-03-10T15:30:00Z",
    lessonDetails: [
      { _id: "lesson_004", title: "Redux Essentials & Store Setup", isFree: true, duration: 1320, type: "video" },
      { _id: "lesson_005", title: "Redux Middleware & Async Thunks", isFree: false, duration: 1680, type: "article" },
      { _id: "lesson_006", title: "TypeScript with Redux", isFree: false, duration: 1440, type: "material" },
    ],
  },
  {
    _id: "module_003",
    title: "Performance & Advanced Patterns",
    description:
      "Optimize React applications with code splitting, lazy loading, memoization, and advanced patterns. Master real-world performance techniques.",
    course: "course_001",
    order: 3,
    lessons: ["lesson_007", "lesson_008", "lesson_009", "lesson_010"],
    totalLessons: 4,
    totalDuration: 1080,
    thumbnail: { public_id: "gha/modules/react-perf-001", secure_url: "https://images.unsplash.com/photo-1633356122544-f134324ef6db?w=200&h=150&fit=crop" },
    isPublished: true,
    publishedAt: "2023-07-01T10:00:00Z",
    objectives: [
      "Profile and optimize React application performance",
      "Implement code splitting and lazy loading",
      "Master memoization and memo patterns",
      "Handle large lists and data virtualization",
    ],
    createdBy: "inst_001",
    updatedBy: "inst_001",
    createdAt: "2023-06-15T10:00:00Z",
    updatedAt: "2024-03-10T15:30:00Z",
    lessonDetails: [
      { _id: "lesson_007", title: "React Performance Profiling", isFree: false, duration: 1560, type: "video" },
      { _id: "lesson_008", title: "Code Splitting & Lazy Loading", isFree: false, duration: 1380, type: "video" },
      { _id: "lesson_009", title: "Memoization: useMemo & useCallback", isFree: false, duration: 1260, type: "video" },
      { _id: "lesson_010", title: "Virtualization for Large Lists", isFree: false, duration: 1440, type: "assignment" },
    ],
  },
  // Design course modules
  {
    _id: "module_011",
    title: "The Philosophy of Design Systems",
    description: "Why design systems exist and how to think about them at scale.",
    course: "course_006",
    order: 1,
    lessons: [],
    totalLessons: 4,
    totalDuration: 135,
    thumbnail: { public_id: "", secure_url: "" },
    isPublished: true,
    publishedAt: "2024-01-01T09:00:00Z",
    objectives: ["Understand design system fundamentals", "Learn when to build vs buy"],
    createdBy: "inst_003",
    updatedBy: "inst_003",
    createdAt: "2023-12-01T08:00:00Z",
    updatedAt: "2024-03-07T14:30:00Z",
    lessonDetails: [
      { _id: "l_011_01", title: "Why most design systems fail (and what to do instead)", isFree: true, duration: 1680, type: "video" },
      { _id: "l_011_02", title: "Atomic Design Theory revisited in 2025", isFree: true, duration: 1320, type: "video" },
      { _id: "l_011_03", title: "Mapping your product to a system architecture", isFree: false, duration: 2040, type: "video" },
      { _id: "l_011_04", title: "Stakeholder alignment and system governance", isFree: false, duration: 2460, type: "video" },
    ],
  },
  {
    _id: "module_012",
    title: "Design Tokens — The Foundation",
    description: "Build a robust token foundation for color, typography, spacing, and more.",
    course: "course_006",
    order: 2,
    lessons: [],
    totalLessons: 6,
    totalDuration: 220,
    thumbnail: { public_id: "", secure_url: "" },
    isPublished: true,
    publishedAt: "2024-01-15T09:00:00Z",
    objectives: ["Build a complete token system", "Use Style Dictionary and Tokens Studio"],
    createdBy: "inst_003",
    updatedBy: "inst_003",
    createdAt: "2023-12-15T08:00:00Z",
    updatedAt: "2024-03-07T14:30:00Z",
    lessonDetails: [
      { _id: "l_012_01", title: "Token taxonomy: primitive, semantic, and component tokens", isFree: false, duration: 1920, type: "video" },
      { _id: "l_012_02", title: "Color systems: ramps, roles, and dark mode", isFree: false, duration: 2760, type: "video" },
      { _id: "l_012_03", title: "Typography tokens and fluid type scales", isFree: false, duration: 2280, type: "video" },
      { _id: "l_012_04", title: "Spacing, radius, and elevation tokens", isFree: false, duration: 1740, type: "video" },
      { _id: "l_012_05", title: "Token tooling: Style Dictionary + Tokens Studio", isFree: false, duration: 3120, type: "video" },
      { _id: "l_012_06", title: "Workshop: Build your token foundation from scratch", isFree: false, duration: 2580, type: "assignment" },
    ],
  },
];

// ════════════════════════════════════════
// INSTRUCTORS — course-detail compatible
// ════════════════════════════════════════

export const mockCourseInstructors = {
  inst_001: {
    _id: "inst_001",
    firstName: "James",
    lastName: "Wright",
    fullName: "James Wright",
    headline: "Senior Full-Stack Engineer · React Core Contributor",
    bio: "James Wright is a senior full-stack engineer with 12 years of experience building production React applications at companies like Stripe, Vercel, and startups from seed to Series C. He has contributed to the React core library and maintains several popular open-source packages with over 200k weekly downloads. James is passionate about teaching production-grade engineering practices that are often skipped in traditional courses.",
    expertise: ["React", "TypeScript", "Node.js", "System Architecture"],
    courses: ["course_001", "course_002"],
    rating: { averageRating: 4.87, totalReviews: 2348 },
    totalStudents: 14352,
  },
  inst_002: {
    _id: "inst_002",
    firstName: "Sarah",
    lastName: "Kim",
    fullName: "Sarah Kim",
    headline: "ML Engineer @ DeepMind · PhD Stanford",
    bio: "Sarah Kim is a machine learning engineer at DeepMind and holds a PhD in Computer Science from Stanford. Her research focuses on practical applications of deep learning in production environments. She has published papers at NeurIPS, ICML, and ICLR. Sarah believes ML should be accessible to every engineer, not just researchers — and her courses reflect that philosophy with a strong emphasis on practical, deployable models.",
    expertise: ["Machine Learning", "Deep Learning", "Python", "PyTorch"],
    courses: ["course_004"],
    rating: { averageRating: 4.93, totalReviews: 567 },
    totalStudents: 9800,
  },
  inst_003: {
    _id: "inst_003",
    firstName: "Alex",
    lastName: "Chen",
    fullName: "Alex Chen",
    headline: "Design Lead @ Figma · Former Google, Airbnb",
    bio: "Alex Chen is a Design Lead at Figma with over a decade of experience building design systems at scale. Previously, she led the design systems team at Airbnb (where she contributed to Airbnb's DLS) and Google (Material Design 3). Her work has influenced how millions of designers and developers build products. She's a speaker at Config, Design Systems Conference, and Smashing Conf. Alex is obsessed with the intersection of design craft and engineering rigor — and believes great design systems are as much about culture as they are about components.",
    expertise: ["Figma", "Design Systems", "UI/UX", "Design Ops"],
    courses: ["course_006"],
    rating: { averageRating: 4.96, totalReviews: 2847 },
    totalStudents: 18402,
  },
  inst_004: {
    _id: "inst_004",
    firstName: "Maya",
    lastName: "Patel",
    fullName: "Maya Patel",
    headline: "AWS Solutions Architect · Cloud Consultant",
    bio: "Maya Patel is a certified AWS Solutions Architect Professional with 8 years of experience designing cloud infrastructure for enterprises. She has helped over 50 companies migrate to AWS, saving them millions in infrastructure costs. Maya holds 7 AWS certifications and contributes regularly to AWS re:Invent as a speaker.",
    expertise: ["AWS", "Cloud Architecture", "DevOps", "Security"],
    courses: ["course_008"],
    rating: { averageRating: 4.85, totalReviews: 234 },
    totalStudents: 11200,
  },
};

// ════════════════════════════════════════
// FILTER & SORT HELPERS (for CourseListing)
// ════════════════════════════════════════

/**
 * Filter courses based on active filters and search query
 */
export function filterCourses(courses, activeFilters, searchQuery) {
  return courses.filter((c) => {
    // Search
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const match =
        c.title.toLowerCase().includes(q) ||
        (c.desc || c.shortDescription || "").toLowerCase().includes(q) ||
        (c.topics || c.tags || []).some((t) => t.toLowerCase().includes(q)) ||
        (typeof c.instructor === "string" && c.instructor.toLowerCase().includes(q));
      if (!match) return false;
    }

    // Category
    if (activeFilters.category?.length) {
      const cat = c.cat || c.category || "";
      if (!activeFilters.category.some((fc) => cat.toLowerCase().includes(fc.toLowerCase()))) return false;
    }

    // Level
    if (activeFilters.level?.length) {
      const lvl = c.level || "";
      if (!activeFilters.level.some((fl) => lvl.toLowerCase().includes(fl.toLowerCase()))) return false;
    }

    // Language
    if (activeFilters.language?.length) {
      if (!activeFilters.language.includes(c.lang || c.language)) return false;
    }

    // Instructor
    if (activeFilters.instructor?.length) {
      const inst = typeof c.instructor === "string" ? c.instructor : "";
      if (!activeFilters.instructor.includes(inst)) return false;
    }

    // Price free/paid
    if (activeFilters.price?.length) {
      const wantsFree = activeFilters.price.includes("Free");
      const wantsPaid = activeFilters.price.includes("Paid");
      const price = c.price;
      if (wantsFree && !wantsPaid && price !== 0) return false;
      if (wantsPaid && !wantsFree && price === 0) return false;
    }

    // Price range
    if (activeFilters.priceRange) {
      const [mn, mx] = activeFilters.priceRange;
      const price = c.discountPrice ?? c.price;
      if (price < mn || price > mx) return false;
    }

    // Rating
    if (activeFilters.rating?.length) {
      const minR = Math.min(...activeFilters.rating.map((r) => parseFloat(r)));
      if (c.rating < minR) return false;
    }

    // Duration
    if (activeFilters.duration?.length) {
      const h = c.hours || c.durationHours || 0;
      const ok = activeFilters.duration.some((d) => {
        if (d === "0-5 hrs") return h <= 5;
        if (d === "5-20 hrs") return h > 5 && h <= 20;
        if (d === "20+ hrs") return h > 20;
        return false;
      });
      if (!ok) return false;
    }

    // Topics
    if (activeFilters.topics?.length) {
      const courseTags = [...(c.topics || []), ...(c.tags || [])];
      if (!activeFilters.topics.some((t) => courseTags.some((ct) => ct.toLowerCase().includes(t.toLowerCase())))) return false;
    }

    // Flags
    if (activeFilters.flags?.length) {
      if (activeFilters.flags.includes("hands-on") && !c.handson) return false;
      if (activeFilters.flags.includes("internship") && !c.internship) return false;
      if (activeFilters.flags.includes("certificate") && !c.certificate && !c.certificateEnabled) return false;
    }

    // Projects
    if (activeFilters.projects?.length) {
      const p = c.projects || 0;
      const ok = activeFilters.projects.some((range) => {
        if (range === "1-3") return p >= 1 && p <= 3;
        if (range === "4-6") return p >= 4 && p <= 6;
        if (range === "7+") return p >= 7;
        return false;
      });
      if (!ok) return false;
    }

    return true;
  });
}

/**
 * Sort courses by the selected mode
 */
export function sortCourses(courses, sortMode) {
  return [...courses].sort((a, b) => {
    if (sortMode === "rating") return b.rating - a.rating;
    if (sortMode === "price-asc") return (a.discountPrice ?? a.price) - (b.discountPrice ?? b.price);
    if (sortMode === "price-desc") return (b.discountPrice ?? b.price) - (a.discountPrice ?? a.price);
    if (sortMode === "newest") return (b.id || 0) - (a.id || 0);
    if (sortMode === "duration-asc") return (a.hours || a.durationHours || 0) - (b.hours || b.durationHours || 0);
    if (sortMode === "duration-desc") return (b.hours || b.durationHours || 0) - (a.hours || a.durationHours || 0);
    return (b.students || b.enrolledCount || 0) - (a.students || a.enrolledCount || 0); // popular
  });
}

/**
 * Get a course by ID (string _id or numeric id)
 */
export function getCourseById(id) {
  return mockCourses.find((c) => c._id === id || String(c.id) === String(id)) || null;
}

/**
 * Get modules for a course
 */
export function getModulesByCourse(courseId) {
  return mockModules.filter((m) => m.course === courseId).sort((a, b) => a.order - b.order);
}

/**
 * Get related courses (same category, different id)
 */
export function getRelatedCourses(courseId, limit = 3) {
  const course = getCourseById(courseId);
  if (!course) return [];
  return mockCourses
    .filter((c) => c._id !== courseId && c.category === course.category)
    .slice(0, limit);
}

/**
 * Get instructor by ID
 */
export function getInstructorById(id) {
  return mockCourseInstructors[id] || null;
}

export default {
  mockCourses,
  mockModules,
  mockCourseInstructors,
  filterCourses,
  sortCourses,
  getCourseById,
  getModulesByCourse,
  getRelatedCourses,
  getInstructorById,
};