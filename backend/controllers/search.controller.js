import Fuse from "fuse.js";
import { Course } from "../models/course.model.js";
import { Instructor } from "../models/instructor.model.js";
import { asyncHandler } from "../middlewares/async.middleware.js";
import { errorResponse, successResponse } from "../utils/response.utils.js";
import { getPagination, createPaginationResponse } from "../utils/pagination.utils.js";

const sanitizeQuery = (value) =>
  String(value || "")
    .normalize("NFKC")
    .replace(/[\u0000-\u001F\u007F]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80);

const tokenize = (value) =>
  String(value || "")
    .toLowerCase()
    .split(/\s+/)
    .map((token) => token.trim())
    .filter(Boolean);

const normalizeText = (value) => String(value || "").toLowerCase().replace(/\s+/g, " ").trim();

const normalizeType = (value) => {
  const incoming = String(value || "").toLowerCase();
  if (incoming === "course" || incoming === "courses") return "courses";
  if (incoming === "instructor" || incoming === "instructors") return "instructors";
  return "all";
};

const normalizeCourseSort = (sortBy) => {
  if (sortBy === "popular") return { enrolledCount: -1 };
  if (sortBy === "rating") return { rating: -1 };
  if (sortBy === "price-low") return { price: 1 };
  if (sortBy === "price-high") return { price: -1 };
  if (sortBy === "newest") return { publishedAt: -1 };
  return { createdAt: -1 };
};

const normalizeInstructorSort = (sortBy) => {
  const map = {
    popular: { totalStudentsTeaching: -1, "rating.averageRating": -1 },
    rating: { "rating.averageRating": -1, "rating.totalReviews": -1 },
    reviews: { "rating.totalReviews": -1 },
    experience: { yearsOfExperience: -1 },
    students: { totalStudentsTeaching: -1 },
    courses: { totalCourses: -1 },
    newest: { createdAt: -1 },
  };
  return map[sortBy] || map.popular;
};

const buildCourseFilter = (query) => {
  const filter = { status: "published", isPublished: true };

  if (query.category) filter.category = query.category;
  if (query.level) filter.level = query.level;
  if (query.language) filter.language = query.language;

  if (query.minPrice || query.maxPrice) {
    filter.price = {};
    if (query.minPrice) filter.price.$gte = Number(query.minPrice);
    if (query.maxPrice) filter.price.$lte = Number(query.maxPrice);
  }

  return filter;
};

const buildInstructorFilter = () => ({
  isActive: true,
  isSuspended: false,
});

const fuzzySearchCourses = (courses, searchTerm) => {
  const termTokens = tokenize(searchTerm);

  const collection = courses.map((course) => ({
    ...course,
    _searchTitle: String(course.title || ""),
    _searchCategory: String(course.category || ""),
    _searchSubCategory: String(course.subCategory || ""),
    _searchText: normalizeText(`${course.title || ""} ${course.category || ""} ${course.subCategory || ""}`),
  }));

  const strictMatches = collection.filter((item) =>
    termTokens.length > 0 && termTokens.every((token) => item._searchText.includes(token))
  );

  if (strictMatches.length > 0) {
    return strictMatches.map((item) => {
      const { _searchTitle, _searchCategory, _searchSubCategory, _searchText, ...clean } = item;
      return clean;
    });
  }

  const fuse = new Fuse(collection, {
    includeScore: true,
    threshold: 0.35,
    ignoreLocation: true,
    minMatchCharLength: 2,
    keys: [
      { name: "_searchTitle", weight: 0.7 },
      { name: "_searchSubCategory", weight: 0.2 },
      { name: "_searchCategory", weight: 0.1 },
    ],
  });

  const strictFuzzy = fuse.search(searchTerm).filter((entry) => (entry.score ?? 1) <= 0.22);
  const relaxedFuzzy =
    strictFuzzy.length > 0
      ? strictFuzzy
      : fuse
          .search(searchTerm)
          .filter((entry) => (entry.score ?? 1) <= 0.3)
          .slice(0, 20);

  return relaxedFuzzy.map(({ item }) => {
    const { _searchTitle, _searchCategory, _searchSubCategory, _searchText, ...clean } = item;
    return clean;
  });
};

