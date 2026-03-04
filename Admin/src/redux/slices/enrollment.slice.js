import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { apiClient } from '../../utils/api.utils.js';

// Async thunks for enrollment management API calls

// Get all enrollments with pagination
export const getAllEnrollments = createAsyncThunk(
  'enrollment/getAllEnrollments',
  async ({ page = 1, limit = 20, userId, courseId, status } = {}, { rejectWithValue }) => {
    try {
      const params = { page, limit };
      if (userId) params.userId = userId;
      if (courseId) params.courseId = courseId;
      if (status) params.status = status;

      const response = await apiClient.get(`/enrollments`, { params });
      return response.data.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to fetch enrollments';
      return rejectWithValue(message);
    }
  }
);

// Get enrollment by ID
export const getEnrollmentById = createAsyncThunk(
  'enrollment/getEnrollmentById',
  async (enrollmentId, { rejectWithValue }) => {
    try {
      const response = await apiClient.get(`/enrollments/${enrollmentId}`);
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to fetch enrollment';
      return rejectWithValue(message);
    }
  }
);

// Create new enrollment
export const createEnrollment = createAsyncThunk(
  'enrollment/createEnrollment',
  async (enrollmentData, { rejectWithValue }) => {
    try {
      const response = await apiClient.post(`/enrollments`, enrollmentData);
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to create enrollment';
      return rejectWithValue(message);
    }
  }
);

// Update enrollment
export const updateEnrollment = createAsyncThunk(
  'enrollment/updateEnrollment',
  async ({ enrollmentId, enrollmentData }, { rejectWithValue }) => {
    try {
      const response = await apiClient.put(`/enrollments/${enrollmentId}`, enrollmentData);
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to update enrollment';
      return rejectWithValue(message);
    }
  }
);

// Delete enrollment
export const deleteEnrollment = createAsyncThunk(
  'enrollment/deleteEnrollment',
  async (enrollmentId, { rejectWithValue }) => {
    try {
      const response = await apiClient.delete(`/enrollments/${enrollmentId}`);
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to delete enrollment';
      return rejectWithValue(message);
    }
  }
);

// Initial state
const initialState = {
  // Enrollments list
  enrollments: [],
  enrollmentsLoading: false,
  enrollmentsError: null,
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

  // Single enrollment
  currentEnrollment: null,
  enrollmentLoading: false,
  enrollmentError: null,

  // Create enrollment
  createEnrollmentLoading: false,
  createEnrollmentError: null,
  createEnrollmentSuccess: false,

  // Update enrollment
  updateEnrollmentLoading: false,
  updateEnrollmentError: null,
  updateEnrollmentSuccess: false,

  // Delete enrollment
  deleteEnrollmentLoading: false,
  deleteEnrollmentError: null,
  deleteEnrollmentSuccess: false,
};

