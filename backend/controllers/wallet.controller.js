import { Wallet } from "../models/wallet.model.js";
import { asyncHandler } from "../middlewares/async.middleware.js";
import { errorResponse, successResponse } from "../utils/response.utils.js";
import { getPagination, createPaginationResponse } from "../utils/pagination.utils.js";
import logger from "../configs/logger.config.js";

/**
 * Wallet Controller
 * Handles wallet operations for both Users & Instructors
 */

// ============================
//      USER / INSTRUCTOR
// ============================

// @route   GET /api/v1/wallet/me
// @desc    Get my wallet details
// @access  Private (User or Instructor)
export const getMyWallet = asyncHandler(async (req, res) => {
    const { ownerId, ownerModel } = resolveOwner(req);

    const wallet = await Wallet.getOrCreateWallet(ownerId, ownerModel);

    return successResponse(res, 200, "Wallet retrieved successfully", {
        wallet: {
            _id: wallet._id,
            balance: wallet.balance,
            availableBalance: wallet.availableBalance,
            holdAmount: wallet.holdAmount,
            currency: wallet.currency,
            lifetimeEarnings: wallet.lifetimeEarnings,
            totalWithdrawn: wallet.totalWithdrawn,
            totalCredited: wallet.totalCredited,
            totalDebited: wallet.totalDebited,
            isActive: wallet.isActive,
            isFrozen: wallet.isFrozen,
            lastTransactionAt: wallet.lastTransactionAt,
            createdAt: wallet.createdAt
        }
    });
});

// @route   GET /api/v1/wallet/transactions
// @desc    Get my wallet transaction history
// @access  Private (User or Instructor)
export const getMyTransactions = asyncHandler(async (req, res) => {
    const { ownerId, ownerModel } = resolveOwner(req);
    const { page, limit } = getPagination(req.query, 20);
    const { type, source, startDate, endDate } = req.query;

    const wallet = await Wallet.getByOwner(ownerId, ownerModel);
    if (!wallet) {
        return errorResponse(res, 404, "Wallet not found. No transactions yet.");
    }

    const result = await Wallet.getTransactionHistory(ownerId, ownerModel, {
        page, limit, type, source, startDate, endDate
    });

    return successResponse(res, 200, "Transactions retrieved successfully", {
        transactions: result.transactions,
        pagination: createPaginationResponse(result.total, page, limit)
    });
});

// @route   GET /api/v1/wallet/balance
// @desc    Quick balance check
// @access  Private (User or Instructor)
export const getBalance = asyncHandler(async (req, res) => {
    const { ownerId, ownerModel } = resolveOwner(req);

    const wallet = await Wallet.getByOwner(ownerId, ownerModel);
    if (!wallet) {
        return successResponse(res, 200, "Balance retrieved", {
            balance: 0,
            availableBalance: 0,
            currency: "INR"
        });
    }

    return successResponse(res, 200, "Balance retrieved", {
        balance: wallet.balance,
        availableBalance: wallet.availableBalance,
        holdAmount: wallet.holdAmount,
        currency: wallet.currency
    });
});

// ============================
//       ADMIN OPERATIONS
// ============================

// @route   GET /api/v1/wallet/admin/all
// @desc    Get all wallets (admin)
// @access  Private (Admin)
export const getAllWallets = asyncHandler(async (req, res) => {
    const { page, limit, skip } = getPagination(req.query, 20);
    const { ownerModel, isActive, isFrozen, minBalance, maxBalance, sortBy = "createdAt", sortOrder = "desc" } = req.query;

    const filter = {};
    if (ownerModel) filter.ownerModel = ownerModel;
    if (isActive !== undefined) filter.isActive = isActive === "true";
    if (isFrozen !== undefined) filter.isFrozen = isFrozen === "true";
    if (minBalance || maxBalance) {
        filter.balance = {};
        if (minBalance) filter.balance.$gte = parseFloat(minBalance);
        if (maxBalance) filter.balance.$lte = parseFloat(maxBalance);
    }

    const sort = { [sortBy]: sortOrder === "asc" ? 1 : -1 };

    const [wallets, total] = await Promise.all([
        Wallet.find(filter)
            .populate("owner", "firstName lastName email")
            .sort(sort)
            .skip(skip)
            .limit(limit)
            .lean(),
        Wallet.countDocuments(filter)
    ]);

    return successResponse(res, 200, "Wallets retrieved successfully", {
        wallets,
        pagination: createPaginationResponse(total, page, limit)
    });
});

