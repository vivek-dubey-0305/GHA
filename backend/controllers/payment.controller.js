/// controllers/payment.controller.js
import { Payment } from "../models/payment.model.js";
import { Course } from "../models/course.model.js";
import { Enrollment } from "../models/enrollment.model.js";
import { User } from "../models/user.model.js";
import { Instructor } from "../models/instructor.model.js";
import { Wallet } from "../models/wallet.model.js";
import mongoose from "mongoose";
import { asyncHandler } from "../middlewares/async.middleware.js";
import { errorResponse, successResponse } from "../utils/response.utils.js";
import { getPagination, createPaginationResponse } from "../utils/pagination.utils.js";
import logger from "../configs/logger.config.js";
import {
    createRazorpayOrder,
    verifyRazorpayPaymentSignature,
    verifyRazorpayWebhookSignature,
    getPublicRazorpayConfig
} from "../services/payment.service.js";

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
    if (course.status !== "published" || !course.isPublished) {
        return errorResponse(res, 400, "Course is not available for enrollment");
    }
    console.log("Over here")
    if (course.maxStudents && course.enrolledCount >= course.maxStudents) {
        return errorResponse(res, 400, "Course is full");
    }

    // Check if already enrolled
    const isEnrolled = await Enrollment.isUserEnrolled(req.user.id, courseId);
    if (isEnrolled) {
        return errorResponse(res, 400, "You are already enrolled in this course");
    }

    // Calculate amount
    const currentPrice = typeof course.currentPrice === "number"
        ? course.currentPrice
        : (course.discountPrice || course.price);
    let amount = currentPrice;
    let originalAmount = course.price;
    let discountAmount = originalAmount - amount;

    // Handle free courses with a zero-value completed payment
    if (amount <= 0) {
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            const existingEnrollment = await Enrollment.findOne({
                user: req.user.id,
                course: courseId
            }).session(session);

            if (existingEnrollment) {
                await session.abortTransaction();
                session.endSession();
                return errorResponse(res, 400, "You are already enrolled in this course");
            }

            const payment = await Payment.create([
                {
                    user: req.user.id,
                    course: courseId,
                    amount: 0,
                    originalAmount,
                    discountAmount: originalAmount,
                    currency: "INR",
                    paymentMethod: "other",
                    paymentGatewayId: `FREE-${Date.now()}`,
                    gatewayOrderId: `FREE-ORDER-${Date.now()}`,
                    status: "completed",
                    completedAt: new Date(),
                    metadata: {
                        userAgent: req.headers["user-agent"],
                        ipAddress: req.ip,
                        couponCode: couponCode || null,
                        source: "free_course_auto_enroll"
                    }
                }
            ], { session });

            const enrollment = await Enrollment.create([
                {
                    user: req.user.id,
                    course: courseId,
                    payment: payment[0]._id,
                    totalLessons: course.totalLessons || 0,
                    status: "active"
                }
            ], { session });

            await Course.findByIdAndUpdate(courseId, { $inc: { enrolledCount: 1 } }, { session });
            await User.findByIdAndUpdate(req.user.id, {
                $inc: { "learningProgress.totalCoursesEnrolled": 1 }
            }, { session });
            await Instructor.findByIdAndUpdate(course.instructor, {
                $inc: { totalStudentsTeaching: 1 }
            }, { session });

            await session.commitTransaction();
            session.endSession();

            logger.info(`Free enrollment completed | user=${req.user.id} | course=${courseId}`);

            return successResponse(res, 200, "Enrolled in free course successfully", {
                payment: payment[0],
                enrollment: enrollment[0],
                isFreeEnrollment: true
            });
        } catch (error) {
            await session.abortTransaction();
            session.endSession();
            throw error;
        }
    }

    if (paymentMethod !== "razorpay") {
        return errorResponse(res, 400, "Only Razorpay is supported for paid enrollments");
    }

    const existingPending = await Payment.findOne({
        user: req.user.id,
        course: courseId,
        paymentMethod: "razorpay",
        status: "pending"
    }).sort({ createdAt: -1 });

    if (existingPending?.gatewayOrderId) {
        const { keyId } = getPublicRazorpayConfig();
        return successResponse(res, 200, "Existing payment order found", {
            payment: existingPending,
            checkout: {
                key: keyId,
                orderId: existingPending.gatewayOrderId,
                amount: Math.round(existingPending.amount * 100),
                currency: existingPending.currency
            }
        });
    }

    const order = await createRazorpayOrder({
        amount,
        currency: req.body.currency || "INR",
        receipt: `course_${courseId}_user_${req.user.id}_${Date.now()}`,
        notes: {
            userId: String(req.user.id),
            courseId: String(courseId)
        }
    });

    // Create payment record
    const payment = await Payment.create({
        user: req.user.id,
        course: courseId,
        amount,
        originalAmount,
        discountAmount,
        currency: order.currency,
        paymentMethod: "razorpay",
        paymentGatewayId: order.id,
        gatewayOrderId: order.id,
        status: "pending",
        metadata: {
            userAgent: req.headers["user-agent"],
            ipAddress: req.ip,
            couponCode: couponCode || null,
            source: "checkout"
        }
    });

    const { keyId } = getPublicRazorpayConfig();

    logger.info(`Payment initiated | payment=${payment._id} | user=${req.user.id} | course=${courseId} | order=${order.id}`);

    successResponse(res, 201, "Payment initiated", {
        payment,
        checkout: {
            key: keyId,
            orderId: order.id,
            amount: order.amount,
            currency: order.currency,
            name: "Greed Hunter Academy",
            description: `Enrollment for ${course.title}`
        }
    });
});

