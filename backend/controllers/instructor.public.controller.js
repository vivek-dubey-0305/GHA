import { Instructor } from "../models/instructor.model.js";
import { Course } from "../models/course.model.js";
import { Review } from "../models/review.model.js";
import { asyncHandler } from "../middlewares/async.middleware.js";
import { errorResponse, successResponse } from "../utils/response.utils.js";
import { getPagination, createPaginationResponse } from "../utils/pagination.utils.js";
import logger from "../configs/logger.config.js";

const parseArrayQuery = (value) => {
  if (value === undefined || value === null) return [];
  if (Array.isArray(value)) {
    return value
      .flatMap((entry) => String(entry).split(","))
      .map((entry) => entry.trim())
      .filter(Boolean);
  }
  return String(value)
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
};

const minFromArray = (values) => {
  const nums = values
    .map((value) => Number(value))
    .filter((value) => Number.isFinite(value));
  return nums.length ? Math.min(...nums) : null;
};

const normalizeSort = (sortKey) => {
  const sortMap = {
    popular: { totalStudentsTeaching: -1, "rating.averageRating": -1 },
    rating: { "rating.averageRating": -1, "rating.totalReviews": -1 },
    reviews: { "rating.totalReviews": -1 },
    experience: { yearsOfExperience: -1 },
    students: { totalStudentsTeaching: -1 },
    courses: { totalCourses: -1 },
    newest: { createdAt: -1 }
  };
  return sortMap[sortKey] || sortMap.popular;
};

const buildInstructorPublicFilter = (query) => {
  const filter = { isActive: true, isSuspended: false };
  const andConditions = [];

  if (query.search) {
    const searchRegex = { $regex: String(query.search).trim(), $options: "i" };
    andConditions.push({
      $or: [
        { firstName: searchRegex },
        { lastName: searchRegex },
        { professionalTitle: searchRegex },
        { shortBio: searchRegex },
        { tags: searchRegex },
        { "specializations.area": searchRegex },
        { "specializations.description": searchRegex }
      ]
    });
  }

  const specializationCategories = parseArrayQuery(query.specializationCategory);
  if (specializationCategories.length > 0) {
    filter["specializations.category"] = { $in: specializationCategories };
  }

  if (query.primarySpecialization) {
    filter["specializations.isPrimary"] = true;
    if (query.primarySpecialization !== "all") {
      filter["specializations.category"] = query.primarySpecialization;
    }
  }

  const ratingThreshold = minFromArray(parseArrayQuery(query.rating));
  if (ratingThreshold !== null) {
    filter["rating.averageRating"] = { $gte: ratingThreshold };
  }

  const studentsThreshold = minFromArray(parseArrayQuery(query.studentsTaught));
  if (studentsThreshold !== null) {
    filter.totalStudentsTeaching = { $gte: studentsThreshold };
  }

  const courseRanges = parseArrayQuery(query.totalCourses);
  if (courseRanges.length > 0) {
    const courseFilters = [];
    courseRanges.forEach((range) => {
      if (range === "1-4") courseFilters.push({ totalCourses: { $gte: 1, $lte: 4 } });
      else if (range === "5-9") courseFilters.push({ totalCourses: { $gte: 5, $lte: 9 } });
      else if (range === "10+") courseFilters.push({ totalCourses: { $gte: 10 } });
    });
    if (courseFilters.length > 0) {
      andConditions.push({ $or: courseFilters });
    }
  }

  if (query.yearsOfExperienceMin || query.yearsOfExperienceMax) {
    filter.yearsOfExperience = {};
    if (query.yearsOfExperienceMin) {
      filter.yearsOfExperience.$gte = Number(query.yearsOfExperienceMin);
    }
    if (query.yearsOfExperienceMax) {
      filter.yearsOfExperience.$lte = Number(query.yearsOfExperienceMax);
    }
  }

  const reviewsThreshold = minFromArray(parseArrayQuery(query.reviewsCount));
  if (reviewsThreshold !== null) {
    filter["rating.totalReviews"] = { $gte: reviewsThreshold };
  }

  const backgroundTypes = parseArrayQuery(query.backgroundType);
  if (backgroundTypes.length > 0) {
    filter.backgroundType = { $in: backgroundTypes };
  }

  if (query.isTopInstructor === "true") {
    filter.isTopInstructor = true;
  }

  if (query.isVerified === "true") {
    filter.isDocumentsVerified = true;
  }

  if (query.availableForMentorship === "true") {
    filter["availability.isAvailableForMentorship"] = true;
  }

  if (query.availableForLive === "true") {
    filter["availability.isAvailableForLive"] = true;
  }

  const teachingLanguages = parseArrayQuery(query.teachingLanguages);
  if (teachingLanguages.length > 0) {
    filter.teachingLanguages = { $in: teachingLanguages };
  }

  if (andConditions.length > 0) {
    filter.$and = andConditions;
  }

  return filter;
};

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
  const sanitizedLimit = Math.min(limit, 50);
  const filter = buildInstructorPublicFilter(req.query);
  const sort = normalizeSort(req.query.sort);

  // Execute query
  const total = await Instructor.countDocuments(filter);
  const instructors = await Instructor.find(filter)
    .select(
      "firstName lastName professionalTitle shortBio profilePicture bannerColor " +
      "specializations skills rating totalStudentsTeaching totalCourses totalLiveClasses yearsOfExperience " +
      "backgroundType isTopInstructor isDocumentsVerified availability teachingLanguages createdAt"
    )
    .sort(sort)
    .skip(skip)
    .limit(sanitizedLimit)
    .lean();

  const paginationData = createPaginationResponse(total, page, sanitizedLimit);

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

    const paginationData = createPaginationResponse(totalReviews, page, limit);

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
