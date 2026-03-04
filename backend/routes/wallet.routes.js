import express from "express";
import {
    getMyWallet,
    getMyTransactions,
    getBalance,
    getAllWallets,
    getWalletById,
    getWalletTransactions,
    adminCreditWallet,
    adminDebitWallet,
    freezeWallet,
    unfreezeWallet,
    getWalletStats
} from "../controllers/wallet.controller.js";
import { authenticateUser } from "../middlewares/user.auth.middleware.js";
import { authenticateInstructor } from "../middlewares/instructor.auth.middleware.js";
import { verifyAdminToken } from "../middlewares/admin.auth.middleware.js";

const router = express.Router();

// ===== User Wallet Routes (Protected) =====
router.get("/user/me", authenticateUser, getMyWallet);
router.get("/user/transactions", authenticateUser, getMyTransactions);
router.get("/user/balance", authenticateUser, getBalance);

// ===== Instructor Wallet Routes (Protected) =====
router.get("/instructor/me", authenticateInstructor, getMyWallet);
router.get("/instructor/transactions", authenticateInstructor, getMyTransactions);
router.get("/instructor/balance", authenticateInstructor, getBalance);

// ===== Admin Wallet Routes (Protected) =====
router.get("/admin/stats", verifyAdminToken, getWalletStats);
router.get("/admin/all", verifyAdminToken, getAllWallets);
router.get("/admin/:walletId", verifyAdminToken, getWalletById);
router.get("/admin/:walletId/transactions", verifyAdminToken, getWalletTransactions);
router.post("/admin/:walletId/credit", verifyAdminToken, adminCreditWallet);
router.post("/admin/:walletId/debit", verifyAdminToken, adminDebitWallet);
router.post("/admin/:walletId/freeze", verifyAdminToken, freezeWallet);
router.post("/admin/:walletId/unfreeze", verifyAdminToken, unfreezeWallet);

export default router;
