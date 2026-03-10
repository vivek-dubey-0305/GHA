import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { apiClient } from '../../utils/api.utils.js';

// ═══════════════════════════════════════════
// ASYNC THUNKS — Admin Live Class API
// ═══════════════════════════════════════════

// Get all live classes (admin view with filters)
export const getAllLiveClasses = createAsyncThunk(
  'liveclass/getAllLiveClasses',
  async ({ page = 1, limit = 20, instructorId, courseId, status, sessionType } = {}, { rejectWithValue }) => {
    try {
      const params = { page, limit };
      if (instructorId) params.instructorId = instructorId;
      if (courseId) params.courseId = courseId;
      if (status) params.status = status;
      if (sessionType) params.sessionType = sessionType;

      const response = await apiClient.get(`/live-classes/admin/all`, { params });
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch live classes');
    }
  }
);

// Get live class by ID (admin detail view)
export const getLiveClassById = createAsyncThunk(
  'liveclass/getLiveClassById',
  async (liveClassId, { rejectWithValue }) => {
    try {
      const response = await apiClient.get(`/live-classes/admin/${liveClassId}`);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch live class');
    }
  }
);

// Create live class by admin
export const createLiveClass = createAsyncThunk(
  'liveclass/createLiveClass',
  async (liveClassData, { rejectWithValue }) => {
    try {
      const response = await apiClient.post(`/live-classes/admin`, liveClassData);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create live class');
    }
  }
);

// Update live class (admin)
export const updateLiveClass = createAsyncThunk(
  'liveclass/updateLiveClass',
  async ({ liveClassId, liveClassData }, { rejectWithValue }) => {
    try {
      const response = await apiClient.put(`/live-classes/admin/${liveClassId}`, liveClassData);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update live class');
    }
  }
);

// Delete live class (admin)
export const deleteLiveClass = createAsyncThunk(
  'liveclass/deleteLiveClass',
  async (liveClassId, { rejectWithValue }) => {
    try {
      await apiClient.delete(`/live-classes/admin/${liveClassId}`);
      return liveClassId;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete live class');
    }
  }
);

// End live class (admin force-end)
export const endLiveClass = createAsyncThunk(
  'liveclass/endLiveClass',
  async (liveClassId, { rejectWithValue }) => {
    try {
      const response = await apiClient.patch(`/live-classes/admin/${liveClassId}/end`);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to end live class');
    }
  }
);

// Cancel live class (admin)
export const cancelLiveClass = createAsyncThunk(
  'liveclass/cancelLiveClass',
  async ({ liveClassId, reason }, { rejectWithValue }) => {
    try {
      const response = await apiClient.patch(`/live-classes/admin/${liveClassId}/cancel`, { reason });
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to cancel live class');
    }
  }
);

// Join live class as admin (get signed playback)
export const joinLiveClassAdmin = createAsyncThunk(
  'liveclass/joinLiveClassAdmin',
  async (liveClassId, { rejectWithValue }) => {
    try {
      const response = await apiClient.post(`/live-classes/admin/${liveClassId}/join`);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to join live class');
    }
  }
);

// Get live class stats (admin dashboard)
export const getLiveClassStats = createAsyncThunk(
  'liveclass/getLiveClassStats',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiClient.get(`/live-classes/admin/stats`);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch stats');
    }
  }
);

// Get participants list
export const getParticipants = createAsyncThunk(
  'liveclass/getParticipants',
  async (liveClassId, { rejectWithValue }) => {
    try {
      const response = await apiClient.get(`/live-classes/admin/${liveClassId}/participants`);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch participants');
    }
  }
);

// ═══════════════════════════════════════════
// STATE & SLICE
// ═══════════════════════════════════════════

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
    prevPage: null,
  },

  // Single live class
  currentLiveClass: null,
  liveClassLoading: false,
  liveClassError: null,

  // Create live class
  createLiveClassLoading: false,
  createLiveClassError: null,
  createLiveClassSuccess: false,

  // Update live class
  updateLiveClassLoading: false,
  updateLiveClassError: null,
  updateLiveClassSuccess: false,

  // Delete live class
  deleteLiveClassLoading: false,
  deleteLiveClassError: null,
  deleteLiveClassSuccess: false,

  // Stats
  liveClassStats: null,
  statsLoading: false,

  // Playback (from join)
  signedPlayback: null,

  // Participants
  participants: null,
};