// Enrollment slice
const enrollmentSlice = createSlice({
  name: 'enrollment',
  initialState,
  reducers: {
    // Clear errors
    clearEnrollmentsError: (state) => {
      state.enrollmentsError = null;
    },
    clearEnrollmentError: (state) => {
      state.enrollmentError = null;
    },
    clearCreateEnrollmentError: (state) => {
      state.createEnrollmentError = null;
      state.createEnrollmentSuccess = false;
    },
    clearUpdateEnrollmentError: (state) => {
      state.updateEnrollmentError = null;
      state.updateEnrollmentSuccess = false;
    },
    clearDeleteEnrollmentError: (state) => {
      state.deleteEnrollmentError = null;
      state.deleteEnrollmentSuccess = false;
    },
    // Reset states
    resetEnrollmentStates: (state) => {
      state.currentEnrollment = null;
      state.enrollmentLoading = false;
      state.enrollmentError = null;
    },
    resetCreateEnrollmentState: (state) => {
      state.createEnrollmentLoading = false;
      state.createEnrollmentError = null;
      state.createEnrollmentSuccess = false;
    },
    resetUpdateEnrollmentState: (state) => {
      state.updateEnrollmentLoading = false;
      state.updateEnrollmentError = null;
      state.updateEnrollmentSuccess = false;
    },
    resetDeleteEnrollmentState: (state) => {
      state.deleteEnrollmentLoading = false;
      state.deleteEnrollmentError = null;
      state.deleteEnrollmentSuccess = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getAllEnrollments.pending, (state) => {
        state.enrollmentsLoading = true;
        state.enrollmentsError = null;
      })
      .addCase(getAllEnrollments.fulfilled, (state, action) => {
        state.enrollmentsLoading = false;
        state.enrollments = action.payload.enrollments;
        state.pagination = action.payload.pagination;
      })
      .addCase(getAllEnrollments.rejected, (state, action) => {
        state.enrollmentsLoading = false;
        state.enrollmentsError = action.payload;
      })
      .addCase(getEnrollmentById.pending, (state) => {
        state.enrollmentLoading = true;
        state.enrollmentError = null;
      })
      .addCase(getEnrollmentById.fulfilled, (state, action) => {
        state.enrollmentLoading = false;
        state.currentEnrollment = action.payload;
      })
      .addCase(getEnrollmentById.rejected, (state, action) => {
        state.enrollmentLoading = false;
        state.enrollmentError = action.payload;
      })
      .addCase(createEnrollment.pending, (state) => {
        state.createEnrollmentLoading = true;
        state.createEnrollmentError = null;
        state.createEnrollmentSuccess = false;
      })
      .addCase(createEnrollment.fulfilled, (state, action) => {
        state.createEnrollmentLoading = false;
        state.createEnrollmentSuccess = true;
        state.enrollments.push(action.payload);
      })
      .addCase(createEnrollment.rejected, (state, action) => {
        state.createEnrollmentLoading = false;
        state.createEnrollmentError = action.payload;
      })
      .addCase(updateEnrollment.pending, (state) => {
        state.updateEnrollmentLoading = true;
        state.updateEnrollmentError = null;
        state.updateEnrollmentSuccess = false;
      })
      .addCase(updateEnrollment.fulfilled, (state, action) => {
        state.updateEnrollmentLoading = false;
        state.updateEnrollmentSuccess = true;
        const index = state.enrollments.findIndex(enrollment => enrollment._id === action.payload._id);
        if (index !== -1) {
          state.enrollments[index] = action.payload;
        }
        if (state.currentEnrollment && state.currentEnrollment._id === action.payload._id) {
          state.currentEnrollment = action.payload;
        }
      })
      .addCase(updateEnrollment.rejected, (state, action) => {
        state.updateEnrollmentLoading = false;
        state.updateEnrollmentError = action.payload;
      })
      .addCase(deleteEnrollment.pending, (state) => {
        state.deleteEnrollmentLoading = true;
        state.deleteEnrollmentError = null;
        state.deleteEnrollmentSuccess = false;
      })
      .addCase(deleteEnrollment.fulfilled, (state, action) => {
        state.deleteEnrollmentLoading = false;
        state.deleteEnrollmentSuccess = true;
        state.enrollments = state.enrollments.filter(enrollment => enrollment._id !== action.meta.arg);
      })
      .addCase(deleteEnrollment.rejected, (state, action) => {
        state.deleteEnrollmentLoading = false;
        state.deleteEnrollmentError = action.payload;
      });
  },
});

// Export actions
export const {
  clearEnrollmentsError,
  clearEnrollmentError,
  clearCreateEnrollmentError,
  clearUpdateEnrollmentError,
  clearDeleteEnrollmentError,
  resetEnrollmentStates,
  resetCreateEnrollmentState,
  resetUpdateEnrollmentState,
  resetDeleteEnrollmentState,
} = enrollmentSlice.actions;

// Export reducer
export default enrollmentSlice.reducer;

// Selectors
export const selectEnrollments = (state) => state.enrollment.enrollments;
export const selectEnrollmentsLoading = (state) => state.enrollment.enrollmentsLoading;
export const selectEnrollmentsError = (state) => state.enrollment.enrollmentsError;
export const selectEnrollmentPagination = (state) => state.enrollment.pagination;
export const selectCurrentEnrollment = (state) => state.enrollment.currentEnrollment;
export const selectEnrollmentLoading = (state) => state.enrollment.enrollmentLoading;
export const selectEnrollmentError = (state) => state.enrollment.enrollmentError;
export const selectCreateEnrollmentLoading = (state) => state.enrollment.createEnrollmentLoading;
export const selectCreateEnrollmentError = (state) => state.enrollment.createEnrollmentError;
export const selectCreateEnrollmentSuccess = (state) => state.enrollment.createEnrollmentSuccess;
export const selectUpdateEnrollmentLoading = (state) => state.enrollment.updateEnrollmentLoading;
export const selectUpdateEnrollmentError = (state) => state.enrollment.updateEnrollmentError;
export const selectUpdateEnrollmentSuccess = (state) => state.enrollment.updateEnrollmentSuccess;
export const selectDeleteEnrollmentLoading = (state) => state.enrollment.deleteEnrollmentLoading;
export const selectDeleteEnrollmentError = (state) => state.enrollment.deleteEnrollmentError;
export const selectDeleteEnrollmentSuccess = (state) => state.enrollment.deleteEnrollmentSuccess;