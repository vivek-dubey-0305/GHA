import express from "express";
import {
    createReview,
    updateReview,
    deleteReview,
    markHelpful,
    reportReview
} from "../controllers/review.controller.js";
import { authenticateUser } from "../middlewares/user.auth.middleware.js";

const router = express.Router();

// All review routes require user authentication
router.use(authenticateUser);

router.post("/", createReview);
router.put("/:id", updateReview);
router.delete("/:id", deleteReview);
router.patch("/:id/helpful", markHelpful);
router.patch("/:id/report", reportReview);

export default router;
