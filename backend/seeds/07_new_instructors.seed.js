import dotenv from "dotenv";
import connectDB from "../configs/connection.config.js";
import { Instructor } from "../models/instructor.model.js";
import { loadSeedData, saveSeedData, logCreated, separator } from "./seed-helpers.js";

dotenv.config();

/**
 * Seed Script: Create 3 NEW Instructors (Anime-themed with complete fields)
 * Usage: node seeds/07_new_instructors.seed.js
 * 
 * Creates 3 unique instructors with 2-5 years experience:
 * 1. Tanjiro Kamado - Web Development Expert
 * 2. Katsuki Bakugo - Cloud Computing & DevOps Specialist
 * 3. Izuku Midoriya - Data Science & AI Researcher
 * 
 * Total: 4 existing + 3 new = 7 instructors
 */

const NEW_INSTRUCTORS_DATA = [
    {
        firstName: "Tanjiro",
        lastName: "Kamado",
        email: "tanjiro.kamado@academy.com",
        phone: "+919876543104",
        password: "SlayerMaster@2024",
        dateOfBirth: new Date("1995-04-15"),
        gender: "Male",
        bio: "Full-Stack Web Development Specialist with 4 years of industry experience. Passionate about building responsive, scalable web applications. Expertise in React, Node.js, and modern web technologies. Taught 8,500+ students globally with 4.8★ rating.",
        address: {
            street: "Tech Valley Road",
            city: "Bangalore",
            state: "Karnataka",
            postalCode: "560102",
            country: "India"
        },
        specialization: ["web_development", "mobile_app_development"],
        qualifications: [
            {
                degree: "B.Tech Computer Science",
                institution: "Bangalore Institute of Technology",
                yearOfCompletion: 2020,
                certificationId: "BIT-2020-CS-245"
            },
            {
                degree: "React Advanced Patterns",
                institution: "Frontend Masters",
                yearOfCompletion: 2023,
                certificationId: "FM-REACT-2023-567"
            },
            {
                degree: "Node.js Backend Mastery",
                institution: "Udemy Pro",
                yearOfCompletion: 2022,
                certificationId: "UDEMY-NODE-2022-890"
            }
        ],
        yearsOfExperience: 4,
        totalStudentsTeaching: 8500,
        totalCourses: 3,
        totalLiveClasses: 42,
        isEmailVerified: true,
        isPhoneVerified: true,
        isDocumentsVerified: true,
        isKYCVerified: true,
        isActive: true,
        isSuspended: false,
        profilePicture: {
            public_id: "instructors/tanjiro-kamado",
            secure_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop"
        },
        rating: {
            averageRating: 4.8,
            totalReviews: 342,
            ratingBreakdown: {
                fivestar: 285,
                fourstar: 45,
                threestar: 10,
                twostar: 2,
                onestar: 0
            }
        },
        preferences: {
            emailNotifications: true,
            classReminders: true,
            studentUpdates: true,
            language: "en",
            timezone: "Asia/Kolkata"
        }
    },
    {
        firstName: "Katsuki",
        lastName: "Bakugo",
        email: "katsuki.bakugo@academy.com",
        phone: "+919876543105",
        password: "ExplosiveDev@2024",
        dateOfBirth: new Date("1994-08-22"),
        gender: "Male",
        bio: "Cloud Architecture & DevOps Expert with 5 years of experience building enterprise infrastructure. AWS & Kubernetes certified. Architected cloud solutions for 50+ companies. Believes in automation-first approach. 4.9★ instructor with 12,300+ students.",
        address: {
            street: "Cloud Summit Tower",
            city: "Mumbai",
            state: "Maharashtra",
            postalCode: "400070",
            country: "India"
        },
        specialization: ["cloud_computing", "devops", "cybersecurity"],
        qualifications: [
            {
                degree: "B.Tech IT",
                institution: "Delhi Institute of Technology",
                yearOfCompletion: 2019,
                certificationId: "DIT-2019-IT-123"
            },
            {
                degree: "AWS Solutions Architect Professional",
                institution: "Amazon Web Services",
                yearOfCompletion: 2021,
                certificationId: "AWS-SAP-2021-345"
            },
            {
                degree: "Certified Kubernetes Administrator",
                institution: "Linux Foundation",
                yearOfCompletion: 2022,
                certificationId: "CNCF-CKA-2022-678"
            },
            {
                degree: "Terraform Associate",
                institution: "HashiCorp",
                yearOfCompletion: 2023,
                certificationId: "HC-TERRAFORM-2023-901"
            }
        ],
        yearsOfExperience: 5,
        totalStudentsTeaching: 12300,
        totalCourses: 4,
        totalLiveClasses: 58,
        isEmailVerified: true,
        isPhoneVerified: true,
        isDocumentsVerified: true,
        isKYCVerified: true,
        isActive: true,
        isSuspended: false,
        profilePicture: {
            public_id: "instructors/katsuki-bakugo",
            secure_url: "https://images.unsplash.com/photo-1519085360771-9852520e8ce7?w=400&h=400&fit=crop"
        },
        rating: {
            averageRating: 4.9,
            totalReviews: 521,
            ratingBreakdown: {
                fivestar: 498,
                fourstar: 20,
                threestar: 3,
                twostar: 0,
                onestar: 0
            }
        },
        preferences: {
            emailNotifications: true,
            classReminders: true,
            studentUpdates: true,
            language: "en",
            timezone: "Asia/Kolkata"
        }
    },
    {
        firstName: "Izuku",
        lastName: "Midoriya",
        email: "izuku.midoriya@academy.com",
        phone: "+919876543106",
        password: "AllMight@2024",
        dateOfBirth: new Date("1996-02-10"),
        gender: "Male",
        bio: "Data Science & AI Researcher with 3 years of corporate experience. Specialized in Machine Learning, Deep Learning, and NLP. Former analyst at leading AI startup. Passionate educator committed to demystifying AI/ML. 4.7★ rating with 6,800+ enrolled students.",
        address: {
            street: "Innovation Park",
            city: "Hyderabad",
            state: "Telangana",
            postalCode: "500081",
            country: "India"
        },
        specialization: ["data_science", "artificial_intelligence", "machine_learning"],
        qualifications: [
            {
                degree: "B.Tech Data Science & AI",
                institution: "IIIT Hyderabad",
                yearOfCompletion: 2021,
                certificationId: "IIITH-2021-DSAI-456"
            },
            {
                degree: "Deep Learning Specialization",
                institution: "Coursera (Andrew Ng)",
                yearOfCompletion: 2022,
                certificationId: "COURSERA-DL-2022-789"
            },
            {
                degree: "TensorFlow Developer Certificate",
                institution: "Google TensorFlow",
                yearOfCompletion: 2023,
                certificationId: "GOOGLE-TF-2023-234"
            },
            {
                degree: "Advanced Python for Data Science",
                institution: "DataCamp Pro",
                yearOfCompletion: 2023,
                certificationId: "DATACAMP-PYTHON-2023-567"
            }
        ],
        yearsOfExperience: 3,
        totalStudentsTeaching: 6800,
        totalCourses: 2,
        totalLiveClasses: 31,
        isEmailVerified: true,
        isPhoneVerified: true,
        isDocumentsVerified: true,
        isKYCVerified: true,
        isActive: true,
        isSuspended: false,
        profilePicture: {
            public_id: "instructors/izuku-midoriya",
            secure_url: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop"
        },
        rating: {
            averageRating: 4.7,
            totalReviews: 289,
            ratingBreakdown: {
                fivestar: 235,
                fourstar: 45,
                threestar: 8,
                twostar: 1,
                onestar: 0
            }
        },
        preferences: {
            emailNotifications: true,
            classReminders: true,
            studentUpdates: true,
            language: "en",
            timezone: "Asia/Kolkata"
        }
    }
];

