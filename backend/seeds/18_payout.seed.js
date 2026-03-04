import dotenv from "dotenv";
import mongoose from "mongoose";
import connectDB from "../configs/connection.config.js";
import { loadSeedData, saveSeedData, logCreated, separator } from "./seed-helpers.js";

dotenv.config();

// Import Payout model schema directly
const payoutSchema = new mongoose.Schema({
    owner: { type: mongoose.Schema.Types.ObjectId, required: true, refPath: "ownerModel" },
    ownerModel: { type: String, required: true, enum: ["User", "Instructor"] },
    wallet: { type: mongoose.Schema.Types.ObjectId, ref: "Wallet", required: true },
    amount: { type: Number, required: true, min: 1 },
    currency: { type: String, default: "INR", enum: ["INR", "USD", "EUR", "GBP"] },
    platformFee: { type: Number, default: 0, min: 0 },
    tds: { type: Number, default: 0, min: 0 },
    netAmount: { type: Number, required: true, min: 0 },
    method: { type: String, required: true, enum: ["bank_transfer", "upi"] },
    bankDetails: {
        accountHolderName: { type: String, trim: true },
        accountNumber: { type: String, trim: true },
        accountNumberMasked: { type: String, trim: true },
        ifscCode: { type: String, trim: true, uppercase: true },
        bankName: { type: String, trim: true },
        branchName: { type: String, trim: true },
        accountType: { type: String, enum: ["savings", "current"], default: "savings" }
    },
    upiDetails: {
        upiId: { type: String, trim: true, lowercase: true },
        upiIdMasked: { type: String, trim: true }
    },
    status: {
        type: String,
        required: true,
        enum: ["pending", "on_hold", "processing", "completed", "failed", "cancelled", "reversed"],
        default: "pending"
    },
    statusHistory: [{
        status: { type: String, enum: ["pending", "on_hold", "processing", "completed", "failed", "cancelled", "reversed"] },
        changedAt: { type: Date, default: Date.now },
        reason: { type: String, trim: true, maxlength: 500 }
    }],
    gatewayPayoutId: { type: String, trim: true, sparse: true },
    gatewayTransferId: { type: String, trim: true, sparse: true },
    utr: { type: String, trim: true, sparse: true },
    failureReason: { type: String, trim: true, maxlength: 1000 },
    initiatedAt: { type: Date, default: Date.now },
    processedAt: Date,
    completedAt: Date,
    idempotencyKey: { type: String, unique: true, sparse: true, trim: true },
    metadata: {
        ipAddress: String,
        userAgent: String,
        requestSource: { type: String, enum: ["web", "mobile", "api", "admin_panel"], default: "web" }
    }
}, { timestamps: true, collection: "payouts" });

const Payout = mongoose.models.Payout || mongoose.model("Payout", payoutSchema);

/**
 * Seed Script: Create Payout Records
 * Usage: node seeds/18_payout.seed.js
 * 
 * Creates sample payout records for instructors demonstrating:
 * - Completed payouts
 * - Pending payouts
 * - Different payment methods (bank, UPI)
 */