// @route   POST /api/v1/payments/verify
// @desc    Verify payment signature and move payment to processing
// @access  Private (User)
export const verifyPayment = asyncHandler(async (req, res) => {
    const { paymentId, gatewayOrderId, gatewayPaymentId, gatewaySignature } = req.body;

    if (!paymentId || !gatewayPaymentId || !gatewaySignature) {
        return errorResponse(res, 400, "paymentId, gatewayPaymentId and gatewaySignature are required");
    }

    const payment = await Payment.findById(paymentId).populate("course", "instructor totalLessons maxStudents enrolledCount");
    if (!payment) return errorResponse(res, 404, "Payment not found");

    if (payment.user.toString() !== req.user.id) {
        return errorResponse(res, 403, "Unauthorized payment verification");
    }

    if (!payment.gatewayOrderId) {
        return errorResponse(res, 400, "Payment order reference is missing");
    }

    if (gatewayOrderId && gatewayOrderId !== payment.gatewayOrderId) {
        return errorResponse(res, 400, "Order ID mismatch for this payment");
    }

    if (payment.status === "completed") {
        const existingEnrollment = await Enrollment.findOne({
            user: req.user.id,
            course: payment.course._id,
            payment: payment._id
        });

        return successResponse(res, 200, "Payment already completed", {
            payment,
            enrollment: existingEnrollment || null
        });
    }

    if (payment.status === "processing") {
        return successResponse(res, 200, "Payment verification accepted, awaiting webhook confirmation", {
            payment,
            settlement: "pending_webhook"
        });
    }

    const isValidSignature = verifyRazorpayPaymentSignature({
        orderId: payment.gatewayOrderId,
        paymentId: gatewayPaymentId,
        signature: gatewaySignature
    });

    if (!isValidSignature) {
        logger.warn(`Payment verification failed due to signature mismatch | payment=${paymentId} | user=${req.user.id}`);
        return errorResponse(res, 400, "Invalid payment signature");
    }

    // Atomic lock: only one verifier can move pending -> processing
    const processingPayment = await Payment.findOneAndUpdate(
        {
            _id: paymentId,
            user: req.user.id,
            status: "pending"
        },
        {
            $set: {
                status: "processing",
                paymentGatewayId: gatewayPaymentId,
                gatewaySignature: gatewaySignature,
                ...(gatewayOrderId ? { gatewayOrderId } : {}),
                metadata: {
                    ...(payment.metadata || {}),
                    verifiedBy: "user_callback",
                    verifyAcceptedAt: new Date().toISOString(),
                    settlement: "awaiting_webhook"
                }
            }
        },
        { new: true }
    );

    if (!processingPayment) {
        const latest = await Payment.findById(paymentId);
        if (!latest) {
            return errorResponse(res, 404, "Payment not found during verification");
        }

        if (latest.status === "processing" || latest.status === "completed") {
            return successResponse(res, 200, "Payment verification accepted, awaiting webhook confirmation", {
                payment: latest,
                settlement: latest.status === "completed" ? "completed" : "pending_webhook"
            });
        }

        return errorResponse(res, 400, `Payment cannot be verified from status '${latest.status}'`);
    }

    logger.info(`Payment moved to processing | payment=${paymentId} | user=${req.user.id} | gatewayPayment=${gatewayPaymentId}`);

    return successResponse(res, 200, "Payment verification accepted, awaiting webhook confirmation", {
        payment: processingPayment,
        settlement: "pending_webhook"
    });
});

