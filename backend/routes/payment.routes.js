// routes/payment.routes.js
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
router.post("/webhook", express.raw({ type: "application/json" }), handleWebhook);

// ===== Instructor Routes (Protected) =====
router.get("/instructor/revenue", authenticateInstructor, getInstructorRevenue);

// ===== User Routes (Protected) =====
router.post("/initiate", authenticateUser, initiatePayment);
router.post("/verify", authenticateUser, verifyPayment);
router.get("/my", authenticateUser, getMyPayments);
router.post("/:id/refund", authenticateUser, requestRefund);
router.get("/:id", authenticateUser, getPayment);

export default router;
