import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { apiClient } from '../../utils/api.utils.js';

// ========================= ASYNC THUNKS =========================

/**
 * Get all published courses for course listing page with filters, pagination, and sorting
 */
export const getAllCourses = createAsyncThunk(
  'course/getAllCourses',
  async (params = {}, { rejectWithValue }) => {
    try {
      const queryParams = new URLSearchParams();
      
      // Pagination
      if (params.page) queryParams.append('page', params.page);
      if (params.limit) queryParams.append('limit', params.limit);
      
      // Filters
      if (params.category) queryParams.append('category', params.category);
      if (params.level) queryParams.append('level', params.level);
      if (params.language) queryParams.append('language', params.language);
      if (params.minPrice !== undefined) queryParams.append('minPrice', params.minPrice);
      if (params.maxPrice !== undefined) queryParams.append('maxPrice', params.maxPrice);
      
      // Search
      if (params.search) queryParams.append('search', params.search);
      
      // Sorting
      if (params.sort) queryParams.append('sort', params.sort);
      
      const response = await apiClient.get(`/courses?${queryParams.toString()}`);
      return response.data.data; // { courses, pagination }
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to fetch courses';
      return rejectWithValue(message);
    }
  }
);

/**
 * Get detailed course information by ID with modules, lessons, instructor details
 */
export const getCourseById = createAsyncThunk(
  'course/getCourseById',
  async (courseId, { rejectWithValue }) => {
    try {
      const response = await apiClient.get(`/courses/${courseId}`);
      const payload = response.data.data;
      return payload; // Course object with populated modules, lessons, instructor
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to fetch course details';
      return rejectWithValue(message);
    }
  }
);

/**
 * Get course reviews and rating statistics
 */
export const getCourseReviews = createAsyncThunk(
  'course/getCourseReviews',
  async ({ courseId, page = 1, limit = 10, verifiedOnly = false }, { rejectWithValue }) => {
    try {
      const queryParams = new URLSearchParams();
      queryParams.append('page', page);
      queryParams.append('limit', limit);
      if (verifiedOnly) queryParams.append('verifiedOnly', 'true');
      
      const response = await apiClient.get(`/courses/${courseId}/reviews?${queryParams.toString()}`);
      return { courseId, ...response.data.data }; // { reviews, ratingStats, pagination }
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to fetch reviews';
      return rejectWithValue(message);
    }
  }
);

/**
 * Get current user's review for a specific course
 */
export const getMyCourseReview = createAsyncThunk(
  'course/getMyCourseReview',
  async (courseId, { rejectWithValue }) => {
    try {
      const response = await apiClient.get(`/reviews/me?courseId=${courseId}`);
      return {
        courseId,
        review: response.data?.data?.review || null,
      };
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to fetch your review';
      return rejectWithValue(message);
    }
  }
);

/**
 * Create a new course review
 */
export const createCourseReview = createAsyncThunk(
  'course/createCourseReview',
  async ({ courseId, rating, comment }, { rejectWithValue }) => {
    try {
      const response = await apiClient.post('/reviews', { courseId, rating, comment });
      return response.data?.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to create review';
      return rejectWithValue(message);
    }
  }
);

/**
 * Update an existing review
 */
export const updateCourseReview = createAsyncThunk(
  'course/updateCourseReview',
  async ({ reviewId, rating, comment }, { rejectWithValue }) => {
    try {
      const response = await apiClient.put(`/reviews/${reviewId}`, { rating, comment });
      return response.data?.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to update review';
      return rejectWithValue(message);
    }
  }
);

/**
 * Mark a review as helpful
 */
export const markReviewHelpful = createAsyncThunk(
  'course/markReviewHelpful',
  async (reviewId, { rejectWithValue }) => {
    try {
      const response = await apiClient.patch(`/reviews/${reviewId}/helpful`);
      return {
        reviewId,
        helpful: Number(response.data?.data?.helpful || 0),
        alreadyMarked: Boolean(response.data?.data?.alreadyMarked),
        isMarkedHelpfulByMe: Boolean(response.data?.data?.isMarkedHelpfulByMe),
      };
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to mark review as helpful';
      return rejectWithValue(message);
    }
  }
);

/**
 * Get current user's review list
 */
export const getMyReviews = createAsyncThunk(
  'course/getMyReviews',
  async ({ page = 1, limit = 20 } = {}, { rejectWithValue }) => {
    try {
      const response = await apiClient.get(`/user/reviews?page=${page}&limit=${limit}`);
      return response.data?.data || { reviews: [], pagination: null };
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to fetch your reviews';
      return rejectWithValue(message);
    }
  }
);

