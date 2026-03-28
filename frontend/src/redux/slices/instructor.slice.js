import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { apiClient } from "../../utils/api.utils.js";

const DEFAULT_PAGINATION = {
  currentPage: 1,
  totalPages: 1,
  totalItems: 0,
  itemsPerPage: 9,
  hasNextPage: false,
  hasPrevPage: false,
};

const appendArrayParams = (queryParams, key, value) => {
  if (!value) return;
  if (Array.isArray(value)) {
    value.forEach((entry) => queryParams.append(key, entry));
    return;
  }
  queryParams.append(key, value);
};

const buildListQuery = (params = {}) => {
  const queryParams = new URLSearchParams();

  if (params.page) queryParams.append("page", params.page);
  if (params.limit) queryParams.append("limit", params.limit);
  if (params.sort) queryParams.append("sort", params.sort);
  if (params.search) queryParams.append("search", params.search);

  appendArrayParams(queryParams, "specializationCategory", params.specializationCategory);
  appendArrayParams(queryParams, "rating", params.rating);
  appendArrayParams(queryParams, "studentsTaught", params.studentsTaught);
  appendArrayParams(queryParams, "totalCourses", params.totalCourses);
  appendArrayParams(queryParams, "reviewsCount", params.reviewsCount);
  appendArrayParams(queryParams, "backgroundType", params.backgroundType);
  appendArrayParams(queryParams, "teachingLanguages", params.teachingLanguages);

  if (params.yearsOfExperienceMin !== undefined) {
    queryParams.append("yearsOfExperienceMin", params.yearsOfExperienceMin);
  }
  if (params.yearsOfExperienceMax !== undefined) {
    queryParams.append("yearsOfExperienceMax", params.yearsOfExperienceMax);
  }

  if (params.isTopInstructor) queryParams.append("isTopInstructor", "true");
  if (params.isVerified) queryParams.append("isVerified", "true");
  if (params.availableForMentorship) queryParams.append("availableForMentorship", "true");
  if (params.availableForLive) queryParams.append("availableForLive", "true");

  return queryParams;
};

export const getAllInstructors = createAsyncThunk(
  "instructor/getAllInstructors",
  async (params = {}, { rejectWithValue }) => {
    try {
      const queryParams = buildListQuery(params);
      const response = await apiClient.get(`/public/instructors?${queryParams.toString()}`);
      return response.data.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message || "Failed to fetch instructors";
      return rejectWithValue(message);
    }
  }
);

export const searchInstructors = createAsyncThunk(
  "instructor/searchInstructors",
  async ({ query, ...params }, { rejectWithValue }) => {
    try {
      const queryParams = buildListQuery(params);
      queryParams.append("type", "instructors");
      queryParams.append("q", query);
      const response = await apiClient.get(`/search?${queryParams.toString()}`);
      return {
        instructors: response.data.data?.results || response.data.data?.instructors || [],
        pagination: response.data.data?.pagination,
      };
    } catch (error) {
      const message = error.response?.data?.message || error.message || "Instructor search failed";
      return rejectWithValue(message);
    }
  }
);

export const getInstructorById = createAsyncThunk(
  "instructor/getInstructorById",
  async (instructorId, { rejectWithValue }) => {
    try {
      const response = await apiClient.get(`/public/instructors/${instructorId}`);
      return response.data.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message || "Failed to fetch instructor details";
      return rejectWithValue(message);
    }
  }
);

export const getInstructorReviews = createAsyncThunk(
  "instructor/getInstructorReviews",
  async ({ instructorId, page = 1, limit = 10 }, { rejectWithValue }) => {
    try {
      const queryParams = new URLSearchParams({
        page: String(page),
        limit: String(limit),
      });
      const response = await apiClient.get(`/public/instructors/${instructorId}/reviews?${queryParams.toString()}`);
      return response.data.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message || "Failed to fetch instructor reviews";
      return rejectWithValue(message);
    }
  }
);

const initialState = {
  instructors: [],
  pagination: DEFAULT_PAGINATION,
  currentInstructor: null,
  reviews: [],
  ratingStats: null,
  reviewPagination: DEFAULT_PAGINATION,
  sortBy: "popular",
  filters: {
    search: "",
  },
  loadingInstructors: false,
  loadingInstructorDetail: false,
  loadingReviews: false,
  error: null,
  detailError: null,
  reviewsError: null,
};

const instructorSlice = createSlice({
  name: "instructor",
  initialState,
  reducers: {
    setInstructorFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearInstructorFilters: (state) => {
      state.filters = { search: "" };
    },
    setInstructorSortBy: (state, action) => {
      state.sortBy = action.payload;
    },
    clearCurrentInstructor: (state) => {
      state.currentInstructor = null;
      state.reviews = [];
      state.ratingStats = null;
      state.reviewPagination = DEFAULT_PAGINATION;
      state.detailError = null;
      state.reviewsError = null;
    },
    clearInstructorErrors: (state) => {
      state.error = null;
      state.detailError = null;
      state.reviewsError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getAllInstructors.pending, (state) => {
        state.loadingInstructors = true;
        state.error = null;
      })
      .addCase(getAllInstructors.fulfilled, (state, action) => {
        state.loadingInstructors = false;
        state.instructors = action.payload.instructors || [];
        state.pagination = action.payload.pagination || DEFAULT_PAGINATION;
      })
      .addCase(getAllInstructors.rejected, (state, action) => {
        state.loadingInstructors = false;
        state.error = action.payload;
        state.instructors = [];
      })
      .addCase(searchInstructors.pending, (state) => {
        state.loadingInstructors = true;
        state.error = null;
      })
      .addCase(searchInstructors.fulfilled, (state, action) => {
        state.loadingInstructors = false;
        state.instructors = action.payload.instructors || [];
        state.pagination = action.payload.pagination || DEFAULT_PAGINATION;
      })
      .addCase(searchInstructors.rejected, (state, action) => {
        state.loadingInstructors = false;
        state.error = action.payload;
        state.instructors = [];
      })
      .addCase(getInstructorById.pending, (state) => {
        state.loadingInstructorDetail = true;
        state.detailError = null;
      })
      .addCase(getInstructorById.fulfilled, (state, action) => {
        state.loadingInstructorDetail = false;
        state.currentInstructor = action.payload;
      })
      .addCase(getInstructorById.rejected, (state, action) => {
        state.loadingInstructorDetail = false;
        state.detailError = action.payload;
        state.currentInstructor = null;
      })
      .addCase(getInstructorReviews.pending, (state) => {
        state.loadingReviews = true;
        state.reviewsError = null;
      })
      .addCase(getInstructorReviews.fulfilled, (state, action) => {
        state.loadingReviews = false;
        state.reviews = action.payload.reviews || [];
        state.ratingStats = action.payload.ratingStats || null;
        state.reviewPagination = action.payload.pagination || DEFAULT_PAGINATION;
      })
      .addCase(getInstructorReviews.rejected, (state, action) => {
        state.loadingReviews = false;
        state.reviewsError = action.payload;
        state.reviews = [];
      });
  },
});

export const {
  setInstructorFilters,
  clearInstructorFilters,
  setInstructorSortBy,
  clearCurrentInstructor,
  clearInstructorErrors,
} = instructorSlice.actions;

export default instructorSlice.reducer;
