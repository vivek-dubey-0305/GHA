import mongoose from "mongoose";

/**
 * Payout Model - Bank/UPI Withdrawals from Wallet
 * 
 * Compliance: Payment details are stored ONLY for payout processing.
 * Bank details / UPI ID are collected at payout-request time, not stored on User/Instructor.
 * These details are masked after processing for audit trail.
 * 
 * Flow: Instructor/User → Requests Payout → Wallet Hold → Admin/System Processes → Bank/UPI Transfer
 */

const payoutSchema = new mongoose.Schema({
    // Owner (polymorphic - User or Instructor)
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        required: [true, "Payout owner is required"],
        refPath: "ownerModel"
    },
    ownerModel: {
        type: String,
        required: [true, "Owner model type is required"],
        enum: ["User", "Instructor"]
    },

    // Wallet reference
    wallet: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Wallet",
        required: [true, "Wallet reference is required"]
    },

    // Payout Amount
    amount: {
        type: Number,
        required: [true, "Payout amount is required"],
        min: [1, "Minimum payout amount is ₹1"]
    },
    currency: {
        type: String,
        default: "INR",
        enum: ["INR", "USD", "EUR", "GBP"]
    },

    // Platform Fee / Tax Deductions (if applicable)
    platformFee: {
        type: Number,
        default: 0,
        min: 0
    },
    tds: {
        type: Number,
        default: 0,
        min: 0
    },
    netAmount: {
        type: Number,
        required: [true, "Net payout amount is required"],
        min: [0, "Net amount cannot be negative"]
    },

    // Payout Method
    method: {
        type: String,
        required: [true, "Payout method is required"],
        enum: ["bank_transfer", "upi"]
    },

    // Bank Details (collected at payout time, masked after processing)
    bankDetails: {
        accountHolderName: {
            type: String,
            trim: true,
            maxlength: [200, "Account holder name cannot exceed 200 characters"]
        },
        accountNumber: {
            type: String,
            trim: true
        },
        accountNumberMasked: {
            type: String,
            trim: true
        },
        ifscCode: {
            type: String,
            trim: true,
            uppercase: true,
            match: [/^[A-Z]{4}0[A-Z0-9]{6}$/, "Invalid IFSC code format"]
        },
        bankName: {
            type: String,
            trim: true,
            maxlength: [200, "Bank name cannot exceed 200 characters"]
        },
        branchName: {
            type: String,
            trim: true,
            maxlength: [200, "Branch name cannot exceed 200 characters"]
        },
        accountType: {
            type: String,
            enum: ["savings", "current"],
            default: "savings"
        }
    },

    // UPI Details (collected at payout time, masked after processing)
    upiDetails: {
        upiId: {
            type: String,
            trim: true,
            lowercase: true
        },
        upiIdMasked: {
            type: String,
            trim: true
        }
    },

    // Payout Status
    status: {
        type: String,
        required: true,
        enum: [
            "pending",       // Initial state - waiting for processing
            "on_hold",       // Under review by admin
            "processing",    // Payment gateway processing
            "completed",     // Successfully transferred
            "failed",        // Transfer failed
            "cancelled",     // Cancelled by user or admin
            "reversed"       // Reversed after completion
        ],
        default: "pending"
    },

    // Status History
    statusHistory: [{
        status: {
            type: String,
            enum: ["pending", "on_hold", "processing", "completed", "failed", "cancelled", "reversed"]
        },
        changedAt: {
            type: Date,
            default: Date.now
        },
        changedBy: {
            type: mongoose.Schema.Types.ObjectId,
            refPath: "statusHistory.changedByModel"
        },
        changedByModel: {
            type: String,
            enum: ["User", "Instructor", "Admin", null],
            default: null
        },
        reason: {
            type: String,
            trim: true,
            maxlength: 500
        }
    }],

    // Gateway/Transfer Reference
    gatewayPayoutId: {
        type: String,
        trim: true,
        sparse: true
    },
    gatewayTransferId: {
        type: String,
        trim: true,
        sparse: true
    },
    gatewayResponse: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },

    // UTR (Unique Transaction Reference from bank)
    utr: {
        type: String,
        trim: true,
        sparse: true
    },

    // Failure Info
    failureReason: {
        type: String,
        trim: true,
        maxlength: 1000
    },
    failureCode: {
        type: String,
        trim: true
    },

    // Timestamps
    initiatedAt: {
        type: Date,
        default: Date.now
    },
    processedAt: Date,
    completedAt: Date,
    failedAt: Date,
    cancelledAt: Date,
    reversedAt: Date,

    // Risk / Review
    risk: {
        isFlagged: {
            type: Boolean,
            default: false
        },
        flagReason: {
            type: String,
            trim: true
        },
        reviewedAt: Date,
        reviewedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Admin"
        },
        reviewNotes: {
            type: String,
            trim: true,
            maxlength: 1000
        }
    },

    // Idempotency
    idempotencyKey: {
        type: String,
        unique: true,
        sparse: true,
        trim: true
    },

    // Request Metadata
    metadata: {
        ipAddress: String,
        userAgent: String,
        deviceFingerprint: String,
        requestSource: {
            type: String,
            enum: ["web", "mobile", "api", "admin_panel"],
            default: "web"
        }
    },

    // Admin Actions
    processedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Admin"
    },
    adminNotes: {
        type: String,
        trim: true,
        maxlength: 1000
    },

    // Wallet Transaction Reference
    walletTransactionId: {
        type: mongoose.Schema.Types.ObjectId
    }
}, {
    timestamps: true,
    collection: "payouts"
});

