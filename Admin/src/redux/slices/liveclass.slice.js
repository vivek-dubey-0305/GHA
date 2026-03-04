import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { apiClient } from '../../utils/api.utils.js';

// Async thunks for live class management API calls

// Get all live classes with pagination
export const getAllLiveClasses = createAsyncThunk(
  'liveclass/getAllLiveClasses',
  async ({ page = 1, limit = 20, instructorId, courseId, status } = {}, { rejectWithValue }) => {
    try {
      const params = { page, limit };
      if (instructorId) params.instructorId = instructorId;
      if (courseId) params.courseId = courseId;
      if (status) params.status = status;

      const response = await apiClient.get(`/live-classes`, { params });
      return response.data.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to fetch live classes';
      return rejectWithValue(message);
    }
  }
);

// Get live class by ID
export const getLiveClassById = createAsyncThunk(
  'liveclass/getLiveClassById',
  async (liveClassId, { rejectWithValue }) => {
    try {
      const response = await apiClient.get(`/live-classes/${liveClassId}`);
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to fetch live class';
      return rejectWithValue(message);
    }
  }
);

// Update live class
export const updateLiveClass = createAsyncThunk(
  'liveclass/updateLiveClass',
  async ({ liveClassId, liveClassData }, { rejectWithValue }) => {
    try {
      const response = await apiClient.put(`/live-classes/${liveClassId}`, liveClassData);
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to update live class';
      return rejectWithValue(message);
    }
  }
);

// Delete live class
export const deleteLiveClass = createAsyncThunk(
  'liveclass/deleteLiveClass',
  async (liveClassId, { rejectWithValue }) => {
    try {
      const response = await apiClient.delete(`/live-classes/${liveClassId}`);
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to delete live class';
      return rejectWithValue(message);
    }
  }
);

// Initial state
const initialState = {
  // Live classes list
  liveClasses: [],
  liveClassesLoading: false,
  liveClassesError: null,
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

  // Single live class
  currentLiveClass: null,
  liveClassLoading: false,
  liveClassError: null,

  // Update live class
  updateLiveClassLoading: false,
  updateLiveClassError: null,
  updateLiveClassSuccess: false,

  // Delete live class
  deleteLiveClassLoading: false,
  deleteLiveClassError: null,
  deleteLiveClassSuccess: false,
};

// Live class slice
const liveClassSlice = createSlice({
  name: 'liveclass',
  initialState,
  reducers: {
    // Clear errors
    clearLiveClassesError: (state) => {
      state.liveClassesError = null;
    },
    clearLiveClassError: (state) => {
      state.liveClassError = null;
    },
    clearUpdateLiveClassError: (state) => {
      state.updateLiveClassError = null;
      state.updateLiveClassSuccess = false;
    },
    clearDeleteLiveClassError: (state) => {
      state.deleteLiveClassError = null;
      state.deleteLiveClassSuccess = false;
    },
    // Reset states
    resetLiveClassStates: (state) => {
      state.currentLiveClass = null;
      state.liveClassLoading = false;
      state.liveClassError = null;
    },
    resetUpdateLiveClassState: (state) => {
      state.updateLiveClassLoading = false;
      state.updateLiveClassError = null;
      state.updateLiveClassSuccess = false;
    },
    resetDeleteLiveClassState: (state) => {
      state.deleteLiveClassLoading = false;
      state.deleteLiveClassError = null;
      state.deleteLiveClassSuccess = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getAllLiveClasses.pending, (state) => {
        state.liveClassesLoading = true;
        state.liveClassesError = null;
      })
      .addCase(getAllLiveClasses.fulfilled, (state, action) => {
        state.liveClassesLoading = false;
        state.liveClasses = action.payload.liveClasses;
        state.pagination = action.payload.pagination;
      })
      .addCase(getAllLiveClasses.rejected, (state, action) => {
        state.liveClassesLoading = false;
        state.liveClassesError = action.payload;
      })
      .addCase(getLiveClassById.pending, (state) => {
        state.liveClassLoading = true;
        state.liveClassError = null;
      })
      .addCase(getLiveClassById.fulfilled, (state, action) => {
        state.liveClassLoading = false;
        state.currentLiveClass = action.payload;
      })
      .addCase(getLiveClassById.rejected, (state, action) => {
        state.liveClassLoading = false;
        state.liveClassError = action.payload;
      })
      .addCase(updateLiveClass.pending, (state) => {
        state.updateLiveClassLoading = true;
        state.updateLiveClassError = null;
        state.updateLiveClassSuccess = false;
      })
      .addCase(updateLiveClass.fulfilled, (state, action) => {
        state.updateLiveClassLoading = false;
        state.updateLiveClassSuccess = true;
        const index = state.liveClasses.findIndex(liveClass => liveClass._id === action.payload._id);
        if (index !== -1) {
          state.liveClasses[index] = action.payload;
        }
        if (state.currentLiveClass && state.currentLiveClass._id === action.payload._id) {
          state.currentLiveClass = action.payload;
        }
      })
      .addCase(updateLiveClass.rejected, (state, action) => {
        state.updateLiveClassLoading = false;
        state.updateLiveClassError = action.payload;
      })
      .addCase(deleteLiveClass.pending, (state) => {
        state.deleteLiveClassLoading = true;
        state.deleteLiveClassError = null;
        state.deleteLiveClassSuccess = false;
      })
      .addCase(deleteLiveClass.fulfilled, (state, action) => {
        state.deleteLiveClassLoading = false;
        state.deleteLiveClassSuccess = true;
        state.liveClasses = state.liveClasses.filter(liveClass => liveClass._id !== action.meta.arg);
      })
      .addCase(deleteLiveClass.rejected, (state, action) => {
        state.deleteLiveClassLoading = false;
        state.deleteLiveClassError = action.payload;
      });
  },
});

// Export actions
export const {
  clearLiveClassesError,
  clearLiveClassError,
  clearUpdateLiveClassError,
  clearDeleteLiveClassError,
  resetLiveClassStates,
  resetUpdateLiveClassState,
  resetDeleteLiveClassState,
} = liveClassSlice.actions;

// Export reducer
export default liveClassSlice.reducer;

// Selectors
export const selectLiveClasses = (state) => state.liveclass.liveClasses;
export const selectLiveClassesLoading = (state) => state.liveclass.liveClassesLoading;
export const selectLiveClassesError = (state) => state.liveclass.liveClassesError;
export const selectLiveClassPagination = (state) => state.liveclass.pagination;
export const selectCurrentLiveClass = (state) => state.liveclass.currentLiveClass;
export const selectLiveClassLoading = (state) => state.liveclass.liveClassLoading;
export const selectLiveClassError = (state) => state.liveclass.liveClassError;
export const selectUpdateLiveClassLoading = (state) => state.liveclass.updateLiveClassLoading;
export const selectUpdateLiveClassError = (state) => state.liveclass.updateLiveClassError;
export const selectUpdateLiveClassSuccess = (state) => state.liveclass.updateLiveClassSuccess;
export const selectDeleteLiveClassLoading = (state) => state.liveclass.deleteLiveClassLoading;
export const selectDeleteLiveClassError = (state) => state.liveclass.deleteLiveClassError;
export const selectDeleteLiveClassSuccess = (state) => state.liveclass.deleteLiveClassSuccess;