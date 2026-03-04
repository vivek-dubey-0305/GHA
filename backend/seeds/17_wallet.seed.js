import dotenv from "dotenv";
import mongoose from "mongoose";
import connectDB from "../configs/connection.config.js";
import { loadSeedData, saveSeedData, logCreated, separator } from "./seed-helpers.js";

dotenv.config();

// Import Wallet model directly from model file
const walletTransactionSchema = new mongoose.Schema({
    type: { type: String, enum: ["credit", "debit"], required: true },
    amount: { type: Number, required: true, min: 0.01 },
    currency: { type: String, default: "INR", enum: ["INR", "USD", "EUR", "GBP"] },
    source: {
        type: String,
        required: true,
        enum: ["course_earning", "course_reward", "referral_bonus", "refund", "payout", 
               "admin_credit", "admin_debit", "platform_commission", "bonus", "reversal"]
    },
    description: { type: String, trim: true, maxlength: 500 },
    referenceId: { type: mongoose.Schema.Types.ObjectId, refPath: "transactions.referenceModel" },
    referenceModel: { type: String, enum: ["Payment", "Payout", "Course", "Enrollment", null], default: null },
    balanceAfter: { type: Number, required: true, min: 0 },
    status: { type: String, enum: ["pending", "completed", "failed", "reversed"], default: "completed" },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
    createdAt: { type: Date, default: Date.now }
}, { _id: true });

const walletSchema = new mongoose.Schema({
    owner: { type: mongoose.Schema.Types.ObjectId, required: true, refPath: "ownerModel" },
    ownerModel: { type: String, required: true, enum: ["User", "Instructor"] },
    balance: { type: Number, default: 0, min: 0 },
    currency: { type: String, default: "INR", enum: ["INR", "USD", "EUR", "GBP"] },
    lifetimeEarnings: { type: Number, default: 0, min: 0 },
    totalWithdrawn: { type: Number, default: 0, min: 0 },
    totalCredited: { type: Number, default: 0, min: 0 },
    totalDebited: { type: Number, default: 0, min: 0 },
    holdAmount: { type: Number, default: 0, min: 0 },
    transactions: [walletTransactionSchema],
    isActive: { type: Boolean, default: true },
    isFrozen: { type: Boolean, default: false },
    frozenReason: { type: String, trim: true },
    frozenAt: Date,
    lastTransactionAt: Date,
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin" }
}, { timestamps: true, collection: "wallets" });

const Wallet = mongoose.models.Wallet || mongoose.model("Wallet", walletSchema);

/**
 * Seed Script: Create Wallets for Users and Instructors
 * Usage: node seeds/17_wallet.seed.js
 * 
 * Creates wallets for:
 * - 3 Users (with some balance from enrollments)
 * - 3 Instructors (with earnings from course sales)
 */

export const seedWallet = async () => {
    console.log("\n💰 Step 17: Seeding Wallets...");
    separator();

    const seedData = loadSeedData();
    if (!seedData.userIds || !seedData.instructorIds) {
        throw new Error("User/Instructor IDs not found. Run previous seeds first.");
    }

    // Check if wallets already exist
    const existingCount = await Wallet.countDocuments({
        $or: [
            { owner: { $in: seedData.userIds.map(id => new mongoose.Types.ObjectId(id)) } },
            { owner: { $in: seedData.instructorIds.map(id => new mongoose.Types.ObjectId(id)) } }
        ]
    });

    if (existingCount > 0) {
        console.log(`   ⚠️  ${existingCount} wallets already exist. Retrieving IDs...`);
        const existing = await Wallet.find({
            $or: [
                { owner: { $in: seedData.userIds.map(id => new mongoose.Types.ObjectId(id)) } },
                { owner: { $in: seedData.instructorIds.map(id => new mongoose.Types.ObjectId(id)) } }
            ]
        });
        const walletIds = existing.map(w => w._id.toString());
        saveSeedData({ walletIds });
        return walletIds;
    }

    const walletIds = [];

    // Create wallets for Users
    console.log("\n   👤 Creating User Wallets:");
    for (let i = 0; i < seedData.userIds.length; i++) {
        const userId = seedData.userIds[i];
        const initialBalance = (i + 1) * 100; // 100, 200, 300

        const wallet = new Wallet({
            owner: userId,
            ownerModel: "User",
            balance: initialBalance,
            currency: "INR",
            lifetimeEarnings: 0,
            totalCredited: initialBalance,
            totalDebited: 0,
            totalWithdrawn: 0,
            holdAmount: 0,
            transactions: [
                {
                    type: "credit",
                    amount: initialBalance,
                    currency: "INR",
                    source: "bonus",
                    description: "Welcome bonus for new user",
                    balanceAfter: initialBalance,
                    status: "completed",
                    metadata: { reason: "signup_bonus" }
                }
            ],
            isActive: true,
            isFrozen: false,
            lastTransactionAt: new Date()
        });

        await wallet.save();
        walletIds.push(wallet._id.toString());
        logCreated(`User ${i + 1} Wallet`, wallet._id.toString(), `Balance: ₹${initialBalance}`);
    }

    // Create wallets for Instructors
    console.log("\n   👨‍🏫 Creating Instructor Wallets:");
    for (let i = 0; i < seedData.instructorIds.length; i++) {
        const instructorId = seedData.instructorIds[i];
        // Instructors have earnings based on enrollments
        const courseEarnings = (i + 1) * 5000; // 5000, 10000, 15000
        const platformFee = Math.round(courseEarnings * 0.1); // 10% platform fee
        const netEarnings = courseEarnings - platformFee;

        const wallet = new Wallet({
            owner: instructorId,
            ownerModel: "Instructor",
            balance: netEarnings,
            currency: "INR",
            lifetimeEarnings: netEarnings,
            totalCredited: courseEarnings,
            totalDebited: platformFee,
            totalWithdrawn: 0,
            holdAmount: 0,
            transactions: [
                {
                    type: "credit",
                    amount: courseEarnings,
                    currency: "INR",
                    source: "course_earning",
                    description: `Earnings from course enrollments`,
                    balanceAfter: courseEarnings,
                    status: "completed",
                    metadata: { enrollments: i + 3 }
                },
                {
                    type: "debit",
                    amount: platformFee,
                    currency: "INR",
                    source: "platform_commission",
                    description: `Platform commission (10%)`,
                    balanceAfter: netEarnings,
                    status: "completed",
                    metadata: { commissionRate: 0.1 }
                }
            ],
            isActive: true,
            isFrozen: false,
            lastTransactionAt: new Date()
        });

        await wallet.save();
        walletIds.push(wallet._id.toString());
        logCreated(`Instructor ${i + 1} Wallet`, wallet._id.toString(), `Balance: ₹${netEarnings}`);
    }

    saveSeedData({ 
        walletIds,
        userWalletIds: walletIds.slice(0, 3),
        instructorWalletIds: walletIds.slice(3)
    });

    console.log(`\n   📊 Total wallets created: ${walletIds.length}`);
    console.log(`      - User wallets: 3`);
    console.log(`      - Instructor wallets: 3`);
    separator();

    return walletIds;
};

// Standalone execution
if (process.argv[1] && process.argv[1].includes("17_wallet")) {
    (async () => {
        try {
            await connectDB();
            await seedWallet();
            process.exit(0);
        } catch (error) {
            console.error("❌ Error:", error.message);
            process.exit(1);
        }
    })();
}
