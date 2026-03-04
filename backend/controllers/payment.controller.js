import { Payment } from "../models/payment.model.js";
import { Course } from "../models/course.model.js";
import { Enrollment } from "../models/enrollment.model.js";
import { User } from "../models/user.model.js";
import { asyncHandler } from "../middlewares/async.middleware.js";
import { errorResponse, successResponse } from "../utils/response.utils.js";
import { getPagination, createPaginationResponse } from "../utils/pagination.utils.js";
import logger from "../configs/logger.config.js";

/**
 * Payment Controller
 * Handles payment initiation, verification, and management
 */

// @route   POST /api/v1/payments/initiate
// @desc    Initiate a payment for course enrollment
// @access  Private (User)
export const initiatePayment = asyncHandler(async (req, res) => {
    const { courseId, paymentMethod, couponCode } = req.body;

    if (!courseId || !paymentMethod) {
        return errorResponse(res, 400, "Course ID and payment method are required");
    }

    // Check if course exists and is published
    const course = await Course.findById(courseId);
    if (!course) return errorResponse(res, 404, "Course not found");
    if (course.status !== "published") {
        return errorResponse(res, 400, "Course is not available for enrollment");
    }

    // Check if already enrolled
    const isEnrolled = await Enrollment.isUserEnrolled(req.user.id, courseId);
    if (isEnrolled) {
        return errorResponse(res, 400, "You are already enrolled in this course");
    }

    // Calculate amount
    let amount = course.discountPrice || course.price;
    let originalAmount = course.price;
    let discountAmount = originalAmount - amount;

    // Handle free courses
    if (amount === 0) {
        // Create enrollment directly
        const enrollment = await Enrollment.create({
            user: req.user.id,
            course: courseId,
            status: "active"
        });

        // Update course enrolled count
        await Course.findByIdAndUpdate(courseId, { $inc: { enrolledCount: 1 } });

        return successResponse(res, 200, "Enrolled in free course successfully", { enrollment });
    }

    // Create payment record
    const payment = await Payment.create({
        user: req.user.id,
        course: courseId,
        amount,
        originalAmount,
        discountAmount,
        currency: req.body.currency || "INR",
        paymentMethod,
        paymentGatewayId: `PENDING-${Date.now()}`,
        status: "pending",
        metadata: {
            userAgent: req.headers["user-agent"],
            ipAddress: req.ip,
            couponCode: couponCode || null
        }
    });

    // In a real implementation, you'd integrate with Razorpay/Stripe here
    // For now, return the payment record for frontend to process
    successResponse(res, 201, "Payment initiated", {
        payment,
        // Gateway-specific data would be returned here
        // razorpayOrderId: order.id, etc.
    });
});

// @route   POST /api/v1/payments/verify
// @desc    Verify and complete a payment
// @access  Private (User)
export const verifyPayment = asyncHandler(async (req, res) => {
    const { paymentId, gatewayPaymentId, gatewaySignature } = req.body;

    if (!paymentId || !gatewayPaymentId) {
        return errorResponse(res, 400, "Payment ID and gateway payment ID are required");
    }

    const payment = await Payment.findById(paymentId);
    if (!payment) return errorResponse(res, 404, "Payment not found");

    if (payment.user.toString() !== req.user.id) {
        return errorResponse(res, 403, "Unauthorized payment verification");
    }

    if (payment.status !== "pending") {
        return errorResponse(res, 400, `Payment is already ${payment.status}`);
    }

    // In production: verify signature with payment gateway
    // const isValid = razorpay.validateWebhookSignature(...)
    // For now, simulate successful verification

    // Mark payment as completed
    await payment.markCompleted(gatewayPaymentId);

    // Create enrollment
    const enrollment = await Enrollment.create({
        user: req.user.id,
        course: payment.course,
        payment: payment._id,
        status: "active"
    });

    // Update course enrolled count
    await Course.findByIdAndUpdate(payment.course, { $inc: { enrolledCount: 1 } });

    // Update user learning progress
    await User.findByIdAndUpdate(req.user.id, {
        $inc: { "learningProgress.totalCoursesEnrolled": 1 }
    });

    successResponse(res, 200, "Payment verified and enrollment created", {
        payment,
        enrollment
    });
});

