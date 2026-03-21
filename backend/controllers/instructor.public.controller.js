import { Instructor } from "../models/instructor.model.js";
import { Course } from "../models/course.model.js";
import { Review } from "../models/review.model.js";
import { asyncHandler } from "../middlewares/async.middleware.js";
import { errorResponse, successResponse } from "../utils/response.utils.js";
import { getPagination, createPaginationResponse } from "../utils/pagination.utils.js";
import logger from "../configs/logger.config.js";

/**
 * Instructor Public Controller
 * Handles public instructor listing and details (no authentication required)
 * Updated to work with comprehensive instructor model including:
 * - specializations[], skills[], qualifications[], achievements[]
 * - workExperience[], tags[], teachingLanguages
 * - backgroundType, availability, social links
 */

// @route   GET /api/v1/public/instructors
// @desc    Get all public instructors with advanced filters and pagination
// @access  Public
export const getAllInstructorsPublic = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query, 10);
  
  // Build filter object
  const filter = { isActive: true, isSuspended: false };

  // Full-text search (name, professional title, bio, tags, specializations)
  if (req.query.search) {
    const searchRegex = { $regex: req.query.search, $options: "i" };
    filter.$or = [
      { firstName: searchRegex },
      { lastName: searchRegex },
      { professionalTitle: searchRegex },
      { shortBio: searchRegex },
      { tags: searchRegex },
      { "specializations.area": searchRegex },
      { "specializations.description": searchRegex }
    ];
  }

  // Specialization category filter (domain areas: web_development, data_science, etc.)
  if (req.query.specializationCategory) {
    const categories = Array.isArray(req.query.specializationCategory) 
      ? req.query.specializationCategory 
      : [req.query.specializationCategory];
    filter["specializations.category"] = { $in: categories };
  }

  // Primary specialization filter
  if (req.query.primarySpecialization) {
    filter["specializations.isPrimary"] = true;
    if (req.query.primarySpecialization !== "all") {
      filter["specializations.category"] = req.query.primarySpecialization;
    }
  }

  // Rating filter (minimum rating threshold)
  if (req.query.rating) {
    const ratings = Array.isArray(req.query.rating) 
      ? req.query.rating.map(Number) 
      : [Number(req.query.rating)];
    const maxRating = Math.min(...ratings);
    filter["rating.averageRating"] = { $gte: maxRating };
  }

  // Students taught filter (minimum threshold)
  if (req.query.studentsTaught) {
    const thresholds = Array.isArray(req.query.studentsTaught) 
      ? req.query.studentsTaught.map(Number) 
      : [Number(req.query.studentsTaught)];
    const maxThreshold = Math.min(...thresholds);
    filter.totalStudentsTeaching = { $gte: maxThreshold };
  }

  // Total courses filter (range)
  if (req.query.totalCourses) {
    const ranges = Array.isArray(req.query.totalCourses) 
      ? req.query.totalCourses 
      : [req.query.totalCourses];
    
    const courseFilters = [];
    ranges.forEach(range => {
      if (range === "1-4") courseFilters.push({ totalCourses: { $gte: 1, $lte: 4 } });
      else if (range === "5-9") courseFilters.push({ totalCourses: { $gte: 5, $lte: 9 } });
      else if (range === "10+") courseFilters.push({ totalCourses: { $gte: 10 } });
    });
    
    if (courseFilters.length > 0) {
      filter.$or = filter.$or ? [...filter.$or, ...courseFilters] : courseFilters;
    }
  }

  // Years of experience filter (range)
  if (req.query.yearsOfExperienceMin || req.query.yearsOfExperienceMax) {
    filter.yearsOfExperience = {};
    if (req.query.yearsOfExperienceMin) {
      filter.yearsOfExperience.$gte = Number(req.query.yearsOfExperienceMin);
    }
    if (req.query.yearsOfExperienceMax) {
      filter.yearsOfExperience.$lte = Number(req.query.yearsOfExperienceMax);
    }
  }

  // Reviews count filter (minimum threshold)
  if (req.query.reviewsCount) {
    const thresholds = Array.isArray(req.query.reviewsCount) 
      ? req.query.reviewsCount.map(Number) 
      : [Number(req.query.reviewsCount)];
    const maxThreshold = Math.min(...thresholds);
    filter["rating.totalReviews"] = { $gte: maxThreshold };
  }

  // Background type filter (faang, startup, research, corporate, freelance, academic)
  if (req.query.backgroundType) {
    const backgrounds = Array.isArray(req.query.backgroundType) 
      ? req.query.backgroundType 
      : [req.query.backgroundType];
    filter.backgroundType = { $in: backgrounds };
  }

  // Top instructor filter
  if (req.query.isTopInstructor === "true") {
    filter.isTopInstructor = true;
  }

  // Verified expert filter (documents verified by admin)
  if (req.query.isVerified === "true") {
    filter.isDocumentsVerified = true;
  }

  // Available for mentorship filter
  if (req.query.availableForMentorship === "true") {
    filter["availability.isAvailableForMentorship"] = true;
  }

  // Available for live classes filter
  if (req.query.availableForLive === "true") {
    filter["availability.isAvailableForLive"] = true;
  }

  // Teaching language filter
  if (req.query.teachingLanguages) {
    const languages = Array.isArray(req.query.teachingLanguages) 
      ? req.query.teachingLanguages 
      : [req.query.teachingLanguages];
    filter.teachingLanguages = { $in: languages };
  }

  // Sorting options
  const sortMap = {
    popular: { totalStudentsTeaching: -1 },
    rating: { "rating.averageRating": -1 },
    reviews: { "rating.totalReviews": -1 },
    experience: { yearsOfExperience: -1 },
    students: { totalStudentsTeaching: -1 },
    newest: { createdAt: -1 }
  };
  const sort = sortMap[req.query.sort] || sortMap.popular;

  // Execute query
  const total = await Instructor.countDocuments(filter);
  const instructors = await Instructor.find(filter)
    .select(
      "firstName lastName professionalTitle shortBio profilePicture bannerColor " +
      "specializations skills rating totalStudentsTeaching totalCourses yearsOfExperience " +
      "backgroundType isTopInstructor isDocumentsVerified availability teachingLanguages"
    )
    .sort(sort)
    .skip(skip)
    .limit(limit)
    .lean();

  const paginationData = createPaginationResponse(page, limit, total);

  successResponse(res, 200, "Instructors retrieved successfully", {
    instructors,
    pagination: paginationData
  });
});

