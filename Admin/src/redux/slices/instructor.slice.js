import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { apiClient } from '../../utils/api.utils.js';

// Async thunks for instructor management API calls

// Get all instructors with pagination
export const getAllInstructors = createAsyncThunk(
  'instructor/getAllInstructors',
  async ({ page = 1, limit = 10, status, isActive, search } = {}, { rejectWithValue }) => {
    try {
      const params = { page, limit };
      if (status) params.status = status;
      if (isActive !== undefined) params.isActive = isActive;
      if (search) params.search = search;

      const response = await apiClient.get(`/instructors`, { params });
      return response.data.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to fetch instructors';
      return rejectWithValue(message);
    }
  }
);

// Get instructor by ID
export const getInstructorById = createAsyncThunk(
  'instructor/getInstructorById',
  async (instructorId, { rejectWithValue }) => {
    try {
      const response = await apiClient.get(`/instructors/${instructorId}`);
      return response.data.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to fetch instructor';
      return rejectWithValue(message);
    }
  }
);

// Create new instructor
export const createInstructor = createAsyncThunk(
  'instructor/createInstructor',
  async (instructorData, { rejectWithValue }) => {
    try {
      const response = await apiClient.post(`/instructors`, instructorData);
      return response.data.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to create instructor';
      return rejectWithValue(message);
    }
  }
);

// Update instructor
export const updateInstructor = createAsyncThunk(
  'instructor/updateInstructor',
  async ({ instructorId, instructorData }, { rejectWithValue }) => {
    try {
      const response = await apiClient.put(`/instructors/${instructorId}`, instructorData);
      return response.data.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to update instructor';
      return rejectWithValue(message);
    }
  }
);

// Delete instructor
export const deleteInstructor = createAsyncThunk(
  'instructor/deleteInstructor',
  async (instructorId, { rejectWithValue }) => {
    try {
      const response = await apiClient.delete(`/instructors/${instructorId}`);
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to delete instructor';
      return rejectWithValue(message);
    }
  }
);

// Delete instructor profile picture
export const deleteInstructorProfilePicture = createAsyncThunk(
  'instructor/deleteInstructorProfilePicture',
  async (instructorId, { rejectWithValue }) => {
    try {
      const response = await apiClient.delete(`/instructors/${instructorId}/profile-picture`);
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to delete instructor profile picture';
      return rejectWithValue(message);
    }
  }
);

// Initial state
const initialState = {
  // Instructors list
  instructors: [],
  instructorsLoading: false,
  instructorsError: null,
  pagination: {
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10,
    hasNextPage: false,
    hasPrevPage: false,
    nextPage: null,
    prevPage: null
  },

  // Single instructor
  currentInstructor: null,
  instructorLoading: false,
  instructorError: null,

  // Create instructor
  createInstructorLoading: false,
  createInstructorError: null,
  createInstructorSuccess: false,

  // Update instructor
  updateInstructorLoading: false,
  updateInstructorError: null,
  updateInstructorSuccess: false,

  // Delete instructor
  deleteInstructorLoading: false,
  deleteInstructorError: null,
  deleteInstructorSuccess: false,

  // Profile picture operations
  deleteProfilePictureLoading: false,
  deleteProfilePictureError: null,
  deleteProfilePictureSuccess: false,
};

