import { Course } from "../models/course.model.js";
import { Enrollment } from "../models/enrollment.model.js";
import { Progress } from "../models/progress.model.js";
import { Payment } from "../models/payment.model.js";
import { Review } from "../models/review.model.js";
import { asyncHandler } from "../middlewares/async.middleware.js";
import { successResponse, errorResponse } from "../utils/response.utils.js";

// @route   GET /api/v1/analytics/instructor/overview
// @desc    Get instructor's overall analytics
// @access  Private (Instructor)
export const getInstructorOverview = asyncHandler(async (req, res) => {
    const courses = await Course.find({ instructor: req.instructor.id }).select("_id title");
    const courseIds = courses.map(c => c._id);

    const [totalEnrollments, activeEnrollments, completedEnrollments] = await Promise.all([
        Enrollment.countDocuments({ course: { $in: courseIds } }),
        Enrollment.countDocuments({ course: { $in: courseIds }, status: "active" }),
        Enrollment.countDocuments({ course: { $in: courseIds }, status: "completed" })
    ]);

    const revenueAgg = await Payment.aggregate([
        { $match: { instructor: req.instructor._id || req.instructor.id, status: "completed" } },
        { $group: { _id: null, total: { $sum: "$amount" }, count: { $sum: 1 } } }
    ]);

    const reviewStats = await Review.aggregate([
        { $match: { course: { $in: courseIds } } },
        { $group: { _id: null, avgRating: { $avg: "$rating" }, count: { $sum: 1 } } }
    ]);

    successResponse(res, 200, "Analytics overview", {
        totalCourses: courses.length,
        totalEnrollments,
        activeEnrollments,
        completedEnrollments,
        completionRate: totalEnrollments > 0 ? Math.round((completedEnrollments / totalEnrollments) * 100) : 0,
        totalRevenue: revenueAgg[0]?.total || 0,
        totalTransactions: revenueAgg[0]?.count || 0,
        averageRating: reviewStats[0]?.avgRating ? Number(reviewStats[0].avgRating.toFixed(1)) : 0,
        totalReviews: reviewStats[0]?.count || 0
    });
});

// @route   GET /api/v1/analytics/instructor/enrollments
// @desc    Get enrollment trends over time
// @access  Private (Instructor)
export const getEnrollmentTrends = asyncHandler(async (req, res) => {
    const { period = "30d" } = req.query;
    const courses = await Course.find({ instructor: req.instructor.id }).select("_id");
    const courseIds = courses.map(c => c._id);

    const days = period === "7d" ? 7 : period === "90d" ? 90 : 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const trends = await Enrollment.aggregate([
        { $match: { course: { $in: courseIds }, createdAt: { $gte: startDate } } },
        {
            $group: {
                _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                count: { $sum: 1 }
            }
        },
        { $sort: { _id: 1 } }
    ]);

    successResponse(res, 200, "Enrollment trends", { trends, period });
});

// @route   GET /api/v1/analytics/instructor/course/:courseId
// @desc    Get detailed analytics for a specific course
// @access  Private (Instructor)
export const getCourseAnalytics = asyncHandler(async (req, res) => {
    const course = await Course.findOne({ _id: req.params.courseId, instructor: req.instructor.id });
    if (!course) return errorResponse(res, 404, "Course not found or not owned by you");

    const [enrollmentCount, completedCount, progressData, reviewData, revenueData] = await Promise.all([
        Enrollment.countDocuments({ course: course._id }),
        Enrollment.countDocuments({ course: course._id, status: "completed" }),
        Progress.aggregate([
            { $match: { course: course._id } },
            {
                $group: {
                    _id: "$user",
                    avgProgress: { $avg: "$progressPercentage" },
                    totalTime: { $sum: "$timeSpent" }
                }
            },
            {
                $group: {
                    _id: null,
                    avgProgress: { $avg: "$avgProgress" },
                    totalWatchTime: { $sum: "$totalTime" },
                    studentCount: { $sum: 1 }
                }
            }
        ]),
        Review.aggregate([
            { $match: { course: course._id } },
            {
                $group: {
                    _id: null,
                    avgRating: { $avg: "$rating" },
                    count: { $sum: 1 },
                    distribution: {
                        $push: "$rating"
                    }
                }
            }
        ]),
        Payment.aggregate([
            { $match: { course: course._id, status: "completed" } },
            { $group: { _id: null, total: { $sum: "$amount" }, count: { $sum: 1 } } }
        ])
    ]);

    // Calculate rating distribution
    const ratingDist = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    if (reviewData[0]?.distribution) {
        reviewData[0].distribution.forEach(r => { ratingDist[r] = (ratingDist[r] || 0) + 1; });
    }

    // Progress distribution buckets
    const progressBuckets = await Progress.aggregate([
        { $match: { course: course._id } },
        { $group: { _id: "$user", avgProg: { $avg: "$progressPercentage" } } },
        {
            $bucket: {
                groupBy: "$avgProg",
                boundaries: [0, 25, 50, 75, 100, 101],
                default: "other",
                output: { count: { $sum: 1 } }
            }
        }
    ]);

    successResponse(res, 200, "Course analytics", {
        courseId: course._id,
        courseTitle: course.title,
        enrollments: enrollmentCount,
        completions: completedCount,
        completionRate: enrollmentCount > 0 ? Math.round((completedCount / enrollmentCount) * 100) : 0,
        avgProgress: progressData[0]?.avgProgress ? Math.round(progressData[0].avgProgress) : 0,
        totalWatchTime: progressData[0]?.totalWatchTime || 0,
        activeStudents: progressData[0]?.studentCount || 0,
        avgRating: reviewData[0]?.avgRating ? Number(reviewData[0].avgRating.toFixed(1)) : 0,
        totalReviews: reviewData[0]?.count || 0,
        ratingDistribution: ratingDist,
        revenue: revenueData[0]?.total || 0,
        transactions: revenueData[0]?.count || 0,
        progressDistribution: progressBuckets
    });
});

// @route   GET /api/v1/analytics/instructor/revenue
// @desc    Get revenue trends
// @access  Private (Instructor)
export const getRevenueTrends = asyncHandler(async (req, res) => {
    const { period = "30d" } = req.query;
    const days = period === "7d" ? 7 : period === "90d" ? 90 : period === "365d" ? 365 : 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const trends = await Payment.aggregate([
        { $match: { instructor: req.instructor._id || req.instructor.id, status: "completed", createdAt: { $gte: startDate } } },
        {
            $group: {
                _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                revenue: { $sum: "$amount" },
                count: { $sum: 1 }
            }
        },
        { $sort: { _id: 1 } }
    ]);

    successResponse(res, 200, "Revenue trends", { trends, period });
});
