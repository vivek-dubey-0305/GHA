import dotenv from "dotenv";
import connectDB from "../configs/connection.config.js";
import { Payment } from "../models/payment.model.js";
import { loadSeedData, saveSeedData, logCreated, separator, TEST_COURSES, generatePaymentId, generateOrderId } from "./seed-helpers.js";

dotenv.config();

/**
 * Seed Script: Create Test Payments (9 payments - 3 users × 3 courses)
 * Usage: node seeds/11_payment.seed.js
 */

export const seedPayment = async () => {
    console.log("\n💳 Step 11: Seeding Payments...");
    separator();

    const seedData = loadSeedData();
    if (!seedData.userIds || !seedData.courseIds) {
        throw new Error("User/Course IDs not found. Run previous seeds first.");
    }

    // Check if payments already exist
    const existingCount = await Payment.countDocuments({
        user: { $in: seedData.userIds }
    });

    if (existingCount > 0) {
        console.log(`   ⚠️  ${existingCount} payments already exist. Retrieving IDs...`);
        const existing = await Payment.find({ user: { $in: seedData.userIds } });
        const paymentIds = existing.map(p => p._id.toString());
        saveSeedData({ paymentIds });
        return paymentIds;
    }

    const paymentIds = [];
    const couponCodes = ["LAUNCH50", "WELCOME25", "NEWYEAR"];
    const vpas = ["user1@upi", "user2@paytm", "user3@gpay"];

    // Create 9 payments: each user enrolls in all 3 courses
    for (let userIdx = 0; userIdx < seedData.userIds.length; userIdx++) {
        for (let courseIdx = 0; courseIdx < seedData.courseIds.length; courseIdx++) {
            const userId = seedData.userIds[userIdx];
            const courseId = seedData.courseIds[courseIdx];
            const coursePrice = TEST_COURSES[courseIdx].price;
            const discountPrice = TEST_COURSES[courseIdx].discountPrice;
            const discountAmount = coursePrice - discountPrice;
            const taxAmount = Math.round(discountPrice * 0.18 * 100) / 100;
            const processingFee = Math.round(discountPrice * 0.02 * 100) / 100;

            const payment = new Payment({
                user: userId,
                course: courseId,
                amount: discountPrice,
                currency: "INR",
                originalAmount: coursePrice,
                paymentMethod: "razorpay",
                paymentGatewayId: generatePaymentId(userIdx, courseIdx),
                status: "completed",
                transactionId: `TXN-${Date.now().toString(36)}-${userIdx}${courseIdx}`.toUpperCase(),
                invoiceId: `INV-${Date.now()}-${userIdx}${courseIdx}`,
                initiatedAt: new Date(Date.now() - (30 - userIdx * 10 - courseIdx) * 24 * 60 * 60 * 1000),
                completedAt: new Date(Date.now() - (29 - userIdx * 10 - courseIdx) * 24 * 60 * 60 * 1000),
                taxAmount,
                processingFee,
                discountAmount,
                metadata: {
                    userAgent: "Mozilla/5.0 (Seed Test)",
                    ipAddress: `192.168.1.${100 + userIdx}`,
                    couponCode: couponCodes[userIdx],
                    utmSource: "direct",
                    utmMedium: "seed-test",
                    utmCampaign: "test-enrollment"
                },
                webhookData: {
                    razorpay_order_id: generateOrderId(userIdx, courseIdx),
                    razorpay_payment_id: generatePaymentId(userIdx, courseIdx),
                    razorpay_signature: `sig_test_${Date.now().toString(36)}${userIdx}${courseIdx}`,
                    method: "upi",
                    bank: null,
                    wallet: null,
                    vpa: vpas[userIdx],
                    notes: { purpose: "Course enrollment" }
                }
            });

            await payment.save();
            paymentIds.push(payment._id.toString());
            logCreated(`Payment ${paymentIds.length}`, payment._id.toString(), 
                `User ${userIdx + 1} → Course ${courseIdx + 1}: ₹${discountPrice}`);
        }
    }

    saveSeedData({ paymentIds });

    console.log(`\n   📊 Total payments created: ${paymentIds.length}`);
    console.log(`      - 3 users × 3 courses = 9 payments`);
    separator();

    return paymentIds;
};

// Standalone execution
if (process.argv[1] && process.argv[1].includes("11_payment")) {
    (async () => {
        try {
            await connectDB();
            await seedPayment();
            process.exit(0);
        } catch (error) {
            console.error("❌ Error:", error.message);
            process.exit(1);
        }
    })();
}
