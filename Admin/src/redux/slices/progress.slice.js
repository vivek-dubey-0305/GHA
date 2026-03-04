import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { apiClient } from '../../utils/api.utils.js';

// Async thunks for progress management API calls

// Get all progress records with pagination
export const getAllProgress = createAsyncThunk(
  'progress/getAllProgress',
  async ({ page = 1, limit = 20, userId, courseId, status } = {}, { rejectWithValue }) => {
    try {
      const params = { page, limit };
      if (userId) params.userId = userId;
      if (courseId) params.courseId = courseId;
      if (status) params.status = status;

      const response = await apiClient.get(`/progress`, { params });
      return response.data.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to fetch progress records';
      return rejectWithValue(message);
    }
  }
);

// Update progress
export const updateProgress = createAsyncThunk(
  'progress/updateProgress',
  async ({ progressId, progressData }, { rejectWithValue }) => {
    try {
      const response = await apiClient.put(`/progress/${progressId}`, progressData);
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to update progress';
      return rejectWithValue(message);
    }
  }
);

// Delete progress
export const deleteProgress = createAsyncThunk(
  'progress/deleteProgress',
  async (progressId, { rejectWithValue }) => {
    try {
      const response = await apiClient.delete(`/progress/${progressId}`);
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to delete progress';
      return rejectWithValue(message);
    }
  }
);

// Initial state
const initialState = {
  // Progress records list
  progress: [],
  progressLoading: false,
  progressError: null,
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

  // Update progress
  updateProgressLoading: false,
  updateProgressError: null,
  updateProgressSuccess: false,

  // Delete progress
  deleteProgressLoading: false,
  deleteProgressError: null,
  deleteProgressSuccess: false,
};

// Progress slice
const progressSlice = createSlice({
  name: 'progress',
  initialState,
  reducers: {
    // Clear errors
    clearProgressError: (state) => {
      state.progressError = null;
    },
    clearUpdateProgressError: (state) => {
      state.updateProgressError = null;
      state.updateProgressSuccess = false;
    },
    clearDeleteProgressError: (state) => {
      state.deleteProgressError = null;
      state.deleteProgressSuccess = false;
    },
    // Reset states
    resetUpdateProgressState: (state) => {
      state.updateProgressLoading = false;
      state.updateProgressError = null;
      state.updateProgressSuccess = false;
    },
    resetDeleteProgressState: (state) => {
      state.deleteProgressLoading = false;
      state.deleteProgressError = null;
      state.deleteProgressSuccess = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getAllProgress.pending, (state) => {
        state.progressLoading = true;
        state.progressError = null;
      })
      .addCase(getAllProgress.fulfilled, (state, action) => {
        state.progressLoading = false;
        state.progress = action.payload.progress;
        state.pagination = action.payload.pagination;
      })
      .addCase(getAllProgress.rejected, (state, action) => {
        state.progressLoading = false;
        state.progressError = action.payload;
      })
      .addCase(updateProgress.pending, (state) => {
        state.updateProgressLoading = true;
        state.updateProgressError = null;
        state.updateProgressSuccess = false;
      })
      .addCase(updateProgress.fulfilled, (state, action) => {
        state.updateProgressLoading = false;
        state.updateProgressSuccess = true;
        const index = state.progress.findIndex(progress => progress._id === action.payload._id);
        if (index !== -1) {
          state.progress[index] = action.payload;
        }
      })
      .addCase(updateProgress.rejected, (state, action) => {
        state.updateProgressLoading = false;
        state.updateProgressError = action.payload;
      })
      .addCase(deleteProgress.pending, (state) => {
        state.deleteProgressLoading = true;
        state.deleteProgressError = null;
        state.deleteProgressSuccess = false;
      })
      .addCase(deleteProgress.fulfilled, (state, action) => {
        state.deleteProgressLoading = false;
        state.deleteProgressSuccess = true;
        state.progress = state.progress.filter(progress => progress._id !== action.meta.arg);
      })
      .addCase(deleteProgress.rejected, (state, action) => {
        state.deleteProgressLoading = false;
        state.deleteProgressError = action.payload;
      });
  },
});

// Export actions
export const {
  clearProgressError,
  clearUpdateProgressError,
  clearDeleteProgressError,
  resetUpdateProgressState,
  resetDeleteProgressState,
} = progressSlice.actions;

// Export reducer
export default progressSlice.reducer;

// Selectors
export const selectProgress = (state) => state.progress.progress;
export const selectProgressLoading = (state) => state.progress.progressLoading;
export const selectProgressError = (state) => state.progress.progressError;
export const selectProgressPagination = (state) => state.progress.pagination;
export const selectUpdateProgressLoading = (state) => state.progress.updateProgressLoading;
export const selectUpdateProgressError = (state) => state.progress.updateProgressError;
export const selectUpdateProgressSuccess = (state) => state.progress.updateProgressSuccess;
export const selectDeleteProgressLoading = (state) => state.progress.deleteProgressLoading;
export const selectDeleteProgressError = (state) => state.progress.deleteProgressError;
export const selectDeleteProgressSuccess = (state) => state.progress.deleteProgressSuccess;