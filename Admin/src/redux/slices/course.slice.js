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

// Get course by ID
export const getCourseById = createAsyncThunk(
  'course/getCourseById',
  async (courseId, { rejectWithValue }) => {
    try {
      const response = await apiClient.get(`/courses/${courseId}`);
      return response.data.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to fetch course';
      return rejectWithValue(message);
    }
  }
);

// Create new course (simple)
export const createCourse = createAsyncThunk(
  'course/createCourse',
  async (courseData, { rejectWithValue }) => {
    try {
      const response = await apiClient.post(`/courses`, courseData);
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to create course';
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

// Update course
export const updateCourse = createAsyncThunk(
  'course/updateCourse',
  async ({ courseId, courseData }, { rejectWithValue }) => {
    try {
      const response = await apiClient.put(`/courses/${courseId}`, courseData);
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to update course';
      return rejectWithValue(message);
    }
  }
);

// Delete course
export const deleteCourse = createAsyncThunk(
  'course/deleteCourse',
  async (courseId, { rejectWithValue }) => {
    try {
      const response = await apiClient.delete(`/courses/${courseId}`);
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

  // Create course
  createCourseLoading: false,
  createCourseError: null,
  createCourseSuccess: false,

  // Create full course
  createFullCourseLoading: false,
  createFullCourseError: null,
  createFullCourseSuccess: false,

  // Save draft
  saveDraftLoading: false,
  saveDraftError: null,
  saveDraftSuccess: false,

  // Update course
  updateCourseLoading: false,
  updateCourseError: null,
  updateCourseSuccess: false,

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
    clearCreateCourseError: (state) => { state.createCourseError = null; state.createCourseSuccess = false; },
    clearUpdateCourseError: (state) => { state.updateCourseError = null; state.updateCourseSuccess = false; },
    clearDeleteCourseError: (state) => { state.deleteCourseError = null; state.deleteCourseSuccess = false; },
    clearCreateFullCourseError: (state) => { state.createFullCourseError = null; state.createFullCourseSuccess = false; },
    clearSaveDraftError: (state) => { state.saveDraftError = null; state.saveDraftSuccess = false; },
    resetCourseStates: (state) => { state.currentCourse = null; state.courseLoading = false; state.courseError = null; },
    resetCreateCourseState: (state) => { state.createCourseLoading = false; state.createCourseError = null; state.createCourseSuccess = false; },
    resetCreateFullCourseState: (state) => { state.createFullCourseLoading = false; state.createFullCourseError = null; state.createFullCourseSuccess = false; },
    resetSaveDraftState: (state) => { state.saveDraftLoading = false; state.saveDraftError = null; state.saveDraftSuccess = false; },
    resetUpdateCourseState: (state) => { state.updateCourseLoading = false; state.updateCourseError = null; state.updateCourseSuccess = false; },
    resetDeleteCourseState: (state) => { state.deleteCourseLoading = false; state.deleteCourseError = null; state.deleteCourseSuccess = false; },
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
      // createCourse
      .addCase(createCourse.pending, (state) => { state.createCourseLoading = true; state.createCourseError = null; state.createCourseSuccess = false; })
      .addCase(createCourse.fulfilled, (state, action) => { state.createCourseLoading = false; state.createCourseSuccess = true; state.courses.push(action.payload); })
      .addCase(createCourse.rejected, (state, action) => { state.createCourseLoading = false; state.createCourseError = action.payload; })
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
      // updateCourse
      .addCase(updateCourse.pending, (state) => { state.updateCourseLoading = true; state.updateCourseError = null; state.updateCourseSuccess = false; })
      .addCase(updateCourse.fulfilled, (state, action) => {
        state.updateCourseLoading = false; state.updateCourseSuccess = true;
        const index = state.courses.findIndex(course => course._id === action.payload._id);
        if (index !== -1) state.courses[index] = action.payload;
        if (state.currentCourse && state.currentCourse._id === action.payload._id) state.currentCourse = action.payload;
      })
      .addCase(updateCourse.rejected, (state, action) => { state.updateCourseLoading = false; state.updateCourseError = action.payload; })
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
      .addCase(getInstructorsForSelect.rejected, (state) => { state.instructorsForSelectLoading = false; });
  },
});

// Export actions
export const {
  clearCoursesError, clearCourseError, clearCreateCourseError, clearUpdateCourseError, clearDeleteCourseError,
  clearCreateFullCourseError, clearSaveDraftError,
  resetCourseStates, resetCreateCourseState, resetCreateFullCourseState, resetSaveDraftState,
  resetUpdateCourseState, resetDeleteCourseState,
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
export const selectCreateCourseLoading = (state) => state.course.createCourseLoading;
export const selectCreateCourseError = (state) => state.course.createCourseError;
export const selectCreateCourseSuccess = (state) => state.course.createCourseSuccess;
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
export const selectUpdateCourseLoading = (state) => state.course.updateCourseLoading;
export const selectUpdateCourseError = (state) => state.course.updateCourseError;
export const selectUpdateCourseSuccess = (state) => state.course.updateCourseSuccess;
export const selectDeleteCourseLoading = (state) => state.course.deleteCourseLoading;
export const selectDeleteCourseError = (state) => state.course.deleteCourseError;
export const selectDeleteCourseSuccess = (state) => state.course.deleteCourseSuccess;
export const selectInstructorsForSelect = (state) => state.course.instructorsForSelect;
export const selectInstructorsForSelectLoading = (state) => state.course.instructorsForSelectLoading;
export const selectCreationProgress = (state) => state.course.creationProgress;