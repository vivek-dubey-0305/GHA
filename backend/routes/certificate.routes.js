import express from "express";
import {
    generateCertificate,
    getMyCertificates,
    getCertificate,
    verifyCertificate,
    getCourseCertificates
} from "../controllers/certificate.controller.js";
import { authenticateUser } from "../middlewares/user.auth.middleware.js";
import { authenticateInstructor } from "../middlewares/instructor.auth.middleware.js";

const router = express.Router();

// ===== Public Routes =====
router.get("/verify/:verificationCode", verifyCertificate);

// ===== User Routes (Protected) =====
router.post("/generate", authenticateUser, generateCertificate);
router.get("/my", authenticateUser, getMyCertificates);
router.get("/:id", authenticateUser, getCertificate);

// ===== Instructor Routes (Protected) =====
router.get("/course/:courseId", authenticateInstructor, getCourseCertificates);

export default router;
