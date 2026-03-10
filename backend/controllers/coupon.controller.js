import { Coupon } from "../models/coupon.model.js";
import { Course } from "../models/course.model.js";
import { asyncHandler } from "../middlewares/async.middleware.js";
import { successResponse, errorResponse } from "../utils/response.utils.js";
import { getPagination, createPaginationResponse } from "../utils/pagination.utils.js";

// @route   POST /api/v1/coupons
// @desc    Create a coupon
// @access  Private (Instructor)
export const createCoupon = asyncHandler(async (req, res) => {
    const { code, course, discountType, discountValue, maxDiscount, minPurchaseAmount, usageLimit, perUserLimit, startDate, expiryDate, description } = req.body;

    // Verify course ownership if course-specific
    if (course) {
        const courseDoc = await Course.findOne({ _id: course, instructor: req.instructor.id });
        if (!courseDoc) return errorResponse(res, 404, "Course not found or not owned by you");
    }

    // Check for duplicate code
    const existing = await Coupon.findOne({ code: code.toUpperCase() });
    if (existing) return errorResponse(res, 409, "Coupon code already exists");

    const coupon = await Coupon.create({
        code: code.toUpperCase(),
        instructor: req.instructor.id,
        course: course || null,
        discountType,
        discountValue,
        maxDiscount: maxDiscount || null,
        minPurchaseAmount: minPurchaseAmount || 0,
        usageLimit: usageLimit || null,
        perUserLimit: perUserLimit || 1,
        startDate: startDate || new Date(),
        expiryDate,
        description
    });

    successResponse(res, 201, "Coupon created successfully", coupon);
});

// @route   GET /api/v1/coupons/instructor/my
// @desc    Get instructor's coupons
// @access  Private (Instructor)
export const getMyCoupons = asyncHandler(async (req, res) => {
    const { page, limit, skip } = getPagination(req.query, 10);
    const { isActive, courseId } = req.query;

    const filter = { instructor: req.instructor.id };
    if (isActive !== undefined) filter.isActive = isActive === "true";
    if (courseId) filter.course = courseId;

    const total = await Coupon.countDocuments(filter);
    const coupons = await Coupon.find(filter)
        .populate("course", "title")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

    successResponse(res, 200, "Coupons retrieved successfully", {
        coupons,
        pagination: createPaginationResponse(total, page, limit)
    });
});

// @route   GET /api/v1/coupons/instructor/my/:id
// @desc    Get single coupon
// @access  Private (Instructor)
export const getCoupon = asyncHandler(async (req, res) => {
    const coupon = await Coupon.findOne({ _id: req.params.id, instructor: req.instructor.id })
        .populate("course", "title");
    if (!coupon) return errorResponse(res, 404, "Coupon not found");

    successResponse(res, 200, "Coupon retrieved successfully", coupon);
});

// @route   PUT /api/v1/coupons/instructor/my/:id
// @desc    Update coupon
// @access  Private (Instructor)
export const updateCoupon = asyncHandler(async (req, res) => {
    const { discountType, discountValue, maxDiscount, minPurchaseAmount, usageLimit, perUserLimit, startDate, expiryDate, isActive, description } = req.body;

    const coupon = await Coupon.findOne({ _id: req.params.id, instructor: req.instructor.id });
    if (!coupon) return errorResponse(res, 404, "Coupon not found");

    if (discountType) coupon.discountType = discountType;
    if (discountValue !== undefined) coupon.discountValue = discountValue;
    if (maxDiscount !== undefined) coupon.maxDiscount = maxDiscount;
    if (minPurchaseAmount !== undefined) coupon.minPurchaseAmount = minPurchaseAmount;
    if (usageLimit !== undefined) coupon.usageLimit = usageLimit;
    if (perUserLimit !== undefined) coupon.perUserLimit = perUserLimit;
    if (startDate) coupon.startDate = startDate;
    if (expiryDate) coupon.expiryDate = expiryDate;
    if (isActive !== undefined) coupon.isActive = isActive;
    if (description !== undefined) coupon.description = description;

    await coupon.save();
    successResponse(res, 200, "Coupon updated successfully", coupon);
});

// @route   DELETE /api/v1/coupons/instructor/my/:id
// @desc    Delete coupon
// @access  Private (Instructor)
export const deleteCoupon = asyncHandler(async (req, res) => {
    const coupon = await Coupon.findOneAndDelete({ _id: req.params.id, instructor: req.instructor.id });
    if (!coupon) return errorResponse(res, 404, "Coupon not found");

    successResponse(res, 200, "Coupon deleted successfully");
});

// @route   POST /api/v1/coupons/validate
// @desc    Validate a coupon code (for users at checkout)
// @access  Private (User)
export const validateCoupon = asyncHandler(async (req, res) => {
    const { code, courseId } = req.body;
    if (!code || !courseId) return errorResponse(res, 400, "Coupon code and course ID are required");

    const coupon = await Coupon.findOne({ code: code.toUpperCase() });
    if (!coupon) return errorResponse(res, 404, "Invalid coupon code");

    // Check active & not expired
    if (!coupon.isActive) return errorResponse(res, 400, "Coupon is inactive");
    if (coupon.expiryDate < new Date()) return errorResponse(res, 400, "Coupon has expired");
    if (coupon.startDate > new Date()) return errorResponse(res, 400, "Coupon is not yet active");

    // Check usage limit
    if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
        return errorResponse(res, 400, "Coupon usage limit reached");
    }

    // Check per-user limit
    const userUses = coupon.usedBy.filter(u => u.user.toString() === req.user.id).length;
    if (userUses >= coupon.perUserLimit) {
        return errorResponse(res, 400, "You have already used this coupon");
    }

    // Check course applicability
    if (coupon.course && coupon.course.toString() !== courseId) {
        return errorResponse(res, 400, "Coupon is not valid for this course");
    }

    // Check course belongs to coupon's instructor
    const course = await Course.findById(courseId);
    if (!course) return errorResponse(res, 404, "Course not found");

    if (coupon.course === null && course.instructor.toString() !== coupon.instructor.toString()) {
        return errorResponse(res, 400, "Coupon is not valid for this course");
    }

    // Check min purchase
    const price = course.discountPrice || course.price || 0;
    if (price < coupon.minPurchaseAmount) {
        return errorResponse(res, 400, `Minimum purchase amount is ${coupon.minPurchaseAmount}`);
    }

    // Calculate discount
    let discount = 0;
    if (coupon.discountType === "percentage") {
        discount = (price * coupon.discountValue) / 100;
        if (coupon.maxDiscount && discount > coupon.maxDiscount) discount = coupon.maxDiscount;
    } else {
        discount = coupon.discountValue;
    }
    discount = Math.min(discount, price);

    successResponse(res, 200, "Coupon is valid", {
        coupon: { code: coupon.code, discountType: coupon.discountType, discountValue: coupon.discountValue },
        discount,
        finalPrice: price - discount
    });
});