// @route   GET /api/v1/public/instructors/:id
// @desc    Get single instructor details by ID with full professional profile
// @access  Public
export const getInstructorByIdPublic = asyncHandler(async (req, res) => {
  const { id } = req.params;

  try {
    const instructor = await Instructor.findOne({
      _id: id,
      isActive: true,
      isSuspended: false
    })
      .populate({
        path: "courses",
        select: "title description thumbnail category rating totalEnrollments price isPublished",
        match: { isPublished: true }
      })
      .lean();

    if (!instructor) {
      return errorResponse(res, 404, "Instructor not found");
    }

    // Remove sensitive fields
    delete instructor.password;
    delete instructor.verificationCode;
    delete instructor.verificationCodeExpires;
    delete instructor.passwordResetToken;
    delete instructor.passwordResetExpires;
    delete instructor.isOtpVerified;
    delete instructor.otpAttempts;
    delete instructor.otpLastSentAt;
    delete instructor.sessions;
    delete instructor.loginAttempts;
    delete instructor.lockUntil;
    delete instructor.cfRtmpKey;
    delete instructor.email;
    delete instructor.phone;
    delete instructor.isEmailVerified;
    delete instructor.isPhoneVerified;

    // Prepare response data with enhanced structure
    const instructorData = {
      ...instructor,
      // Profile section
      profile: {
        firstName: instructor.firstName,
        lastName: instructor.lastName,
        professionalTitle: instructor.professionalTitle,
        profilePicture: instructor.profilePicture,
        bannerImage: instructor.bannerImage,
        bannerColor: instructor.bannerColor
      },
      // Bio section
      about: {
        shortBio: instructor.shortBio,
        bio: instructor.bio
      },
      // Professional data
      professional: {
        specializations: instructor.specializations || [],
        skills: instructor.skills || [],
        achievements: instructor.achievements || [],
        qualifications: instructor.qualifications || [],
        workExperience: instructor.workExperience || [],
        yearsOfExperience: instructor.yearsOfExperience,
        backgroundType: instructor.backgroundType,
        teachingLanguages: instructor.teachingLanguages
      },
      // Social & contact
      social: instructor.socialLinks || {},
      // Stats
      stats: {
        totalStudentsTeaching: instructor.totalStudentsTeaching,
        totalCourses: instructor.totalCourses,
        totalReviews: instructor.rating?.totalReviews || 0,
        averageRating: instructor.rating?.averageRating || 0,
        ratingBreakdown: instructor.rating?.ratingBreakdown || {}
      },
      // Badges
      badges: {
        isTopInstructor: instructor.isTopInstructor,
        isVerifiedExpert: instructor.isDocumentsVerified,
        availableForMentorship: instructor.availability?.isAvailableForMentorship,
        availableForLive: instructor.availability?.isAvailableForLive
      },
      // Availability
      availability: instructor.availability || {},
      // Courses
      publishedCourses: instructor.courses || []
    };

    successResponse(res, 200, "Instructor retrieved successfully", instructorData);
  } catch (error) {
    logger.error(`Error fetching instructor ${id}: ${error.message}`);
    return errorResponse(res, 500, "Failed to retrieve instructor details");
  }
});