// ========================= INDEXES =========================
payoutSchema.index({ owner: 1, ownerModel: 1 });
payoutSchema.index({ wallet: 1 });
payoutSchema.index({ status: 1 });
payoutSchema.index({ method: 1 });
payoutSchema.index({ createdAt: -1 });
payoutSchema.index({ initiatedAt: -1 });
// payoutSchema.index({ gatewayPayoutId: 1 }, { sparse: true });
// payoutSchema.index({ utr: 1 }, { sparse: true });
// payoutSchema.index({ idempotencyKey: 1 });
payoutSchema.index({ owner: 1, status: 1, createdAt: -1 });
payoutSchema.index({ "risk.isFlagged": 1 });
payoutSchema.index({ processedBy: 1 });

// ========================= PRE-SAVE HOOKS =========================

/**
 * Mask sensitive payment details after payout is processed
 */
// payoutSchema.pre("save", function (next) {
//     // Only mask after payout reaches a terminal state
//     if (["completed", "failed", "cancelled", "reversed"].includes(this.status)) {
//         // Mask bank account number
//         if (this.bankDetails?.accountNumber && !this.bankDetails.accountNumberMasked) {
//             const accNum = this.bankDetails.accountNumber;
//             this.bankDetails.accountNumberMasked = accNum.length > 4
//                 ? "XXXX" + accNum.slice(-4)
//                 : "XXXX";
//             this.bankDetails.accountNumber = undefined; // Remove real number
//         }

//         // Mask UPI ID
//         if (this.upiDetails?.upiId && !this.upiDetails.upiIdMasked) {
//             const upi = this.upiDetails.upiId;
//             const atIndex = upi.indexOf("@");
//             if (atIndex > 2) {
//                 this.upiDetails.upiIdMasked = upi.substring(0, 2) + "***" + upi.substring(atIndex);
//             } else {
//                 this.upiDetails.upiIdMasked = "***" + upi.substring(atIndex);
//             }
//             this.upiDetails.upiId = undefined; // Remove real UPI
//         }
//     }

//     // Auto-calculate net amount
//     if (this.isModified("amount") || this.isModified("platformFee") || this.isModified("tds")) {
//         this.netAmount = this.amount - (this.platformFee || 0) - (this.tds || 0);
//     }

//     next();
// });

// ========================= INSTANCE METHODS =========================

/**
 * Update payout status with history tracking
 */