export const seedNewInstructors = async () => {
    console.log("\n🆕 Adding 3 NEW Instructors (Anime-themed)...");
    separator();

    const seedData = loadSeedData();
    const newInstructorIds = [];
    let successCount = 0;
    let skipCount = 0;

    for (let i = 0; i < NEW_INSTRUCTORS_DATA.length; i++) {
        const instructorData = NEW_INSTRUCTORS_DATA[i];

        try {
            // Check if already exists
            const existing = await Instructor.findOne({ email: instructorData.email }).select("+email");
            if (existing) {
                console.log(`\n   ⚠️  Instructor already exists: ${instructorData.email}`);
                console.log(`      ID: ${existing._id}`);
                newInstructorIds.push(existing._id.toString());
                skipCount++;
                continue;
            }

            // Create new instructor
            const instructor = new Instructor({
                ...instructorData,
                // CF fields explicitly set to null (not included)
                cfLiveInputId: null,
                cfRtmpUrl: null,
                cfRtmpKey: null,
                cfSrtUrl: null,
                cfWebRTCUrl: null,
                // Ensure arrays are initialized
                courses: [],
                liveClasses: [],
                qualifications: instructorData.qualifications || [],
                sessions: [],
                // Initialize empty arrays for nested data
                loginAttempts: 0,
                otpAttempts: 0,
                isOtpVerified: true
            });

            await instructor.save();
            const id = instructor._id.toString();
            newInstructorIds.push(id);

            console.log(`\n   ✅ Instructor ${i + 1} created successfully:`);
            logCreated(`ID`, id, instructorData.email);
            console.log(`      👤 Name: ${instructorData.firstName} ${instructorData.lastName}`);
            console.log(`      📧 Email: ${instructorData.email}`);
            console.log(`      🔑 Password: ${instructorData.password}`);
            console.log(`      🎓 Specialization: ${instructorData.specialization.join(", ")}`);
            console.log(`      📚 Experience: ${instructorData.yearsOfExperience} years`);
            console.log(`      👥 Students: ${instructorData.totalStudentsTeaching}`);
            console.log(`      ⭐ Rating: ${instructorData.rating.averageRating}/5 (${instructorData.rating.totalReviews} reviews)`);
            console.log(`      🎬 Live Classes: ${instructorData.totalLiveClasses}`);

            successCount++;
        } catch (error) {
            console.error(`\n   ❌ Error creating instructor ${i + 1}:`, error.message);
            if (error.code === 11000) {
                const field = Object.keys(error.keyPattern)[0];
                console.log(`      Duplicate ${field}: ${instructorData[field]}`);
            }
        }
    }

    // Save to seed data
    saveSeedData({
        newInstructorIds,
        newInstructor1: newInstructorIds[0],
        newInstructor2: newInstructorIds[1],
        newInstructor3: newInstructorIds[2]
    });

    separator();
    console.log(`\n   📊 Summary:`);
    console.log(`      ✅ Created: ${successCount}`);
    console.log(`      ⏭️  Skipped: ${skipCount}`);
    console.log(`      📈 Total New Instructors: ${newInstructorIds.length}`);
    console.log(`      🎯 Total Instructors in DB: 4 (existing) + ${successCount} (new) = ${4 + successCount}`);
    separator();

    return newInstructorIds;
};

// Standalone execution
if (process.argv[1] && process.argv[1].includes("07_new_instructors")) {
    (async () => {
        try {
            await connectDB();
            await seedNewInstructors();
            console.log("\n✨ Seeding completed successfully!");
            process.exit(0);
        } catch (error) {
            console.error("\n❌ Seeding failed:", error.message);
            console.error(error.stack);
            process.exit(1);
        }
    })();
}

export default seedNewInstructors;
