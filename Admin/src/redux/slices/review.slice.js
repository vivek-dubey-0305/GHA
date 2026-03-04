import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { apiClient } from '../../utils/api.utils.js';

// Async thunks for review management API calls

// Get all reviews with pagination
export const getAllReviews = createAsyncThunk(
  'review/getAllReviews',
  async ({ page = 1, limit = 20, courseId, userId, rating } = {}, { rejectWithValue }) => {
    try {
      const params = { page, limit };
      if (courseId) params.courseId = courseId;
      if (userId) params.userId = userId;
      if (rating) params.rating = rating;

      const response = await apiClient.get(`/reviews`, { params });
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to fetch reviews';
      return rejectWithValue(message);
    }
  }
);

// Get review by ID
export const getReviewById = createAsyncThunk(
  'review/getReviewById',
  async (reviewId, { rejectWithValue }) => {
    try {
      const response = await apiClient.get(`/reviews/${reviewId}`);
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to fetch review';
      return rejectWithValue(message);
    }
  }
);

// Update review
export const updateReview = createAsyncThunk(
  'review/updateReview',
  async ({ reviewId, reviewData }, { rejectWithValue }) => {
    try {
      const response = await apiClient.put(`/reviews/${reviewId}`, reviewData);
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to update review';
      return rejectWithValue(message);
    }
  }
);

// Delete review
export const deleteReview = createAsyncThunk(
  'review/deleteReview',
  async (reviewId, { rejectWithValue }) => {
    try {
      const response = await apiClient.delete(`/reviews/${reviewId}`);
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to delete review';
      return rejectWithValue(message);
    }
  }
);

// Initial state
const initialState = {
  // Reviews list
  reviews: [],
  reviewsLoading: false,
  reviewsError: null,
  pagination: {
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 20,
    hasNextPage: false,
    hasPrevPage: false,
    nextPage: null,
    prevPage: null
  },

  // Single review
  currentReview: null,
  reviewLoading: false,
  reviewError: null,

  // Update review
  updateReviewLoading: false,
  updateReviewError: null,
  updateReviewSuccess: false,

  // Delete review
  deleteReviewLoading: false,
  deleteReviewError: null,
  deleteReviewSuccess: false,
};

// Review slice
const reviewSlice = createSlice({
  name: 'review',
  initialState,
  reducers: {
    // Clear errors
    clearReviewsError: (state) => {
      state.reviewsError = null;
    },
    clearReviewError: (state) => {
      state.reviewError = null;
    },
    clearUpdateReviewError: (state) => {
      state.updateReviewError = null;
      state.updateReviewSuccess = false;
    },
    clearDeleteReviewError: (state) => {
      state.deleteReviewError = null;
      state.deleteReviewSuccess = false;
    },
    // Reset states
    resetReviewStates: (state) => {
      state.currentReview = null;
      state.reviewLoading = false;
      state.reviewError = null;
    },
    resetUpdateReviewState: (state) => {
      state.updateReviewLoading = false;
      state.updateReviewError = null;
      state.updateReviewSuccess = false;
    },
    resetDeleteReviewState: (state) => {
      state.deleteReviewLoading = false;
      state.deleteReviewError = null;
      state.deleteReviewSuccess = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getAllReviews.pending, (state) => {
        state.reviewsLoading = true;
        state.reviewsError = null;
      })
      .addCase(getAllReviews.fulfilled, (state, action) => {
        state.reviewsLoading = false;
        state.reviews = action.payload.reviews;
        state.pagination = action.payload.pagination;
      })
      .addCase(getAllReviews.rejected, (state, action) => {
        state.reviewsLoading = false;
        state.reviewsError = action.payload;
      })
      .addCase(getReviewById.pending, (state) => {
        state.reviewLoading = true;
        state.reviewError = null;
      })
      .addCase(getReviewById.fulfilled, (state, action) => {
        state.reviewLoading = false;
        state.currentReview = action.payload;
      })
      .addCase(getReviewById.rejected, (state, action) => {
        state.reviewLoading = false;
        state.reviewError = action.payload;
      })
      .addCase(updateReview.pending, (state) => {
        state.updateReviewLoading = true;
        state.updateReviewError = null;
        state.updateReviewSuccess = false;
      })
      .addCase(updateReview.fulfilled, (state, action) => {
        state.updateReviewLoading = false;
        state.updateReviewSuccess = true;
        const index = state.reviews.findIndex(review => review._id === action.payload._id);
        if (index !== -1) {
          state.reviews[index] = action.payload;
        }
        if (state.currentReview && state.currentReview._id === action.payload._id) {
          state.currentReview = action.payload;
        }
      })
      .addCase(updateReview.rejected, (state, action) => {
        state.updateReviewLoading = false;
        state.updateReviewError = action.payload;
      })
      .addCase(deleteReview.pending, (state) => {
        state.deleteReviewLoading = true;
        state.deleteReviewError = null;
        state.deleteReviewSuccess = false;
      })
      .addCase(deleteReview.fulfilled, (state, action) => {
        state.deleteReviewLoading = false;
        state.deleteReviewSuccess = true;
        state.reviews = state.reviews.filter(review => review._id !== action.meta.arg);
      })
      .addCase(deleteReview.rejected, (state, action) => {
        state.deleteReviewLoading = false;
        state.deleteReviewError = action.payload;
      });
  },
});

// Export actions
export const {
  clearReviewsError,
  clearReviewError,
  clearUpdateReviewError,
  clearDeleteReviewError,
  resetReviewStates,
  resetUpdateReviewState,
  resetDeleteReviewState,
} = reviewSlice.actions;

// Export reducer
export default reviewSlice.reducer;

// Selectors
export const selectReviews = (state) => state.review.reviews;
export const selectReviewsLoading = (state) => state.review.reviewsLoading;
export const selectReviewsError = (state) => state.review.reviewsError;
export const selectReviewPagination = (state) => state.review.pagination;
export const selectCurrentReview = (state) => state.review.currentReview;
export const selectReviewLoading = (state) => state.review.reviewLoading;
export const selectReviewError = (state) => state.review.reviewError;
export const selectUpdateReviewLoading = (state) => state.review.updateReviewLoading;
export const selectUpdateReviewError = (state) => state.review.updateReviewError;
export const selectUpdateReviewSuccess = (state) => state.review.updateReviewSuccess;
export const selectDeleteReviewLoading = (state) => state.review.deleteReviewLoading;
export const selectDeleteReviewError = (state) => state.review.deleteReviewError;
export const selectDeleteReviewSuccess = (state) => state.review.deleteReviewSuccess;