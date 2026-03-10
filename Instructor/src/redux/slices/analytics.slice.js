import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import apiClient from '../../utils/api.utils';

export const getAnalyticsOverview = createAsyncThunk(
  'analytics/getOverview',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiClient.get('/analytics/instructor/overview');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch analytics');
    }
  }
);

export const getEnrollmentTrends = createAsyncThunk(
  'analytics/getEnrollmentTrends',
  async (period = '30d', { rejectWithValue }) => {
    try {
      const response = await apiClient.get('/analytics/instructor/enrollments', { params: { period } });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch enrollment trends');
    }
  }
);

export const getRevenueTrends = createAsyncThunk(
  'analytics/getRevenueTrends',
  async (period = '30d', { rejectWithValue }) => {
    try {
      const response = await apiClient.get('/analytics/instructor/revenue', { params: { period } });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch revenue trends');
    }
  }
);

export const getCourseAnalytics = createAsyncThunk(
  'analytics/getCourseAnalytics',
  async (courseId, { rejectWithValue }) => {
    try {
      const response = await apiClient.get(`/analytics/instructor/course/${courseId}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch course analytics');
    }
  }
);

const analyticsSlice = createSlice({
  name: 'analytics',
  initialState: {
    overview: null,
    enrollmentTrends: [],
    revenueTrends: [],
    courseAnalytics: null,
    loading: false,
    error: null,
  },
  reducers: {
    clearAnalyticsError: (state) => { state.error = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getAnalyticsOverview.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(getAnalyticsOverview.fulfilled, (state, action) => {
        state.loading = false;
        state.overview = action.payload.data;
      })
      .addCase(getAnalyticsOverview.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      .addCase(getEnrollmentTrends.fulfilled, (state, action) => {
        state.enrollmentTrends = action.payload.data?.trends || [];
      })
      .addCase(getRevenueTrends.fulfilled, (state, action) => {
        state.revenueTrends = action.payload.data?.trends || [];
      })
      .addCase(getCourseAnalytics.pending, (state) => { state.loading = true; })
      .addCase(getCourseAnalytics.fulfilled, (state, action) => {
        state.loading = false;
        state.courseAnalytics = action.payload.data;
      })
      .addCase(getCourseAnalytics.rejected, (state, action) => { state.loading = false; state.error = action.payload; });
  },
});

export const { clearAnalyticsError } = analyticsSlice.actions;
export default analyticsSlice.reducer;