// @route   POST /api/v1/payments/webhook
// @desc    Handle payment gateway webhook
// @access  Public (verified by signature)
export const handleWebhook = asyncHandler(async (req, res) => {
    const { event, payload } = req.body;

    logger.info(`Payment webhook received: ${event}`);

    // In production: verify webhook signature
    // Store raw webhook data
    if (payload?.payment?.entity) {
        const payment = await Payment.findOne({
            paymentGatewayId: payload.payment.entity.order_id
        });

        if (payment) {
            payment.webhookData = payload;

            if (event === "payment.captured") {
                await payment.markCompleted(payload.payment.entity.id);
            } else if (event === "payment.failed") {
                await payment.markFailed(payload.payment.entity.error_description);
            }
        }
    }

    // Always respond 200 to webhook
    res.status(200).json({ received: true });
});

// @route   GET /api/v1/payments/my
// @desc    Get user's payment history
// @access  Private (User)
export const getMyPayments = asyncHandler(async (req, res) => {
    const { page, limit, skip } = getPagination(req.query, 10);
    const { status } = req.query;

    const payments = await Payment.getUserPayments(req.user.id, {
        status,
        limit,
        skip
    });

    const total = await Payment.countDocuments({
        user: req.user.id,
        ...(status && { status })
    });

    successResponse(res, 200, "Payment history retrieved", {
        payments,
        pagination: createPaginationResponse(total, page, limit)
    });
});

// @route   GET /api/v1/payments/:id
// @desc    Get payment details
// @access  Private (User - own / Admin)
export const getPayment = asyncHandler(async (req, res) => {
    const payment = await Payment.findById(req.params.id)
        .populate("user", "firstName lastName email")
        .populate("course", "title thumbnail price");

    if (!payment) return errorResponse(res, 404, "Payment not found");

    // Check ownership (unless admin)
    if (req.user && payment.user._id.toString() !== req.user.id) {
        return errorResponse(res, 403, "Unauthorized");
    }

    successResponse(res, 200, "Payment details retrieved", payment);
});

// @route   POST /api/v1/payments/:id/refund
// @desc    Request a refund
// @access  Private (User)
export const requestRefund = asyncHandler(async (req, res) => {
    const { reason } = req.body;
    const payment = await Payment.findById(req.params.id);
    if (!payment) return errorResponse(res, 404, "Payment not found");

    if (payment.user.toString() !== req.user.id) {
        return errorResponse(res, 403, "Unauthorized");
    }

    if (!payment.isRefundable()) {
        return errorResponse(res, 400, "Payment is not eligible for refund (30-day policy or already refunded)");
    }

    await payment.processRefund(payment.amount, reason || "User requested refund");

    // Update enrollment status
    await Enrollment.findOneAndUpdate(
        { user: req.user.id, course: payment.course, payment: payment._id },
        { status: "refunded" }
    );

    // Update course enrolled count
    await Course.findByIdAndUpdate(payment.course, { $inc: { enrolledCount: -1 } });

    successResponse(res, 200, "Refund processed successfully", payment);
});

// @route   GET /api/v1/payments/instructor/revenue
// @desc    Get instructor revenue stats
// @access  Private (Instructor)
export const getInstructorRevenue = asyncHandler(async (req, res) => {
    const courses = await Course.find({ instructor: req.instructor.id }).select("_id");
    const courseIds = courses.map(c => c._id);

    const revenue = await Payment.aggregate([
        { $match: { course: { $in: courseIds }, status: "completed" } },
        {
            $group: {
                _id: null,
                totalRevenue: { $sum: "$amount" },
                totalTransactions: { $sum: 1 },
                averageTransaction: { $avg: "$amount" }
            }
        }
    ]);

    const monthlyRevenue = await Payment.aggregate([
        { $match: { course: { $in: courseIds }, status: "completed" } },
        {
            $group: {
                _id: {
                    year: { $year: "$completedAt" },
                    month: { $month: "$completedAt" }
                },
                revenue: { $sum: "$amount" },
                transactions: { $sum: 1 }
            }
        },
        { $sort: { "_id.year": -1, "_id.month": -1 } },
        { $limit: 12 }
    ]);

    const courseRevenue = await Payment.aggregate([
        { $match: { course: { $in: courseIds }, status: "completed" } },
        { $group: { _id: "$course", revenue: { $sum: "$amount" }, enrollments: { $sum: 1 } } },
        { $sort: { revenue: -1 } }
    ]);

    // Populate course names
    const populatedCourseRevenue = await Course.populate(courseRevenue, {
        path: "_id",
        select: "title thumbnail"
    });

    successResponse(res, 200, "Revenue data retrieved", {
        summary: revenue[0] || { totalRevenue: 0, totalTransactions: 0, averageTransaction: 0 },
        monthlyRevenue,
        courseRevenue: populatedCourseRevenue
    });
});
