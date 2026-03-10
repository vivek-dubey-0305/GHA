import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import apiClient from '../../utils/api.utils';

/* ── helpers ────────────────────────────────────────────── */
const reject = (error) =>
  error.response?.data?.message || error.message || 'Something went wrong';

/* ── thunks ─────────────────────────────────────────────── */

// List my live classes (paginated + filter)
export const getMyLiveClasses = createAsyncThunk(
  'liveclass/getMyLiveClasses',
  async ({ page = 1, limit = 10, status } = {}, { rejectWithValue }) => {
    try {
      const params = { page, limit };
      if (status) params.status = status;
      const { data } = await apiClient.get('/live-classes/my', { params });
      return data;
    } catch (e) { return rejectWithValue(reject(e)); }
  }
);

// Create a scheduled live class
export const createLiveClass = createAsyncThunk(
  'liveclass/createLiveClass',
  async (body, { rejectWithValue }) => {
    try {
      const { data } = await apiClient.post('/live-classes', body);
      return data;
    } catch (e) { return rejectWithValue(reject(e)); }
  }
);

// Create instant session
export const createInstantSession = createAsyncThunk(
  'liveclass/createInstantSession',
  async (body, { rejectWithValue }) => {
    try {
      const { data } = await apiClient.post('/live-classes/instant', body);
      return data;
    } catch (e) { return rejectWithValue(reject(e)); }
  }
);

// Update a live class
export const updateLiveClass = createAsyncThunk(
  'liveclass/updateLiveClass',
  async ({ id, body }, { rejectWithValue }) => {
    try {
      const { data } = await apiClient.put(`/live-classes/${id}`, body);
      return data;
    } catch (e) { return rejectWithValue(reject(e)); }
  }
);

// Delete a live class
export const deleteLiveClass = createAsyncThunk(
  'liveclass/deleteLiveClass',
  async (id, { rejectWithValue }) => {
    try {
      const { data } = await apiClient.delete(`/live-classes/${id}`);
      return { ...data, _deletedId: id };
    } catch (e) { return rejectWithValue(reject(e)); }
  }
);

// Start streaming
export const startLiveClass = createAsyncThunk(
  'liveclass/startLiveClass',
  async (id, { rejectWithValue }) => {
    try {
      const { data } = await apiClient.patch(`/live-classes/${id}/start`);
      return data;
    } catch (e) { return rejectWithValue(reject(e)); }
  }
);

// End streaming
export const endLiveClass = createAsyncThunk(
  'liveclass/endLiveClass',
  async (id, { rejectWithValue }) => {
    try {
      const { data } = await apiClient.patch(`/live-classes/${id}/end`);
      return data;
    } catch (e) { return rejectWithValue(reject(e)); }
  }
);

// Get stream credentials (RTMP url+key for OBS)
export const getStreamCredentials = createAsyncThunk(
  'liveclass/getStreamCredentials',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await apiClient.get('/live-classes/stream-credentials');
      return data;
    } catch (e) { return rejectWithValue(reject(e)); }
  }
);

// Get OBS auto-config payload
export const getObsConfig = createAsyncThunk(
  'liveclass/getObsConfig',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await apiClient.get('/live-classes/obs-config');
      return data;
    } catch (e) { return rejectWithValue(reject(e)); }
  }
);

// Get RTMP credentials for a specific session
export const getRtmpCredentials = createAsyncThunk(
  'liveclass/getRtmpCredentials',
  async (id, { rejectWithValue }) => {
    try {
      const { data } = await apiClient.get(`/live-classes/${id}/rtmp`);
      return data;
    } catch (e) { return rejectWithValue(reject(e)); }
  }
);

// Get recording status
export const getRecordingStatus = createAsyncThunk(
  'liveclass/getRecordingStatus',
  async (id, { rejectWithValue }) => {
    try {
      const { data } = await apiClient.get(`/live-classes/${id}/recording`);
      return data;
    } catch (e) { return rejectWithValue(reject(e)); }
  }
);

// Join as instructor (instructor-to-instructor or co-host)
export const joinAsInstructor = createAsyncThunk(
  'liveclass/joinAsInstructor',
  async (id, { rejectWithValue }) => {
    try {
      const { data } = await apiClient.post(`/live-classes/${id}/join-instructor`);
      return data;
    } catch (e) { return rejectWithValue(reject(e)); }
  }
);