/**
 * Get related/recommended courses (same category or level)
 */
export const getRelatedCourses = createAsyncThunk(
  'course/getRelatedCourses',
  async ({ courseId, category, limit = 6 }, { rejectWithValue }) => {
    try {
      const queryParams = new URLSearchParams();
      if (category) queryParams.append('category', category);
      queryParams.append('limit', limit);
      // Assuming backend has an endpoint for related courses
      // If not, we can mimic with getAllCourses with category filter
      const response = await apiClient.get(`/courses?${queryParams.toString()}`);
      const allCourses = response.data.data?.courses || [];
      // Filter out the current course
      const related = allCourses.filter(c => c._id !== courseId).slice(0, limit);
      return related;
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to fetch related courses';
      return rejectWithValue(message);
    }
  }
);

/**
 * Get instructor details (usually populated with course, but can be used separately)
 */
export const getInstructorById = createAsyncThunk(
  'course/getInstructorById',
  async (instructorId, { rejectWithValue }) => {
    try {
      const response = await apiClient.get(`/instructors/${instructorId}`);
      return response.data.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to fetch instructor';
      return rejectWithValue(message);
    }
  }
);

/**
 * Search courses with keyword
 */
export const searchCourses = createAsyncThunk(
  'course/searchCourses',
  async ({ query, page = 1, limit = 12, sort, category, level, language, minPrice, maxPrice }, { rejectWithValue }) => {
    try {
      const queryParams = new URLSearchParams();
      queryParams.append('type', 'courses');
      queryParams.append('q', query);
      queryParams.append('page', page);
      queryParams.append('limit', limit);

      if (sort) queryParams.append('sort', sort);
      if (category) queryParams.append('category', category);
      if (level) queryParams.append('level', level);
      if (language) queryParams.append('language', language);
      if (minPrice !== undefined) queryParams.append('minPrice', minPrice);
      if (maxPrice !== undefined) queryParams.append('maxPrice', maxPrice);
      
      const response = await apiClient.get(`/search?${queryParams.toString()}`);
      return {
        courses: response.data.data?.results || response.data.data?.courses || [],
        pagination: response.data.data?.pagination,
      };
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Search failed';
      return rejectWithValue(message);
    }
  }
);

/**
 * Get courses by category
 */
export const getCoursesByCategory = createAsyncThunk(
  'course/getCoursesByCategory',
  async ({ category, page = 1, limit = 12 }, { rejectWithValue }) => {
    try {
      const queryParams = new URLSearchParams();
      queryParams.append('category', category);
      queryParams.append('page', page);
      queryParams.append('limit', limit);
      
      const response = await apiClient.get(`/courses?${queryParams.toString()}`);
      return { category, ...response.data.data }; // { category, courses, pagination }
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to fetch category courses';
      return rejectWithValue(message);
    }
  }
);

// ========================= INITIAL STATE =========================

const initialState = {
  // Listing state
  courses: [],
  pagination: {
    currentPage: 1,
    totalPages: 1,
    totalResults: 0,
    hasNextPage: false,
    hasPrevPage: false,
  },
  
  // Detail state
  currentCourse: null,
  
  // Modules and curriculum
  modules: [],
  
  // Reviews state
  reviews: [],
  reviewPagination: {
    currentPage: 1,
    totalPages: 1,
    totalResults: 0,
  },
  ratingStats: null,
  myReviewByCourseId: {},
  myReviews: [],
  myReviewsPagination: {
    currentPage: 1,
    totalPages: 1,
    totalResults: 0,
  },
  
  // Related courses
  relatedCourses: [],
  
  // Instructor state
  currentInstructor: null,
  
  // Filters and search
  filters: {
    category: null,
    level: null,
    language: null,
    minPrice: 0,
    maxPrice: 10000,
    search: '',
  },
  sortBy: 'popular',
  
  // Loading and error states
  loadingCourses: false,
  loadingCourseDetail: false,
  loadingReviews: false,
  loadingMyReview: false,
  loadingMyReviews: false,
  reviewActionLoading: false,
  loadingRelated: false,
  loadingInstructor: false,
  
  error: null,
  courseDetailError: null,
  reviewsError: null,
  myReviewError: null,
  myReviewsError: null,
  reviewActionError: null,
};

// ========================= SLICE =========================