const fuzzySearchInstructors = (instructors, searchTerm) => {
  const termTokens = tokenize(searchTerm);

  const collection = instructors.map((instructor) => {
    const firstName = String(instructor.firstName || "").trim();
    const lastName = String(instructor.lastName || "").trim();

    return {
      ...instructor,
      _searchFirstName: firstName,
      _searchLastName: lastName,
      _searchFullName: `${firstName} ${lastName}`.trim(),
      _searchText: normalizeText(`${firstName} ${lastName}`),
    };
  });

  const strictMatches = collection.filter((item) =>
    termTokens.length > 0 && termTokens.every((token) => item._searchText.includes(token))
  );

  if (strictMatches.length > 0) {
    return strictMatches.map((item) => {
      const { _searchFirstName, _searchLastName, _searchFullName, _searchText, ...clean } = item;
      return clean;
    });
  }

  const fuse = new Fuse(collection, {
    includeScore: true,
    threshold: 0.35,
    ignoreLocation: true,
    minMatchCharLength: 2,
    keys: [
      { name: "_searchFullName", weight: 0.65 },
      { name: "_searchFirstName", weight: 0.2 },
      { name: "_searchLastName", weight: 0.15 },
    ],
  });

  const strictFuzzy = fuse.search(searchTerm).filter((entry) => (entry.score ?? 1) <= 0.2);
  const relaxedFuzzy =
    strictFuzzy.length > 0
      ? strictFuzzy
      : fuse
          .search(searchTerm)
          .filter((entry) => (entry.score ?? 1) <= 0.28)
          .slice(0, 20);

  return relaxedFuzzy.map(({ item }) => {
    const { _searchFirstName, _searchLastName, _searchFullName, _searchText, ...clean } = item;
    return clean;
  });
};

const paginateArray = (items, page, limit) => {
  const total = items.length;
  const start = (page - 1) * limit;
  const paginated = items.slice(start, start + limit);

  return {
    items: paginated,
    pagination: createPaginationResponse(total, page, limit),
  };
};

export const globalSearch = asyncHandler(async (req, res) => {
  const type = normalizeType(req.query.type);
  const query = sanitizeQuery(req.query.q || req.query.query || req.query.search);

  if (!query) {
    return errorResponse(res, 400, "Search query is required");
  }

  if (query.length < 2) {
    return errorResponse(res, 400, "Search query must be at least 2 characters");
  }

  const { page, limit } = getPagination(req.query, 12);
  const cappedLimit = Math.min(limit, 50);

  if (type === "courses") {
    const filter = buildCourseFilter(req.query);
    const sort = normalizeCourseSort(req.query.sort);

    const courses = await Course.find(filter)
      .populate("instructor", "firstName lastName profilePicture rating")
      .select("title category subCategory thumbnail price discountPrice enrolledCount rating totalReviews language level instructor status isPublished createdAt publishedAt")
      .sort(sort)
      .lean();

    const matched = fuzzySearchCourses(courses, query);
    const { items, pagination } = paginateArray(matched, page, cappedLimit);

    return successResponse(res, 200, "Course search results retrieved successfully", {
      type,
      query,
      results: items,
      courses: items,
      pagination,
    });
  }

  if (type === "instructors") {
    const filter = buildInstructorFilter();
    const sort = normalizeInstructorSort(req.query.sort);

    const instructors = await Instructor.find(filter)
      .select("firstName lastName professionalTitle shortBio profilePicture bannerColor specializations rating totalStudentsTeaching totalCourses totalLiveClasses yearsOfExperience isTopInstructor isDocumentsVerified availability createdAt")
      .sort(sort)
      .lean();

    const matched = fuzzySearchInstructors(instructors, query);
    const { items, pagination } = paginateArray(matched, page, cappedLimit);

    return successResponse(res, 200, "Instructor search results retrieved successfully", {
      type,
      query,
      results: items,
      instructors: items,
      pagination,
    });
  }

  const courseFilter = buildCourseFilter(req.query);
  const courses = await Course.find(courseFilter)
    .populate("instructor", "firstName lastName profilePicture rating")
    .select("title category subCategory thumbnail price discountPrice enrolledCount rating totalReviews language level instructor status isPublished createdAt publishedAt")
    .sort(normalizeCourseSort(req.query.sort))
    .lean();

  const instructors = await Instructor.find(buildInstructorFilter())
    .select("firstName lastName professionalTitle shortBio profilePicture bannerColor specializations rating totalStudentsTeaching totalCourses totalLiveClasses yearsOfExperience isTopInstructor isDocumentsVerified availability createdAt")
    .sort(normalizeInstructorSort(req.query.sort))
    .lean();

  const matchedCourses = fuzzySearchCourses(courses, query).slice(0, cappedLimit);
  const matchedInstructors = fuzzySearchInstructors(instructors, query).slice(0, cappedLimit);

  return successResponse(res, 200, "Global search results retrieved successfully", {
    type,
    query,
    courses: matchedCourses,
    instructors: matchedInstructors,
    totals: {
      courses: matchedCourses.length,
      instructors: matchedInstructors.length,
    },
  });
});
