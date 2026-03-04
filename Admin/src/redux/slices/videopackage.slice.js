import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { apiClient } from '../../utils/api.utils.js';

// Async thunks for video package management API calls

// Get all video packages with pagination
export const getAllVideoPackages = createAsyncThunk(
  'videopackage/getAllVideoPackages',
  async ({ page = 1, limit = 20, instructorId, courseId, status } = {}, { rejectWithValue }) => {
    try {
      const params = { page, limit };
      if (instructorId) params.instructorId = instructorId;
      if (courseId) params.courseId = courseId;
      if (status) params.status = status;

      const response = await apiClient.get(`/video-packages`, { params });
      return response.data.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to fetch video packages';
      return rejectWithValue(message);
    }
  }
);

// Get video package by ID
export const getVideoPackageById = createAsyncThunk(
  'videopackage/getVideoPackageById',
  async (videoPackageId, { rejectWithValue }) => {1
    try {
      const response = await apiClient.get(`/video-packages/${videoPackageId}`);
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to fetch video package';
      return rejectWithValue(message);
    }
  }
);

// Update video package
export const updateVideoPackage = createAsyncThunk(
  'videopackage/updateVideoPackage',
  async ({ videoPackageId, videoPackageData }, { rejectWithValue }) => {
    try {
      const response = await apiClient.put(`/video-packages/${videoPackageId}`, videoPackageData);
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to update video package';
      return rejectWithValue(message);
    }
  }
);

// Delete video package
export const deleteVideoPackage = createAsyncThunk(
  'videopackage/deleteVideoPackage',
  async (videoPackageId, { rejectWithValue }) => {
    try {
      const response = await apiClient.delete(`/video-packages/${videoPackageId}`);
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to delete video package';
      return rejectWithValue(message);
    }
  }
);

// Initial state
const initialState = {
  // Video packages list
  videoPackages: [],
  videoPackagesLoading: false,
  videoPackagesError: null,
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

  // Single video package
  currentVideoPackage: null,
  videoPackageLoading: false,
  videoPackageError: null,

  // Update video package
  updateVideoPackageLoading: false,
  updateVideoPackageError: null,
  updateVideoPackageSuccess: false,

  // Delete video package
  deleteVideoPackageLoading: false,
  deleteVideoPackageError: null,
  deleteVideoPackageSuccess: false,
};

// Video package slice
const videoPackageSlice = createSlice({
  name: 'videopackage',
  initialState,
  reducers: {
    // Clear errors
    clearVideoPackagesError: (state) => {
      state.videoPackagesError = null;
    },
    clearVideoPackageError: (state) => {
      state.videoPackageError = null;
    },
    clearUpdateVideoPackageError: (state) => {
      state.updateVideoPackageError = null;
      state.updateVideoPackageSuccess = false;
    },
    clearDeleteVideoPackageError: (state) => {
      state.deleteVideoPackageError = null;
      state.deleteVideoPackageSuccess = false;
    },
    // Reset states
    resetVideoPackageStates: (state) => {
      state.currentVideoPackage = null;
      state.videoPackageLoading = false;
      state.videoPackageError = null;
    },
    resetUpdateVideoPackageState: (state) => {
      state.updateVideoPackageLoading = false;
      state.updateVideoPackageError = null;
      state.updateVideoPackageSuccess = false;
    },
    resetDeleteVideoPackageState: (state) => {
      state.deleteVideoPackageLoading = false;
      state.deleteVideoPackageError = null;
      state.deleteVideoPackageSuccess = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getAllVideoPackages.pending, (state) => {
        state.videoPackagesLoading = true;
        state.videoPackagesError = null;
      })
      .addCase(getAllVideoPackages.fulfilled, (state, action) => {
        state.videoPackagesLoading = false;
        state.videoPackages = action.payload.videoPackages;
        state.pagination = action.payload.pagination;
      })
      .addCase(getAllVideoPackages.rejected, (state, action) => {
        state.videoPackagesLoading = false;
        state.videoPackagesError = action.payload;
      })
      .addCase(getVideoPackageById.pending, (state) => {
        state.videoPackageLoading = true;
        state.videoPackageError = null;
      })
      .addCase(getVideoPackageById.fulfilled, (state, action) => {
        state.videoPackageLoading = false;
        state.currentVideoPackage = action.payload;
      })
      .addCase(getVideoPackageById.rejected, (state, action) => {
        state.videoPackageLoading = false;
        state.videoPackageError = action.payload;
      })
      .addCase(updateVideoPackage.pending, (state) => {
        state.updateVideoPackageLoading = true;
        state.updateVideoPackageError = null;
        state.updateVideoPackageSuccess = false;
      })
      .addCase(updateVideoPackage.fulfilled, (state, action) => {
        state.updateVideoPackageLoading = false;
        state.updateVideoPackageSuccess = true;
        const index = state.videoPackages.findIndex(videoPackage => videoPackage._id === action.payload._id);
        if (index !== -1) {
          state.videoPackages[index] = action.payload;
        }
        if (state.currentVideoPackage && state.currentVideoPackage._id === action.payload._id) {
          state.currentVideoPackage = action.payload;
        }
      })
      .addCase(updateVideoPackage.rejected, (state, action) => {
        state.updateVideoPackageLoading = false;
        state.updateVideoPackageError = action.payload;
      })
      .addCase(deleteVideoPackage.pending, (state) => {
        state.deleteVideoPackageLoading = true;
        state.deleteVideoPackageError = null;
        state.deleteVideoPackageSuccess = false;
      })
      .addCase(deleteVideoPackage.fulfilled, (state, action) => {
        state.deleteVideoPackageLoading = false;
        state.deleteVideoPackageSuccess = true;
        state.videoPackages = state.videoPackages.filter(videoPackage => videoPackage._id !== action.meta.arg);
      })
      .addCase(deleteVideoPackage.rejected, (state, action) => {
        state.deleteVideoPackageLoading = false;
        state.deleteVideoPackageError = action.payload;
      });
  },
});

// Export actions
export const {
  clearVideoPackagesError,
  clearVideoPackageError,
  clearUpdateVideoPackageError,
  clearDeleteVideoPackageError,
  resetVideoPackageStates,
  resetUpdateVideoPackageState,
  resetDeleteVideoPackageState,
} = videoPackageSlice.actions;

// Export reducer
export default videoPackageSlice.reducer;

// Selectors
export const selectVideoPackages = (state) => state.videopackage.videoPackages;
export const selectVideoPackagesLoading = (state) => state.videopackage.videoPackagesLoading;
export const selectVideoPackagesError = (state) => state.videopackage.videoPackagesError;
export const selectVideoPackagePagination = (state) => state.videopackage.pagination;
export const selectCurrentVideoPackage = (state) => state.videopackage.currentVideoPackage;
export const selectVideoPackageLoading = (state) => state.videopackage.videoPackageLoading;
export const selectVideoPackageError = (state) => state.videopackage.videoPackageError;
export const selectUpdateVideoPackageLoading = (state) => state.videopackage.updateVideoPackageLoading;
export const selectUpdateVideoPackageError = (state) => state.videopackage.updateVideoPackageError;
export const selectUpdateVideoPackageSuccess = (state) => state.videopackage.updateVideoPackageSuccess;
export const selectDeleteVideoPackageLoading = (state) => state.videopackage.deleteVideoPackageLoading;
export const selectDeleteVideoPackageError = (state) => state.videopackage.deleteVideoPackageError;
export const selectDeleteVideoPackageSuccess = (state) => state.videopackage.deleteVideoPackageSuccess;