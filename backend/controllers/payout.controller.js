// controllers/payout.controller.js
import { Payout } from "../models/payout.model.js";
import { Wallet } from "../models/wallet.model.js";
import { asyncHandler } from "../middlewares/async.middleware.js";
import { errorResponse, successResponse } from "../utils/response.utils.js";
import { getPagination, createPaginationResponse } from "../utils/pagination.utils.js";
import logger from "../configs/logger.config.js";
import crypto from "crypto";

/**
 * Payout Controller
 * Handles fund withdrawal requests from Wallet to Bank/UPI
 * 
 * Flow:
 *  1. User/Instructor requests payout → validated → wallet hold placed
 *  2. Admin reviews (optional for flagged) → approves/rejects
 *  3. System processes → gateway transfer → wallet debit on success
 *  4. On failure → wallet hold released
 */

// ============================
//    MINIMUM PAYOUT AMOUNTS
// ============================
const MIN_PAYOUT = {
    bank_transfer: 100,   // ₹100 minimum for bank
    upi: 10               // ₹10 minimum for UPI
};

const MAX_PAYOUT_PER_DAY = 50000; // ₹50,000 daily limit

// ============================
//      USER / INSTRUCTOR
// ============================

// @route   POST /api/v1/payouts/request
// @desc    Request a payout (withdraw from wallet to bank/UPI)
// @access  Private (User or Instructor)
export const requestPayout = asyncHandler(async (req, res) => {
    const { ownerId, ownerModel } = resolveOwner(req);
    const { amount, method, bankDetails, upiId } = req.body;

    // ---- Basic Validations ----
    if (!amount || !method) {
        return errorResponse(res, 400, "Amount and payout method are required");
    }

    if (!["bank_transfer", "upi"].includes(method)) {
        return errorResponse(res, 400, "Invalid payout method. Use 'bank_transfer' or 'upi'");
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
        return errorResponse(res, 400, "Amount must be a valid positive number");
    }

    if (parsedAmount < MIN_PAYOUT[method]) {
        return errorResponse(res, 400, `Minimum payout for ${method} is ₹${MIN_PAYOUT[method]}`);
    }

    // ---- Method-specific Validations ----
    if (method === "bank_transfer") {
        if (!bankDetails?.accountHolderName || !bankDetails?.accountNumber || !bankDetails?.ifscCode) {
            return errorResponse(res, 400, "Bank details (accountHolderName, accountNumber, ifscCode) are required");
        }
        if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(bankDetails.ifscCode.toUpperCase())) {
            return errorResponse(res, 400, "Invalid IFSC code format");
        }
    }

    if (method === "upi") {
        if (!upiId) {
            return errorResponse(res, 400, "UPI ID is required for UPI payout");
        }
        if (!/^[\w.\-]+@[\w]+$/.test(upiId)) {
            return errorResponse(res, 400, "Invalid UPI ID format");
        }
    }

    // ---- Wallet Check ----
    const wallet = await Wallet.getByOwner(ownerId, ownerModel);
    if (!wallet) return errorResponse(res, 404, "Wallet not found. No balance to withdraw.");
    if (wallet.isFrozen) return errorResponse(res, 403, "Wallet is frozen. Contact support.");
    if (!wallet.isActive) return errorResponse(res, 403, "Wallet is not active.");

    if (wallet.availableBalance < parsedAmount) {
        return errorResponse(res, 400,
            `Insufficient available balance. Available: ₹${wallet.availableBalance.toFixed(2)}`
        );
    }

    // ---- Daily Limit Check ----
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayPayouts = await Payout.aggregate([
        {
            $match: {
                owner: wallet.owner,
                ownerModel,
                status: { $in: ["processing", "completed"] },
                createdAt: { $gte: todayStart }
            }
        },
        { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);

    const todayTotal = todayPayouts[0]?.total || 0;
    if (todayTotal + parsedAmount > MAX_PAYOUT_PER_DAY) {
        return errorResponse(res, 400,
            `Daily payout limit exceeded. Today's total: ₹${todayTotal}. Limit: ₹${MAX_PAYOUT_PER_DAY}`
        );
    }

    // ---- Duplicate Check ----
    const isDuplicate = await Payout.checkDuplicatePayout(ownerId, ownerModel, parsedAmount, 5);
    if (isDuplicate) {
        return errorResponse(res, 429, "A similar payout request is already being processed. Please wait.");
    }

    // ---- Calculate Deductions ----
    const platformFee = 0;  // Can be configured later
    const tds = 0;          // TDS logic can be added later
    const netAmount = parsedAmount - platformFee - tds;

    // ---- Place Wallet Hold ----
    await wallet.placeHold(parsedAmount);

    // ---- Create Payout ----
    const idempotencyKey = crypto.randomUUID();

    const payout = await Payout.create({
        owner: ownerId,
        ownerModel,
        wallet: wallet._id,
        amount: parsedAmount,
        currency: wallet.currency,
        platformFee,
        tds,
        netAmount,
        method,
        bankDetails: method === "bank_transfer" ? {
            accountHolderName: bankDetails.accountHolderName.trim(),
            accountNumber: bankDetails.accountNumber.trim(),
            ifscCode: bankDetails.ifscCode.toUpperCase().trim(),
            bankName: bankDetails.bankName?.trim() || "",
            branchName: bankDetails.branchName?.trim() || "",
            accountType: bankDetails.accountType || "savings"
        } : undefined,
        upiDetails: method === "upi" ? {
            upiId: upiId.trim().toLowerCase()
        } : undefined,
        status: "pending",
        statusHistory: [{
            status: "pending",
            changedAt: new Date(),
            reason: "Payout requested"
        }],
        idempotencyKey,
        initiatedAt: new Date(),
        metadata: {
            ipAddress: req.ip,
            userAgent: req.get("User-Agent"),
            requestSource: "web"
        }
    });

    logger.info(`Payout requested: ${payout._id} | ₹${parsedAmount} | ${method} | ${ownerModel}:${ownerId}`);

    return successResponse(res, 201, "Payout request submitted successfully", {
        payout: {
            _id: payout._id,
            amount: payout.amount,
            netAmount: payout.netAmount,
            method: payout.method,
            status: payout.status,
            initiatedAt: payout.initiatedAt,
            currency: payout.currency
        }
    });
});

// @route   GET /api/v1/payouts/my
// @desc    Get my payout history
// @access  Private (User or Instructor)
export const getMyPayouts = asyncHandler(async (req, res) => {
    const { ownerId, ownerModel } = resolveOwner(req);
    const { page, limit } = getPagination(req.query, 20);
    const { status, method, startDate, endDate } = req.query;

    const result = await Payout.getPayoutsByOwner(ownerId, ownerModel, {
        page, limit, status, method, startDate, endDate
    });

    return successResponse(res, 200, "Payouts retrieved successfully", {
        payouts: result.payouts,
        pagination: createPaginationResponse(result.total, page, limit)
    });
});

// @route   GET /api/v1/payouts/my/:payoutId
// @desc    Get a specific payout detail
// @access  Private (User or Instructor)
export const getMyPayout = asyncHandler(async (req, res) => {
    const { ownerId, ownerModel } = resolveOwner(req);
    const { payoutId } = req.params;

    const payout = await Payout.findOne({ _id: payoutId, owner: ownerId, ownerModel });
    if (!payout) return errorResponse(res, 404, "Payout not found");

    return successResponse(res, 200, "Payout details retrieved", { payout });
});

// @route   POST /api/v1/payouts/my/:payoutId/cancel
// @desc    Cancel a pending payout
// @access  Private (User or Instructor)
export const cancelMyPayout = asyncHandler(async (req, res) => {
    const { ownerId, ownerModel } = resolveOwner(req);
    const { payoutId } = req.params;

    const payout = await Payout.findOne({ _id: payoutId, owner: ownerId, ownerModel });
    if (!payout) return errorResponse(res, 404, "Payout not found");

    if (payout.status !== "pending") {
        return errorResponse(res, 400, `Cannot cancel payout in '${payout.status}' status`);
    }

    // Release wallet hold
    const wallet = await Wallet.findById(payout.wallet);
    if (wallet) {
        await wallet.releaseHold(payout.amount);
    }

    await payout.updateStatus("cancelled", ownerId, ownerModel, "Cancelled by owner");

    logger.info(`Payout cancelled: ${payoutId} by ${ownerModel}:${ownerId}`);

    return successResponse(res, 200, "Payout cancelled successfully", {
        payoutId: payout._id,
        status: "cancelled"
    });
});

// @route   GET /api/v1/payouts/my/stats
// @desc    Get my payout statistics
// @access  Private (User or Instructor)
export const getMyPayoutStats = asyncHandler(async (req, res) => {
    const { ownerId, ownerModel } = resolveOwner(req);

    const stats = await Payout.getPayoutStats(ownerId, ownerModel);

    return successResponse(res, 200, "Payout statistics retrieved", { stats });
});

// ============================
//       ADMIN OPERATIONS
// ============================

// @route   GET /api/v1/payouts/admin/all
// @desc    Get all payouts (admin)
// @access  Private (Admin)
export const getAllPayouts = asyncHandler(async (req, res) => {
    const { page, limit, skip } = getPagination(req.query, 20);
    const { status, method, ownerModel, isFlagged, startDate, endDate, sortBy = "createdAt", sortOrder = "desc" } = req.query;

    const filter = {};
    if (status) filter.status = status;
    if (method) filter.method = method;
    if (ownerModel) filter.ownerModel = ownerModel;
    if (isFlagged !== undefined) filter["risk.isFlagged"] = isFlagged === "true";
    if (startDate || endDate) {
        filter.createdAt = {};
        if (startDate) filter.createdAt.$gte = new Date(startDate);
        if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    const sort = { [sortBy]: sortOrder === "asc" ? 1 : -1 };

    const [payouts, total] = await Promise.all([
        Payout.find(filter)
            .populate("owner", "firstName lastName email")
            .populate("wallet", "balance currency")
            .populate("processedBy", "name email")
            .sort(sort)
            .skip(skip)
            .limit(limit)
            .lean(),
        Payout.countDocuments(filter)
    ]);

    return successResponse(res, 200, "Payouts retrieved", {
        payouts,
        pagination: createPaginationResponse(total, page, limit)
    });
});

// @route   GET /api/v1/payouts/admin/:payoutId
// @desc    Get payout details (admin)
// @access  Private (Admin)
export const getPayoutById = asyncHandler(async (req, res) => {
    const { payoutId } = req.params;

    const payout = await Payout.findById(payoutId)
        .populate("owner", "firstName lastName email phone")
        .populate("wallet", "balance currency holdAmount")
        .populate("processedBy", "name email")
        .populate("risk.reviewedBy", "name email");

    if (!payout) return errorResponse(res, 404, "Payout not found");

    return successResponse(res, 200, "Payout details retrieved", { payout });
});

// @route   POST /api/v1/payouts/admin/:payoutId/process
// @desc    Start processing a payout (admin)
// @access  Private (Admin)
export const processPayout = asyncHandler(async (req, res) => {
    const { payoutId } = req.params;

    const payout = await Payout.findById(payoutId);
    if (!payout) return errorResponse(res, 404, "Payout not found");

    if (!["pending", "on_hold"].includes(payout.status)) {
        return errorResponse(res, 400, `Cannot process payout in '${payout.status}' status`);
    }

    // If flagged, must be reviewed first
    if (payout.risk.isFlagged && !payout.risk.reviewedAt) {
        return errorResponse(res, 400, "Flagged payout must be reviewed before processing");
    }

    payout.processedBy = req.admin?.id;
    await payout.updateStatus("processing", req.admin?.id, "Admin", "Processing initiated by admin");

    logger.info(`Payout processing: ${payoutId} by admin ${req.admin?.id}`);

    return successResponse(res, 200, "Payout is now processing", {
        payoutId: payout._id,
        status: "processing"
    });
});

// @route   POST /api/v1/payouts/admin/:payoutId/complete
// @desc    Mark payout as completed (admin confirms transfer done)
// @access  Private (Admin)
export const completePayout = asyncHandler(async (req, res) => {
    const { payoutId } = req.params;
    const { utr, gatewayPayoutId, notes } = req.body;

    const payout = await Payout.findById(payoutId);
    if (!payout) return errorResponse(res, 404, "Payout not found");

    if (payout.status !== "processing") {
        return errorResponse(res, 400, `Cannot complete payout in '${payout.status}' status`);
    }

    // ---- Debit wallet (actual deduction) & release hold ----
    const wallet = await Wallet.findById(payout.wallet);
    if (!wallet) return errorResponse(res, 500, "Associated wallet not found");

    // Release the hold first
    await wallet.releaseHold(payout.amount);

    // Debit from wallet
    const transaction = await wallet.debit(
        payout.amount,
        "payout",
        `Payout #${payout._id} - ${payout.method}`,
        {
            referenceId: payout._id,
            referenceModel: "Payout",
            metadata: { utr, method: payout.method }
        }
    );

    // Update payout
    if (utr) payout.utr = utr;
    if (gatewayPayoutId) payout.gatewayPayoutId = gatewayPayoutId;
    if (notes) payout.adminNotes = notes;
    payout.walletTransactionId = transaction._id;
    await payout.updateStatus("completed", req.admin?.id, "Admin", "Transfer confirmed");

    logger.info(`Payout completed: ${payoutId} | ₹${payout.amount} | UTR: ${utr || "N/A"}`);

    return successResponse(res, 200, "Payout marked as completed", {
        payoutId: payout._id,
        status: "completed",
        utr: utr || null,
        amountDebited: payout.amount
    });
});

// @route   POST /api/v1/payouts/admin/:payoutId/fail
// @desc    Mark payout as failed (admin)
// @access  Private (Admin)
export const failPayout = asyncHandler(async (req, res) => {
    const { payoutId } = req.params;
    const { reason, failureCode } = req.body;

    if (!reason) return errorResponse(res, 400, "Failure reason is required");

    const payout = await Payout.findById(payoutId);
    if (!payout) return errorResponse(res, 404, "Payout not found");

    if (payout.status !== "processing") {
        return errorResponse(res, 400, `Cannot fail payout in '${payout.status}' status`);
    }

    // Release wallet hold (money stays in wallet)
    const wallet = await Wallet.findById(payout.wallet);
    if (wallet) {
        await wallet.releaseHold(payout.amount);
    }

    payout.failureReason = reason;
    payout.failureCode = failureCode || null;
    await payout.updateStatus("failed", req.admin?.id, "Admin", reason);

    logger.warn(`Payout failed: ${payoutId} | Reason: ${reason}`);

    return successResponse(res, 200, "Payout marked as failed", {
        payoutId: payout._id,
        status: "failed",
        failureReason: reason
    });
});

// @route   POST /api/v1/payouts/admin/:payoutId/cancel
// @desc    Cancel a payout (admin)
// @access  Private (Admin)
export const adminCancelPayout = asyncHandler(async (req, res) => {
    const { payoutId } = req.params;
    const { reason } = req.body;

    if (!reason) return errorResponse(res, 400, "Cancellation reason is required");

    const payout = await Payout.findById(payoutId);
    if (!payout) return errorResponse(res, 404, "Payout not found");

    if (!["pending", "on_hold"].includes(payout.status)) {
        return errorResponse(res, 400, `Cannot cancel payout in '${payout.status}' status`);
    }

    // Release wallet hold
    const wallet = await Wallet.findById(payout.wallet);
    if (wallet) {
        await wallet.releaseHold(payout.amount);
    }

    payout.adminNotes = reason;
    await payout.updateStatus("cancelled", req.admin?.id, "Admin", reason);

    logger.info(`Payout cancelled by admin: ${payoutId} | Reason: ${reason}`);

    return successResponse(res, 200, "Payout cancelled", {
        payoutId: payout._id,
        status: "cancelled"
    });
});

// @route   POST /api/v1/payouts/admin/:payoutId/flag
// @desc    Flag a payout for review (admin)
// @access  Private (Admin)
export const flagPayout = asyncHandler(async (req, res) => {
    const { payoutId } = req.params;
    const { reason } = req.body;

    if (!reason) return errorResponse(res, 400, "Flag reason is required");

    const payout = await Payout.findById(payoutId);
    if (!payout) return errorResponse(res, 404, "Payout not found");

    await payout.flag(reason);

    logger.warn(`Payout flagged: ${payoutId} | Reason: ${reason}`);

    return successResponse(res, 200, "Payout flagged for review", {
        payoutId: payout._id,
        status: payout.status,
        isFlagged: true
    });
});

// @route   POST /api/v1/payouts/admin/:payoutId/review
// @desc    Review a flagged payout (admin)
// @access  Private (Admin)
export const reviewPayout = asyncHandler(async (req, res) => {
    const { payoutId } = req.params;
    const { approve, notes } = req.body;

    const payout = await Payout.findById(payoutId);
    if (!payout) return errorResponse(res, 404, "Payout not found");

    if (!payout.risk.isFlagged) {
        return errorResponse(res, 400, "Payout is not flagged for review");
    }

    await payout.approveReview(req.admin?.id, notes);

    if (approve === false) {
        // If not approved, cancel the payout
        const wallet = await Wallet.findById(payout.wallet);
        if (wallet) await wallet.releaseHold(payout.amount);
        await payout.updateStatus("cancelled", req.admin?.id, "Admin", `Review rejected: ${notes || "No reason"}`);
    }

    logger.info(`Payout reviewed: ${payoutId} | Approved: ${approve !== false}`);

    return successResponse(res, 200, `Payout review ${approve !== false ? "approved" : "rejected"}`, {
        payoutId: payout._id,
        status: payout.status,
        reviewed: true
    });
});

// @route   GET /api/v1/payouts/admin/stats
// @desc    Get payout system statistics (admin)
// @access  Private (Admin)
export const getPayoutStats = asyncHandler(async (req, res) => {
    const [stats] = await Payout.aggregate([
        {
            $facet: {
                byStatus: [
                    { $group: { _id: "$status", count: { $sum: 1 }, totalAmount: { $sum: "$amount" }, totalNet: { $sum: "$netAmount" } } }
                ],
                byMethod: [
                    { $group: { _id: "$method", count: { $sum: 1 }, totalAmount: { $sum: "$amount" } } }
                ],
                byOwnerType: [
                    { $group: { _id: "$ownerModel", count: { $sum: 1 }, totalAmount: { $sum: "$amount" } } }
                ],
                flagged: [
                    { $match: { "risk.isFlagged": true } },
                    { $count: "count" }
                ],
                today: [
                    { $match: { createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) } } },
                    { $group: { _id: null, count: { $sum: 1 }, totalAmount: { $sum: "$amount" } } }
                ],
                overall: [
                    { $group: { _id: null, totalPayouts: { $sum: 1 }, totalAmount: { $sum: "$amount" }, totalNetPaid: { $sum: { $cond: [{ $eq: ["$status", "completed"] }, "$netAmount", 0] } } } }
                ]
            }
        }
    ]);

    return successResponse(res, 200, "Payout statistics retrieved", {
        stats: {
            byStatus: stats.byStatus,
            byMethod: stats.byMethod,
            byOwnerType: stats.byOwnerType,
            flaggedCount: stats.flagged[0]?.count || 0,
            today: stats.today[0] || { count: 0, totalAmount: 0 },
            overall: stats.overall[0] || { totalPayouts: 0, totalAmount: 0, totalNetPaid: 0 }
        }
    });
});

// ============================
//       HELPER FUNCTIONS
// ============================

function resolveOwner(req) {
    if (req.user) {
        return { ownerId: req.user.id, ownerModel: "User" };
    }
    if (req.instructor) {
        return { ownerId: req.instructor.id, ownerModel: "Instructor" };
    }
    throw new Error("Unauthenticated: No user or instructor found on request");
}
