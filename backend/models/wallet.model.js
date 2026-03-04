import mongoose from "mongoose";

/**
 * Wallet Model - Centralised Wallet for Users & Instructors
 * 
 * Compliance: No payment instruments stored. Only balance tracking.
 * Users/Instructors earn money into wallet (course earnings, rewards, etc.)
 * Withdrawals handled via separate Payout collection.
 * 
 * Balance = 1 INR = 1 Rupee (real money)
 */

const walletTransactionSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ["credit", "debit"],
        required: [true, "Transaction type is required"]
    },
    amount: {
        type: Number,
        required: [true, "Transaction amount is required"],
        min: [0.01, "Transaction amount must be greater than 0"]
    },
    currency: {
        type: String,
        default: "INR",
        enum: ["INR", "USD", "EUR", "GBP"]
    },
    source: {
        type: String,
        required: [true, "Transaction source is required"],
        enum: [
            "course_earning",          // Instructor earned from course sale
            "course_reward",           // User earned reward for course completion
            "referral_bonus",          // Referral bonus
            "refund",                  // Refund credited back
            "payout",                  // Withdrawal to bank/UPI
            "admin_credit",            // Admin manually credited
            "admin_debit",             // Admin manually debited
            "platform_commission",     // Platform commission deducted
            "bonus",                   // Promotional bonus
            "reversal"                 // Transaction reversal
        ]
    },
    description: {
        type: String,
        trim: true,
        maxlength: [500, "Description cannot exceed 500 characters"]
    },
    referenceId: {
        type: mongoose.Schema.Types.ObjectId,
        refPath: "transactions.referenceModel"
    },
    referenceModel: {
        type: String,
        enum: ["Payment", "Payout", "Course", "Enrollment", null],
        default: null
    },
    balanceAfter: {
        type: Number,
        required: true,
        min: 0
    },
    status: {
        type: String,
        enum: ["pending", "completed", "failed", "reversed"],
        default: "completed"
    },
    metadata: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, { _id: true });

const walletSchema = new mongoose.Schema({
    // Polymorphic owner (User or Instructor)
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        required: [true, "Wallet owner is required"],
        refPath: "ownerModel"
    },
    ownerModel: {
        type: String,
        required: [true, "Owner model type is required"],
        enum: ["User", "Instructor"]
    },

    // Balance
    balance: {
        type: Number,
        default: 0,
        min: [0, "Wallet balance cannot be negative"]
    },
    currency: {
        type: String,
        default: "INR",
        enum: ["INR", "USD", "EUR", "GBP"]
    },

    // Lifetime Statistics
    lifetimeEarnings: {
        type: Number,
        default: 0,
        min: 0
    },
    totalWithdrawn: {
        type: Number,
        default: 0,
        min: 0
    },
    totalCredited: {
        type: Number,
        default: 0,
        min: 0
    },
    totalDebited: {
        type: Number,
        default: 0,
        min: 0
    },

    // Hold amount (for pending payouts)
    holdAmount: {
        type: Number,
        default: 0,
        min: 0
    },

    // Available balance = balance - holdAmount (virtual)

    // Transaction History (embedded for fast reads)
    transactions: [walletTransactionSchema],

    // Wallet Status
    isActive: {
        type: Boolean,
        default: true
    },
    isFrozen: {
        type: Boolean,
        default: false
    },
    frozenReason: {
        type: String,
        trim: true
    },
    frozenAt: Date,
    frozenBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Admin"
    },

    // Last Activity
    lastTransactionAt: Date,

    // Audit
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Admin"
    }
}, {
    timestamps: true,
    collection: "wallets"
});

// ========================= INDEXES =========================
walletSchema.index({ owner: 1, ownerModel: 1 }, { unique: true });
walletSchema.index({ isActive: 1 });
walletSchema.index({ balance: -1 });
walletSchema.index({ "transactions.createdAt": -1 });
walletSchema.index({ "transactions.type": 1 });
walletSchema.index({ "transactions.source": 1 });
walletSchema.index({ lastTransactionAt: -1 });

// ========================= VIRTUALS =========================
walletSchema.virtual("availableBalance").get(function () {
    return Math.max(0, this.balance - this.holdAmount);
});

// ========================= INSTANCE METHODS =========================

/**
 * Credit amount to wallet (atomic operation)
 * @param {Number} amount - Amount to credit
 * @param {String} source - Source of credit
 * @param {String} description - Transaction description
 * @param {Object} options - { referenceId, referenceModel, metadata }
 * @returns {Object} Transaction record
 */
walletSchema.methods.credit = async function (amount, source, description, options = {}) {
    if (amount <= 0) throw new Error("Credit amount must be positive");
    if (this.isFrozen) throw new Error("Wallet is frozen. Contact support.");
    if (!this.isActive) throw new Error("Wallet is not active");

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        // Atomic update with $inc to prevent race conditions
        const updated = await Wallet.findOneAndUpdate(
            { _id: this._id, isFrozen: false, isActive: true },
            {
                $inc: {
                    balance: amount,
                    lifetimeEarnings: ["course_earning", "course_reward", "referral_bonus", "bonus"].includes(source) ? amount : 0,
                    totalCredited: amount
                },
                $set: { lastTransactionAt: new Date() }
            },
            { new: true, session }
        );

        if (!updated) throw new Error("Wallet update failed. Wallet may be frozen or inactive.");

        const transaction = {
            type: "credit",
            amount,
            currency: this.currency,
            source,
            description: description || `${source} credit`,
            referenceId: options.referenceId || null,
            referenceModel: options.referenceModel || null,
            balanceAfter: updated.balance,
            status: "completed",
            metadata: options.metadata || {},
            createdAt: new Date()
        };

        updated.transactions.push(transaction);
        await updated.save({ session });

        await session.commitTransaction();
        session.endSession();

        return transaction;
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        throw error;
    }
};

