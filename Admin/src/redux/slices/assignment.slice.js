import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { apiClient } from '../../utils/api.utils.js';

// Async thunks for assignment management API calls

// Get all assignments with pagination
export const getAllAssignments = createAsyncThunk(
  'assignment/getAllAssignments',
  async ({ page = 1, limit = 20, courseId, instructorId } = {}, { rejectWithValue }) => {
    try {
      const params = { page, limit };
      if (courseId) params.courseId = courseId;
      if (instructorId) params.instructorId = instructorId;

      const response = await apiClient.get(`/assignments`, { params });
      return response.data.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to fetch assignments';
      return rejectWithValue(message);
    }
  }
);

// Get assignment by ID
export const getAssignmentById = createAsyncThunk(
  'assignment/getAssignmentById',
  async (assignmentId, { rejectWithValue }) => {
    try {
      const response = await apiClient.get(`/assignments/${assignmentId}`);
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to fetch assignment';
      return rejectWithValue(message);
    }
  }
);

// Create new assignment
export const createAssignment = createAsyncThunk(
  'assignment/createAssignment',
  async (assignmentData, { rejectWithValue }) => {
    try {
      const response = await apiClient.post(`/assignments`, assignmentData);
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to create assignment';
      return rejectWithValue(message);
    }
  }
);

// Update assignment
export const updateAssignment = createAsyncThunk(
  'assignment/updateAssignment',
  async ({ assignmentId, assignmentData }, { rejectWithValue }) => {
    try {
      const response = await apiClient.put(`/assignments/${assignmentId}`, assignmentData);
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to update assignment';
      return rejectWithValue(message);
    }
  }
);

// Delete assignment
export const deleteAssignment = createAsyncThunk(
  'assignment/deleteAssignment',
  async (assignmentId, { rejectWithValue }) => {
    try {
      const response = await apiClient.delete(`/assignments/${assignmentId}`);
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to delete assignment';
      return rejectWithValue(message);
    }
  }
);

// Initial state
const initialState = {
  // Assignments list
  assignments: [],
  assignmentsLoading: false,
  assignmentsError: null,
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

  // Single assignment
  currentAssignment: null,
  assignmentLoading: false,
  assignmentError: null,

  // Create assignment
  createAssignmentLoading: false,
  createAssignmentError: null,
  createAssignmentSuccess: false,

  // Update assignment
  updateAssignmentLoading: false,
  updateAssignmentError: null,
  updateAssignmentSuccess: false,

  // Delete assignment
  deleteAssignmentLoading: false,
  deleteAssignmentError: null,
  deleteAssignmentSuccess: false,
};

