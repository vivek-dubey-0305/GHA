import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { apiClient } from '../../utils/api.utils.js';

// Async thunks for course management API calls

// Get all courses with pagination (admin endpoint)
export const getAllCourses = createAsyncThunk(
  'course/getAllCourses',
  async ({ page = 1, limit = 10, status, category, instructorId, search } = {}, { rejectWithValue }) => {
    try {
      const params = { page, limit };
      if (status) params.status = status;
      if (category) params.category = category;
      if (instructorId) params.instructorId = instructorId;
      if (search) params.search = search;

      const response = await apiClient.get(`/courses`, { params });
      return response.data.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to fetch courses';
      return rejectWithValue(message);
    }
  }
);

// Get course by ID (uses full course endpoint)
export const getCourseById = createAsyncThunk(
  'course/getCourseById',
  async (courseId, { rejectWithValue }) => {
    try {
      const response = await apiClient.get(`/courses/${courseId}/full`);
      return response.data.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to fetch course';
      return rejectWithValue(message);
    }
  }
);

// Create full course (with modules + lessons + type-specific models)
export const createFullCourse = createAsyncThunk(
  'course/createFullCourse',
  async (formData, { rejectWithValue, dispatch }) => {
    try {
      dispatch(setCreationProgress({ step: 'uploading', percent: 10, message: 'Uploading files...' }));
      const response = await apiClient.post(`/courses/full`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 600000, // 10 min timeout for large uploads
        onUploadProgress: (progressEvent) => {
          const percent = Math.min(Math.round((progressEvent.loaded * 60) / progressEvent.total) + 10, 70);
          dispatch(setCreationProgress({ step: 'uploading', percent, message: `Uploading... ${percent}%` }));
        }
      });
      dispatch(setCreationProgress({ step: 'finalizing', percent: 90, message: 'Finalizing course...' }));

      // Handle partial success (207 — course created but some steps failed)
      if (response.status === 207 || response.data?.status === 'error') {
        const errors = response.data?.error?.errors || [];
        const errMsg = response.data?.message || 'Course created with errors';
        dispatch(setCreationProgress({ step: 'error', percent: 0, message: errMsg }));
        return rejectWithValue({ message: errMsg, errors, course: response.data?.error?.course || response.data?.data });
      }

      return response.data.data;
    } catch (error) {
      dispatch(setCreationProgress({ step: 'error', percent: 0, message: error.response?.data?.message || 'Failed' }));
      const message = error.response?.data?.message || error.message || 'Failed to create full course';
      return rejectWithValue(message);
    }
  }
);

// Save draft course
export const saveDraftCourse = createAsyncThunk(
  'course/saveDraftCourse',
  async ({ courseId, formData }, { rejectWithValue }) => {
    try {
      const response = await apiClient.put(`/courses/${courseId}/save-draft`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 300000
      });
      return response.data.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to save draft';
      return rejectWithValue(message);
    }
  }
);

// Get full course structure (with modules, lessons, details)
export const getFullCourse = createAsyncThunk(
  'course/getFullCourse',
  async (courseId, { rejectWithValue }) => {
    try {
      const response = await apiClient.get(`/courses/${courseId}/full`);
      return response.data.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to fetch full course';
      return rejectWithValue(message);
    }
  }
);

// Update full course structure (course + modules + lessons + certificates + media)
export const updateFullCourse = createAsyncThunk(
  'course/updateFullCourse',
  async ({ courseId, formData }, { rejectWithValue }) => {
    try {
      const response = await apiClient.put(`/courses/${courseId}/full`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 600000,
      });
      return response.data.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to update full course';
      return rejectWithValue(message);
    }
  }
);

// Get draft courses
export const getDraftCourses = createAsyncThunk(
  'course/getDraftCourses',
  async ({ page = 1, limit = 10, search } = {}, { rejectWithValue }) => {
    try {
      const params = { page, limit };
      if (search) params.search = search;
      const response = await apiClient.get(`/courses/drafts`, { params });
      return response.data.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to fetch draft courses';
      return rejectWithValue(message);
    }
  }
);

// Delete course (full delete with all related data)
export const deleteCourse = createAsyncThunk(
  'course/deleteCourse',
  async (courseId, { rejectWithValue }) => {
    try {
      const response = await apiClient.delete(`/courses/${courseId}/full`);
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to delete course';
      return rejectWithValue(message);
    }
  }
);

// Get all instructors (for dropdown selection)
export const getInstructorsForSelect = createAsyncThunk(
  'course/getInstructorsForSelect',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiClient.get(`/instructors`, { params: { limit: 100 } });
      return response.data.data.instructors;
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to fetch instructors';
      return rejectWithValue(message);
    }
  }
);

