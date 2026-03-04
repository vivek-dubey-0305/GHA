import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { apiClient } from '../../utils/api.utils.js';

// Async thunks for submission management API calls

// Get all submissions with pagination
export const getAllSubmissions = createAsyncThunk(
  'submission/getAllSubmissions',
  async ({ page = 1, limit = 20, assignmentId, userId, status } = {}, { rejectWithValue }) => {
    try {
      const params = { page, limit };
      if (assignmentId) params.assignmentId = assignmentId;
      if (userId) params.userId = userId;
      if (status) params.status = status;

      const response = await apiClient.get(`/submissions`, { params });
      return response.data.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to fetch submissions';
      return rejectWithValue(message);
    }
  }
);

// Get submission by ID
export const getSubmissionById = createAsyncThunk(
  'submission/getSubmissionById',
  async (submissionId, { rejectWithValue }) => {
    try {
      const response = await apiClient.get(`/submissions/${submissionId}`);
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to fetch submission';
      return rejectWithValue(message);
    }
  }
);

// Update submission
export const updateSubmission = createAsyncThunk(
  'submission/updateSubmission',
  async ({ submissionId, submissionData }, { rejectWithValue }) => {
    try {
      const response = await apiClient.put(`/submissions/${submissionId}`, submissionData);
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to update submission';
      return rejectWithValue(message);
    }
  }
);

// Delete submission
export const deleteSubmission = createAsyncThunk(
  'submission/deleteSubmission',
  async (submissionId, { rejectWithValue }) => {
    try {
      const response = await apiClient.delete(`/submissions/${submissionId}`);
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to delete submission';
      return rejectWithValue(message);
    }
  }
);

// Initial state
const initialState = {
  // Submissions list
  submissions: [],
  submissionsLoading: false,
  submissionsError: null,
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

  // Single submission
  currentSubmission: null,
  submissionLoading: false,
  submissionError: null,

  // Update submission
  updateSubmissionLoading: false,
  updateSubmissionError: null,
  updateSubmissionSuccess: false,

  // Delete submission
  deleteSubmissionLoading: false,
  deleteSubmissionError: null,
  deleteSubmissionSuccess: false,
};

// Submission slice
const submissionSlice = createSlice({
  name: 'submission',
  initialState,
  reducers: {
    // Clear errors
    clearSubmissionsError: (state) => {
      state.submissionsError = null;
    },
    clearSubmissionError: (state) => {
      state.submissionError = null;
    },
    clearUpdateSubmissionError: (state) => {
      state.updateSubmissionError = null;
      state.updateSubmissionSuccess = false;
    },
    clearDeleteSubmissionError: (state) => {
      state.deleteSubmissionError = null;
      state.deleteSubmissionSuccess = false;
    },
    // Reset states
    resetSubmissionStates: (state) => {
      state.currentSubmission = null;
      state.submissionLoading = false;
      state.submissionError = null;
    },
    resetUpdateSubmissionState: (state) => {
      state.updateSubmissionLoading = false;
      state.updateSubmissionError = null;
      state.updateSubmissionSuccess = false;
    },
    resetDeleteSubmissionState: (state) => {
      state.deleteSubmissionLoading = false;
      state.deleteSubmissionError = null;
      state.deleteSubmissionSuccess = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getAllSubmissions.pending, (state) => {
        state.submissionsLoading = true;
        state.submissionsError = null;
      })
      .addCase(getAllSubmissions.fulfilled, (state, action) => {
        state.submissionsLoading = false;
        state.submissions = action.payload.submissions;
        state.pagination = action.payload.pagination;
      })
      .addCase(getAllSubmissions.rejected, (state, action) => {
        state.submissionsLoading = false;
        state.submissionsError = action.payload;
      })
      .addCase(getSubmissionById.pending, (state) => {
        state.submissionLoading = true;
        state.submissionError = null;
      })
      .addCase(getSubmissionById.fulfilled, (state, action) => {
        state.submissionLoading = false;
        state.currentSubmission = action.payload;
      })
      .addCase(getSubmissionById.rejected, (state, action) => {
        state.submissionLoading = false;
        state.submissionError = action.payload;
      })
      .addCase(updateSubmission.pending, (state) => {
        state.updateSubmissionLoading = true;
        state.updateSubmissionError = null;
        state.updateSubmissionSuccess = false;
      })
      .addCase(updateSubmission.fulfilled, (state, action) => {
        state.updateSubmissionLoading = false;
        state.updateSubmissionSuccess = true;
        const index = state.submissions.findIndex(submission => submission._id === action.payload._id);
        if (index !== -1) {
          state.submissions[index] = action.payload;
        }
        if (state.currentSubmission && state.currentSubmission._id === action.payload._id) {
          state.currentSubmission = action.payload;
        }
      })
      .addCase(updateSubmission.rejected, (state, action) => {
        state.updateSubmissionLoading = false;
        state.updateSubmissionError = action.payload;
      })
      .addCase(deleteSubmission.pending, (state) => {
        state.deleteSubmissionLoading = true;
        state.deleteSubmissionError = null;
        state.deleteSubmissionSuccess = false;
      })
      .addCase(deleteSubmission.fulfilled, (state, action) => {
        state.deleteSubmissionLoading = false;
        state.deleteSubmissionSuccess = true;
        state.submissions = state.submissions.filter(submission => submission._id !== action.meta.arg);
      })
      .addCase(deleteSubmission.rejected, (state, action) => {
        state.deleteSubmissionLoading = false;
        state.deleteSubmissionError = action.payload;
      });
  },
});

// Export actions
export const {
  clearSubmissionsError,
  clearSubmissionError,
  clearUpdateSubmissionError,
  clearDeleteSubmissionError,
  resetSubmissionStates,
  resetUpdateSubmissionState,
  resetDeleteSubmissionState,
} = submissionSlice.actions;

// Export reducer
export default submissionSlice.reducer;

// Selectors
export const selectSubmissions = (state) => state.submission.submissions;
export const selectSubmissionsLoading = (state) => state.submission.submissionsLoading;
export const selectSubmissionsError = (state) => state.submission.submissionsError;
export const selectSubmissionPagination = (state) => state.submission.pagination;
export const selectCurrentSubmission = (state) => state.submission.currentSubmission;
export const selectSubmissionLoading = (state) => state.submission.submissionLoading;
export const selectSubmissionError = (state) => state.submission.submissionError;
export const selectUpdateSubmissionLoading = (state) => state.submission.updateSubmissionLoading;
export const selectUpdateSubmissionError = (state) => state.submission.updateSubmissionError;
export const selectUpdateSubmissionSuccess = (state) => state.submission.updateSubmissionSuccess;
export const selectDeleteSubmissionLoading = (state) => state.submission.deleteSubmissionLoading;
export const selectDeleteSubmissionError = (state) => state.submission.deleteSubmissionError;
export const selectDeleteSubmissionSuccess = (state) => state.submission.deleteSubmissionSuccess;