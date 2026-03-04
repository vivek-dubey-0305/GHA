import express from "express";
import {
    initiatePayment,
    verifyPayment,
    handleWebhook,
    getMyPayments,
    getPayment,
    requestRefund,
    getInstructorRevenue
} from "../controllers/payment.controller.js";
import { authenticateUser } from "../middlewares/user.auth.middleware.js";
import { authenticateInstructor } from "../middlewares/instructor.auth.middleware.js";

const router = express.Router();

// ===== Webhook Route (No Auth - Verified by signature) =====
router.post("/webhook", handleWebhook);

// ===== User Routes (Protected) =====
router.post("/initiate", authenticateUser, initiatePayment);
router.post("/verify", authenticateUser, verifyPayment);
router.get("/my", authenticateUser, getMyPayments);
router.get("/:id", authenticateUser, getPayment);
router.post("/:id/refund", authenticateUser, requestRefund);

// ===== Instructor Routes (Protected) =====
router.get("/instructor/revenue", authenticateInstructor, getInstructorRevenue);

export default router;