// Initial state
const initialState = {
  // Courses list
  courses: [],
  coursesLoading: false,
  coursesError: null,
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

  // Draft courses
  draftCourses: [],
  draftCoursesLoading: false,
  draftCoursesError: null,
  draftPagination: null,

  // Single course
  currentCourse: null,
  courseLoading: false,
  courseError: null,

  // Create full course
  createFullCourseLoading: false,
  createFullCourseError: null,
  createFullCourseSuccess: false,

  // Save draft
  saveDraftLoading: false,
  saveDraftError: null,
  saveDraftSuccess: false,

  // Full course
  fullCourse: null,
  fullCourseLoading: false,
  fullCourseError: null,

  // Update full course
  updateFullCourseLoading: false,
  updateFullCourseError: null,
  updateFullCourseSuccess: false,

  // Delete course
  deleteCourseLoading: false,
  deleteCourseError: null,
  deleteCourseSuccess: false,

  // Instructors for select
  instructorsForSelect: [],
  instructorsForSelectLoading: false,

  // Creation progress tracking
  creationProgress: {
    step: 'idle', // idle | preparing | uploading | finalizing | done | error
    percent: 0,
    message: '',
  },
};

// Course slice
const courseSlice = createSlice({
  name: 'course',
  initialState,
  reducers: {
    clearCoursesError: (state) => { state.coursesError = null; },
    clearCourseError: (state) => { state.courseError = null; },
    clearDeleteCourseError: (state) => { state.deleteCourseError = null; state.deleteCourseSuccess = false; },
    clearCreateFullCourseError: (state) => { state.createFullCourseError = null; state.createFullCourseSuccess = false; },
    clearSaveDraftError: (state) => { state.saveDraftError = null; state.saveDraftSuccess = false; },
    clearUpdateFullCourseError: (state) => { state.updateFullCourseError = null; state.updateFullCourseSuccess = false; },
    resetCourseStates: (state) => { state.currentCourse = null; state.courseLoading = false; state.courseError = null; },
    resetFullCourseState: (state) => { state.fullCourse = null; state.fullCourseLoading = false; state.fullCourseError = null; },
    resetCreateFullCourseState: (state) => { state.createFullCourseLoading = false; state.createFullCourseError = null; state.createFullCourseSuccess = false; },
    resetSaveDraftState: (state) => { state.saveDraftLoading = false; state.saveDraftError = null; state.saveDraftSuccess = false; },
    resetDeleteCourseState: (state) => { state.deleteCourseLoading = false; state.deleteCourseError = null; state.deleteCourseSuccess = false; },
    resetUpdateFullCourseState: (state) => { state.updateFullCourseLoading = false; state.updateFullCourseError = null; state.updateFullCourseSuccess = false; },
    setCreationProgress: (state, action) => { state.creationProgress = action.payload; },
    resetCreationProgress: (state) => { state.creationProgress = { step: 'idle', percent: 0, message: '' }; },
  },
  extraReducers: (builder) => {
    builder
      // getAllCourses
      .addCase(getAllCourses.pending, (state) => { state.coursesLoading = true; state.coursesError = null; })
      .addCase(getAllCourses.fulfilled, (state, action) => {
        state.coursesLoading = false;
        state.courses = action.payload.courses;
        state.pagination = action.payload.pagination;
      })
      .addCase(getAllCourses.rejected, (state, action) => { state.coursesLoading = false; state.coursesError = action.payload; })
      // getCourseById
      .addCase(getCourseById.pending, (state) => { state.courseLoading = true; state.courseError = null; })
      .addCase(getCourseById.fulfilled, (state, action) => { state.courseLoading = false; state.currentCourse = action.payload; })
      .addCase(getCourseById.rejected, (state, action) => { state.courseLoading = false; state.courseError = action.payload; })
      // createFullCourse
      .addCase(createFullCourse.pending, (state) => { state.createFullCourseLoading = true; state.createFullCourseError = null; state.createFullCourseSuccess = false; state.creationProgress = { step: 'preparing', percent: 5, message: 'Preparing course data...' }; })
      .addCase(createFullCourse.fulfilled, (state, action) => { state.createFullCourseLoading = false; state.createFullCourseSuccess = true; state.courses.unshift(action.payload); state.creationProgress = { step: 'done', percent: 100, message: 'Course created successfully!' }; })
      .addCase(createFullCourse.rejected, (state, action) => { state.createFullCourseLoading = false; state.createFullCourseError = action.payload; state.creationProgress = { step: 'error', percent: 0, message: action.payload || 'Creation failed' }; })
      // saveDraftCourse
      .addCase(saveDraftCourse.pending, (state) => { state.saveDraftLoading = true; state.saveDraftError = null; state.saveDraftSuccess = false; })
      .addCase(saveDraftCourse.fulfilled, (state, action) => {
        state.saveDraftLoading = false;
        state.saveDraftSuccess = true;
        const idx = state.draftCourses.findIndex(c => c._id === action.payload?._id);
        if (idx !== -1) state.draftCourses[idx] = action.payload;
        else state.draftCourses.unshift(action.payload);
      })
      .addCase(saveDraftCourse.rejected, (state, action) => { state.saveDraftLoading = false; state.saveDraftError = action.payload; })
      // getDraftCourses
      .addCase(getDraftCourses.pending, (state) => { state.draftCoursesLoading = true; state.draftCoursesError = null; })
      .addCase(getDraftCourses.fulfilled, (state, action) => {
        state.draftCoursesLoading = false;
        state.draftCourses = action.payload.courses;
        state.draftPagination = action.payload.pagination;
      })
      .addCase(getDraftCourses.rejected, (state, action) => { state.draftCoursesLoading = false; state.draftCoursesError = action.payload; })
      // deleteCourse
      .addCase(deleteCourse.pending, (state) => { state.deleteCourseLoading = true; state.deleteCourseError = null; state.deleteCourseSuccess = false; })
      .addCase(deleteCourse.fulfilled, (state, action) => {
        state.deleteCourseLoading = false; state.deleteCourseSuccess = true;
        state.courses = state.courses.filter(course => course._id !== action.meta.arg);
        state.draftCourses = state.draftCourses.filter(course => course._id !== action.meta.arg);
      })
      .addCase(deleteCourse.rejected, (state, action) => { state.deleteCourseLoading = false; state.deleteCourseError = action.payload; })
      // getInstructorsForSelect
      .addCase(getInstructorsForSelect.pending, (state) => { state.instructorsForSelectLoading = true; })
      .addCase(getInstructorsForSelect.fulfilled, (state, action) => { state.instructorsForSelectLoading = false; state.instructorsForSelect = action.payload; })
      .addCase(getInstructorsForSelect.rejected, (state) => { state.instructorsForSelectLoading = false; })
      // getFullCourse
      .addCase(getFullCourse.pending, (state) => { state.fullCourseLoading = true; state.fullCourseError = null; })
      .addCase(getFullCourse.fulfilled, (state, action) => { state.fullCourseLoading = false; state.fullCourse = action.payload; })
      .addCase(getFullCourse.rejected, (state, action) => { state.fullCourseLoading = false; state.fullCourseError = action.payload; })
      // updateFullCourse
      .addCase(updateFullCourse.pending, (state) => { state.updateFullCourseLoading = true; state.updateFullCourseError = null; state.updateFullCourseSuccess = false; })
      .addCase(updateFullCourse.fulfilled, (state, action) => {
        state.updateFullCourseLoading = false;
        state.updateFullCourseSuccess = true;
        if (action.payload?.course) {
          state.fullCourse = { ...state.fullCourse, course: action.payload.course };
          const idx = state.courses.findIndex(c => c._id === action.payload.course._id);
          if (idx !== -1) state.courses[idx] = action.payload.course;
        }
      })
      .addCase(updateFullCourse.rejected, (state, action) => { state.updateFullCourseLoading = false; state.updateFullCourseError = action.payload; });
  },
});