// Assignment slice
const assignmentSlice = createSlice({
  name: 'assignment',
  initialState,
  reducers: {
    // Clear errors
    clearAssignmentsError: (state) => {
      state.assignmentsError = null;
    },
    clearAssignmentError: (state) => {
      state.assignmentError = null;
    },
    clearCreateAssignmentError: (state) => {
      state.createAssignmentError = null;
      state.createAssignmentSuccess = false;
    },
    clearUpdateAssignmentError: (state) => {
      state.updateAssignmentError = null;
      state.updateAssignmentSuccess = false;
    },
    clearDeleteAssignmentError: (state) => {
      state.deleteAssignmentError = null;
      state.deleteAssignmentSuccess = false;
    },
    // Reset states
    resetAssignmentStates: (state) => {
      state.currentAssignment = null;
      state.assignmentLoading = false;
      state.assignmentError = null;
    },
    resetCreateAssignmentState: (state) => {
      state.createAssignmentLoading = false;
      state.createAssignmentError = null;
      state.createAssignmentSuccess = false;
    },
    resetUpdateAssignmentState: (state) => {
      state.updateAssignmentLoading = false;
      state.updateAssignmentError = null;
      state.updateAssignmentSuccess = false;
    },
    resetDeleteAssignmentState: (state) => {
      state.deleteAssignmentLoading = false;
      state.deleteAssignmentError = null;
      state.deleteAssignmentSuccess = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getAllAssignments.pending, (state) => {
        state.assignmentsLoading = true;
        state.assignmentsError = null;
      })
      .addCase(getAllAssignments.fulfilled, (state, action) => {
        state.assignmentsLoading = false;
        state.assignments = action.payload.assignments;
        state.pagination = action.payload.pagination;
      })
      .addCase(getAllAssignments.rejected, (state, action) => {
        state.assignmentsLoading = false;
        state.assignmentsError = action.payload;
      })
      .addCase(getAssignmentById.pending, (state) => {
        state.assignmentLoading = true;
        state.assignmentError = null;
      })
      .addCase(getAssignmentById.fulfilled, (state, action) => {
        state.assignmentLoading = false;
        state.currentAssignment = action.payload;
      })
      .addCase(getAssignmentById.rejected, (state, action) => {
        state.assignmentLoading = false;
        state.assignmentError = action.payload;
      })
      .addCase(createAssignment.pending, (state) => {
        state.createAssignmentLoading = true;
        state.createAssignmentError = null;
        state.createAssignmentSuccess = false;
      })
      .addCase(createAssignment.fulfilled, (state, action) => {
        state.createAssignmentLoading = false;
        state.createAssignmentSuccess = true;
        state.assignments.push(action.payload);
      })
      .addCase(createAssignment.rejected, (state, action) => {
        state.createAssignmentLoading = false;
        state.createAssignmentError = action.payload;
      })
      .addCase(updateAssignment.pending, (state) => {
        state.updateAssignmentLoading = true;
        state.updateAssignmentError = null;
        state.updateAssignmentSuccess = false;
      })
      .addCase(updateAssignment.fulfilled, (state, action) => {
        state.updateAssignmentLoading = false;
        state.updateAssignmentSuccess = true;
        const index = state.assignments.findIndex(assignment => assignment._id === action.payload._id);
        if (index !== -1) {
          state.assignments[index] = action.payload;
        }
        if (state.currentAssignment && state.currentAssignment._id === action.payload._id) {
          state.currentAssignment = action.payload;
        }
      })
      .addCase(updateAssignment.rejected, (state, action) => {
        state.updateAssignmentLoading = false;
        state.updateAssignmentError = action.payload;
      })
      .addCase(deleteAssignment.pending, (state) => {
        state.deleteAssignmentLoading = true;
        state.deleteAssignmentError = null;
        state.deleteAssignmentSuccess = false;
      })
      .addCase(deleteAssignment.fulfilled, (state, action) => {
        state.deleteAssignmentLoading = false;
        state.deleteAssignmentSuccess = true;
        state.assignments = state.assignments.filter(assignment => assignment._id !== action.meta.arg);
      })
      .addCase(deleteAssignment.rejected, (state, action) => {
        state.deleteAssignmentLoading = false;
        state.deleteAssignmentError = action.payload;
      });
  },
});

// Export actions
export const {
  clearAssignmentsError,
  clearAssignmentError,
  clearCreateAssignmentError,
  clearUpdateAssignmentError,
  clearDeleteAssignmentError,
  resetAssignmentStates,
  resetCreateAssignmentState,
  resetUpdateAssignmentState,
  resetDeleteAssignmentState,
} = assignmentSlice.actions;

// Export reducer
export default assignmentSlice.reducer;

// Selectors
export const selectAssignments = (state) => state.assignment.assignments;
export const selectAssignmentsLoading = (state) => state.assignment.assignmentsLoading;
export const selectAssignmentsError = (state) => state.assignment.assignmentsError;
export const selectAssignmentPagination = (state) => state.assignment.pagination;
export const selectCurrentAssignment = (state) => state.assignment.currentAssignment;
export const selectAssignmentLoading = (state) => state.assignment.assignmentLoading;
export const selectAssignmentError = (state) => state.assignment.assignmentError;
export const selectCreateAssignmentLoading = (state) => state.assignment.createAssignmentLoading;
export const selectCreateAssignmentError = (state) => state.assignment.createAssignmentError;
export const selectCreateAssignmentSuccess = (state) => state.assignment.createAssignmentSuccess;
export const selectUpdateAssignmentLoading = (state) => state.assignment.updateAssignmentLoading;
export const selectUpdateAssignmentError = (state) => state.assignment.updateAssignmentError;
export const selectUpdateAssignmentSuccess = (state) => state.assignment.updateAssignmentSuccess;
export const selectDeleteAssignmentLoading = (state) => state.assignment.deleteAssignmentLoading;
export const selectDeleteAssignmentError = (state) => state.assignment.deleteAssignmentError;
export const selectDeleteAssignmentSuccess = (state) => state.assignment.deleteAssignmentSuccess;