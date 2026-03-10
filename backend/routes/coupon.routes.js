import express from "express";
import {
    createCoupon,
    getMyCoupons,
    getCoupon,
    updateCoupon,
    deleteCoupon,
    validateCoupon
} from "../controllers/coupon.controller.js";
import { authenticateInstructor } from "../middlewares/instructor.auth.middleware.js";
import { authenticateUser } from "../middlewares/user.auth.middleware.js";

const router = express.Router();

// Instructor routes
router.post("/", authenticateInstructor, createCoupon);
router.get("/instructor/my", authenticateInstructor, getMyCoupons);
router.get("/instructor/my/:id", authenticateInstructor, getCoupon);
router.put("/instructor/my/:id", authenticateInstructor, updateCoupon);
router.delete("/instructor/my/:id", authenticateInstructor, deleteCoupon);

// User routes
router.post("/validate", authenticateUser, validateCoupon);

export default router;