/**
 * Debit amount from wallet (atomic operation)
 * @param {Number} amount - Amount to debit
 * @param {String} source - Source of debit
 * @param {String} description - Transaction description
 * @param {Object} options - { referenceId, referenceModel, metadata }
 * @returns {Object} Transaction record
 */
walletSchema.methods.debit = async function (amount, source, description, options = {}) {
    if (amount <= 0) throw new Error("Debit amount must be positive");
    if (this.isFrozen) throw new Error("Wallet is frozen. Contact support.");
    if (!this.isActive) throw new Error("Wallet is not active");

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        // Atomic update with balance check to prevent negative balance
        const updated = await Wallet.findOneAndUpdate(
            {
                _id: this._id,
                isFrozen: false,
                isActive: true,
                balance: { $gte: amount }
            },
            {
                $inc: {
                    balance: -amount,
                    totalDebited: amount,
                    totalWithdrawn: source === "payout" ? amount : 0
                },
                $set: { lastTransactionAt: new Date() }
            },
            { new: true, session }
        );

        if (!updated) throw new Error("Insufficient balance or wallet is frozen/inactive");

        const transaction = {
            type: "debit",
            amount,
            currency: this.currency,
            source,
            description: description || `${source} debit`,
            referenceId: options.referenceId || null,
            referenceModel: options.referenceModel || null,
            balanceAfter: updated.balance,
            status: "completed",
            metadata: options.metadata || {},
            createdAt: new Date()
        };

        updated.transactions.push(transaction);
        await updated.save({ session });

        await session.commitTransaction();
        session.endSession();

        return transaction;
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        throw error;
    }
};

/**
 * Place hold on amount (for pending payouts)
 */
walletSchema.methods.placeHold = async function (amount) {
    if (amount <= 0) throw new Error("Hold amount must be positive");
    if (this.availableBalance < amount) throw new Error("Insufficient available balance for hold");

    this.holdAmount += amount;
    await this.save();
    return this;
};

/**
 * Release hold
 */
walletSchema.methods.releaseHold = async function (amount) {
    if (amount <= 0) throw new Error("Release amount must be positive");
    this.holdAmount = Math.max(0, this.holdAmount - amount);
    await this.save();
    return this;
};

/**
 * Freeze wallet (admin action)
 */
walletSchema.methods.freeze = async function (reason, adminId) {
    this.isFrozen = true;
    this.frozenReason = reason;
    this.frozenAt = new Date();
    this.frozenBy = adminId;
    await this.save();
    return this;
};

/**
 * Unfreeze wallet (admin action)
 */
walletSchema.methods.unfreeze = async function () {
    this.isFrozen = false;
    this.frozenReason = null;
    this.frozenAt = null;
    this.frozenBy = null;
    await this.save();
    return this;
};

// ========================= STATIC METHODS =========================

/**
 * Get or create wallet for a user/instructor
 */
walletSchema.statics.getOrCreateWallet = async function (ownerId, ownerModel, currency = "INR") {
    let wallet = await this.findOne({ owner: ownerId, ownerModel });

    if (!wallet) {
        wallet = await this.create({
            owner: ownerId,
            ownerModel,
            currency
        });
    }

    return wallet;
};

/**
 * Get wallet by owner
 */
walletSchema.statics.getByOwner = function (ownerId, ownerModel) {
    return this.findOne({ owner: ownerId, ownerModel });
};

/**
 * Get transaction history with pagination
 */
walletSchema.statics.getTransactionHistory = async function (ownerId, ownerModel, options = {}) {
    const { page = 1, limit = 20, type, source, startDate, endDate } = options;
    const skip = (page - 1) * limit;

    const wallet = await this.findOne({ owner: ownerId, ownerModel });
    if (!wallet) return { transactions: [], total: 0 };

    let transactions = wallet.transactions;

    // Filter by type
    if (type) transactions = transactions.filter(t => t.type === type);
    // Filter by source
    if (source) transactions = transactions.filter(t => t.source === source);
    // Filter by date range
    if (startDate) transactions = transactions.filter(t => t.createdAt >= new Date(startDate));
    if (endDate) transactions = transactions.filter(t => t.createdAt <= new Date(endDate));

    // Sort by most recent first
    transactions.sort((a, b) => b.createdAt - a.createdAt);

    const total = transactions.length;
    const paginated = transactions.slice(skip, skip + limit);

    return { transactions: paginated, total };
};

// ========================= TRANSFORM OUTPUT =========================
walletSchema.methods.toJSON = function () {
    const walletObject = this.toObject({ virtuals: true });
    return walletObject;
};

// ========================= MODEL =========================
const Wallet = mongoose.model("Wallet", walletSchema);

export { Wallet };
