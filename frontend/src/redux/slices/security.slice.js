import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { securityService } from "../../services/security.service.js";

const getErrorMessage = (error, fallback) => error.response?.data?.message || error.message || fallback;

export const fetchUserSessions = createAsyncThunk(
  "security/fetchUserSessions",
  async (_, { rejectWithValue }) => {
    try {
      return await securityService.getSessions();
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, "Failed to fetch sessions."));
    }
  }
);

export const revokeUserSession = createAsyncThunk(
  "security/revokeUserSession",
  async (sessionId, { rejectWithValue }) => {
    try {
      await securityService.revokeSession(sessionId);
      return sessionId;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, "Failed to revoke session."));
    }
  }
);

export const revokeAllOtherSessions = createAsyncThunk(
  "security/revokeAllOtherSessions",
  async (_, { rejectWithValue }) => {
    try {
      return await securityService.logoutAllOtherSessions();
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, "Failed to logout all other sessions."));
    }
  }
);

export const submitChangePassword = createAsyncThunk(
  "security/submitChangePassword",
  async (payload, { rejectWithValue }) => {
    try {
      return await securityService.changePassword(payload);
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, "Failed to change password."));
    }
  }
);

const initialState = {
  sessions: [],
  sessionsLoading: false,
  sessionsError: null,

  revokeSessionLoading: false,
  revokeSessionError: null,

  revokeAllLoading: false,
  revokeAllError: null,

  changePasswordLoading: false,
  changePasswordError: null,
  changePasswordSuccess: false,
};

const securitySlice = createSlice({
  name: "security",
  initialState,
  reducers: {
    clearSecurityStatus: (state) => {
      state.sessionsError = null;
      state.revokeSessionError = null;
      state.revokeAllError = null;
      state.changePasswordError = null;
      state.changePasswordSuccess = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUserSessions.pending, (state) => {
        state.sessionsLoading = true;
        state.sessionsError = null;
      })
      .addCase(fetchUserSessions.fulfilled, (state, action) => {
        state.sessionsLoading = false;
        state.sessions = action.payload;
      })
      .addCase(fetchUserSessions.rejected, (state, action) => {
        state.sessionsLoading = false;
        state.sessionsError = action.payload;
      })
      .addCase(revokeUserSession.pending, (state) => {
        state.revokeSessionLoading = true;
        state.revokeSessionError = null;
      })
      .addCase(revokeUserSession.fulfilled, (state, action) => {
        state.revokeSessionLoading = false;
        state.sessions = state.sessions.filter((session) => String(session.id) !== String(action.payload));
      })
      .addCase(revokeUserSession.rejected, (state, action) => {
        state.revokeSessionLoading = false;
        state.revokeSessionError = action.payload;
      })
      .addCase(revokeAllOtherSessions.pending, (state) => {
        state.revokeAllLoading = true;
        state.revokeAllError = null;
      })
      .addCase(revokeAllOtherSessions.fulfilled, (state) => {
        state.revokeAllLoading = false;
      })
      .addCase(revokeAllOtherSessions.rejected, (state, action) => {
        state.revokeAllLoading = false;
        state.revokeAllError = action.payload;
      })
      .addCase(submitChangePassword.pending, (state) => {
        state.changePasswordLoading = true;
        state.changePasswordError = null;
        state.changePasswordSuccess = false;
      })
      .addCase(submitChangePassword.fulfilled, (state) => {
        state.changePasswordLoading = false;
        state.changePasswordSuccess = true;
      })
      .addCase(submitChangePassword.rejected, (state, action) => {
        state.changePasswordLoading = false;
        state.changePasswordError = action.payload;
      });
  },
});

export const { clearSecurityStatus } = securitySlice.actions;

export const selectSecurityState = (state) => state.security;
export const selectSessions = (state) => state.security.sessions;

export default securitySlice.reducer;