// Instructor slice
const instructorSlice = createSlice({
  name: 'instructor',
  initialState,
  reducers: {
    // Clear errors
    clearInstructorsError: (state) => {
      state.instructorsError = null;
    },
    clearInstructorError: (state) => {
      state.instructorError = null;
    },
    clearCreateInstructorError: (state) => {
      state.createInstructorError = null;
      state.createInstructorSuccess = false;
    },
    clearUpdateInstructorError: (state) => {
      state.updateInstructorError = null;
      state.updateInstructorSuccess = false;
    },
    clearDeleteInstructorError: (state) => {
      state.deleteInstructorError = null;
      state.deleteInstructorSuccess = false;
    },
    clearDeleteProfilePictureError: (state) => {
      state.deleteProfilePictureError = null;
      state.deleteProfilePictureSuccess = false;
    },
    // Reset states
    resetInstructorStates: (state) => {
      state.currentInstructor = null;
      state.instructorLoading = false;
      state.instructorError = null;
    },
    resetCreateInstructorState: (state) => {
      state.createInstructorLoading = false;
      state.createInstructorError = null;
      state.createInstructorSuccess = false;
    },
    resetUpdateInstructorState: (state) => {
      state.updateInstructorLoading = false;
      state.updateInstructorError = null;
      state.updateInstructorSuccess = false;
    },
    resetDeleteInstructorState: (state) => {
      state.deleteInstructorLoading = false;
      state.deleteInstructorError = null;
      state.deleteInstructorSuccess = false;
    },
    resetProfilePictureStates: (state) => {
      state.deleteProfilePictureLoading = false;
      state.deleteProfilePictureError = null;
      state.deleteProfilePictureSuccess = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getAllInstructors.pending, (state) => {
        state.instructorsLoading = true;
        state.instructorsError = null;
      })
      .addCase(getAllInstructors.fulfilled, (state, action) => {
        state.instructorsLoading = false;
        state.instructors = action.payload.instructors;
        state.pagination = action.payload.pagination;
      })
      .addCase(getAllInstructors.rejected, (state, action) => {
        state.instructorsLoading = false;
        state.instructorsError = action.payload;
      })
      .addCase(getInstructorById.pending, (state) => {
        state.instructorLoading = true;
        state.instructorError = null;
      })
      .addCase(getInstructorById.fulfilled, (state, action) => {
        state.instructorLoading = false;
        state.currentInstructor = action.payload;
      })
      .addCase(getInstructorById.rejected, (state, action) => {
        state.instructorLoading = false;
        state.instructorError = action.payload;
      })
      .addCase(createInstructor.pending, (state) => {
        state.createInstructorLoading = true;
        state.createInstructorError = null;
        state.createInstructorSuccess = false;
      })
      .addCase(createInstructor.fulfilled, (state, action) => {
        state.createInstructorLoading = false;
        state.createInstructorSuccess = true;
        state.instructors.push(action.payload);
      })
      .addCase(createInstructor.rejected, (state, action) => {
        state.createInstructorLoading = false;
        state.createInstructorError = action.payload;
      })
      .addCase(updateInstructor.pending, (state) => {
        state.updateInstructorLoading = true;
        state.updateInstructorError = null;
        state.updateInstructorSuccess = false;
      })
      .addCase(updateInstructor.fulfilled, (state, action) => {
        state.updateInstructorLoading = false;
        state.updateInstructorSuccess = true;
        const index = state.instructors.findIndex(inst => inst._id === action.payload._id);
        if (index !== -1) {
          state.instructors[index] = action.payload;
        }
        if (state.currentInstructor && state.currentInstructor._id === action.payload._id) {
          state.currentInstructor = action.payload;
        }
      })
      .addCase(updateInstructor.rejected, (state, action) => {
        state.updateInstructorLoading = false;
        state.updateInstructorError = action.payload;
      })
      .addCase(deleteInstructor.pending, (state) => {
        state.deleteInstructorLoading = true;
        state.deleteInstructorError = null;
        state.deleteInstructorSuccess = false;
      })
      .addCase(deleteInstructor.fulfilled, (state, action) => {
        state.deleteInstructorLoading = false;
        state.deleteInstructorSuccess = true;
        state.instructors = state.instructors.filter(inst => inst._id !== action.meta.arg);
      })
      .addCase(deleteInstructor.rejected, (state, action) => {
        state.deleteInstructorLoading = false;
        state.deleteInstructorError = action.payload;
      })
      .addCase(deleteInstructorProfilePicture.pending, (state) => {
        state.deleteProfilePictureLoading = true;
        state.deleteProfilePictureError = null;
        state.deleteProfilePictureSuccess = false;
      })
      .addCase(deleteInstructorProfilePicture.fulfilled, (state, action) => {
        state.deleteProfilePictureLoading = false;
        state.deleteProfilePictureSuccess = true;
        if (state.currentInstructor) {
          state.currentInstructor.profilePicture = null;
        }
      })
      .addCase(deleteInstructorProfilePicture.rejected, (state, action) => {
        state.deleteProfilePictureLoading = false;
        state.deleteProfilePictureError = action.payload;
      });
  },
});

// Export actions
export const {
  clearInstructorsError,
  clearInstructorError,
  clearCreateInstructorError,
  clearUpdateInstructorError,
  clearDeleteInstructorError,
  clearDeleteProfilePictureError,
  resetInstructorStates,
  resetCreateInstructorState,
  resetUpdateInstructorState,
  resetDeleteInstructorState,
  resetProfilePictureStates,
} = instructorSlice.actions;

// Export reducer
export default instructorSlice.reducer;

// Selectors
export const selectInstructors = (state) => state.instructor.instructors;
export const selectInstructorsLoading = (state) => state.instructor.instructorsLoading;
export const selectInstructorsError = (state) => state.instructor.instructorsError;
export const selectInstructorPagination = (state) => state.instructor.pagination;
export const selectCurrentInstructor = (state) => state.instructor.currentInstructor;
export const selectInstructorLoading = (state) => state.instructor.instructorLoading;
export const selectInstructorError = (state) => state.instructor.instructorError;
export const selectCreateInstructorLoading = (state) => state.instructor.createInstructorLoading;
export const selectCreateInstructorError = (state) => state.instructor.createInstructorError;
export const selectCreateInstructorSuccess = (state) => state.instructor.createInstructorSuccess;
export const selectUpdateInstructorLoading = (state) => state.instructor.updateInstructorLoading;
export const selectUpdateInstructorError = (state) => state.instructor.updateInstructorError;
export const selectUpdateInstructorSuccess = (state) => state.instructor.updateInstructorSuccess;
export const selectDeleteInstructorLoading = (state) => state.instructor.deleteInstructorLoading;
export const selectDeleteInstructorError = (state) => state.instructor.deleteInstructorError;
export const selectDeleteInstructorSuccess = (state) => state.instructor.deleteInstructorSuccess;
export const selectDeleteProfilePictureLoading = (state) => state.instructor.deleteProfilePictureLoading;
export const selectDeleteProfilePictureError = (state) => state.instructor.deleteProfilePictureError;
export const selectDeleteProfilePictureSuccess = (state) => state.instructor.deleteProfilePictureSuccess;