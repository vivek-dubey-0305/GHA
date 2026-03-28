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

export const getAssignmentSubmissions = createAsyncThunk(
  'assignment/getAssignmentSubmissions',
  async ({ assignmentId, page = 1, limit = 50, status } = {}, { rejectWithValue }) => {
    try {
      const params = { page, limit };
      if (status) params.status = status;
      const response = await apiClient.get(`/submissions/assignment/${assignmentId}`, { params });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch assignment submissions');
    }
  }
);

export const gradeSubmission = createAsyncThunk(
  'assignment/gradeSubmission',
  async ({ submissionId, payload }, { rejectWithValue }) => {
    try {
      const response = await apiClient.patch(`/submissions/${submissionId}/grade`, payload);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to grade submission');
    }
  }
);

export const returnSubmissionForRevision = createAsyncThunk(
  'assignment/returnSubmissionForRevision',
  async ({ submissionId, feedback }, { rejectWithValue }) => {
    try {
      const response = await apiClient.patch(`/submissions/${submissionId}/return`, { feedback });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to return submission');
    }
  }
);

export const reportSuspiciousSubmission = createAsyncThunk(
  'assignment/reportSuspiciousSubmission',
  async ({ submissionId, reason, evidenceFiles = [] }, { rejectWithValue }) => {
    try {
      const formData = new FormData();
      formData.append('reason', reason);
      evidenceFiles.forEach((file) => formData.append('files', file));

      const response = await apiClient.patch(`/submissions/${submissionId}/report`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to report suspicious submission');
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

  assignmentSubmissions: [],
  assignmentSubmissionsStats: null,
  assignmentSubmissionsLoading: false,
  assignmentSubmissionsError: null,

  actionLoading: false,
  actionError: null,
  actionSuccess: null,
};

const assignmentSlice = createSlice({
  name: 'assignment',
  initialState,
  reducers: {
    clearAssignmentsError: (state) => { state.assignmentsError = null; },
    clearPendingSubmissionsError: (state) => { state.pendingSubmissionsError = null; },
    clearAssignmentSubmissionsError: (state) => { state.assignmentSubmissionsError = null; },
    clearAssignmentActionState: (state) => {
      state.actionLoading = false;
      state.actionError = null;
      state.actionSuccess = null;
    },
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
      })

      .addCase(getAssignmentSubmissions.pending, (state) => {
        state.assignmentSubmissionsLoading = true;
        state.assignmentSubmissionsError = null;
      })
      .addCase(getAssignmentSubmissions.fulfilled, (state, action) => {
        state.assignmentSubmissionsLoading = false;
        state.assignmentSubmissions = action.payload.data?.submissions || [];
        state.assignmentSubmissionsStats = action.payload.data?.stats || null;
      })
      .addCase(getAssignmentSubmissions.rejected, (state, action) => {
        state.assignmentSubmissionsLoading = false;
        state.assignmentSubmissionsError = action.payload;
      })

      .addCase(gradeSubmission.pending, (state) => {
        state.actionLoading = true;
        state.actionError = null;
        state.actionSuccess = null;
      })
      .addCase(gradeSubmission.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.actionSuccess = action.payload?.message || 'Submission graded successfully';
      })
      .addCase(gradeSubmission.rejected, (state, action) => {
        state.actionLoading = false;
        state.actionError = action.payload;
      })

      .addCase(returnSubmissionForRevision.pending, (state) => {
        state.actionLoading = true;
        state.actionError = null;
        state.actionSuccess = null;
      })
      .addCase(returnSubmissionForRevision.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.actionSuccess = action.payload?.message || 'Submission returned successfully';
      })
      .addCase(returnSubmissionForRevision.rejected, (state, action) => {
        state.actionLoading = false;
        state.actionError = action.payload;
      })

      .addCase(reportSuspiciousSubmission.pending, (state) => {
        state.actionLoading = true;
        state.actionError = null;
        state.actionSuccess = null;
      })
      .addCase(reportSuspiciousSubmission.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.actionSuccess = action.payload?.message || 'Submission reported successfully';
      })
      .addCase(reportSuspiciousSubmission.rejected, (state, action) => {
        state.actionLoading = false;
        state.actionError = action.payload;
      });
  },
});

export const {
  clearAssignmentsError,
  clearPendingSubmissionsError,
  clearAssignmentSubmissionsError,
  clearAssignmentActionState,
  resetAssignmentState,
} = assignmentSlice.actions;
export default assignmentSlice.reducer;

export const selectAssignments = (state) => state.assignment.assignments;
export const selectAssignmentPagination = (state) => state.assignment.assignmentPagination;
export const selectAssignmentsLoading = (state) => state.assignment.assignmentsLoading;
export const selectAssignmentsError = (state) => state.assignment.assignmentsError;
export const selectPendingSubmissions = (state) => state.assignment.pendingSubmissions;
export const selectPendingSubmissionsPagination = (state) => state.assignment.pendingSubmissionsPagination;
export const selectPendingSubmissionsLoading = (state) => state.assignment.pendingSubmissionsLoading;
export const selectPendingSubmissionsError = (state) => state.assignment.pendingSubmissionsError;
export const selectAssignmentSubmissions = (state) => state.assignment.assignmentSubmissions;
export const selectAssignmentSubmissionsStats = (state) => state.assignment.assignmentSubmissionsStats;
export const selectAssignmentSubmissionsLoading = (state) => state.assignment.assignmentSubmissionsLoading;
export const selectAssignmentSubmissionsError = (state) => state.assignment.assignmentSubmissionsError;
export const selectAssignmentActionLoading = (state) => state.assignment.actionLoading;
export const selectAssignmentActionError = (state) => state.assignment.actionError;
export const selectAssignmentActionSuccess = (state) => state.assignment.actionSuccess;
