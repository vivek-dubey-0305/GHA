import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { apiClient } from '../../utils/api.utils.js';

// Async thunks for dashboard API calls

// Get dashboard overview
export const getDashboard = createAsyncThunk(
  'dashboard/getDashboard',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiClient.get(`/dashboard`);
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to fetch dashboard data';
      return rejectWithValue(message);
    }
  }
);

// Initial state
const initialState = {
  // Dashboard data
  dashboardData: null,
  dashboardLoading: false,
  dashboardError: null,
};

// Dashboard slice
const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState,
  reducers: {
    // Clear errors
    clearDashboardError: (state) => {
      state.dashboardError = null;
    },
    // Reset states
    resetDashboardState: (state) => {
      state.dashboardData = null;
      state.dashboardLoading = false;
      state.dashboardError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getDashboard.pending, (state) => {
        state.dashboardLoading = true;
        state.dashboardError = null;
      })
      .addCase(getDashboard.fulfilled, (state, action) => {
        state.dashboardLoading = false;
        state.dashboardData = action.payload;
      })
      .addCase(getDashboard.rejected, (state, action) => {
        state.dashboardLoading = false;
        state.dashboardError = action.payload;
      });
  },
});

// Export actions
export const {
  clearDashboardError,
  resetDashboardState,
} = dashboardSlice.actions;

// Export reducer
export default dashboardSlice.reducer;

// Selectors
export const selectDashboardData = (state) => state.dashboard.dashboardData;
export const selectDashboardLoading = (state) => state.dashboard.dashboardLoading;
export const selectDashboardError = (state) => state.dashboard.dashboardError;