// @route   GET /api/v1/public/instructors/:id/reviews
// @desc    Get instructor reviews/ratings with stats
// @access  Public
export const getInstructorReviewsPublic = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { page, limit, skip } = getPagination(req.query, 10);

  try {
    // Verify instructor exists and is active
    const instructor = await Instructor.findOne({
      _id: id,
      isActive: true,
      isSuspended: false
    });

    if (!instructor) {
      return errorResponse(res, 404, "Instructor not found");
    }

    // Get courses taught by this instructor
    const instructorCourses = await Course.find({ instructor: id }).select("_id");
    const courseIds = instructorCourses.map(c => c._id);

    // Get verified reviews count
    const totalReviews = await Review.countDocuments({
      course: { $in: courseIds },
      isVerified: true
    });

    // Get paginated reviews
    const reviews = await Review.find({
      course: { $in: courseIds },
      isVerified: true
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("user", "firstName lastName profilePicture")
      .populate("course", "title")
      .lean();

    const paginationData = createPaginationResponse(page, limit, totalReviews);

    successResponse(res, 200, "Reviews retrieved successfully", {
      reviews: reviews.map(review => ({
        _id: review._id,
        rating: review.rating,
        title: review.title,
        description: review.description,
        user: review.user,
        course: review.course,
        createdAt: review.createdAt,
        updatedAt: review.updatedAt
      })),
      ratingStats: {
        averageRating: instructor.rating.averageRating,
        totalReviews: instructor.rating.totalReviews,
        ratingBreakdown: instructor.rating.ratingBreakdown
      },
      instructorInfo: {
        firstName: instructor.firstName,
        lastName: instructor.lastName,
        professionalTitle: instructor.professionalTitle,
        profilePicture: instructor.profilePicture
      },
      pagination: paginationData
    });
  } catch (error) {
    logger.error(`Error fetching reviews for instructor ${id}: ${error.message}`);
    return errorResponse(res, 500, "Failed to retrieve reviews");
  }
});
