// src/redux/slices/enrollment.slice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { apiClient } from '../../utils/api.utils.js';

export const checkEnrollment = createAsyncThunk(
  'enrollment/checkEnrollment',
  async (courseId, { rejectWithValue }) => {
    try {
      const response = await apiClient.get(`/enrollments/check/${courseId}`);
      return { courseId, payload: response.data };
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to check enrollment';
      return rejectWithValue(message);
    }
  }
);

export const enrollInCourse = createAsyncThunk(
  'enrollment/enrollInCourse',
  async ({ courseId, paymentId }, { rejectWithValue }) => {
    try {
      const response = await apiClient.post('/enrollments', { courseId, paymentId });
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to enroll in course';
      return rejectWithValue(message);
    }
  }
);

export const getEnrollmentById = createAsyncThunk(
  'enrollment/getEnrollmentById',
  async (enrollmentId, { rejectWithValue }) => {
    try {
      const response = await apiClient.get(`/enrollments/${enrollmentId}`);
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to fetch enrollment details';
      return rejectWithValue(message);
    }
  }
);

export const requestEnrollmentRefund = createAsyncThunk(
  'enrollment/requestEnrollmentRefund',
  async ({ enrollmentId, reason }, { rejectWithValue }) => {
    try {
      const response = await apiClient.post(`/enrollments/${enrollmentId}/refund`, { reason });
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to request enrollment refund';
      return rejectWithValue(message);
    }
  }
);

export const getMyEnrollments = createAsyncThunk(
  'enrollment/getMyEnrollments',
  async ({ page = 1, limit = 100, status } = {}, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams();
      params.append('page', page);
      params.append('limit', limit);
      if (status) params.append('status', status);

      const response = await apiClient.get(`/user/enrollments?${params.toString()}`);
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to fetch my enrollments';
      return rejectWithValue(message);
    }
  }
);

const enrollmentSlice = createSlice({
  name: 'enrollment',
  initialState: {
    enrollmentByCourse: {},
    currentEnrollment: null,
    myEnrollments: [],
    myEnrollmentsPagination: null,
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
      })

      .addCase(getMyEnrollments.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getMyEnrollments.fulfilled, (state, action) => {
        state.loading = false;
        state.myEnrollments = action.payload?.data?.enrollments || [];
        state.myEnrollmentsPagination = action.payload?.data?.pagination || null;

        state.myEnrollments.forEach((enrollment) => {
          const courseId = String(enrollment?.course?._id || enrollment?.course || '');
          if (courseId) {
            state.enrollmentByCourse[courseId] = ['active', 'completed'].includes(enrollment?.status);
          }
        });
      })
      .addCase(getMyEnrollments.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.myEnrollments = [];
        state.myEnrollmentsPagination = null;
        state.enrollmentByCourse = {};
      });
  },
});

export const { clearEnrollmentError, clearCurrentEnrollment } = enrollmentSlice.actions;

export default enrollmentSlice.reducer;
