import mongoose from "mongoose";

const couponSchema = new mongoose.Schema(
    {
        code: {
            type: String,
            required: [true, "Coupon code is required"],
            unique: true,
            uppercase: true,
            trim: true,
            maxlength: [30, "Coupon code cannot exceed 30 characters"],
            match: [/^[A-Z0-9_-]+$/, "Coupon code can only contain letters, numbers, hyphens and underscores"]
        },
        instructor: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Instructor",
            required: true,
            index: true
        },
        course: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Course",
            default: null // null = applies to all instructor's courses
        },
        discountType: {
            type: String,
            enum: ["percentage", "flat"],
            required: [true, "Discount type is required"]
        },
        discountValue: {
            type: Number,
            required: [true, "Discount value is required"],
            min: [1, "Discount must be at least 1"]
        },
        maxDiscount: {
            type: Number,
            default: null // cap for percentage discounts
        },
        minPurchaseAmount: {
            type: Number,
            default: 0
        },
        usageLimit: {
            type: Number,
            default: null // null = unlimited
        },
        usedCount: {
            type: Number,
            default: 0
        },
        perUserLimit: {
            type: Number,
            default: 1
        },
        usedBy: [{
            user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
            usedAt: { type: Date, default: Date.now }
        }],
        startDate: {
            type: Date,
            default: Date.now
        },
        expiryDate: {
            type: Date,
            required: [true, "Expiry date is required"]
        },
        isActive: {
            type: Boolean,
            default: true
        },
        description: {
            type: String,
            maxlength: [200, "Description cannot exceed 200 characters"]
        }
    },
    { timestamps: true }
);

// Validate percentage max 100
// couponSchema.pre("validate", function (next) {
//     if (this.discountType === "percentage" && this.discountValue > 100) {
//         return next(new Error("Percentage discount cannot exceed 100"));
//     }
//     next();
// });

// Virtual: is expired
couponSchema.virtual("isExpired").get(function () {
    return this.expiryDate < new Date();
});

// Virtual: is usable
couponSchema.virtual("isUsable").get(function () {
    return this.isActive && !this.isExpired && (this.usageLimit === null || this.usedCount < this.usageLimit);
});

couponSchema.set("toJSON", { virtuals: true });
couponSchema.set("toObject", { virtuals: true });

export const Coupon = mongoose.model("Coupon", couponSchema);