// Get available instructors for instructor sessions
export const getAvailableInstructors = createAsyncThunk(
  'liveclass/getAvailableInstructors',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await apiClient.get('/live-classes/available-instructors');
      return data;
    } catch (e) { return rejectWithValue(reject(e)); }
  }
);

// Check OBS stream status for a session
export const checkStreamStatus = createAsyncThunk(
  'liveclass/checkStreamStatus',
  async (id, { rejectWithValue }) => {
    try {
      const { data } = await apiClient.get(`/live-classes/${id}/stream-status`);
      return data;
    } catch (e) { return rejectWithValue(reject(e)); }
  }
);

// Check instructor-level OBS connection (no session)
export const checkInstructorConnection = createAsyncThunk(
  'liveclass/checkInstructorConnection',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await apiClient.get('/live-classes/check-connection');
      return data;
    } catch (e) { return rejectWithValue(reject(e)); }
  }
);

// Get enrolled students for doubt session invite
export const getEnrolledStudents = createAsyncThunk(
  'liveclass/getEnrolledStudents',
  async (courseId, { rejectWithValue }) => {
    try {
      const { data } = await apiClient.get(`/live-classes/enrolled-students/${courseId}`);
      return data;
    } catch (e) { return rejectWithValue(reject(e)); }
  }
);

// Request admin business call
export const requestAdminCall = createAsyncThunk(
  'liveclass/requestAdminCall',
  async (body, { rejectWithValue }) => {
    try {
      const { data } = await apiClient.post('/live-classes/request-admin-call', body);
      return data;
    } catch (e) { return rejectWithValue(reject(e)); }
  }
);

/* ── state ──────────────────────────────────────────────── */
const initialState = {
  liveClasses: [],
  liveClassPagination: null,
  liveClassesLoading: false,
  liveClassesError: null,

  // mutations
  mutationLoading: false,
  mutationError: null,
  mutationSuccess: false,

  // stream credentials
  streamCredentials: null,
  streamCredentialsLoading: false,

  // OBS config
  obsConfig: null,
  obsConfigLoading: false,

  // signed playback (returned by joinAsInstructor)
  signedPlayback: null,

  // available instructors
  availableInstructors: [],

  // stream status polling
  streamStatus: null, // { connected, cfStatus, sessionStatus }
  streamStatusLoading: false,

  // enrolled students (for doubt sessions)
  enrolledStudents: [],
  enrolledStudentsLoading: false,

  // created session (returned from createInstantSession / createLiveClass)
  createdSession: null,
};

