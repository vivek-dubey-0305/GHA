// src/redux/slices/enrollment.slice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { apiClient } from '../../utils/api.utils.js';

export const checkEnrollment = createAsyncThunk(
  'enrollment/checkEnrollment',
  async (courseId, { rejectWithValue }) => {
    try {
      const response = await apiClient.get(`/enrollments/check/${courseId}`);
      console.info('[enrollment] checkEnrollment:success', {
        courseId,
        isEnrolled: response?.data?.data?.isEnrolled,
      });
      return { courseId, payload: response.data };
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to check enrollment';
      console.error('[enrollment] checkEnrollment:error', { message, courseId });
      return rejectWithValue(message);
    }
  }
);

export const enrollInCourse = createAsyncThunk(
  'enrollment/enrollInCourse',
  async ({ courseId, paymentId }, { rejectWithValue }) => {
    try {
      const response = await apiClient.post('/enrollments', { courseId, paymentId });
      console.info('[enrollment] enrollInCourse:success', {
        courseId,
        enrollmentId: response?.data?.data?._id,
      });
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to enroll in course';
      console.error('[enrollment] enrollInCourse:error', { message, courseId, paymentId });
      return rejectWithValue(message);
    }
  }
);

export const getEnrollmentById = createAsyncThunk(
  'enrollment/getEnrollmentById',
  async (enrollmentId, { rejectWithValue }) => {
    try {
      const response = await apiClient.get(`/enrollments/${enrollmentId}`);
      console.info('[enrollment] getEnrollmentById:success', { enrollmentId });
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to fetch enrollment details';
      console.error('[enrollment] getEnrollmentById:error', { message, enrollmentId });
      return rejectWithValue(message);
    }
  }
);

export const requestEnrollmentRefund = createAsyncThunk(
  'enrollment/requestEnrollmentRefund',
  async ({ enrollmentId, reason }, { rejectWithValue }) => {
    try {
      const response = await apiClient.post(`/enrollments/${enrollmentId}/refund`, { reason });
      console.info('[enrollment] requestEnrollmentRefund:success', { enrollmentId });
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to request enrollment refund';
      console.error('[enrollment] requestEnrollmentRefund:error', { message, enrollmentId });
      return rejectWithValue(message);
    }
  }
);

const enrollmentSlice = createSlice({
  name: 'enrollment',
  initialState: {
    enrollmentByCourse: {},
    currentEnrollment: null,
    loading: false,
    error: null,
  },
  reducers: {
    clearEnrollmentError: (state) => {
      state.error = null;
    },
    clearCurrentEnrollment: (state) => {
      state.currentEnrollment = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(checkEnrollment.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(checkEnrollment.fulfilled, (state, action) => {
        state.loading = false;
        const courseId = action.payload.courseId;
        state.enrollmentByCourse[courseId] = action.payload.payload?.data?.isEnrolled || false;
      })
      .addCase(checkEnrollment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(enrollInCourse.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(enrollInCourse.fulfilled, (state, action) => {
        state.loading = false;
        state.currentEnrollment = action.payload?.data || null;
        const courseId = action.payload?.data?.course;
        if (courseId) {
          state.enrollmentByCourse[String(courseId)] = true;
        }
      })
      .addCase(enrollInCourse.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(getEnrollmentById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getEnrollmentById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentEnrollment = action.payload?.data || null;
      })
      .addCase(getEnrollmentById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(requestEnrollmentRefund.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(requestEnrollmentRefund.fulfilled, (state, action) => {
        state.loading = false;
        state.currentEnrollment = action.payload?.data || state.currentEnrollment;
      })
      .addCase(requestEnrollmentRefund.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearEnrollmentError, clearCurrentEnrollment } = enrollmentSlice.actions;

export default enrollmentSlice.reducer;