const courseSlice = createSlice({
  name: 'course',
  initialState,
  reducers: {
    // Set filter
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
      state.pagination.currentPage = 1; // Reset to first page on filter change
    },
    
    // Clear filters
    clearFilters: (state) => {
      state.filters = initialState.filters;
      state.pagination.currentPage = 1;
    },
    
    // Set sort
    setSortBy: (state, action) => {
      state.sortBy = action.payload;
      state.pagination.currentPage = 1;
    },
    
    // Set search
    setSearch: (state, action) => {
      state.filters.search = action.payload;
      state.pagination.currentPage = 1;
    },
    
    // Clear current course details
    clearCurrentCourse: (state) => {
      state.currentCourse = null;
      state.modules = [];
      state.currentInstructor = null;
      state.reviews = [];
      state.myReviewByCourseId = {};
      state.relatedCourses = [];
      state.courseDetailError = null;
    },
    
    // Clear errors
    clearErrors: (state) => {
      state.error = null;
      state.courseDetailError = null;
      state.reviewsError = null;
      state.myReviewError = null;
      state.myReviewsError = null;
      state.reviewActionError = null;
    },
  },
  
  extraReducers: (builder) => {
    // ========== GET ALL COURSES ==========
    builder
      .addCase(getAllCourses.pending, (state) => {
        state.loadingCourses = true;
        state.error = null;
      })
      .addCase(getAllCourses.fulfilled, (state, action) => {
        state.loadingCourses = false;
        state.courses = action.payload.courses || [];
        state.pagination = action.payload.pagination || initialState.pagination;
      })
      .addCase(getAllCourses.rejected, (state, action) => {
        state.loadingCourses = false;
        state.error = action.payload;
      });

    // ========== GET COURSE BY ID ==========
    builder
      .addCase(getCourseById.pending, (state) => {
        state.loadingCourseDetail = true;
        state.courseDetailError = null;
        state.modules = [];
      })
      .addCase(getCourseById.fulfilled, (state, action) => {
        state.loadingCourseDetail = false;
        const coursePayload = action.payload || {};
        const rawModules =
          coursePayload?.modules ||
          coursePayload?.course?.modules ||
          coursePayload?.curriculum?.modules ||
          [];
        state.modules = Array.isArray(rawModules) ? rawModules : [];

        const totalMaterials = state.modules.reduce((sum, mod) => {
          const lessons = Array.isArray(mod?.lessons) ? mod.lessons : [];
          return (
            sum +
            lessons.filter((lesson) => {
              const isMaterialLesson = lesson?.type === "material";
              const hasMaterialRef = !!lesson?.materialId;
              return isMaterialLesson && hasMaterialRef;
            }).length
          );
        }, 0);

        state.currentCourse = { ...coursePayload, totalMaterials };
        // Extract instructor if it exists
        if (coursePayload.instructor) {
          state.currentInstructor = coursePayload.instructor;
        }
      })
      .addCase(getCourseById.rejected, (state, action) => {
        state.loadingCourseDetail = false;
        state.courseDetailError = action.payload;
        state.currentCourse = null;
      });

    // ========== GET COURSE REVIEWS ==========
    builder
      .addCase(getCourseReviews.pending, (state) => {
        state.loadingReviews = true;
        state.reviewsError = null;
      })
      .addCase(getCourseReviews.fulfilled, (state, action) => {
        state.loadingReviews = false;
        state.reviews = action.payload.reviews || [];
        state.ratingStats = action.payload.ratingStats || null;
        state.reviewPagination = action.payload.pagination || initialState.reviewPagination;
      })
      .addCase(getCourseReviews.rejected, (state, action) => {
        state.loadingReviews = false;
        state.reviewsError = action.payload;
      });

    // ========== GET MY COURSE REVIEW ==========
    builder
      .addCase(getMyCourseReview.pending, (state) => {
        state.loadingMyReview = true;
        state.myReviewError = null;
      })
      .addCase(getMyCourseReview.fulfilled, (state, action) => {
        state.loadingMyReview = false;
        const { courseId, review } = action.payload;
        state.myReviewByCourseId[String(courseId)] = review;
      })
      .addCase(getMyCourseReview.rejected, (state, action) => {
        state.loadingMyReview = false;
        state.myReviewError = action.payload;
      });

    // ========== CREATE COURSE REVIEW ==========
    builder
      .addCase(createCourseReview.pending, (state) => {
        state.reviewActionLoading = true;
        state.reviewActionError = null;
      })
      .addCase(createCourseReview.fulfilled, (state, action) => {
        state.reviewActionLoading = false;
        const review = action.payload;
        if (review?.course) {
          const courseId = typeof review.course === 'string' ? review.course : review.course?._id;
          if (courseId) {
            state.myReviewByCourseId[String(courseId)] = review;
          }
        }
      })
      .addCase(createCourseReview.rejected, (state, action) => {
        state.reviewActionLoading = false;
        state.reviewActionError = action.payload;
      });

    // ========== UPDATE COURSE REVIEW ==========
    builder
      .addCase(updateCourseReview.pending, (state) => {
        state.reviewActionLoading = true;
        state.reviewActionError = null;
      })
      .addCase(updateCourseReview.fulfilled, (state, action) => {
        state.reviewActionLoading = false;
        const updated = action.payload;
        if (updated?._id) {
          state.myReviews = state.myReviews.map((review) => (
            review._id === updated._id ? { ...review, ...updated } : review
          ));
        }
        if (updated?.course) {
          const courseId = typeof updated.course === 'string' ? updated.course : updated.course?._id;
          if (courseId) {
            state.myReviewByCourseId[String(courseId)] = updated;
          }
        }
      })
      .addCase(updateCourseReview.rejected, (state, action) => {
        state.reviewActionLoading = false;
        state.reviewActionError = action.payload;
      });

    // ========== MARK REVIEW HELPFUL ==========
    builder
      .addCase(markReviewHelpful.pending, (state) => {
        state.reviewActionError = null;
      })
      .addCase(markReviewHelpful.fulfilled, (state, action) => {
        const { reviewId, helpful, isMarkedHelpfulByMe } = action.payload;
        state.reviews = state.reviews.map((review) => (
          String(review?._id) === String(reviewId)
            ? { ...review, helpful, isMarkedHelpfulByMe }
            : review
        ));
      })
      .addCase(markReviewHelpful.rejected, (state, action) => {
        state.reviewActionError = action.payload;
      });

    // ========== GET MY REVIEWS ==========
    builder
      .addCase(getMyReviews.pending, (state) => {
        state.loadingMyReviews = true;
        state.myReviewsError = null;
      })
      .addCase(getMyReviews.fulfilled, (state, action) => {
        state.loadingMyReviews = false;
        state.myReviews = action.payload.reviews || [];
        state.myReviewsPagination = action.payload.pagination || initialState.myReviewsPagination;
      })
      .addCase(getMyReviews.rejected, (state, action) => {
        state.loadingMyReviews = false;
        state.myReviewsError = action.payload;
      });

    // ========== GET RELATED COURSES ==========
    builder
      .addCase(getRelatedCourses.pending, (state) => {
        state.loadingRelated = true;
      })
      .addCase(getRelatedCourses.fulfilled, (state, action) => {
        state.loadingRelated = false;
        state.relatedCourses = action.payload;
      })
      .addCase(getRelatedCourses.rejected, (state) => {
        state.loadingRelated = false;
        state.relatedCourses = [];
      });

    // ========== GET INSTRUCTOR ==========
    builder
      .addCase(getInstructorById.pending, (state) => {
        state.loadingInstructor = true;
      })
      .addCase(getInstructorById.fulfilled, (state, action) => {
        state.loadingInstructor = false;
        state.currentInstructor = action.payload;
      })
      .addCase(getInstructorById.rejected, (state) => {
        state.loadingInstructor = false;
      });

    // ========== SEARCH COURSES ==========
    builder
      .addCase(searchCourses.pending, (state) => {
        state.loadingCourses = true;
        state.error = null;
      })
      .addCase(searchCourses.fulfilled, (state, action) => {
        state.loadingCourses = false;
        state.courses = action.payload.courses || [];
        state.pagination = action.payload.pagination || initialState.pagination;
      })
      .addCase(searchCourses.rejected, (state, action) => {
        state.loadingCourses = false;
        state.error = action.payload;
      });

    // ========== GET COURSES BY CATEGORY ==========
    builder
      .addCase(getCoursesByCategory.pending, (state) => {
        state.loadingCourses = true;
        state.error = null;
      })
      .addCase(getCoursesByCategory.fulfilled, (state, action) => {
        state.loadingCourses = false;
        state.courses = action.payload.courses || [];
        state.pagination = action.payload.pagination || initialState.pagination;
        state.filters.category = action.payload.category;
      })
      .addCase(getCoursesByCategory.rejected, (state, action) => {
        state.loadingCourses = false;
        state.error = action.payload;
      });
  },
});

// ========================= EXPORTS =========================

export const {
  setFilters,
  clearFilters,
  setSortBy,
  setSearch,
  clearCurrentCourse,
  clearErrors,
} = courseSlice.actions;

export default courseSlice.reducer;