// @route   POST /api/v1/payments/webhook
// @desc    Handle payment gateway webhook
// @access  Public (verified by signature)
export const handleWebhook = asyncHandler(async (req, res) => {
    try {
        const signature = req.headers["x-razorpay-signature"];
        const rawBody = Buffer.isBuffer(req.body) ? req.body : Buffer.from(JSON.stringify(req.body || {}));
        const isValid = verifyRazorpayWebhookSignature({ rawBody, signature });

        if (!isValid) {
            logger.warn("Rejected payment webhook due to invalid signature");
            return res.status(400).json({ received: false, message: "Invalid webhook signature" });
        }

        const webhook = Buffer.isBuffer(req.body)
            ? JSON.parse(req.body.toString("utf8"))
            : req.body;

        const event = webhook?.event;
        const entity = webhook?.payload?.payment?.entity;

        logger.info(`Payment webhook received | event=${event}`);

        if (!entity) {
            return res.status(200).json({ received: true, skipped: true });
        }

        const payment = await Payment.findOne({ gatewayOrderId: entity.order_id }).populate("course", "instructor totalLessons maxStudents enrolledCount");
        if (!payment) {
            logger.warn(`Webhook payment not found for orderId=${entity.order_id}`);
            return res.status(200).json({ received: true, skipped: true });
        }

        payment.webhookData = webhook.payload;

        if (event === "payment.captured") {
            // Idempotency hard guard for retries/replays.
            if (payment.status === "completed") {
                logger.info(`Webhook replay ignored for completed payment | payment=${payment._id} | order=${entity.order_id}`);
                return res.status(200).json({ received: true, idempotent: true });
            }

            const session = await mongoose.startSession();
            session.startTransaction();
            try {
                const livePayment = await Payment.findById(payment._id).session(session);
                if (!livePayment) {
                    throw new Error("Payment not found during webhook settlement");
                }

                if (livePayment.status === "completed") {
                    await session.commitTransaction();
                    session.endSession();
                    logger.info(`Webhook replay ignored after re-check | payment=${payment._id}`);
                    return res.status(200).json({ received: true, idempotent: true });
                }

                if (!["pending", "processing"].includes(livePayment.status)) {
                    throw new Error(`Cannot settle payment from status '${livePayment.status}'`);
                }

                const liveCourse = await Course.findById(livePayment.course)
                    .select("instructor totalLessons maxStudents enrolledCount")
                    .session(session);

                if (!liveCourse) {
                    throw new Error("Course not found while processing webhook");
                }

                // Lock marker before provisioning side effects.
                livePayment.status = "processing";
                livePayment.paymentGatewayId = entity.id;
                livePayment.gatewaySignature = signature;
                livePayment.webhookData = webhook.payload;
                await livePayment.save({ session });

                const existingEnrollment = await Enrollment.findOne({
                    user: livePayment.user,
                    course: livePayment.course
                }).session(session);

                if (!existingEnrollment) {
                    if (liveCourse.maxStudents && liveCourse.enrolledCount >= liveCourse.maxStudents) {
                        throw new Error("Course is full while processing webhook");
                    }

                    await Enrollment.create([
                        {
                            user: livePayment.user,
                            course: livePayment.course,
                            payment: livePayment._id,
                            totalLessons: liveCourse.totalLessons || 0,
                            status: "active"
                        }
                    ], { session });

                    await Course.findByIdAndUpdate(livePayment.course, { $inc: { enrolledCount: 1 } }, { session });
                    await User.findByIdAndUpdate(livePayment.user, {
                        $inc: { "learningProgress.totalCoursesEnrolled": 1 }
                    }, { session });
                    await Instructor.findByIdAndUpdate(liveCourse.instructor, {
                        $inc: { totalStudentsTeaching: 1 }
                    }, { session });

                    await creditInstructorWalletInSession({
                        instructorId: liveCourse.instructor,
                        amount: livePayment.amount,
                        paymentId: livePayment._id,
                        courseId: liveCourse._id,
                        session
                    });
                }

                livePayment.status = "completed";
                livePayment.completedAt = new Date();
                livePayment.paymentGatewayId = entity.id;
                livePayment.gatewaySignature = signature;
                livePayment.idempotencyKey = `${entity.order_id}:${entity.id}`;
                livePayment.metadata = {
                    ...(livePayment.metadata || {}),
                    verifiedBy: "webhook",
                    verifiedAt: new Date().toISOString(),
                    walletCredited: !existingEnrollment,
                    settlement: "completed"
                };
                livePayment.webhookData = webhook.payload;
                await livePayment.save({ session });

                await session.commitTransaction();
                session.endSession();
                logger.info(`Webhook settlement completed | payment=${livePayment._id} | order=${entity.order_id}`);
            } catch (error) {
                await session.abortTransaction();
                session.endSession();
                throw error;
            }
        } else if (event === "payment.failed") {
            await payment.markFailed(entity.error_description || "Payment failed at gateway");
            payment.webhookData = webhook.payload;
            await payment.save();
        } else {
            await payment.save();
        }

        return res.status(200).json({ received: true });
    } catch (error) {
        logger.error(`Webhook processing failed: ${error.message}`);
        return res.status(200).json({ received: true, error: "Webhook processing error" });
    }
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

    // Keep analytics counters aligned
    await User.findByIdAndUpdate(req.user.id, {
        $inc: { "learningProgress.totalCoursesEnrolled": -1 }
    });

    const course = await Course.findById(payment.course).select("instructor");
    if (course?.instructor) {
        await Instructor.findByIdAndUpdate(course.instructor, {
            $inc: { totalStudentsTeaching: -1 }
        });
    }

    logger.info(`Refund processed | payment=${payment._id} | user=${req.user.id}`);

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

async function creditInstructorWalletInSession({ instructorId, amount, paymentId, courseId, session }) {
    let wallet = await Wallet.findOne({ owner: instructorId, ownerModel: "Instructor" }).session(session);

    if (!wallet) {
        const created = await Wallet.create([
            {
                owner: instructorId,
                ownerModel: "Instructor",
                currency: "INR",
                balance: 0,
                lifetimeEarnings: 0,
                totalCredited: 0,
                totalDebited: 0,
                totalWithdrawn: 0,
                holdAmount: 0,
                transactions: []
            }
        ], { session });
        wallet = created[0];
    }

    const transaction = {
        type: "credit",
        amount,
        currency: "INR",
        source: "course_earning",
        description: `Course sale credit for payment ${paymentId}`,
        referenceId: paymentId,
        referenceModel: "Payment",
        balanceAfter: wallet.balance + amount,
        status: "completed",
        metadata: {
            courseId,
            paymentId
        },
        createdAt: new Date()
    };

    await Wallet.findByIdAndUpdate(
        wallet._id,
        {
            $inc: {
                balance: amount,
                lifetimeEarnings: amount,
                totalCredited: amount
            },
            $set: { lastTransactionAt: new Date() },
            $push: { transactions: transaction }
        },
        { session }
    );
}
