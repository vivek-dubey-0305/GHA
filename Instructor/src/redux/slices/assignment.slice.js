import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import apiClient from '../../utils/api.utils';

// Get instructor's assignments
export const getMyAssignments = createAsyncThunk(
  'assignment/getMyAssignments',
  async ({ page = 1, limit = 10, courseId } = {}, { rejectWithValue }) => {
    try {
      const params = { page, limit };
      if (courseId) params.courseId = courseId;
      const response = await apiClient.get('/instructor/assignments', { params });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch assignments');
    }
  }
);

// Get pending submissions
export const getPendingSubmissions = createAsyncThunk(
  'assignment/getPendingSubmissions',
  async ({ page = 1, limit = 20 } = {}, { rejectWithValue }) => {
    try {
      const response = await apiClient.get('/instructor/submissions/pending', { params: { page, limit } });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch pending submissions');
    }
  }
);

const initialState = {
  assignments: [],
  assignmentPagination: null,
  assignmentsLoading: false,
  assignmentsError: null,

  pendingSubmissions: [],
  pendingSubmissionsPagination: null,
  pendingSubmissionsLoading: false,
  pendingSubmissionsError: null,
};

const assignmentSlice = createSlice({
  name: 'assignment',
  initialState,
  reducers: {
    clearAssignmentsError: (state) => { state.assignmentsError = null; },
    clearPendingSubmissionsError: (state) => { state.pendingSubmissionsError = null; },
    resetAssignmentState: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(getMyAssignments.pending, (state) => {
        state.assignmentsLoading = true;
        state.assignmentsError = null;
      })
      .addCase(getMyAssignments.fulfilled, (state, action) => {
        state.assignmentsLoading = false;
        state.assignments = action.payload.data?.assignments || [];
        state.assignmentPagination = action.payload.data?.pagination || null;
      })
      .addCase(getMyAssignments.rejected, (state, action) => {
        state.assignmentsLoading = false;
        state.assignmentsError = action.payload;
      })

      .addCase(getPendingSubmissions.pending, (state) => {
        state.pendingSubmissionsLoading = true;
        state.pendingSubmissionsError = null;
      })
      .addCase(getPendingSubmissions.fulfilled, (state, action) => {
        state.pendingSubmissionsLoading = false;
        state.pendingSubmissions = action.payload.data?.submissions || [];
        state.pendingSubmissionsPagination = action.payload.data?.pagination || null;
      })
      .addCase(getPendingSubmissions.rejected, (state, action) => {
        state.pendingSubmissionsLoading = false;
        state.pendingSubmissionsError = action.payload;
      });
  },
});

export const { clearAssignmentsError, clearPendingSubmissionsError, resetAssignmentState } = assignmentSlice.actions;
export default assignmentSlice.reducer;

export const selectAssignments = (state) => state.assignment.assignments;
export const selectAssignmentPagination = (state) => state.assignment.assignmentPagination;
export const selectAssignmentsLoading = (state) => state.assignment.assignmentsLoading;
export const selectAssignmentsError = (state) => state.assignment.assignmentsError;
export const selectPendingSubmissions = (state) => state.assignment.pendingSubmissions;
export const selectPendingSubmissionsPagination = (state) => state.assignment.pendingSubmissionsPagination;
export const selectPendingSubmissionsLoading = (state) => state.assignment.pendingSubmissionsLoading;
export const selectPendingSubmissionsError = (state) => state.assignment.pendingSubmissionsError;
