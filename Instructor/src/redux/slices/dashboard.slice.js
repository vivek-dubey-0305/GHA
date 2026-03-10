import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import apiClient from '../../utils/api.utils';

// Get instructor dashboard stats
export const getDashboard = createAsyncThunk(
  'dashboard/getDashboard',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiClient.get('/instructor/dashboard');
      console.log("response")
      return response.data;
    } catch (error) {
      console.log("response", error)

      const message = error.response?.data?.message || error.message || 'Failed to fetch dashboard data';

      return rejectWithValue(message);
    }
  }
);

const initialState = {
  dashboardData: null,
  dashboardLoading: false,
  dashboardError: null,
};

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState,
  reducers: {
    clearDashboardError: (state) => {
      state.dashboardError = null;
    },
    resetDashboardState: () => initialState,
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

export const { clearDashboardError, resetDashboardState } = dashboardSlice.actions;
export default dashboardSlice.reducer;

export const selectDashboardData = (state) => state.dashboard.dashboardData;
export const selectDashboardLoading = (state) => state.dashboard.dashboardLoading;
export const selectDashboardError = (state) => state.dashboard.dashboardError;
