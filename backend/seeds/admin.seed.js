import mongoose from "mongoose";
import dotenv from "dotenv";
import { Admin } from "../models/admin.model.js";
import connectDB from "../configs/connection.config.js";

dotenv.config();

/**
 * Seed Script: Create First Admin
 * Run once to initialize the first super admin
 * Usage: node seeds/admin.seed.js
 */

const seedFirstAdmin = async () => {
    try {
        console.log("🌱 Starting admin seed process...\n");

        // Connect to database
        await connectDB();
        console.log("✅ Database connected\n");

        // Check if admin already exists
        const existingAdmin = await Admin.findOne({ email: process.env.ADMIN_MAIL }).select("+email");
        if (existingAdmin) {
            console.log("⚠️  Admin already exists with email:", process.env.ADMIN_MAIL);
            console.log("Skipping seed process. To recreate, delete existing admin first.\n");
            process.exit(0);
        }

        // Validate environment variables
        if (!process.env.ADMIN_MAIL || !process.env.ADMIN_ID) {
            console.error("❌ Error: Missing environment variables");
            console.error("Required: ADMIN_MAIL and ADMIN_ID");
            process.exit(1);
        }

        // Create first super admin
        const firstAdmin = new Admin({
            name: "Super Admin",
            email: process.env.ADMIN_MAIL,
            password: process.env.ADMIN_ID,
            isSuperAdmin: true,
            isActive: true,
            permissions: [
                "manage_users",
                "manage_courses",
                "manage_instructors",
                "manage_payments",
                "view_analytics",
                "system_settings",
                "delete_data"
            ]
        });

        await firstAdmin.save();

        console.log("✅ Super Admin created successfully!\n");
        console.log("Admin Details:");
        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        console.log(`📧 Email: ${process.env.ADMIN_MAIL}`);
        console.log(`🔐 Password: ${process.env.ADMIN_ID}`);
        console.log(`👑 Super Admin: Yes`);
        console.log(`✓ Active: Yes`);
        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

        console.log("📝 Next Steps:");
        console.log("1. Use this admin account to login via OTP");
        console.log("2. OTP will be sent to your email after password verification");
        console.log("3. Verify OTP to get access & refresh tokens");
        console.log("4. Set cookies with tokens for subsequent requests\n");

        console.log("🔒 Security Notes:");
        console.log("• Keep credentials safe and change password after first login");
        console.log("• Use strong, unique passwords for all admin accounts");
        console.log("• OTP is valid for 10 minutes");
        console.log("• Access token is valid for 15 minutes");
        console.log("• Refresh token is valid for 7 days\n");

        process.exit(0);
    } catch (error) {
        console.error("❌ Error during admin seeding:", error.message);
        console.error("Stack trace:", error.stack);
        if (error.code === 11000) {
            console.error("Duplicate email - Admin already exists");
        }
        process.exit(1);
    }
};

// Run the seed
seedFirstAdmin();