// Export actions
export const {
  clearCoursesError, clearCourseError, clearDeleteCourseError,
  clearCreateFullCourseError, clearSaveDraftError, clearUpdateFullCourseError,
  resetCourseStates, resetFullCourseState, resetCreateFullCourseState, resetSaveDraftState,
  resetDeleteCourseState, resetUpdateFullCourseState,
  setCreationProgress, resetCreationProgress,
} = courseSlice.actions;

export default courseSlice.reducer;

// Selectors
export const selectCourses = (state) => state.course.courses;
export const selectCoursesLoading = (state) => state.course.coursesLoading;
export const selectCoursesError = (state) => state.course.coursesError;
export const selectCoursePagination = (state) => state.course.pagination;
export const selectCurrentCourse = (state) => state.course.currentCourse;
export const selectCourseLoading = (state) => state.course.courseLoading;
export const selectCourseError = (state) => state.course.courseError;
export const selectCreateFullCourseLoading = (state) => state.course.createFullCourseLoading;
export const selectCreateFullCourseError = (state) => state.course.createFullCourseError;
export const selectCreateFullCourseSuccess = (state) => state.course.createFullCourseSuccess;
export const selectSaveDraftLoading = (state) => state.course.saveDraftLoading;
export const selectSaveDraftError = (state) => state.course.saveDraftError;
export const selectSaveDraftSuccess = (state) => state.course.saveDraftSuccess;
export const selectDraftCourses = (state) => state.course.draftCourses;
export const selectDraftCoursesLoading = (state) => state.course.draftCoursesLoading;
export const selectDraftCoursesError = (state) => state.course.draftCoursesError;
export const selectDraftPagination = (state) => state.course.draftPagination;
export const selectDeleteCourseLoading = (state) => state.course.deleteCourseLoading;
export const selectDeleteCourseError = (state) => state.course.deleteCourseError;
export const selectDeleteCourseSuccess = (state) => state.course.deleteCourseSuccess;
export const selectInstructorsForSelect = (state) => state.course.instructorsForSelect;
export const selectInstructorsForSelectLoading = (state) => state.course.instructorsForSelectLoading;
export const selectCreationProgress = (state) => state.course.creationProgress;
export const selectFullCourse = (state) => state.course.fullCourse;
export const selectFullCourseLoading = (state) => state.course.fullCourseLoading;
export const selectFullCourseError = (state) => state.course.fullCourseError;
export const selectUpdateFullCourseLoading = (state) => state.course.updateFullCourseLoading;
export const selectUpdateFullCourseError = (state) => state.course.updateFullCourseError;
export const selectUpdateFullCourseSuccess = (state) => state.course.updateFullCourseSuccess;