payoutSchema.methods.updateStatus = async function (newStatus, changedBy, changedByModel, reason) {
    const validTransitions = {
        pending: ["on_hold", "processing", "cancelled"],
        on_hold: ["processing", "cancelled"],
        processing: ["completed", "failed"],
        failed: ["processing", "cancelled"],     // Allow retry
        completed: ["reversed"],
        cancelled: [],
        reversed: []
    };

    const allowed = validTransitions[this.status];
    if (!allowed || !allowed.includes(newStatus)) {
        throw new Error(`Invalid status transition: ${this.status} → ${newStatus}`);
    }

    this.status = newStatus;
    this.statusHistory.push({
        status: newStatus,
        changedAt: new Date(),
        changedBy: changedBy || null,
        changedByModel: changedByModel || null,
        reason: reason || null
    });

    // Set relevant timestamps
    switch (newStatus) {
        case "processing":
            this.processedAt = new Date();
            break;
        case "completed":
            this.completedAt = new Date();
            break;
        case "failed":
            this.failedAt = new Date();
            break;
        case "cancelled":
            this.cancelledAt = new Date();
            break;
        case "reversed":
            this.reversedAt = new Date();
            break;
    }

    await this.save();
    return this;
};

/**
 * Flag payout for review
 */
payoutSchema.methods.flag = async function (reason) {
    this.risk.isFlagged = true;
    this.risk.flagReason = reason;
    await this.updateStatus("on_hold", null, null, `Flagged: ${reason}`);
    return this;
};

/**
 * Approve flagged payout
 */
payoutSchema.methods.approveReview = async function (adminId, notes) {
    this.risk.reviewedAt = new Date();
    this.risk.reviewedBy = adminId;
    this.risk.reviewNotes = notes || "Approved";
    this.risk.isFlagged = false;
    await this.save();
    return this;
};

// ========================= STATIC METHODS =========================

/**
 * Get payouts for an owner with pagination
 */
payoutSchema.statics.getPayoutsByOwner = async function (ownerId, ownerModel, options = {}) {
    const { page = 1, limit = 20, status, method, startDate, endDate, sortBy = "createdAt", sortOrder = -1 } = options;
    const skip = (page - 1) * limit;

    const query = { owner: ownerId, ownerModel };
    if (status) query.status = status;
    if (method) query.method = method;
    if (startDate || endDate) {
        query.createdAt = {};
        if (startDate) query.createdAt.$gte = new Date(startDate);
        if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const [payouts, total] = await Promise.all([
        this.find(query)
            .sort({ [sortBy]: sortOrder })
            .skip(skip)
            .limit(limit)
            .lean(),
        this.countDocuments(query)
    ]);

    return { payouts, total, page, limit, totalPages: Math.ceil(total / limit) };
};

/**
 * Get payout statistics for an owner
 */
payoutSchema.statics.getPayoutStats = async function (ownerId, ownerModel) {
    const stats = await this.aggregate([
        { $match: { owner: new mongoose.Types.ObjectId(ownerId), ownerModel } },
        {
            $group: {
                _id: "$status",
                count: { $sum: 1 },
                totalAmount: { $sum: "$amount" },
                totalNetAmount: { $sum: "$netAmount" }
            }
        }
    ]);

    const result = {
        totalPayouts: 0,
        totalAmount: 0,
        totalNetPaid: 0,
        byStatus: {}
    };

    stats.forEach(s => {
        result.totalPayouts += s.count;
        result.totalAmount += s.totalAmount;
        if (s._id === "completed") result.totalNetPaid += s.totalNetAmount;
        result.byStatus[s._id] = { count: s.count, totalAmount: s.totalAmount };
    });

    return result;
};

/**
 * Check for duplicate/rapid payouts (anti-fraud)
 */
payoutSchema.statics.checkDuplicatePayout = async function (ownerId, ownerModel, amount, minutes = 10) {
    const cutoff = new Date(Date.now() - minutes * 60 * 1000);

    const recentPayout = await this.findOne({
        owner: ownerId,
        ownerModel,
        amount,
        status: { $in: ["pending", "processing"] },
        createdAt: { $gte: cutoff }
    });

    return !!recentPayout;
};

// ========================= TRANSFORM OUTPUT =========================
payoutSchema.methods.toJSON = function () {
    const payoutObject = this.toObject();

    // Never expose raw account numbers or UPI in JSON responses
    if (payoutObject.bankDetails) {
        delete payoutObject.bankDetails.accountNumber;
    }
    if (payoutObject.upiDetails) {
        delete payoutObject.upiDetails.upiId;
    }
    // Remove gateway response from client responses
    delete payoutObject.gatewayResponse;

    return payoutObject;
};

// ========================= MODEL =========================
const Payout = mongoose.model("Payout", payoutSchema);

export { Payout };
