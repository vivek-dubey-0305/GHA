// models/payment.model.js
import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema({
    // Relationships
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: [true, "Payment must belong to a user"]
    },
    course: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Course",
        required: [true, "Payment must belong to a course"]
    },

    // Payment Details
    amount: {
        type: Number,
        required: [true, "Payment amount is required"],
        min: [0, "Amount cannot be negative"]
    },
    currency: {
        type: String,
        required: [true, "Currency is required"],
        default: "USD",
        enum: ["USD", "EUR", "GBP", "INR"]
    },
    originalAmount: {
        type: Number,
        min: 0 // Amount before discount
    },

    // Payment Method
    paymentMethod: {
        type: String,
        required: [true, "Payment method is required"],
        enum: ["stripe", "paypal", "razorpay", "bank_transfer", "crypto", "other"]
    },
    paymentGatewayId: {
        type: String, // Transaction ID from payment gateway
        required: true
    },

    // Gateway Compliance Fields (PCI DSS)
    gatewayOrderId: {
        type: String,
        trim: true
    },
    gatewaySignature: {
        type: String,
        trim: true
    },

    // Idempotency Protection (prevents duplicate payments from webhook replays)
    idempotencyKey: {
        type: String,
        unique: true,
        sparse: true
    },

    // Fraud / Risk Assessment (gateway audit requirements)
    risk: {
        isSuspicious: {
            type: Boolean,
            default: false
        },
        riskScore: {
            type: Number,
            min: 0,
            max: 100
        },
        flaggedReason: {
            type: String,
            trim: true,
            maxlength: 500
        },
        reviewedAt: Date,
        reviewedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Admin"
        }
    },

    // Device Fingerprinting (fraud detection)
    deviceFingerprint: {
        type: String,
        trim: true
    },

    // Payment Status
    status: {
        type: String,
        enum: ["pending", "processing", "completed", "failed", "cancelled", "refunded"],
        default: "pending"
    },

    // Transaction Details
    transactionId: {
        type: String,
        unique: true,
        sparse: true
    },
    invoiceId: {
        type: String,
        unique: true,
        sparse: true
    },

    // Timestamps
    initiatedAt: {
        type: Date,
        default: Date.now
    },
    completedAt: Date,
    failedAt: Date,

    // Failure/Refund Details
    failureReason: {
        type: String,
        trim: true,
        maxlength: 500
    },
    refundAmount: {
        type: Number,
        min: 0
    },
    refundReason: {
        type: String,
        trim: true,
        maxlength: 500
    },
    refundedAt: Date,

    // Additional Charges
    taxAmount: {
        type: Number,
        min: 0,
        default: 0
    },
    processingFee: {
        type: Number,
        min: 0,
        default: 0
    },
    discountAmount: {
        type: Number,
        min: 0,
        default: 0
    },

    // Metadata
    metadata: {
        userAgent: String,
        ipAddress: String,
        couponCode: String,
        utmSource: String,
        utmMedium: String,
        utmCampaign: String
    },

    // Webhook/Callback Data
    webhookData: mongoose.Schema.Types.Mixed,

    // Audit Fields
    processedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Admin" // If manual processing
    }
}, {
    timestamps: true,
    collection: "payments"
});

// Indexes for performance
paymentSchema.index({ user: 1, status: 1 });
paymentSchema.index({ course: 1, status: 1 });
paymentSchema.index({ paymentGatewayId: 1 });
paymentSchema.index({ gatewayOrderId: 1 });
paymentSchema.index({ status: 1, createdAt: -1 });
paymentSchema.index({ initiatedAt: -1 });
paymentSchema.index({ completedAt: -1 });
paymentSchema.index({ "risk.isSuspicious": 1 });

// Compound indexes
paymentSchema.index({ user: 1, course: 1, status: 1 });
paymentSchema.index({ paymentMethod: 1, status: 1, createdAt: -1 });

// Pre-save middleware to generate transaction ID
paymentSchema.pre("save", function() {
    if (this.isNew && !this.transactionId) {
        const timestamp = Date.now().toString(36);
        const random = Math.random().toString(36).substr(2, 8);
        this.transactionId = `TXN-${timestamp}-${random}`.toUpperCase();
    }

    if (this.isNew && !this.invoiceId) {
        this.invoiceId = `INV-${Date.now()}`;
    }
});

// Static method to get user payments
paymentSchema.statics.getUserPayments = function(userId, options = {}) {
    const { status, limit = 20, skip = 0, sort = "-createdAt" } = options;

    let query = { user: userId };
    if (status) query.status = status;

    return this.find(query)
        .populate("course", "title thumbnail")
        .sort(sort)
        .limit(limit)
        .skip(skip);
};

// Static method to get course revenue
paymentSchema.statics.getCourseRevenue = function(courseId, options = {}) {
    const { startDate, endDate } = options;

    let match = { course: courseId, status: "completed" };
    if (startDate && endDate) {
        match.completedAt = { $gte: startDate, $lte: endDate };
    }

    return this.aggregate([
        { $match: match },
        {
            $group: {
                _id: null,
                totalRevenue: { $sum: "$amount" },
                totalTransactions: { $sum: 1 },
                averageTransaction: { $avg: "$amount" },
                totalRefunds: {
                    $sum: { $cond: [{ $eq: ["$status", "refunded"] }, "$refundAmount", 0] }
                }
            }
        }
    ]);
};

// Static method to get payment statistics
paymentSchema.statics.getPaymentStats = function(options = {}) {
    const { startDate, endDate } = options;

    let match = { status: "completed" };
    if (startDate && endDate) {
        match.completedAt = { $gte: startDate, $lte: endDate };
    }

    return this.aggregate([
        { $match: match },
        {
            $group: {
                _id: {
                    year: { $year: "$completedAt" },
                    month: { $month: "$completedAt" },
                    day: { $dayOfMonth: "$completedAt" }
                },
                revenue: { $sum: "$amount" },
                transactions: { $sum: 1 },
                averageAmount: { $avg: "$amount" }
            }
        },
        { $sort: { "_id.year": -1, "_id.month": -1, "_id.day": -1 } }
    ]);
};

// Instance method to mark as completed
paymentSchema.methods.markCompleted = function(gatewayId) {
    this.status = "completed";
    this.completedAt = new Date();
    if (gatewayId) this.paymentGatewayId = gatewayId;
    return this.save();
};

// Instance method to mark as failed
paymentSchema.methods.markFailed = function(reason) {
    this.status = "failed";
    this.failedAt = new Date();
    this.failureReason = reason;
    return this.save();
};

// Instance method to process refund
paymentSchema.methods.processRefund = function(amount, reason) {
    this.status = "refunded";
    this.refundAmount = amount;
    this.refundReason = reason;
    this.refundedAt = new Date();
    return this.save();
};

// Instance method to check if refundable
paymentSchema.methods.isRefundable = function() {
    const daysSincePayment = (new Date() - this.completedAt) / (1000 * 60 * 60 * 24);
    return this.status === "completed" && daysSincePayment <= 30; // 30-day refund policy
};

// Virtual for formatted amount
paymentSchema.virtual("formattedAmount").get(function() {
    return `${this.currency} ${this.amount.toFixed(2)}`;
});

const Payment = mongoose.model("Payment", paymentSchema);

export { Payment };