// @route   GET /api/v1/wallet/admin/:walletId
// @desc    Get wallet details by ID (admin)
// @access  Private (Admin)
export const getWalletById = asyncHandler(async (req, res) => {
    const { walletId } = req.params;

    const wallet = await Wallet.findById(walletId)
        .populate("owner", "firstName lastName email phone");

    if (!wallet) return errorResponse(res, 404, "Wallet not found");

    return successResponse(res, 200, "Wallet details retrieved", { wallet });
});

// @route   GET /api/v1/wallet/admin/:walletId/transactions
// @desc    Get wallet transactions by wallet ID (admin)
// @access  Private (Admin)
export const getWalletTransactions = asyncHandler(async (req, res) => {
    const { walletId } = req.params;
    const { page, limit } = getPagination(req.query, 20);
    const { type, source, startDate, endDate } = req.query;

    const wallet = await Wallet.findById(walletId);
    if (!wallet) return errorResponse(res, 404, "Wallet not found");

    const result = await Wallet.getTransactionHistory(wallet.owner, wallet.ownerModel, {
        page, limit, type, source, startDate, endDate
    });

    return successResponse(res, 200, "Transactions retrieved", {
        transactions: result.transactions,
        pagination: createPaginationResponse(result.total, page, limit)
    });
});

// @route   POST /api/v1/wallet/admin/:walletId/credit
// @desc    Admin credit to wallet (manual adjustment)
// @access  Private (Admin)
export const adminCreditWallet = asyncHandler(async (req, res) => {
    const { walletId } = req.params;
    const { amount, description, metadata } = req.body;

    if (!amount || amount <= 0) {
        return errorResponse(res, 400, "Valid positive amount is required");
    }

    const wallet = await Wallet.findById(walletId);
    if (!wallet) return errorResponse(res, 404, "Wallet not found");

    const transaction = await wallet.credit(
        parseFloat(amount),
        "admin_credit",
        description || `Admin credit by ${req.admin?.email || "system"}`,
        { metadata: { ...metadata, adminId: req.admin?.id } }
    );

    logger.info(`Admin wallet credit: ₹${amount} to wallet ${walletId} by admin ${req.admin?.id}`);

    return successResponse(res, 200, "Wallet credited successfully", {
        transaction,
        newBalance: wallet.balance + parseFloat(amount)
    });
});

// @route   POST /api/v1/wallet/admin/:walletId/debit
// @desc    Admin debit from wallet (manual adjustment)
// @access  Private (Admin)
export const adminDebitWallet = asyncHandler(async (req, res) => {
    const { walletId } = req.params;
    const { amount, description, metadata } = req.body;

    if (!amount || amount <= 0) {
        return errorResponse(res, 400, "Valid positive amount is required");
    }

    const wallet = await Wallet.findById(walletId);
    if (!wallet) return errorResponse(res, 404, "Wallet not found");

    if (wallet.balance < amount) {
        return errorResponse(res, 400, `Insufficient balance. Current: ₹${wallet.balance}`);
    }

    const transaction = await wallet.debit(
        parseFloat(amount),
        "admin_debit",
        description || `Admin debit by ${req.admin?.email || "system"}`,
        { metadata: { ...metadata, adminId: req.admin?.id } }
    );

    logger.info(`Admin wallet debit: ₹${amount} from wallet ${walletId} by admin ${req.admin?.id}`);

    return successResponse(res, 200, "Wallet debited successfully", {
        transaction,
        newBalance: wallet.balance - parseFloat(amount)
    });
});