export const seedPayout = async () => {
    console.log("\n💸 Step 18: Seeding Payouts...");
    separator();

    const seedData = loadSeedData();
    if (!seedData.instructorIds || !seedData.instructorWalletIds) {
        throw new Error("Instructor/Wallet IDs not found. Run previous seeds first.");
    }

    // Check if payouts already exist
    const existingCount = await Payout.countDocuments({
        owner: { $in: seedData.instructorIds.map(id => new mongoose.Types.ObjectId(id)) }
    });

    if (existingCount > 0) {
        console.log(`   ⚠️  ${existingCount} payouts already exist. Retrieving IDs...`);
        const existing = await Payout.find({
            owner: { $in: seedData.instructorIds.map(id => new mongoose.Types.ObjectId(id)) }
        });
        const payoutIds = existing.map(p => p._id.toString());
        saveSeedData({ payoutIds });
        return payoutIds;
    }

    const payoutIds = [];

    // Create sample payouts for instructors
    const payoutData = [
        {
            instructorIndex: 0,
            method: "bank_transfer",
            amount: 2000,
            status: "completed",
            bankDetails: {
                accountHolderName: "Khushbu Bhargav",
                accountNumber: "XXXXXXXXXXX1234",
                accountNumberMasked: "XXXXXX1234",
                ifscCode: "SBIN0001234",
                bankName: "State Bank of India",
                branchName: "Ahmedabad Main Branch",
                accountType: "savings"
            }
        },
        {
            instructorIndex: 1,
            method: "upi",
            amount: 5000,
            status: "completed",
            upiDetails: {
                upiId: "vikram.desai@upi",
                upiIdMasked: "v***@upi"
            }
        },
        {
            instructorIndex: 2,
            method: "bank_transfer",
            amount: 3000,
            status: "pending",
            bankDetails: {
                accountHolderName: "Neha Gupta",
                accountNumber: "XXXXXXXXXXX5678",
                accountNumberMasked: "XXXXXX5678",
                ifscCode: "HDFC0001234",
                bankName: "HDFC Bank",
                branchName: "Pune Main Branch",
                accountType: "savings"
            }
        },
        {
            instructorIndex: 0,
            method: "upi",
            amount: 1500,
            status: "processing",
            upiDetails: {
                upiId: "khushbu@okaxis",
                upiIdMasked: "k***@okaxis"
            }
        }
    ];

    for (let i = 0; i < payoutData.length; i++) {
        const data = payoutData[i];
        const instructorId = seedData.instructorIds[data.instructorIndex];
        const walletId = seedData.instructorWalletIds[data.instructorIndex];
        
        const platformFee = Math.round(data.amount * 0.02); // 2% platform fee
        const tds = Math.round(data.amount * 0.01); // 1% TDS
        const netAmount = data.amount - platformFee - tds;

        const payout = new Payout({
            owner: instructorId,
            ownerModel: "Instructor",
            wallet: walletId,
            amount: data.amount,
            currency: "INR",
            platformFee,
            tds,
            netAmount,
            method: data.method,
            bankDetails: data.bankDetails || {},
            upiDetails: data.upiDetails || {},
            status: data.status,
            statusHistory: [
                { status: "pending", changedAt: new Date(Date.now() - 48 * 60 * 60 * 1000), reason: "Payout initiated" },
                ...(data.status === "processing" ? [{ status: "processing", changedAt: new Date(Date.now() - 24 * 60 * 60 * 1000), reason: "Processing by payment gateway" }] : []),
                ...(data.status === "completed" ? [
                    { status: "processing", changedAt: new Date(Date.now() - 24 * 60 * 60 * 1000), reason: "Processing by payment gateway" },
                    { status: "completed", changedAt: new Date(), reason: "Successfully transferred" }
                ] : [])
            ],
            gatewayPayoutId: data.status !== "pending" ? `pout_${Date.now().toString(36)}_${i}` : null,
            utr: data.status === "completed" ? `UTR${Date.now()}${i}` : null,
            initiatedAt: new Date(Date.now() - 48 * 60 * 60 * 1000),
            processedAt: data.status !== "pending" ? new Date(Date.now() - 24 * 60 * 60 * 1000) : null,
            completedAt: data.status === "completed" ? new Date() : null,
            idempotencyKey: `idem_${Date.now()}_${i}_${Math.random().toString(36).substr(2, 8)}`,
            metadata: {
                ipAddress: "192.168.1." + (100 + i),
                userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                requestSource: "web"
            }
        });

        await payout.save();
        payoutIds.push(payout._id.toString());
        
        const statusIcon = data.status === "completed" ? "✅" : data.status === "processing" ? "⏳" : "📋";
        logCreated(`Payout ${i + 1} (${data.status})`, payout._id.toString(), 
            `₹${data.amount} via ${data.method} ${statusIcon}`);
    }

    saveSeedData({ payoutIds });

    console.log(`\n   📊 Total payouts created: ${payoutIds.length}`);
    console.log(`      - Completed: ${payoutData.filter(p => p.status === "completed").length}`);
    console.log(`      - Processing: ${payoutData.filter(p => p.status === "processing").length}`);
    console.log(`      - Pending: ${payoutData.filter(p => p.status === "pending").length}`);
    separator();

    return payoutIds;
};

// Standalone execution
if (process.argv[1] && process.argv[1].includes("18_payout")) {
    (async () => {
        try {
            await connectDB();
            await seedPayout();
            process.exit(0);
        } catch (error) {
            console.error("❌ Error:", error.message);
            process.exit(1);
        }
    })();
}