const liveClassSlice = createSlice({
  name: 'liveclass',
  initialState,
  reducers: {
    clearLiveClassesError: (state) => { state.liveClassesError = null; },
    clearLiveClassError: (state) => { state.liveClassError = null; },
    clearCreateLiveClassError: (state) => {
      state.createLiveClassError = null;
      state.createLiveClassSuccess = false;
    },
    clearUpdateLiveClassError: (state) => {
      state.updateLiveClassError = null;
      state.updateLiveClassSuccess = false;
    },
    clearDeleteLiveClassError: (state) => {
      state.deleteLiveClassError = null;
      state.deleteLiveClassSuccess = false;
    },
    resetLiveClassStates: (state) => {
      state.currentLiveClass = null;
      state.liveClassLoading = false;
      state.liveClassError = null;
      state.signedPlayback = null;
      state.participants = null;
    },
    resetCreateLiveClassState: (state) => {
      state.createLiveClassLoading = false;
      state.createLiveClassError = null;
      state.createLiveClassSuccess = false;
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
      // GET ALL
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
      // GET BY ID
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
      // CREATE
      .addCase(createLiveClass.pending, (state) => {
        state.createLiveClassLoading = true;
        state.createLiveClassError = null;
        state.createLiveClassSuccess = false;
      })
      .addCase(createLiveClass.fulfilled, (state, action) => {
        state.createLiveClassLoading = false;
        state.createLiveClassSuccess = true;
        state.liveClasses.unshift(action.payload);
      })
      .addCase(createLiveClass.rejected, (state, action) => {
        state.createLiveClassLoading = false;
        state.createLiveClassError = action.payload;
      })
      // UPDATE
      .addCase(updateLiveClass.pending, (state) => {
        state.updateLiveClassLoading = true;
        state.updateLiveClassError = null;
        state.updateLiveClassSuccess = false;
      })
      .addCase(updateLiveClass.fulfilled, (state, action) => {
        state.updateLiveClassLoading = false;
        state.updateLiveClassSuccess = true;
        const index = state.liveClasses.findIndex(lc => lc._id === action.payload._id);
        if (index !== -1) state.liveClasses[index] = action.payload;
        if (state.currentLiveClass?._id === action.payload._id) {
          state.currentLiveClass = action.payload;
        }
      })
      .addCase(updateLiveClass.rejected, (state, action) => {
        state.updateLiveClassLoading = false;
        state.updateLiveClassError = action.payload;
      })
      // DELETE
      .addCase(deleteLiveClass.pending, (state) => {
        state.deleteLiveClassLoading = true;
        state.deleteLiveClassError = null;
        state.deleteLiveClassSuccess = false;
      })
      .addCase(deleteLiveClass.fulfilled, (state, action) => {
        state.deleteLiveClassLoading = false;
        state.deleteLiveClassSuccess = true;
        state.liveClasses = state.liveClasses.filter(lc => lc._id !== action.payload);
      })
      .addCase(deleteLiveClass.rejected, (state, action) => {
        state.deleteLiveClassLoading = false;
        state.deleteLiveClassError = action.payload;
      })
      // END
      .addCase(endLiveClass.fulfilled, (state, action) => {
        const index = state.liveClasses.findIndex(lc => lc._id === action.payload._id);
        if (index !== -1) state.liveClasses[index] = action.payload;
        if (state.currentLiveClass?._id === action.payload._id) {
          state.currentLiveClass = action.payload;
        }
      })
      // CANCEL
      .addCase(cancelLiveClass.fulfilled, (state, action) => {
        const index = state.liveClasses.findIndex(lc => lc._id === action.payload._id);
        if (index !== -1) state.liveClasses[index] = action.payload;
        if (state.currentLiveClass?._id === action.payload._id) {
          state.currentLiveClass = action.payload;
        }
      })
      // JOIN (signed playback)
      .addCase(joinLiveClassAdmin.fulfilled, (state, action) => {
        state.signedPlayback = action.payload.signedPlayback;
      })
      // STATS
      .addCase(getLiveClassStats.pending, (state) => { state.statsLoading = true; })
      .addCase(getLiveClassStats.fulfilled, (state, action) => {
        state.statsLoading = false;
        state.liveClassStats = action.payload;
      })
      .addCase(getLiveClassStats.rejected, (state) => { state.statsLoading = false; })
      // PARTICIPANTS
      .addCase(getParticipants.fulfilled, (state, action) => {
        state.participants = action.payload;
      });
  },
});

export const {
  clearLiveClassesError,
  clearLiveClassError,
  clearCreateLiveClassError,
  clearUpdateLiveClassError,
  clearDeleteLiveClassError,
  resetLiveClassStates,
  resetCreateLiveClassState,
  resetUpdateLiveClassState,
  resetDeleteLiveClassState,
} = liveClassSlice.actions;

export default liveClassSlice.reducer;

// Selectors
export const selectLiveClasses = (state) => state.liveclass.liveClasses;
export const selectLiveClassesLoading = (state) => state.liveclass.liveClassesLoading;
export const selectLiveClassesError = (state) => state.liveclass.liveClassesError;
export const selectLiveClassPagination = (state) => state.liveclass.pagination;
export const selectCurrentLiveClass = (state) => state.liveclass.currentLiveClass;
export const selectLiveClassLoading = (state) => state.liveclass.liveClassLoading;
export const selectLiveClassError = (state) => state.liveclass.liveClassError;
export const selectCreateLiveClassLoading = (state) => state.liveclass.createLiveClassLoading;
export const selectCreateLiveClassError = (state) => state.liveclass.createLiveClassError;
export const selectCreateLiveClassSuccess = (state) => state.liveclass.createLiveClassSuccess;
export const selectUpdateLiveClassLoading = (state) => state.liveclass.updateLiveClassLoading;
export const selectUpdateLiveClassError = (state) => state.liveclass.updateLiveClassError;
export const selectUpdateLiveClassSuccess = (state) => state.liveclass.updateLiveClassSuccess;
export const selectDeleteLiveClassLoading = (state) => state.liveclass.deleteLiveClassLoading;
export const selectDeleteLiveClassError = (state) => state.liveclass.deleteLiveClassError;
export const selectDeleteLiveClassSuccess = (state) => state.liveclass.deleteLiveClassSuccess;
export const selectLiveClassStats = (state) => state.liveclass.liveClassStats;
export const selectStatsLoading = (state) => state.liveclass.statsLoading;
export const selectSignedPlayback = (state) => state.liveclass.signedPlayback;
export const selectParticipants = (state) => state.liveclass.participants;