/* ── slice ──────────────────────────────────────────────── */
const liveclassSlice = createSlice({
  name: 'liveclass',
  initialState,
  reducers: {
    clearLiveClassesError: (state) => { state.liveClassesError = null; },
    clearMutationState: (state) => { state.mutationError = null; state.mutationSuccess = false; },
    clearSignedPlayback: (state) => { state.signedPlayback = null; },
    clearStreamStatus: (state) => { state.streamStatus = null; },
    clearEnrolledStudents: (state) => { state.enrolledStudents = []; },
    clearCreatedSession: (state) => { state.createdSession = null; },
    resetLiveClassState: () => initialState,
  },
  extraReducers: (builder) => {
    /* getMyLiveClasses */
    builder
      .addCase(getMyLiveClasses.pending, (state) => { state.liveClassesLoading = true; state.liveClassesError = null; })
      .addCase(getMyLiveClasses.fulfilled, (state, { payload }) => {
        state.liveClassesLoading = false;
        state.liveClasses = payload.data?.liveClasses || [];
        state.liveClassPagination = payload.data?.pagination || null;
      })
      .addCase(getMyLiveClasses.rejected, (state, { payload }) => { state.liveClassesLoading = false; state.liveClassesError = payload; });

    /* create / createInstant / update / start / end — all mutation-style */
    const mutationPending = (state) => { state.mutationLoading = true; state.mutationError = null; state.mutationSuccess = false; };
    const mutationRejected = (state, { payload }) => { state.mutationLoading = false; state.mutationError = payload; };

    [createLiveClass, createInstantSession, updateLiveClass, startLiveClass, endLiveClass, requestAdminCall].forEach((thunk) => {
      builder
        .addCase(thunk.pending, mutationPending)
        .addCase(thunk.fulfilled, (state, action) => {
          state.mutationLoading = false;
          state.mutationSuccess = true;
          // Capture created session data for navigation
          if (action.type.includes('createLiveClass') || action.type.includes('createInstantSession')) {
            state.createdSession = action.payload?.data?.liveClass || action.payload?.data || null;
          }
        })
        .addCase(thunk.rejected, mutationRejected);
    });

    /* delete — also remove from local list */
    builder
      .addCase(deleteLiveClass.pending, mutationPending)
      .addCase(deleteLiveClass.fulfilled, (state, { payload }) => {
        state.mutationLoading = false;
        state.mutationSuccess = true;
        state.liveClasses = state.liveClasses.filter((lc) => lc._id !== payload._deletedId);
      })
      .addCase(deleteLiveClass.rejected, mutationRejected);

    /* stream credentials */
    builder
      .addCase(getStreamCredentials.pending, (state) => { state.streamCredentialsLoading = true; })
      .addCase(getStreamCredentials.fulfilled, (state, { payload }) => { state.streamCredentialsLoading = false; state.streamCredentials = payload.data; })
      .addCase(getStreamCredentials.rejected, (state) => { state.streamCredentialsLoading = false; });

    /* OBS config */
    builder
      .addCase(getObsConfig.pending, (state) => { state.obsConfigLoading = true; })
      .addCase(getObsConfig.fulfilled, (state, { payload }) => { state.obsConfigLoading = false; state.obsConfig = payload.data; })
      .addCase(getObsConfig.rejected, (state) => { state.obsConfigLoading = false; });

    /* join as instructor — returns signed playback */
    builder
      .addCase(joinAsInstructor.fulfilled, (state, { payload }) => { state.signedPlayback = payload.data?.signedPlayback || null; });

    /* available instructors */
    builder
      .addCase(getAvailableInstructors.fulfilled, (state, { payload }) => { state.availableInstructors = payload.data?.instructors || []; });

    /* stream status polling */
    builder
      .addCase(checkStreamStatus.pending, (state) => { state.streamStatusLoading = true; })
      .addCase(checkStreamStatus.fulfilled, (state, { payload }) => {
        state.streamStatusLoading = false;
        state.streamStatus = payload.data || null;
      })
      .addCase(checkStreamStatus.rejected, (state) => { state.streamStatusLoading = false; });

    builder
      .addCase(checkInstructorConnection.fulfilled, (state, { payload }) => {
        state.streamStatus = payload.data || null;
      });

    /* enrolled students */
    builder
      .addCase(getEnrolledStudents.pending, (state) => { state.enrolledStudentsLoading = true; })
      .addCase(getEnrolledStudents.fulfilled, (state, { payload }) => {
        state.enrolledStudentsLoading = false;
        state.enrolledStudents = payload.data?.students || [];
      })
      .addCase(getEnrolledStudents.rejected, (state) => { state.enrolledStudentsLoading = false; });
  },
});

export const { clearLiveClassesError, clearMutationState, clearSignedPlayback, clearStreamStatus, clearEnrolledStudents, clearCreatedSession, resetLiveClassState } = liveclassSlice.actions;
export default liveclassSlice.reducer;

/* ── selectors ──────────────────────────────────────────── */
export const selectLiveClasses = (s) => s.liveclass.liveClasses;
export const selectLiveClassPagination = (s) => s.liveclass.liveClassPagination;
export const selectLiveClassesLoading = (s) => s.liveclass.liveClassesLoading;
export const selectLiveClassesError = (s) => s.liveclass.liveClassesError;

export const selectMutationLoading = (s) => s.liveclass.mutationLoading;
export const selectMutationError = (s) => s.liveclass.mutationError;
export const selectMutationSuccess = (s) => s.liveclass.mutationSuccess;

export const selectStreamCredentials = (s) => s.liveclass.streamCredentials;
export const selectStreamCredentialsLoading = (s) => s.liveclass.streamCredentialsLoading;
export const selectObsConfig = (s) => s.liveclass.obsConfig;
export const selectObsConfigLoading = (s) => s.liveclass.obsConfigLoading;
export const selectSignedPlayback = (s) => s.liveclass.signedPlayback;
export const selectAvailableInstructors = (s) => s.liveclass.availableInstructors;
export const selectStreamStatus = (s) => s.liveclass.streamStatus;
export const selectStreamStatusLoading = (s) => s.liveclass.streamStatusLoading;
export const selectEnrolledStudents = (s) => s.liveclass.enrolledStudents;
export const selectEnrolledStudentsLoading = (s) => s.liveclass.enrolledStudentsLoading;
export const selectCreatedSession = (s) => s.liveclass.createdSession;
