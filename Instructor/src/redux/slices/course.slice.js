import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import apiClient from '../../utils/api.utils';

// Get instructor's courses
export const getMyCourses = createAsyncThunk(
  'course/getMyCourses',
  async ({ page = 1, limit = 10, status } = {}, { rejectWithValue }) => {
    try {
      const params = { page, limit };
      if (status) params.status = status;
      const response = await apiClient.get('/instructor/courses', { params });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch courses');
    }
  }
);

// Get full course details (for editing)
export const getFullCourse = createAsyncThunk(
  'course/getFullCourse',
  async (courseId, { rejectWithValue }) => {
    try {
      const response = await apiClient.get(`/courses/${courseId}/full`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch course details');
    }
  }
);

// Create a full course
export const createFullCourse = createAsyncThunk(
  'course/createFullCourse',
  async (formData, { rejectWithValue }) => {
    try {
      const response = await apiClient.post('/courses/full', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create course');
    }
  }
);

// Delete a course
export const deleteFullCourse = createAsyncThunk(
  'course/deleteFullCourse',
  async (courseId, { rejectWithValue }) => {
    try {
      const response = await apiClient.delete(`/courses/${courseId}/full`);
      return { ...response.data, courseId };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete course');
    }
  }
);

// Toggle publish/unpublish
export const togglePublishCourse = createAsyncThunk(
  'course/togglePublishCourse',
  async (courseId, { rejectWithValue }) => {
    try {
      const response = await apiClient.patch(`/courses/${courseId}/publish`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to toggle publish status');
    }
  }
);

// Get course stats
export const getCourseStats = createAsyncThunk(
  'course/getCourseStats',
  async (courseId, { rejectWithValue }) => {
    try {
      const response = await apiClient.get(`/courses/${courseId}/stats`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch course stats');
    }
  }
);

// Update a full course
export const updateFullCourse = createAsyncThunk(
  'course/updateFullCourse',
  async ({ courseId, formData }, { rejectWithValue }) => {
    try {
      const response = await apiClient.put(`/courses/${courseId}/full`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 600000,
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update course');
    }
  }
);

const initialState = {
  courses: [],
  coursePagination: null,
  coursesLoading: false,
  coursesError: null,

  currentCourse: null,
  currentCourseLoading: false,
  currentCourseError: null,

  createCourseLoading: false,
  createCourseError: null,
  createCourseSuccess: false,

  updateCourseLoading: false,
  updateCourseError: null,
  updateCourseSuccess: false,

  deleteCourseLoading: false,
  deleteCourseError: null,

  togglePublishLoading: false,
  togglePublishError: null,

  courseStats: null,
  courseStatsLoading: false,
  courseStatsError: null,
};

const courseSlice = createSlice({
  name: 'course',
  initialState,
  reducers: {
    clearCoursesError: (state) => { state.coursesError = null; },
    clearCurrentCourseError: (state) => { state.currentCourseError = null; },
    clearCreateCourseError: (state) => { state.createCourseError = null; },
    clearDeleteCourseError: (state) => { state.deleteCourseError = null; },
    clearUpdateCourseError: (state) => { state.updateCourseError = null; },
    clearTogglePublishError: (state) => { state.togglePublishError = null; },
    clearCourseStatsError: (state) => { state.courseStatsError = null; },
    resetCreateCourseState: (state) => {
      state.createCourseLoading = false;
      state.createCourseError = null;
      state.createCourseSuccess = false;
    },
    resetUpdateCourseState: (state) => {
      state.updateCourseLoading = false;
      state.updateCourseError = null;
      state.updateCourseSuccess = false;
    },
    resetCurrentCourse: (state) => {
      state.currentCourse = null;
      state.currentCourseLoading = false;
      state.currentCourseError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Get My Courses
      .addCase(getMyCourses.pending, (state) => {
        state.coursesLoading = true;
        state.coursesError = null;
      })
      .addCase(getMyCourses.fulfilled, (state, action) => {
        state.coursesLoading = false;
        state.courses = action.payload.data?.courses || [];
        state.coursePagination = action.payload.data?.pagination || null;
      })
      .addCase(getMyCourses.rejected, (state, action) => {
        state.coursesLoading = false;
        state.coursesError = action.payload;
      })

      // Get Full Course
      .addCase(getFullCourse.pending, (state) => {
        state.currentCourseLoading = true;
        state.currentCourseError = null;
      })
      .addCase(getFullCourse.fulfilled, (state, action) => {
        state.currentCourseLoading = false;
        state.currentCourse = action.payload.data;
      })
      .addCase(getFullCourse.rejected, (state, action) => {
        state.currentCourseLoading = false;
        state.currentCourseError = action.payload;
      })

      // Create Full Course
      .addCase(createFullCourse.pending, (state) => {
        state.createCourseLoading = true;
        state.createCourseError = null;
        state.createCourseSuccess = false;
      })
      .addCase(createFullCourse.fulfilled, (state) => {
        state.createCourseLoading = false;
        state.createCourseSuccess = true;
      })
      .addCase(createFullCourse.rejected, (state, action) => {
        state.createCourseLoading = false;
        state.createCourseError = action.payload;
      })

      // Update Full Course
      .addCase(updateFullCourse.pending, (state) => {
        state.updateCourseLoading = true;
        state.updateCourseError = null;
        state.updateCourseSuccess = false;
      })
      .addCase(updateFullCourse.fulfilled, (state, action) => {
        state.updateCourseLoading = false;
        state.updateCourseSuccess = true;
        if (action.payload.data?.course) {
          state.currentCourse = action.payload.data.course;
        }
      })
      .addCase(updateFullCourse.rejected, (state, action) => {
        state.updateCourseLoading = false;
        state.updateCourseError = action.payload;
      })

      // Delete Full Course
      .addCase(deleteFullCourse.pending, (state) => {
        state.deleteCourseLoading = true;
        state.deleteCourseError = null;
      })
      .addCase(deleteFullCourse.fulfilled, (state, action) => {
        state.deleteCourseLoading = false;
        state.courses = state.courses.filter(c => c._id !== action.payload.courseId);
      })
      .addCase(deleteFullCourse.rejected, (state, action) => {
        state.deleteCourseLoading = false;
        state.deleteCourseError = action.payload;
      })

      // Toggle Publish
      .addCase(togglePublishCourse.pending, (state) => {
        state.togglePublishLoading = true;
        state.togglePublishError = null;
      })
      .addCase(togglePublishCourse.fulfilled, (state, action) => {
        state.togglePublishLoading = false;
        const updated = action.payload.data;
        if (updated) {
          const idx = state.courses.findIndex(c => c._id === updated._id);
          if (idx !== -1) state.courses[idx] = updated;
        }
      })
      .addCase(togglePublishCourse.rejected, (state, action) => {
        state.togglePublishLoading = false;
        state.togglePublishError = action.payload;
      })

      // Course Stats
      .addCase(getCourseStats.pending, (state) => {
        state.courseStatsLoading = true;
        state.courseStatsError = null;
      })
      .addCase(getCourseStats.fulfilled, (state, action) => {
        state.courseStatsLoading = false;
        state.courseStats = action.payload.data;
      })
      .addCase(getCourseStats.rejected, (state, action) => {
        state.courseStatsLoading = false;
        state.courseStatsError = action.payload;
      });
  },
});

export const {
  clearCoursesError,
  clearCurrentCourseError,
  clearCreateCourseError,
  clearUpdateCourseError,
  clearDeleteCourseError,
  clearTogglePublishError,
  clearCourseStatsError,
  resetCreateCourseState,
  resetUpdateCourseState,
  resetCurrentCourse,
} = courseSlice.actions;

export default courseSlice.reducer;

// Selectors
export const selectCourses = (state) => state.course.courses;
export const selectCoursePagination = (state) => state.course.coursePagination;
export const selectCoursesLoading = (state) => state.course.coursesLoading;
export const selectCoursesError = (state) => state.course.coursesError;
export const selectCurrentCourse = (state) => state.course.currentCourse;
export const selectCurrentCourseLoading = (state) => state.course.currentCourseLoading;
export const selectCurrentCourseError = (state) => state.course.currentCourseError;
export const selectCreateCourseLoading = (state) => state.course.createCourseLoading;
export const selectCreateCourseError = (state) => state.course.createCourseError;
export const selectCreateCourseSuccess = (state) => state.course.createCourseSuccess;
export const selectDeleteCourseLoading = (state) => state.course.deleteCourseLoading;
export const selectDeleteCourseError = (state) => state.course.deleteCourseError;
export const selectTogglePublishLoading = (state) => state.course.togglePublishLoading;
export const selectTogglePublishError = (state) => state.course.togglePublishError;
export const selectUpdateCourseLoading = (state) => state.course.updateCourseLoading;
export const selectUpdateCourseError = (state) => state.course.updateCourseError;
export const selectUpdateCourseSuccess = (state) => state.course.updateCourseSuccess;
export const selectCourseStats = (state) => state.course.courseStats;
export const selectCourseStatsLoading = (state) => state.course.courseStatsLoading;
export const selectCourseStatsError = (state) => state.course.courseStatsError;