// @route   POST /api/v1/wallet/admin/:walletId/freeze
// @desc    Freeze a wallet (admin)
// @access  Private (Admin)
export const freezeWallet = asyncHandler(async (req, res) => {
    const { walletId } = req.params;
    const { reason } = req.body;

    if (!reason) {
        return errorResponse(res, 400, "Freeze reason is required");
    }

    const wallet = await Wallet.findById(walletId);
    if (!wallet) return errorResponse(res, 404, "Wallet not found");
    if (wallet.isFrozen) return errorResponse(res, 400, "Wallet is already frozen");

    await wallet.freeze(reason, req.admin?.id);

    logger.warn(`Wallet frozen: ${walletId} by admin ${req.admin?.id}. Reason: ${reason}`);

    return successResponse(res, 200, "Wallet frozen successfully", {
        walletId: wallet._id,
        isFrozen: true,
        frozenReason: reason
    });
});

// @route   POST /api/v1/wallet/admin/:walletId/unfreeze
// @desc    Unfreeze a wallet (admin)
// @access  Private (Admin)
export const unfreezeWallet = asyncHandler(async (req, res) => {
    const { walletId } = req.params;

    const wallet = await Wallet.findById(walletId);
    if (!wallet) return errorResponse(res, 404, "Wallet not found");
    if (!wallet.isFrozen) return errorResponse(res, 400, "Wallet is not frozen");

    await wallet.unfreeze();

    logger.info(`Wallet unfrozen: ${walletId} by admin ${req.admin?.id}`);

    return successResponse(res, 200, "Wallet unfrozen successfully", {
        walletId: wallet._id,
        isFrozen: false
    });
});

// @route   GET /api/v1/wallet/admin/stats
// @desc    Get wallet system statistics (admin)
// @access  Private (Admin)
export const getWalletStats = asyncHandler(async (req, res) => {
    const [stats] = await Wallet.aggregate([
        {
            $group: {
                _id: "$ownerModel",
                count: { $sum: 1 },
                totalBalance: { $sum: "$balance" },
                totalLifetimeEarnings: { $sum: "$lifetimeEarnings" },
                totalWithdrawn: { $sum: "$totalWithdrawn" },
                avgBalance: { $avg: "$balance" },
                frozenCount: { $sum: { $cond: ["$isFrozen", 1, 0] } },
                activeCount: { $sum: { $cond: ["$isActive", 1, 0] } }
            }
        },
        {
            $group: {
                _id: null,
                byOwnerType: {
                    $push: {
                        ownerModel: "$_id",
                        count: "$count",
                        totalBalance: "$totalBalance",
                        totalLifetimeEarnings: "$totalLifetimeEarnings",
                        totalWithdrawn: "$totalWithdrawn",
                        avgBalance: { $round: ["$avgBalance", 2] },
                        frozenCount: "$frozenCount",
                        activeCount: "$activeCount"
                    }
                },
                totalWallets: { $sum: "$count" },
                platformTotalBalance: { $sum: "$totalBalance" },
                platformTotalEarnings: { $sum: "$totalLifetimeEarnings" },
                platformTotalWithdrawn: { $sum: "$totalWithdrawn" }
            }
        }
    ]);

    return successResponse(res, 200, "Wallet statistics retrieved", {
        stats: stats || {
            byOwnerType: [],
            totalWallets: 0,
            platformTotalBalance: 0,
            platformTotalEarnings: 0,
            platformTotalWithdrawn: 0
        }
    });
});

// ============================
//       HELPER FUNCTIONS
// ============================

/**
 * Resolve the owner ID and model from the request.
 * Works for both User and Instructor authenticated routes.
 */
function resolveOwner(req) {
    if (req.user) {
        return { ownerId: req.user.id, ownerModel: "User" };
    }
    if (req.instructor) {
        return { ownerId: req.instructor.id, ownerModel: "Instructor" };
    }
    throw new Error("Unauthenticated: No user or instructor found on request");
}
